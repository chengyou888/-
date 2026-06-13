/**
 * Main-process bootstrap. Loaded by the asar loader before Codex's own
 * main process code runs. We hook `BrowserWindow` so every window Codex
 * creates gets our preload script attached. We also stand up an IPC
 * channel for tweaks to talk to the main process.
 *
 * We are in CJS land here (matches Electron's main process and Codex's own
 * code). The renderer-side runtime is bundled separately into preload.js.
 */
import { app, BrowserView, BrowserWindow, clipboard, ipcMain, Menu, session, shell, Tray, webContents, type MenuItemConstructorOptions } from "electron";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer, type IncomingHttpHeaders, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { createHash, randomInt, randomUUID } from "node:crypto";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";
import chokidar from "chokidar";
import { discoverTweaks, type DiscoveredTweak } from "./tweak-discovery";
import { createDiskStorage, type DiskStorage } from "./storage";
import { syncManagedMcpServers } from "./mcp-sync";
import { getWatcherHealth } from "./watcher-health";
import {
  isMainProcessTweakScope,
  reloadTweaks,
  setTweakEnabledAndReload,
} from "./tweak-lifecycle";
import { appendCappedLog } from "./logging";
import {
  getCdpStatus,
  getRuntimeCapabilities,
  getRuntimeInfo,
  listCdpTargets,
} from "./codex-runtime-probe";
import { NativeBridge, type NativeTweakContext } from "./native-bridge";
import type { TweakManifest } from "@codex-plusplus/sdk";
import type {
  CodexRuntimeCapabilities,
  CodexRuntimeInfo,
  CodexViewCreateOptions,
  CodexViewRef,
  CodexWindowRef,
  NativeHelperLaunchOptions,
  NativeModuleLoadOptions,
  NativePanelCreateOptions,
  NativeViewAttachOptions,
  TweakPermission,
} from "@codex-plusplus/sdk";
import {
  DEFAULT_TWEAK_STORE_INDEX_URL,
  normalizeGitHubRepo,
  normalizeStoreRegistry,
  shuffleStoreEntries,
  storeArchiveUrl,
  type TweakStorePublishSubmission,
  type TweakStoreEntry,
  type TweakStoreRegistry,
  type TweakStorePlatform,
} from "./tweak-store";
import { maybeStartBrowserUiServer } from "./browser-ui";

const userRoot = process.env.CODEX_PLUSPLUS_USER_ROOT;
const runtimeDir = process.env.CODEX_PLUSPLUS_RUNTIME;

if (!userRoot || !runtimeDir) {
  throw new Error(
    "codex-plusplus runtime started without CODEX_PLUSPLUS_USER_ROOT/RUNTIME envs",
  );
}

const PRELOAD_PATH = resolve(runtimeDir, "preload.js");
const TWEAKS_DIR = join(userRoot, "tweaks");
const LOG_DIR = join(userRoot, "log");
const LOG_FILE = join(LOG_DIR, "main.log");
const CONFIG_FILE = join(userRoot, "config.json");
const DESKTOP_CODEX_HOME = join(userRoot, "desktop-codex-home");
const CODEX_CONFIG_FILE = join(DESKTOP_CODEX_HOME, "config.toml");
const CODEX_AUTH_FILE = join(DESKTOP_CODEX_HOME, "auth.json");
const GLOBAL_CODEX_CONFIG_FILE = join(homedir(), ".codex", "config.toml");
const GLOBAL_CODEX_AUTH_FILE = join(homedir(), ".codex", "auth.json");
const INSTALLER_STATE_FILE = join(userRoot, "state.json");
const UPDATE_MODE_FILE = join(userRoot, "update-mode.json");
const SELF_UPDATE_STATE_FILE = join(userRoot, "self-update-state.json");
const SIGNED_CODEX_BACKUP = join(userRoot, "backup", "Codex.app");
const CODEX_PLUSPLUS_VERSION = "1.0.0";
const CODEX_PLUSPLUS_REPO = "chengyou888/-";
const TWEAK_STORE_INDEX_URL = process.env.CODEX_PLUSPLUS_STORE_INDEX_URL ?? DEFAULT_TWEAK_STORE_INDEX_URL;
const CODEX_WINDOW_SERVICES_KEY = "__codexpp_window_services__";
const CODEXPP_MODEL_BRIDGE_PROVIDER_ID = "codexpp_bridge";
const CODEXPP_MODEL_BRIDGE_PORT = 17661;
const CODEXPP_MODEL_BRIDGE_URL = `http://127.0.0.1:${CODEXPP_MODEL_BRIDGE_PORT}/v1`;
const CODEXPP_MODEL_BRIDGE_BEGIN = "# BEGIN codex-plusplus desktop model bridge";
const CODEXPP_MODEL_BRIDGE_END = "# END codex-plusplus desktop model bridge";
const FALLBACK_NATIVE_CODEX_MODEL = "gpt-5.5";

mkdirSync(LOG_DIR, { recursive: true });
mkdirSync(TWEAKS_DIR, { recursive: true });
ensureDesktopCodexHome();
installCodexChildProcessEnvHook();
installApplicationMenuLocalizationHook();
installTrayActivationHook();
installAppActivationRestoreHook();

let modelBridgeServer: Server | null = null;
let modelBridgeStarting = false;

// Optional: enable Chrome DevTools Protocol on a TCP port so we can drive the
// running Codex from outside (curl http://localhost:<port>/json, attach via
// CDP WebSocket, take screenshots, evaluate in renderer, etc.). Codex's
// production build sets webPreferences.devTools=false, which kills the
// in-window DevTools shortcut, but `--remote-debugging-port` works regardless
// because it's a Chromium command-line switch processed before app init.
//
// Off by default. Set CODEXPP_REMOTE_DEBUG=1 (optionally CODEXPP_REMOTE_DEBUG_PORT)
// to turn it on. Must be appended before `app` becomes ready; we're at module
// top-level so that's fine.
if (process.env.CODEXPP_REMOTE_DEBUG === "1") {
  const port = process.env.CODEXPP_REMOTE_DEBUG_PORT ?? "9222";
  app.commandLine.appendSwitch("remote-debugging-port", port);
  log("info", `remote debugging enabled on port ${port}`);
}

interface PersistedState {
  codexPlusPlus?: {
    enabled?: boolean;
    autoUpdate?: boolean;
    safeMode?: boolean;
    updateChannel?: SelfUpdateChannel;
    updateRepo?: string;
    updateRef?: string;
    updateCheck?: CodexPlusPlusUpdateCheck;
    activeAgentProvider?: AgentProviderSelection;
    modelBridgeBackup?: CodexModelBridgeBackup;
    modelBridge?: CodexModelBridgeState;
    xiaobaiToolbox?: XiaobaiToolboxConfig;
  };
  /** Per-tweak enable flags. Missing entries default to enabled. */
  tweaks?: Record<string, { enabled?: boolean }>;
  /** Cached GitHub release checks. Runtime never auto-installs updates. */
  tweakUpdateChecks?: Record<string, TweakUpdateCheck>;
  /** Built-in provider connectors shown in Settings. */
  agentConnectors?: Partial<Record<AgentProviderId, AgentProviderConfig>>;
}

type AgentProviderId = "deepseek" | "zhipu" | "qwen";
type AgentProviderSelection = "codex-native" | AgentProviderId;
type AgentProviderMode = "chat" | "app";
type AgentProviderAccessMode = "bridge" | "pure-api";

interface XiaobaiToolboxConfig {
  path?: string;
  executable?: string;
  args?: string[];
}

interface XiaobaiToolboxLaunchResult {
  path: string;
  executable: string | null;
  args: string[];
  openedAt: string;
}

interface AgentProviderConfig {
  provider?: AgentProviderId;
  enabled?: boolean;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  appId?: string;
  mode?: AgentProviderMode;
  accessMode?: AgentProviderAccessMode;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  sessionId?: string;
}

interface AgentProviderTestRequest {
  prompt?: string;
  config?: Partial<AgentProviderConfig>;
}

interface AgentProviderTestResult {
  provider: AgentProviderId;
  text: string;
  model?: string;
  sessionId?: string;
  usage?: unknown;
  raw?: unknown;
}

interface AgentProviderModel {
  id: string;
  label?: string;
  ownedBy?: string;
}

interface AgentProviderModelsResult {
  provider: AgentProviderId;
  models: AgentProviderModel[];
  sourceUrl?: string;
  disabledReason?: string;
}

interface AgentProviderActivationResult {
  activeProvider: AgentProviderSelection;
  bridgeUrl: string | null;
  configPath: string;
  restartRequired: boolean;
  message: string;
}

interface CodexModelBridgeBackup {
  model?: string;
  modelProvider?: string;
  modelReasoningEffort?: string;
}

interface CodexModelBridgeState {
  provider: AgentProviderId;
  model: string;
  baseUrl: string;
  accessMode?: AgentProviderAccessMode;
  updatedAt: string;
}

interface CodexBridgeSessionContext {
  id: string;
  source: string;
}

interface CodexPlusPlusUpdateCheck {
  checkedAt: string;
  currentVersion: string;
  latestVersion: string | null;
  releaseUrl: string | null;
  releaseNotes: string | null;
  updateAvailable: boolean;
  error?: string;
}

type SelfUpdateChannel = "stable" | "prerelease" | "custom";
type SelfUpdateStatus = "checking" | "up-to-date" | "updated" | "failed" | "disabled";

interface SelfUpdateState {
  checkedAt: string;
  completedAt?: string;
  status: SelfUpdateStatus;
  currentVersion: string;
  latestVersion: string | null;
  targetRef: string | null;
  releaseUrl: string | null;
  repo: string;
  channel: SelfUpdateChannel;
  sourceRoot: string;
  installationSource?: InstallationSource;
  error?: string;
}

interface InstallationSource {
  kind: "github-source" | "homebrew" | "local-dev" | "source-archive" | "unknown";
  label: string;
  detail: string;
}

interface TweakUpdateCheck {
  checkedAt: string;
  repo: string;
  currentVersion: string;
  latestVersion: string | null;
  latestTag: string | null;
  releaseUrl: string | null;
  updateAvailable: boolean;
  error?: string;
}

function readState(): PersistedState {
  try {
    return JSON.parse(stripUtf8Bom(readFileSync(CONFIG_FILE, "utf8"))) as PersistedState;
  } catch {
    return {};
  }
}

function stripUtf8Bom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function writeState(s: PersistedState): void {
  try {
    writeFileSync(CONFIG_FILE, JSON.stringify(s, null, 2));
  } catch (e) {
    log("warn", "writeState failed:", String((e as Error).message));
  }
}
function isCodexPlusPlusEnabled(): boolean {
  return readState().codexPlusPlus?.enabled !== false;
}
function setCodexPlusPlusEnabled(enabled: boolean): void {
  const s = readState();
  s.codexPlusPlus ??= {};
  s.codexPlusPlus.enabled = enabled;
  writeState(s);
}
function isCodexPlusPlusAutoUpdateEnabled(): boolean {
  return readState().codexPlusPlus?.autoUpdate !== false;
}
function setCodexPlusPlusAutoUpdate(enabled: boolean): void {
  const s = readState();
  s.codexPlusPlus ??= {};
  s.codexPlusPlus.autoUpdate = enabled;
  writeState(s);
}
function setCodexPlusPlusUpdateConfig(config: {
  updateChannel?: SelfUpdateChannel;
  updateRepo?: string;
  updateRef?: string;
}): void {
  const s = readState();
  s.codexPlusPlus ??= {};
  if (config.updateChannel) s.codexPlusPlus.updateChannel = config.updateChannel;
  if ("updateRepo" in config) s.codexPlusPlus.updateRepo = cleanOptionalString(config.updateRepo);
  if ("updateRef" in config) s.codexPlusPlus.updateRef = cleanOptionalString(config.updateRef);
  writeState(s);
}

function ensureDesktopCodexHome(): void {
  mkdirSync(DESKTOP_CODEX_HOME, { recursive: true });
  process.env.CODEX_HOME = DESKTOP_CODEX_HOME;
  process.env.CODEXPP_DESKTOP_CODEX_HOME = DESKTOP_CODEX_HOME;
  applyDesktopSystemProxyEnv(process.env);
  syncDesktopCodexAuthFromState("startup");

  try {
    const current = existsSync(CODEX_CONFIG_FILE)
      ? readFileSync(CODEX_CONFIG_FILE, "utf8")
      : "";
    const next = prepareDesktopCodexConfig(current);
    if (!existsSync(CODEX_CONFIG_FILE) || next !== current) {
      writeFileSync(CODEX_CONFIG_FILE, next, "utf8");
    }
  } catch (e) {
    log("warn", "failed to prepare desktop Codex home:", e);
  }
}

function installCodexChildProcessEnvHook(): void {
  const childProcess = require("node:child_process") as Record<string, any> & { __codexppDesktopEnvHook?: boolean };
  if (childProcess.__codexppDesktopEnvHook) return;
  childProcess.__codexppDesktopEnvHook = true;

  const originalSpawn = childProcess.spawn;
  const originalExecFile = childProcess.execFile;
  const originalFork = childProcess.fork;
  const originalSpawnSync = childProcess.spawnSync;
  const originalExecFileSync = childProcess.execFileSync;

  if (typeof originalSpawn === "function") {
    childProcess.spawn = function codexPlusPlusSpawn(command: unknown, ...args: unknown[]) {
      return originalSpawn.call(this, command, ...withDesktopCodexEnv(args));
    };
  }
  if (typeof originalExecFile === "function") {
    childProcess.execFile = function codexPlusPlusExecFile(file: unknown, ...args: unknown[]) {
      return originalExecFile.call(this, file, ...withDesktopCodexEnv(args));
    };
  }
  if (typeof originalFork === "function") {
    childProcess.fork = function codexPlusPlusFork(modulePath: unknown, ...args: unknown[]) {
      return originalFork.call(this, modulePath, ...withDesktopCodexEnv(args));
    };
  }
  if (typeof originalSpawnSync === "function") {
    childProcess.spawnSync = function codexPlusPlusSpawnSync(command: unknown, ...args: unknown[]) {
      return originalSpawnSync.call(this, command, ...withDesktopCodexEnv(args));
    };
  }
  if (typeof originalExecFileSync === "function") {
    childProcess.execFileSync = function codexPlusPlusExecFileSync(file: unknown, ...args: unknown[]) {
      return originalExecFileSync.call(this, file, ...withDesktopCodexEnv(args));
    };
  }
}

function withDesktopCodexEnv(args: unknown[]): unknown[] {
  const next = [...args];
  const callbackIndex = typeof next[next.length - 1] === "function" ? next.length - 1 : -1;
  const searchEnd = callbackIndex === -1 ? next.length : callbackIndex;
  const optionsIndex = childProcessOptionsIndex(next, searchEnd);
  if (optionsIndex === -1) {
    next.splice(searchEnd, 0, { env: desktopCodexChildEnv(process.env) });
    return next;
  }
  next[optionsIndex] = {
    ...(next[optionsIndex] as Record<string, unknown>),
    env: desktopCodexChildEnv(asRecord((next[optionsIndex] as Record<string, unknown>).env) ?? process.env),
  };
  return next;
}

function childProcessOptionsIndex(args: unknown[], end = args.length): number {
  for (let i = end - 1; i >= 0; i -= 1) {
    if (isChildProcessOptions(args[i])) return i;
  }
  return -1;
}

function isChildProcessOptions(value: unknown): value is Record<string, unknown> {
  const record = asRecord(value);
  if (!record || Array.isArray(value)) return false;
  return (
    "cwd" in record ||
    "env" in record ||
    "shell" in record ||
    "stdio" in record ||
    "detached" in record ||
    "windowsHide" in record ||
    "windowsVerbatimArguments" in record ||
    "timeout" in record ||
    "encoding" in record ||
    "killSignal" in record ||
    "uid" in record ||
    "gid" in record ||
    "signal" in record ||
    "serialization" in record
  );
}

function desktopCodexChildEnv(base: NodeJS.ProcessEnv | Record<string, unknown>): NodeJS.ProcessEnv {
  const env = {
    ...base,
    CODEX_HOME: DESKTOP_CODEX_HOME,
    CODEXPP_DESKTOP_CODEX_HOME: DESKTOP_CODEX_HOME,
  } as NodeJS.ProcessEnv;
  applyDesktopSystemProxyEnv(env);
  return env;
}

let cachedDesktopSystemProxy: string | null | undefined;

function applyDesktopSystemProxyEnv(env: NodeJS.ProcessEnv): void {
  const proxy = getDesktopSystemProxy();
  if (!proxy) return;
  setEnvIfMissing(env, "HTTP_PROXY", proxy);
  setEnvIfMissing(env, "HTTPS_PROXY", proxy);
  setEnvIfMissing(env, "ALL_PROXY", proxy);
  setEnvIfMissing(env, "http_proxy", proxy);
  setEnvIfMissing(env, "https_proxy", proxy);
  setEnvIfMissing(env, "all_proxy", proxy);
  appendNoProxy(env, "127.0.0.1,localhost,::1");
}

function setEnvIfMissing(env: NodeJS.ProcessEnv, key: string, value: string): void {
  if (!env[key]) env[key] = value;
}

function appendNoProxy(env: NodeJS.ProcessEnv, value: string): void {
  const keys = ["NO_PROXY", "no_proxy"];
  for (const key of keys) {
    const current = env[key];
    if (!current) {
      env[key] = value;
      continue;
    }
    const parts = current.split(",").map((part) => part.trim()).filter(Boolean);
    for (const item of value.split(",")) {
      if (!parts.some((part) => part.toLowerCase() === item.toLowerCase())) parts.push(item);
    }
    env[key] = parts.join(",");
  }
}

function getDesktopSystemProxy(): string | null {
  if (cachedDesktopSystemProxy !== undefined) return cachedDesktopSystemProxy;
  cachedDesktopSystemProxy = readWindowsInternetProxy();
  return cachedDesktopSystemProxy;
}

function readWindowsInternetProxy(): string | null {
  if (process.platform !== "win32") return null;
  try {
    const key = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";
    const enabled = execFileSync("reg.exe", ["query", key, "/v", "ProxyEnable"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2_000,
    });
    if (!/\b0x1\b/i.test(enabled)) return null;
    const serverOutput = execFileSync("reg.exe", ["query", key, "/v", "ProxyServer"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2_000,
    });
    const server = parseRegValue(serverOutput, "ProxyServer");
    return normalizeWindowsProxyServer(server);
  } catch {
    return null;
  }
}

function parseRegValue(output: string, name: string): string {
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(new RegExp(`^\\s*${escapeRegExp(name)}\\s+REG_\\w+\\s+(.+?)\\s*$`, "i"));
    if (match) return match[1]?.trim() ?? "";
  }
  return "";
}

function normalizeWindowsProxyServer(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes("=")) {
    const entries = new Map<string, string>();
    for (const part of trimmed.split(";")) {
      const [rawKey, rawValue] = part.split("=", 2);
      const key = rawKey?.trim().toLowerCase();
      const proxy = rawValue?.trim();
      if (key && proxy) entries.set(key, proxy);
    }
    return normalizeProxyUrl(entries.get("https") ?? entries.get("http") ?? entries.get("socks") ?? "");
  }
  return normalizeProxyUrl(trimmed);
}

function normalizeProxyUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

function syncDesktopCodexAuthFromGlobal(reason: string): void {
  try {
    if (!existsSync(GLOBAL_CODEX_AUTH_FILE)) return;
    const globalStat = statSync(GLOBAL_CODEX_AUTH_FILE);
    const desktopStat = existsSync(CODEX_AUTH_FILE) ? statSync(CODEX_AUTH_FILE) : null;
    if (desktopStat && desktopStat.mtimeMs >= globalStat.mtimeMs && !desktopCodexAuthIsPureApiOnly()) return;
    mkdirSync(DESKTOP_CODEX_HOME, { recursive: true });
    cpSync(GLOBAL_CODEX_AUTH_FILE, CODEX_AUTH_FILE);
    log("info", `synced desktop Codex auth from global auth (${reason})`);
  } catch (e) {
    log("warn", `failed to sync desktop Codex auth (${reason}):`, e);
  }
}

function desktopCodexAuthIsPureApiOnly(): boolean {
  try {
    const auth = JSON.parse(stripUtf8Bom(readFileSync(CODEX_AUTH_FILE, "utf8"))) as Record<string, unknown>;
    return typeof auth.OPENAI_API_KEY === "string" && !auth.tokens;
  } catch {
    return false;
  }
}

function syncDesktopCodexAuthFromState(reason: string): void {
  const pureApi = activePureApiAgentProviderConfig();
  if (pureApi) {
    writeCodexPureApiAuth(pureApi.apiKey);
    log("info", `synced desktop Codex auth from pure API key (${reason})`);
    return;
  }
  syncDesktopCodexAuthFromGlobal(reason);
}

function activePureApiAgentProviderConfig(): Required<AgentProviderConfig> | null {
  const active = readState().codexPlusPlus?.activeAgentProvider;
  if (!active || active === "codex-native") return null;
  const config = getAgentProviderConfig(active);
  if (!config.enabled || !config.apiKey || !config.model) return null;
  if (active === "qwen" && config.mode === "app") return null;
  return config.accessMode === "pure-api" ? config : null;
}

function writeCodexPureApiAuth(apiKey: string): void {
  mkdirSync(dirname(CODEX_AUTH_FILE), { recursive: true });
  writeFileSync(CODEX_AUTH_FILE, `${JSON.stringify({ OPENAI_API_KEY: apiKey }, null, 2)}\n`, "utf8");
}

function prepareDesktopCodexConfig(text: string): string {
  let next = removeCodexBridgeBlock(text);
  next = removeLegacyCodexBridgeBlocks(next);
  next = removeTopLevelTomlKey(next, "notify");
  next = removeTomlSections(next, (name) =>
    name === "projects" ||
    name.startsWith("projects.") ||
    name === "desktop" ||
    name === "features" ||
    name === "tui.model_availability_nux" ||
    name.startsWith("marketplaces.") ||
    name.startsWith("mcp_servers.") ||
    name.startsWith("plugins."),
  );
  next = commentWindowsTomlSections(next);
  next = upsertTopLevelTomlString(next, "sandbox_mode", "danger-full-access");
  next = upsertTopLevelTomlString(next, "approval_policy", "never");
  return next.trimEnd() + "\n";
}

function removeLegacyCodexBridgeBlocks(text: string): string {
  return text
    .replace(/^# BEGIN codex.*model bridge[\s\S]*?^# END codex.*model bridge\s*$/gim, "")
    .trimEnd() + (text.trimEnd() ? "\n" : "");
}

function commentWindowsTomlSections(text: string): string {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let inWindows = false;
  for (const line of lines) {
    const section = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (section) {
      inWindows = section[1]?.trim() === "windows";
      out.push(inWindows ? commentTomlLine(line) : line);
      continue;
    }
    out.push(inWindows && line.trim() ? commentTomlLine(line) : line);
  }
  return out.join("\n");
}

function removeTomlSections(text: string, shouldRemove: (sectionName: string) => boolean): string {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let removing = false;
  for (const line of lines) {
    const section = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (section) {
      const name = section[1]?.trim() ?? "";
      removing = shouldRemove(name);
      if (removing) continue;
    }
    if (!removing) out.push(line);
  }
  return out.join("\n");
}

function commentTomlLine(line: string): string {
  return /^\s*#/.test(line) ? line : `# ${line.trimStart()}`;
}

function agentProviderDefaults(provider: AgentProviderId, mode: AgentProviderMode = "chat"): Required<AgentProviderConfig> {
  if (provider === "deepseek") {
    return {
      provider,
      enabled: true,
      apiKey: "",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
      appId: "",
      mode: "chat",
      accessMode: "bridge",
      systemPrompt: "",
      temperature: 0.7,
      maxTokens: 2048,
      sessionId: "",
    };
  }
  if (provider === "zhipu") {
    return {
      provider,
      enabled: true,
      apiKey: "",
      baseUrl: "https://open.bigmodel.cn/api/paas/v4",
      model: "glm-5.1",
      appId: "",
      mode: "chat",
      accessMode: "bridge",
      systemPrompt: "",
      temperature: 0.7,
      maxTokens: 2048,
      sessionId: "",
    };
  }
  return {
    provider,
    enabled: true,
    apiKey: "",
    baseUrl: mode === "chat"
      ? "https://dashscope.aliyuncs.com/compatible-mode/v1"
      : "https://dashscope.aliyuncs.com/api/v1",
    model: "qwen-plus",
    appId: "",
    mode,
    accessMode: "bridge",
    systemPrompt: "",
    temperature: 0.7,
    maxTokens: 2048,
    sessionId: "",
  };
}

function assertAgentProviderId(value: unknown): AgentProviderId {
  if (value === "deepseek" || value === "zhipu" || value === "qwen") return value;
  throw new Error(`unknown agent provider: ${String(value)}`);
}

function getAgentProviderConfig(provider: AgentProviderId): Required<AgentProviderConfig> {
  const saved = readState().agentConnectors?.[provider] ?? {};
  return normalizeAgentProviderConfig(provider, saved);
}

function setAgentProviderConfig(
  provider: AgentProviderId,
  patch: Partial<AgentProviderConfig>,
): Required<AgentProviderConfig> {
  const s = readState();
  s.agentConnectors ??= {};
  const current = s.agentConnectors[provider] ?? {};
  const next = normalizeAgentProviderConfig(provider, { ...current, ...patch, provider });
  s.agentConnectors[provider] = next;
  writeState(s);
  return next;
}

function setActiveAgentProvider(selection: AgentProviderSelection): AgentProviderActivationResult {
  if (selection === "codex-native") return deactivateCodexModelBridge();
  const config = getAgentProviderConfig(selection);
  return activateCodexModelBridge(selection, config);
}

function getActiveAgentProvider(): AgentProviderSelection {
  const active = readState().codexPlusPlus?.activeAgentProvider;
  return active === "deepseek" || active === "zhipu" || active === "qwen" ? active : "codex-native";
}

function activateCodexModelBridge(
  provider: AgentProviderId,
  config: Required<AgentProviderConfig>,
): AgentProviderActivationResult {
  if (!isCodexPlusPlusEnabled()) throw new Error("插件总开关已关闭，请先在 codex汉化增强plus版 配置页开启。");
  if (!config.enabled) throw new Error("该模型入口已关闭，请先启用。");
  if (!config.apiKey) throw new Error("请先填写 API Key。");
  if (provider === "qwen" && config.mode === "app") {
    throw new Error("百炼智能体应用不是模型 provider，不能接管 Codex 主聊天。请切换到千问模型模式。");
  }
  if (!config.model) throw new Error("请先刷新并选择模型。");

  const state = readState();
  state.codexPlusPlus ??= {};
  const currentConfigText = readCodexConfigText();
  if (!state.codexPlusPlus.modelBridgeBackup || readTopLevelTomlString(currentConfigText, "model_provider") !== CODEXPP_MODEL_BRIDGE_PROVIDER_ID) {
    state.codexPlusPlus.modelBridgeBackup = {
      model: readTopLevelTomlString(currentConfigText, "model"),
      modelProvider: readTopLevelTomlString(currentConfigText, "model_provider"),
      modelReasoningEffort: readTopLevelTomlString(currentConfigText, "model_reasoning_effort"),
    };
  }
  state.codexPlusPlus.activeAgentProvider = provider;
  state.codexPlusPlus.modelBridge = {
    provider,
    model: config.model,
    baseUrl: config.baseUrl,
    accessMode: config.accessMode,
    updatedAt: new Date().toISOString(),
  };
  writeState(state);

  applyAgentProviderEnvironment(provider, config);
  syncDesktopCodexAuthFromState("agent-activated");
  startCodexModelBridgeServer();
  writeCodexBridgeConfig(config);
  scheduleDesktopCodexConfigSanitization("agent-activated");
  const modeLabel = config.accessMode === "pure-api" ? "纯 API 模式" : "桥接模式";
  return {
    activeProvider: provider,
    bridgeUrl: CODEXPP_MODEL_BRIDGE_URL,
    configPath: CODEX_CONFIG_FILE,
    restartRequired: true,
    message: `${agentProviderLabel(provider)} 已用${modeLabel}接管桌面 Codex 主聊天；使用桌面专用配置，不改全局配置。重启桌面 Codex 或新建会话后生效。`,
  };
}

function deactivateCodexModelBridge(): AgentProviderActivationResult {
  const state = readState();
  const backup = state.codexPlusPlus?.modelBridgeBackup;
  state.codexPlusPlus ??= {};
  state.codexPlusPlus.activeAgentProvider = "codex-native";
  state.codexPlusPlus.modelBridge = undefined;
  writeState(state);
  syncDesktopCodexAuthFromGlobal("agent-deactivated");
  writeCodexNativeConfig(backup);
  scheduleDesktopCodexConfigSanitization("agent-deactivated");
  return {
    activeProvider: "codex-native",
    bridgeUrl: null,
    configPath: CODEX_CONFIG_FILE,
    restartRequired: true,
    message: "已恢复桌面 Codex 原生模型配置；全局配置不受影响。重启桌面 Codex 或新建会话后生效。",
  };
}

function ensureCodexModelBridgeFromState(): void {
  if (!isCodexPlusPlusEnabled()) return;
  const state = readState();
  const active = state.codexPlusPlus?.activeAgentProvider;
  if (!active || active === "codex-native") return;
  const config = getAgentProviderConfig(active);
  if (!config.enabled || !config.apiKey || !config.model) return;
  if (active === "qwen" && config.mode === "app") return;
  applyAgentProviderEnvironment(active, config);
  syncDesktopCodexAuthFromState("agent-state");
  startCodexModelBridgeServer();
  try {
    writeCodexBridgeConfig(config);
  } catch (e) {
    log("warn", "failed to sync Codex model bridge config:", e);
  }
}

function applyAgentProviderEnvironment(provider: AgentProviderId, config: Required<AgentProviderConfig>): void {
  if (provider === "deepseek") process.env.CODEXPP_DEEPSEEK_API_KEY = config.apiKey;
  if (provider === "zhipu") process.env.CODEXPP_ZHIPU_API_KEY = config.apiKey;
  if (provider === "qwen") process.env.CODEXPP_QWEN_API_KEY = config.apiKey;
}

function readCodexConfigText(): string {
  try {
    return readFileSync(CODEX_CONFIG_FILE, "utf8");
  } catch {
    return "";
  }
}

function writeCodexBridgeConfig(config: Required<AgentProviderConfig>): void {
  mkdirSync(dirname(CODEX_CONFIG_FILE), { recursive: true });
  let text = removeCodexBridgeBlock(prepareDesktopCodexConfig(readCodexConfigText()));
  text = upsertTopLevelTomlString(text, "model", config.model);
  text = upsertTopLevelTomlString(text, "model_provider", CODEXPP_MODEL_BRIDGE_PROVIDER_ID);
  text = appendCodexBridgeBlock(text, config.accessMode);
  writeFileSync(CODEX_CONFIG_FILE, text, "utf8");
}

function writeCodexNativeConfig(backup?: CodexModelBridgeBackup): void {
  mkdirSync(dirname(CODEX_CONFIG_FILE), { recursive: true });
  const nativeBackup = resolveCodexNativeBackup(backup);
  let text = removeCodexBridgeBlock(prepareDesktopCodexConfig(readCodexConfigText()));
  if (nativeBackup.model) text = upsertTopLevelTomlString(text, "model", nativeBackup.model);
  else text = removeTopLevelTomlKey(text, "model");
  if (nativeBackup.modelProvider) text = upsertTopLevelTomlString(text, "model_provider", nativeBackup.modelProvider);
  else text = removeTopLevelTomlKey(text, "model_provider");
  if (nativeBackup.modelReasoningEffort) {
    text = upsertTopLevelTomlString(text, "model_reasoning_effort", nativeBackup.modelReasoningEffort);
  } else {
    text = removeTopLevelTomlKey(text, "model_reasoning_effort");
  }
  writeFileSync(CODEX_CONFIG_FILE, text, "utf8");
}

function resolveCodexNativeBackup(backup?: CodexModelBridgeBackup): CodexModelBridgeBackup {
  const globalBackup = readGlobalCodexNativeBackup();
  const model = backup?.model && !isThirdPartyAgentModel(backup.model)
    ? backup.model
    : globalBackup.model ?? FALLBACK_NATIVE_CODEX_MODEL;
  const modelProvider = backup?.modelProvider && backup.modelProvider !== CODEXPP_MODEL_BRIDGE_PROVIDER_ID
    ? backup.modelProvider
    : globalBackup.modelProvider;
  return {
    model,
    modelProvider,
    modelReasoningEffort: backup?.modelReasoningEffort ?? globalBackup.modelReasoningEffort,
  };
}

function readGlobalCodexNativeBackup(): CodexModelBridgeBackup {
  try {
    const text = readFileSync(GLOBAL_CODEX_CONFIG_FILE, "utf8");
    const model = readTopLevelTomlString(text, "model");
    const modelProvider = readTopLevelTomlString(text, "model_provider");
    return {
      model: model && !isThirdPartyAgentModel(model) ? model : undefined,
      modelProvider: modelProvider && modelProvider !== CODEXPP_MODEL_BRIDGE_PROVIDER_ID ? modelProvider : undefined,
      modelReasoningEffort: readTopLevelTomlString(text, "model_reasoning_effort"),
    };
  } catch {
    return {};
  }
}

function isThirdPartyAgentModel(model: string): boolean {
  return looksLikeProviderModel(model, "deepseek") || looksLikeProviderModel(model, "zhipu") || looksLikeProviderModel(model, "qwen");
}

function syncDesktopCodexConfigFromState(reason: string): void {
  try {
    const state = readState();
    const active = state.codexPlusPlus?.activeAgentProvider;
    if (active && active !== "codex-native") {
      const config = getAgentProviderConfig(active);
      if (config.enabled && config.apiKey && config.model && !(active === "qwen" && config.mode === "app")) {
        syncDesktopCodexAuthFromState(reason);
        writeCodexBridgeConfig(config);
        return;
      }
    }
    writeCodexNativeConfig(state.codexPlusPlus?.modelBridgeBackup);
  } catch (e) {
    log("warn", `failed to sanitize desktop Codex config (${reason}):`, e);
  }
}

function scheduleDesktopCodexConfigSanitization(reason: string): void {
  for (const delayMs of [500, 2_000, 6_000, 15_000]) {
    setTimeout(() => syncDesktopCodexConfigFromState(reason), delayMs).unref?.();
  }
}

function appendCodexBridgeBlock(text: string, accessMode: AgentProviderAccessMode = "bridge"): string {
  const trimmed = text.trimEnd();
  const block = [
    CODEXPP_MODEL_BRIDGE_BEGIN,
    `[model_providers.${CODEXPP_MODEL_BRIDGE_PROVIDER_ID}]`,
    `name = "codex\\u6c49\\u5316\\u589e\\u5f3aplus\\u7248 \\u6a21\\u578b\\u6865\\u63a5"`,
    `base_url = "${CODEXPP_MODEL_BRIDGE_URL}"`,
    `wire_api = "responses"`,
    ...(accessMode === "pure-api" ? [`requires_openai_auth = true`] : []),
    CODEXPP_MODEL_BRIDGE_END,
  ].join("\n");
  return `${trimmed}${trimmed ? "\n\n" : ""}${block}\n`;
}

function removeCodexBridgeBlock(text: string): string {
  const pattern = new RegExp(`${escapeRegExp(CODEXPP_MODEL_BRIDGE_BEGIN)}[\\s\\S]*?${escapeRegExp(CODEXPP_MODEL_BRIDGE_END)}\\n?`, "g");
  return text.replace(pattern, "").trimEnd() + (text.trimEnd() ? "\n" : "");
}

function upsertTopLevelTomlString(text: string, key: string, value: string): string {
  const [root, rest] = splitTomlRoot(text);
  const line = `${key} = ${JSON.stringify(value)}`;
  const keyPattern = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=.*$`, "m");
  const nextRoot = keyPattern.test(root)
    ? root.replace(keyPattern, line)
    : `${root.trimEnd()}${root.trimEnd() ? "\n" : ""}${line}\n`;
  return `${nextRoot}${rest}`;
}

function removeTopLevelTomlKey(text: string, key: string): string {
  const [root, rest] = splitTomlRoot(text);
  const keyPattern = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=.*\\r?\\n?`, "gm");
  return `${root.replace(keyPattern, "")}${rest}`;
}

function readTopLevelTomlString(text: string, key: string): string | undefined {
  const [root] = splitTomlRoot(text);
  const match = root.match(new RegExp(`^\\s*${escapeRegExp(key)}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\r\\n#]+))`, "m"));
  return (match?.[2] ?? match?.[3] ?? match?.[4])?.trim();
}

function splitTomlRoot(text: string): [root: string, rest: string] {
  const lines = text.split(/(?=^\s*\[)/m);
  if (lines.length === 1) return [text, ""];
  return [lines[0] ?? "", lines.slice(1).join("")];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeAgentProviderConfig(
  provider: AgentProviderId,
  input: Partial<AgentProviderConfig>,
): Required<AgentProviderConfig> {
  const mode: AgentProviderMode = input.mode === "app" ? "app" : "chat";
  const defaults = agentProviderDefaults(provider, mode);
  const cleanedBaseUrl = cleanOptionalString(input.baseUrl);
  const qwenAppBase = "https://dashscope.aliyuncs.com/api/v1";
  const qwenChatBase = "https://dashscope.aliyuncs.com/compatible-mode/v1";
  const accessMode: AgentProviderAccessMode = input.accessMode === "pure-api" ? "pure-api" : "bridge";
  const baseUrl = provider === "qwen"
    ? (
        !cleanedBaseUrl ||
        (mode === "chat" && cleanedBaseUrl === qwenAppBase) ||
        (mode === "app" && cleanedBaseUrl === qwenChatBase)
          ? defaults.baseUrl
          : cleanedBaseUrl
      )
    : (cleanedBaseUrl ?? defaults.baseUrl);
  return {
    provider,
    enabled: input.enabled !== false,
    apiKey: cleanOptionalString(input.apiKey) ?? defaults.apiKey,
    baseUrl,
    model: cleanOptionalString(input.model) ?? defaults.model,
    appId: cleanOptionalString(input.appId) ?? defaults.appId,
    mode: provider === "qwen" ? mode : "chat",
    accessMode,
    systemPrompt: cleanOptionalString(input.systemPrompt) ?? defaults.systemPrompt,
    temperature: clampNumeric(input.temperature, 0, 2, defaults.temperature),
    maxTokens: Math.round(clampNumeric(input.maxTokens, 1, 384000, defaults.maxTokens)),
    sessionId: cleanOptionalString(input.sessionId) ?? defaults.sessionId,
  };
}

function clampNumeric(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function isCodexPlusPlusSafeModeEnabled(): boolean {
  return readState().codexPlusPlus?.safeMode === true;
}
function isTweakEnabled(id: string): boolean {
  const s = readState();
  if (s.codexPlusPlus?.enabled === false) return false;
  if (s.codexPlusPlus?.safeMode === true) return false;
  return s.tweaks?.[id]?.enabled !== false;
}
function setTweakEnabled(id: string, enabled: boolean): void {
  const s = readState();
  s.tweaks ??= {};
  s.tweaks[id] = { ...s.tweaks[id], enabled };
  writeState(s);
}

interface InstallerState {
  appRoot: string;
  codexVersion: string | null;
  sourceRoot?: string;
}

function readInstallerState(): InstallerState | null {
  try {
    return JSON.parse(readFileSync(INSTALLER_STATE_FILE, "utf8")) as InstallerState;
  } catch {
    return null;
  }
}

function readSelfUpdateState(): SelfUpdateState | null {
  try {
    return JSON.parse(readFileSync(SELF_UPDATE_STATE_FILE, "utf8")) as SelfUpdateState;
  } catch {
    return null;
  }
}
function writeSelfUpdateState(state: SelfUpdateState): void {
  try {
    writeFileSync(SELF_UPDATE_STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    log("warn", "writeSelfUpdateState failed:", String((e as Error).message));
  }
}

function cleanOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

async function callAgentProvider(
  provider: AgentProviderId,
  config: Required<AgentProviderConfig>,
  prompt: string,
): Promise<AgentProviderTestResult> {
  const text = prompt.trim();
  if (!config.enabled) throw new Error("该入口已关闭，请先启用后再测试。");
  if (!config.apiKey) throw new Error("请先填写 API Key。");
  if (!text) throw new Error("请输入测试问题。");
  if (!(provider === "qwen" && config.mode === "app") && !config.model) {
    throw new Error("请先刷新模型列表并选择模型。");
  }
  if (provider === "qwen" && config.mode === "app") {
    return callAliyunApplication(config, text);
  }
  return callOpenAiCompatibleAgent(provider, config, text);
}

async function listAgentProviderModels(
  provider: AgentProviderId,
  config: Required<AgentProviderConfig>,
): Promise<AgentProviderModelsResult> {
  if (provider === "qwen" && config.mode === "app") {
    return {
      provider,
      models: [],
      disabledReason: "百炼智能体应用模式不需要选择模型。",
    };
  }
  if (!config.apiKey) throw new Error("请先填写 API Key。");

  const primaryUrl = openAiModelsUrl(config.baseUrl);
  try {
    const json = await fetchJsonRecord(provider, primaryUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    });
    return {
      provider,
      sourceUrl: primaryUrl,
      models: normalizeModelList(modelsFromOpenAiList(json, provider), provider),
    };
  } catch (primaryError) {
    if (provider !== "qwen") throw primaryError;
    const fallbackUrl = aliyunDeployableModelsUrl(config.baseUrl);
    const json = await fetchJsonRecord(provider, fallbackUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    });
    return {
      provider,
      sourceUrl: fallbackUrl,
      models: normalizeModelList(modelsFromAnyJson(json, provider), provider),
    };
  }
}

async function callOpenAiCompatibleAgent(
  provider: AgentProviderId,
  config: Required<AgentProviderConfig>,
  prompt: string,
): Promise<AgentProviderTestResult> {
  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (config.systemPrompt) messages.push({ role: "system", content: config.systemPrompt });
  messages.push({ role: "user", content: prompt });
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature: config.temperature,
  };
  body.max_tokens = config.maxTokens;

  const json = await fetchJsonRecord(provider, openAiChatCompletionUrl(config.baseUrl), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const choice = asRecord(asArray(json.choices)[0]);
  const message = asRecord(choice?.message);
  const content = extractContentText(message?.content);
  const reasoning = stringValue(message?.reasoning_content);
  const output = [reasoning ? `思考过程：\n${reasoning}` : "", content].filter(Boolean).join("\n\n");
  if (!output) throw new Error(formatAgentProviderApiError(provider, null, json, "服务商返回了空响应。"));
  return {
    provider,
    text: output,
    model: stringValue(json.model) ?? config.model,
    usage: json.usage,
    raw: json,
  };
}

async function callAliyunApplication(
  config: Required<AgentProviderConfig>,
  prompt: string,
): Promise<AgentProviderTestResult> {
  if (!config.appId) throw new Error("百炼智能体应用模式需要填写应用 ID。");
  const input: Record<string, unknown> = { prompt };
  if (config.sessionId) input.session_id = config.sessionId;
  const json = await fetchJsonRecord("qwen", aliyunApplicationUrl(config.baseUrl, config.appId), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input,
      parameters: {},
      debug: {},
    }),
  });
  const output = asRecord(json.output);
  const text =
    stringValue(output?.text) ??
    stringValue(json.message) ??
    (output ? JSON.stringify(output, null, 2) : "");
  if (!text || providerErrorMessage(json)) {
    throw new Error(formatAgentProviderApiError("qwen", null, json, "阿里百炼应用返回了空响应。"));
  }
  return {
    provider: "qwen",
    text,
    sessionId: stringValue(output?.session_id) ?? stringValue(json.session_id),
    usage: json.usage,
    raw: json,
  };
}

async function fetchJsonRecord(
  provider: AgentProviderId,
  url: string,
  init: RequestInit,
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const raw = await res.text();
    let parsed: unknown = {};
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = { message: raw };
      }
    }
    const json = asRecord(parsed);
    if (!json) throw new Error("服务商返回了非 JSON 响应。");
    if (!res.ok) {
      throw new Error(formatAgentProviderApiError(provider, res.status, json, res.statusText));
    }
    return json;
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      throw new Error(`${agentProviderLabel(provider)} 接入失败\n原因：请求超过 45 秒没有返回。\n解决方式：\n1. 检查当前网络或代理是否能访问服务商 API。\n2. 确认 Base URL 是否填写正确。\n3. 稍后再试。`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function startCodexModelBridgeServer(): void {
  if (modelBridgeServer || modelBridgeStarting) return;
  modelBridgeStarting = true;
  const server = createServer((req, res) => {
    void handleCodexModelBridgeRequest(req, res).catch((e) => {
      if (!res.headersSent) {
        sendJson(res, 500, { error: { message: String((e as Error).message ?? e), type: "codexpp_bridge_error" } });
      } else {
        writeSse(res, "response.failed", {
          type: "response.failed",
          response: {
            id: `resp_${randomUUID()}`,
            object: "response",
            status: "failed",
            error: { message: String((e as Error).message ?? e) },
          },
        });
        res.end();
      }
    });
  });
  server.on("error", (e) => {
    modelBridgeStarting = false;
    modelBridgeServer = null;
    log("warn", "Codex model bridge failed:", e);
  });
  server.listen(CODEXPP_MODEL_BRIDGE_PORT, "127.0.0.1", () => {
    modelBridgeServer = server;
    modelBridgeStarting = false;
    log("info", `Codex model bridge listening on ${CODEXPP_MODEL_BRIDGE_URL}`);
  });
}

function stopCodexModelBridgeServer(): void {
  modelBridgeStarting = false;
  if (!modelBridgeServer) return;
  try {
    modelBridgeServer.close();
  } catch (e) {
    log("warn", "failed to stop Codex model bridge:", e);
  } finally {
    modelBridgeServer = null;
  }
}

async function handleCodexModelBridgeRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", CODEXPP_MODEL_BRIDGE_URL);
  if (req.method === "GET" && /\/models$/i.test(url.pathname)) {
    const config = activeBridgeProviderConfig();
    const model = bridgeModelCatalogEntry(config);
    sendJson(res, 200, {
      object: "list",
      data: [model],
      models: [model],
    });
    return;
  }
  if (req.method !== "POST" || !/\/responses$/i.test(url.pathname)) {
    sendJson(res, 404, { error: { message: "codex汉化增强plus版 模型桥仅支持 /v1/models 和 /v1/responses。" } });
    return;
  }
  const request = asRecord(JSON.parse(await readRequestBody(req)));
  if (!request) throw new Error("Codex Responses 请求不是 JSON 对象。");
  await proxyCodexResponseRequest(request, req.headers, res);
}

function bridgeModelCatalogEntry(config: Required<AgentProviderConfig>): Record<string, unknown> {
  return {
    id: config.model,
    slug: config.model,
    name: config.model,
    title: `${agentProviderLabel(config.provider)} ${config.model}`,
    display_name: `${agentProviderLabel(config.provider)} ${config.model}`,
    description: `Third-party model bridged through codex汉化增强plus版: ${agentProviderLabel(config.provider)} ${config.model}.`,
    default_reasoning_level: "medium",
    object: "model",
    owned_by: config.provider,
    provider: config.provider,
    model_provider: CODEXPP_MODEL_BRIDGE_PROVIDER_ID,
    wire_api: "responses",
    mode: "chat",
    supported_reasoning_levels: [
      { effort: "low", description: "Fast responses with lighter reasoning" },
      { effort: "medium", description: "Balanced responses" },
      { effort: "high", description: "More reasoning for complex work" },
      { effort: "xhigh", description: "Extra reasoning for complex work" },
    ],
    shell_type: "shell_command",
    visibility: "list",
    supported_in_api: true,
    priority: 1,
    additional_speed_tiers: [],
    service_tiers: [],
    availability_nux: null,
    upgrade: null,
    base_instructions: "You are Codex, a coding agent helping the user in the current workspace.",
    model_messages: {
      instructions_template: [
        "You are Codex, a coding agent helping the user in the current workspace.",
        "{{ personality }}",
        "When asked about the current model, answer according to the active model provider metadata.",
      ].join("\n\n"),
      instructions_variables: {
        personality_default: "",
        personality_friendly: "",
        personality_pragmatic: "",
      },
    },
    supports_reasoning_summaries: false,
    default_reasoning_summary: "none",
    support_verbosity: false,
    default_verbosity: "low",
    supported_verbosity_levels: [],
    apply_patch_tool_type: "freeform",
    web_search_tool_type: "text_and_image",
    truncation_policy: { mode: "tokens", limit: 10000 },
    supports_text_output: true,
    supports_image_input: false,
    supports_parallel_tool_calls: true,
    supports_image_detail_original: false,
    supports_tool_choice: true,
    supports_web_search: false,
    context_window: 131072,
    max_context_window: 131072,
    effective_context_window_percent: 95,
    experimental_supported_tools: [],
    input_modalities: ["text"],
    supports_search_tool: false,
  };
}

function activeBridgeProviderConfig(): Required<AgentProviderConfig> {
  const active = readState().codexPlusPlus?.activeAgentProvider;
  if (!active || active === "codex-native") throw new Error("尚未激活第三方模型接管。");
  const config = getAgentProviderConfig(active);
  if (!config.enabled || !config.apiKey || !config.model) throw new Error("第三方模型配置不完整，请回到模型接入页重新测试。");
  if (active === "qwen" && config.mode === "app") throw new Error("百炼智能体应用不能作为 Codex 主聊天模型。");
  return config;
}

async function proxyCodexResponseRequest(
  request: Record<string, unknown>,
  headers: IncomingHttpHeaders,
  res: ServerResponse,
): Promise<void> {
  const config = activeBridgeProviderConfig();
  const wantsStream = request.stream !== false;
  const sessionContext = codexBridgeSessionContext(request, headers);
  const upstreamBody = buildChatCompletionRequest(request, config, wantsStream, sessionContext);
  const upstream = await fetch(openAiChatCompletionUrl(config.baseUrl), {
    method: "POST",
    headers: chatCompletionHeaders(config, sessionContext),
    body: JSON.stringify(upstreamBody),
  });
  if (!upstream.ok) {
    const json = await readFetchJson(upstream);
    throw new Error(formatAgentProviderApiError(config.provider, upstream.status, json, upstream.statusText));
  }
  if (wantsStream) {
    await streamChatCompletionAsResponses(upstream, res);
    return;
  }
  const json = await readFetchJson(upstream);
  sendJson(res, 200, chatCompletionToResponse(json));
}

function buildChatCompletionRequest(
  request: Record<string, unknown>,
  config: Required<AgentProviderConfig>,
  stream: boolean,
  sessionContext: CodexBridgeSessionContext | null = null,
): Record<string, unknown> {
  const messages = responsesInputToChatMessages(request);
  insertBridgeSystemMessages(messages, config, sessionContext);
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature: config.temperature,
    stream,
  };
  if (sessionContext) body.user = sessionContext.id;
  const tools = responsesToolsToChatTools(asArray(request.tools));
  if (tools.length > 0) body.tools = tools;
  const toolChoice = request.tool_choice;
  if (toolChoice === "none") body.tool_choice = "none";
  else if (tools.length > 0) body.tool_choice = "auto";
  body.max_tokens = config.maxTokens;
  return body;
}

function insertBridgeSystemMessages(
  messages: Array<Record<string, unknown>>,
  config: Required<AgentProviderConfig>,
  sessionContext: CodexBridgeSessionContext | null = null,
): void {
  const systemMessages: Array<Record<string, unknown>> = [];
  if (config.systemPrompt) systemMessages.push({ role: "system", content: config.systemPrompt });
  systemMessages.push({ role: "system", content: bridgeProviderIdentityPrompt(config) });
  if (sessionContext) systemMessages.push({ role: "system", content: bridgeSessionSystemPrompt(sessionContext) });
  const firstNonSystem = messages.findIndex((message) => stringValue(message.role) !== "system");
  messages.splice(firstNonSystem === -1 ? messages.length : firstNonSystem, 0, ...systemMessages);
}

function bridgeProviderIdentityPrompt(config: Required<AgentProviderConfig>): string {
  const providerLabel = agentProviderLabel(config.provider);
  return [
    `当前底层模型供应商是 ${providerLabel}，模型名是 ${config.model}。`,
    `当用户询问你是谁、哪个模型、供应商或驱动模型时，直接说明你正在通过 codex汉化增强plus版 桥接使用 ${providerLabel} 的 ${config.model}。`,
    "不要声称底层模型是 OpenAI、GPT、Claude 或 Anthropic，除非当前模型配置明确如此。",
  ].join(" ");
}

function bridgeSessionSystemPrompt(sessionContext: CodexBridgeSessionContext): string {
  return [
    `当前 Codex 会话 ID 是 ${sessionContext.id}。`,
    `该值来源于 ${sessionContext.source}，仅用于下游模型或服务商做会话追踪、缓存、日志关联和连续性判断。`,
    "不要主动向用户展示这个会话 ID，除非用户明确询问。",
  ].join(" ");
}

function chatCompletionHeaders(
  config: Required<AgentProviderConfig>,
  sessionContext: CodexBridgeSessionContext | null,
): Record<string, string> {
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };
  if (sessionContext) {
    headers["X-Codex-Session-Id"] = sessionContext.id;
    headers["X-Codex-Session-Source"] = sessionContext.source;
  }
  return headers;
}

function codexBridgeSessionContext(
  request: Record<string, unknown>,
  headers: IncomingHttpHeaders,
): CodexBridgeSessionContext | null {
  const headerContext = sessionContextFromHeaders(headers);
  if (headerContext) return headerContext;

  const bodyContext = sessionContextFromRecord(request, "responses.body");
  if (bodyContext) return bodyContext;

  const metadata = asRecord(request.metadata) ?? asRecord(request.client_metadata) ?? asRecord(request.responsesapiClientMetadata);
  const metadataContext = metadata ? sessionContextFromRecord(metadata, "responses.metadata") : null;
  if (metadataContext) return metadataContext;

  return derivedSessionContext(request);
}

function sessionContextFromHeaders(headers: IncomingHttpHeaders): CodexBridgeSessionContext | null {
  const keys = [
    "x-codex-session-id",
    "x-codex-thread-id",
    "x-openai-conversation-id",
    "openai-conversation-id",
  ];
  for (const key of keys) {
    const value = stringHeader(headers, key);
    const id = normalizeSessionIdentifier(value);
    if (id) return { id, source: `header:${key}` };
  }
  return null;
}

function sessionContextFromRecord(record: Record<string, unknown>, source: string): CodexBridgeSessionContext | null {
  const keys = [
    "session_id",
    "sessionId",
    "thread_id",
    "threadId",
    "conversation_id",
    "conversationId",
    "codex_session_id",
    "codexSessionId",
    "codex_thread_id",
    "codexThreadId",
    "user",
    "previous_response_id",
  ];
  for (const key of keys) {
    const id = normalizeSessionIdentifier(stringValue(record[key]));
    if (id) return { id, source: `${source}.${key}` };
  }
  return null;
}

function derivedSessionContext(request: Record<string, unknown>): CodexBridgeSessionContext {
  const seed = JSON.stringify({
    model: stringValue(request.model),
    instructions: stringValue(request.instructions),
    input: request.input ?? null,
  });
  const id = `codex_${createHash("sha256").update(seed).digest("hex").slice(0, 32)}`;
  return { id, source: "responses.body.sha256" };
}

function stringHeader(headers: IncomingHttpHeaders, key: string): string | undefined {
  const value = headers[key.toLowerCase()];
  if (Array.isArray(value)) return value.find((item) => item.trim());
  return value;
}

function normalizeSessionIdentifier(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\s+/g, " ").slice(0, 256);
}

function responsesInputToChatMessages(request: Record<string, unknown>): Array<Record<string, unknown>> {
  const messages: Array<Record<string, unknown>> = [];
  const instructions = stringValue(request.instructions);
  if (instructions) messages.push({ role: "system", content: instructions });
  const plainInput = stringValue(request.input);
  if (plainInput) messages.push({ role: "user", content: plainInput });
  for (const item of asArray(request.input)) {
    const record = asRecord(item);
    if (!record) continue;
    const type = stringValue(record.type);
    if (type === "message" || (!type && isResponseMessageRecord(record))) {
      const role = responseRoleToChatRole(stringValue(record.role));
      messages.push({ role, content: responseContentToText(record.content) });
      continue;
    }
    if (type === "function_call") {
      const callId = stringValue(record.call_id) ?? stringValue(record.id) ?? `call_${randomUUID()}`;
      messages.push({
        role: "assistant",
        content: null,
        tool_calls: [{
          id: callId,
          type: "function",
          function: {
            name: stringValue(record.name) ?? "unknown",
            arguments: stringValue(record.arguments) ?? "{}",
          },
        }],
      });
      continue;
    }
    if (type === "function_call_output") {
      messages.push({
        role: "tool",
        tool_call_id: stringValue(record.call_id) ?? stringValue(record.id) ?? "",
        content: responseContentToText(record.output) || stringifyProviderValue(record.output),
      });
    }
  }
  return messages.length > 0 ? messages : [{ role: "user", content: "" }];
}

function isResponseMessageRecord(record: Record<string, unknown>): boolean {
  return !!stringValue(record.role) && "content" in record;
}

function responseRoleToChatRole(role: string | undefined): string {
  if (role === "assistant" || role === "tool" || role === "user") return role;
  return "system";
}

function responseContentToText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return stringifyProviderValue(value);
  return value
    .map((part) => {
      if (typeof part === "string") return part;
      const record = asRecord(part);
      return stringValue(record?.text) ?? stringValue(record?.content) ?? "";
    })
    .filter(Boolean)
    .join("\n");
}

function responsesToolsToChatTools(tools: unknown[]): unknown[] {
  return tools
    .map((tool) => {
      const record = asRecord(tool);
      if (!record || record.type !== "function") return null;
      return {
        type: "function",
        function: {
          name: stringValue(record.name) ?? "tool",
          description: stringValue(record.description) ?? "",
          parameters: record.parameters ?? { type: "object", properties: {} },
          strict: record.strict === true,
        },
      };
    })
    .filter(Boolean);
}

async function streamChatCompletionAsResponses(upstream: Response, res: ServerResponse): Promise<void> {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
  });
  const responseId = `resp_${randomUUID()}`;
  const createdAt = Math.floor(Date.now() / 1000);
  const output: unknown[] = [];
  let textItem: { id: string; text: string } | null = null;
  const toolItems = new Map<number, { id: string; callId: string; name: string; arguments: string }>();

  writeSse(res, "response.created", {
    type: "response.created",
    response: responseEnvelope(responseId, createdAt, "in_progress", output),
  });

  for (const event of await readSseEvents(upstream)) {
    if (event === "[DONE]") break;
    const chunk = asRecord(safeJsonParse(event));
    const choice = asRecord(asArray(chunk?.choices)[0]);
    const delta = asRecord(choice?.delta);
    if (!delta) continue;
    const content = stringValue(delta.content);
    if (content) {
      if (!textItem) textItem = startResponseTextItem(res);
      textItem.text += content;
      writeSse(res, "response.output_text.delta", {
        type: "response.output_text.delta",
        item_id: textItem.id,
        output_index: 0,
        content_index: 0,
        delta: content,
      });
    }
    for (const toolDelta of asArray(delta.tool_calls)) {
      const record = asRecord(toolDelta);
      if (!record) continue;
      const index = typeof record.index === "number" ? record.index : 0;
      let toolItem = toolItems.get(index);
      const fn = asRecord(record.function);
      if (!toolItem) {
        toolItem = {
          id: `fc_${randomUUID()}`,
          callId: stringValue(record.id) ?? `call_${randomUUID()}`,
          name: stringValue(fn?.name) ?? "unknown",
          arguments: "",
        };
        toolItems.set(index, toolItem);
        writeSse(res, "response.output_item.added", {
          type: "response.output_item.added",
          output_index: output.length + toolItems.size - 1,
          item: {
            id: toolItem.id,
            type: "function_call",
            status: "in_progress",
            call_id: toolItem.callId,
            name: toolItem.name,
            arguments: "",
          },
        });
      }
      const name = stringValue(fn?.name);
      if (name) toolItem.name = name;
      const args = stringValue(fn?.arguments);
      if (args) {
        toolItem.arguments += args;
        writeSse(res, "response.function_call_arguments.delta", {
          type: "response.function_call_arguments.delta",
          item_id: toolItem.id,
          output_index: output.length + index,
          delta: args,
        });
      }
    }
  }

  if (textItem) {
    const item = finishResponseTextItem(res, textItem);
    output.push(item);
  }
  for (const toolItem of toolItems.values()) {
    writeSse(res, "response.function_call_arguments.done", {
      type: "response.function_call_arguments.done",
      item_id: toolItem.id,
      arguments: toolItem.arguments,
    });
    const item = {
      id: toolItem.id,
      type: "function_call",
      status: "completed",
      call_id: toolItem.callId,
      name: toolItem.name,
      arguments: toolItem.arguments || "{}",
    };
    output.push(item);
    writeSse(res, "response.output_item.done", {
      type: "response.output_item.done",
      output_index: output.length - 1,
      item,
    });
  }
  writeSse(res, "response.completed", {
    type: "response.completed",
    response: responseEnvelope(responseId, createdAt, "completed", output),
  });
  res.end();
}

function startResponseTextItem(res: ServerResponse): { id: string; text: string } {
  const id = `msg_${randomUUID()}`;
  writeSse(res, "response.output_item.added", {
    type: "response.output_item.added",
    output_index: 0,
    item: { id, type: "message", status: "in_progress", role: "assistant", content: [] },
  });
  writeSse(res, "response.content_part.added", {
    type: "response.content_part.added",
    item_id: id,
    output_index: 0,
    content_index: 0,
    part: { type: "output_text", text: "", annotations: [] },
  });
  return { id, text: "" };
}

function finishResponseTextItem(res: ServerResponse, textItem: { id: string; text: string }): Record<string, unknown> {
  const part = { type: "output_text", text: textItem.text, annotations: [] };
  const item = { id: textItem.id, type: "message", status: "completed", role: "assistant", content: [part] };
  writeSse(res, "response.output_text.done", {
    type: "response.output_text.done",
    item_id: textItem.id,
    output_index: 0,
    content_index: 0,
    text: textItem.text,
  });
  writeSse(res, "response.content_part.done", {
    type: "response.content_part.done",
    item_id: textItem.id,
    output_index: 0,
    content_index: 0,
    part,
  });
  writeSse(res, "response.output_item.done", {
    type: "response.output_item.done",
    output_index: 0,
    item,
  });
  return item;
}

function chatCompletionToResponse(json: Record<string, unknown>): Record<string, unknown> {
  const choice = asRecord(asArray(json.choices)[0]);
  const message = asRecord(choice?.message);
  const text = extractContentText(message?.content);
  const output: unknown[] = [];
  if (text) {
    output.push({
      id: `msg_${randomUUID()}`,
      type: "message",
      status: "completed",
      role: "assistant",
      content: [{ type: "output_text", text, annotations: [] }],
    });
  }
  for (const toolCall of asArray(message?.tool_calls)) {
    const record = asRecord(toolCall);
    const fn = asRecord(record?.function);
    output.push({
      id: `fc_${randomUUID()}`,
      type: "function_call",
      status: "completed",
      call_id: stringValue(record?.id) ?? `call_${randomUUID()}`,
      name: stringValue(fn?.name) ?? "unknown",
      arguments: stringValue(fn?.arguments) ?? "{}",
    });
  }
  return responseEnvelope(`resp_${randomUUID()}`, Math.floor(Date.now() / 1000), "completed", output, json.usage);
}

function responseEnvelope(
  id: string,
  createdAt: number,
  status: "in_progress" | "completed" | "failed",
  output: unknown[],
  usage?: unknown,
): Record<string, unknown> {
  return {
    id,
    object: "response",
    created_at: createdAt,
    status,
    model: activeBridgeProviderConfig().model,
    output,
    parallel_tool_calls: true,
    tool_choice: "auto",
    usage: usage ?? null,
  };
}

async function readSseEvents(response: Response): Promise<string[]> {
  if (!response.body) return [];
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const events: string[] = [];
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let delimiter = sseDelimiterIndex(buffer);
    while (delimiter.index >= 0) {
      const raw = buffer.slice(0, delimiter.index);
      buffer = buffer.slice(delimiter.index + delimiter.length);
      const data = raw
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (data) events.push(data);
      delimiter = sseDelimiterIndex(buffer);
    }
  }
  return events;
}

function sseDelimiterIndex(buffer: string): { index: number; length: number } {
  const crlf = buffer.indexOf("\r\n\r\n");
  const lf = buffer.indexOf("\n\n");
  if (crlf >= 0 && (lf < 0 || crlf < lf)) return { index: crlf, length: 4 };
  return { index: lf, length: lf >= 0 ? 2 : 0 };
}

async function readFetchJson(response: Response): Promise<Record<string, unknown>> {
  const raw = await response.text();
  if (!raw) return {};
  return asRecord(safeJsonParse(raw)) ?? { message: raw };
}

async function readRequestBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function writeSse(res: ServerResponse, event: string, data: unknown): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function stringifyProviderValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function openAiChatCompletionUrl(baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  if (/\/chat\/completions$/i.test(base)) return base;
  return `${base}/chat/completions`;
}

function openAiModelsUrl(baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, "").replace(/\/chat\/completions$/i, "");
  if (/\/models$/i.test(base)) return base;
  return `${base}/models`;
}

function aliyunApplicationUrl(baseUrl: string, appId: string): string {
  const encoded = encodeURIComponent(appId);
  const base = baseUrl.replace(/\/+$/, "");
  if (base.includes("{APP_ID}")) return base.replace(/\{APP_ID\}/g, encoded);
  if (base.includes("APP_ID")) return base.replace(/APP_ID/g, encoded);
  if (/\/apps\/[^/]+\/completion$/i.test(base)) return base;
  return `${base}/apps/${encoded}/completion`;
}

function aliyunDeployableModelsUrl(baseUrl: string): string {
  const parsed = new URL(baseUrl);
  return `${parsed.origin}/api/v1/deployments/models?page_no=1&page_size=100&version=v1.0&model_source=base`;
}

function modelsFromOpenAiList(json: Record<string, unknown>, provider: AgentProviderId): AgentProviderModel[] {
  return asArray(json.data)
    .map((item) => modelFromRecordLike(item))
    .filter((model): model is AgentProviderModel => Boolean(model && looksLikeProviderModel(model.id, provider)));
}

function modelsFromAnyJson(json: Record<string, unknown>, provider: AgentProviderId): AgentProviderModel[] {
  const models: AgentProviderModel[] = [];
  const seen = new Set<unknown>();
  const visit = (value: unknown, depth: number): void => {
    if (depth > 8 || value === null || value === undefined || seen.has(value)) return;
    if (typeof value === "string") {
      if (looksLikeProviderModel(value, provider)) models.push({ id: value });
      return;
    }
    if (typeof value !== "object") return;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1);
      return;
    }
    const record = value as Record<string, unknown>;
    const model = modelFromRecordLike(record);
    if (model && looksLikeProviderModel(model.id, provider)) models.push(model);
    for (const child of Object.values(record)) visit(child, depth + 1);
  };
  visit(json, 0);
  return models;
}

function modelFromRecordLike(value: unknown): AgentProviderModel | null {
  if (typeof value === "string") return { id: value };
  const record = asRecord(value);
  if (!record) return null;
  const id =
    stringValue(record.id) ??
    stringValue(record.model) ??
    stringValue(record.model_id) ??
    stringValue(record.modelId) ??
    stringValue(record.model_name) ??
    stringValue(record.modelName) ??
    stringValue(record.name);
  if (!id) return null;
  return {
    id,
    label: stringValue(record.display_name) ?? stringValue(record.displayName) ?? stringValue(record.name),
    ownedBy: stringValue(record.owned_by) ?? stringValue(record.owner) ?? stringValue(record.provider),
  };
}

function normalizeModelList(
  models: AgentProviderModel[],
  provider: AgentProviderId,
): AgentProviderModel[] {
  const result: AgentProviderModel[] = [];
  const seen = new Set<string>();
  for (const model of models) {
    const id = model.id.trim();
    if (!id || seen.has(id) || !looksLikeProviderModel(id, provider)) continue;
    seen.add(id);
    result.push({ ...model, id });
  }
  result.sort((a, b) => a.id.localeCompare(b.id, undefined, { sensitivity: "base" }));
  return result;
}

function looksLikeProviderModel(id: string, provider: AgentProviderId): boolean {
  const value = id.trim();
  if (!value || value.length > 160 || /^https?:\/\//i.test(value)) return false;
  if (provider === "deepseek") return /^deepseek[-_a-z0-9.]+$/i.test(value);
  if (provider === "zhipu") return /^(glm|chatglm|codegeex|embedding|rerank|charglm|emohaa|cog|vidu)[-_a-z0-9.]*$/i.test(value);
  return /^(qwen|qwq|qvq|qvq|text-|omni-|wanx-|sambert|paraformer|gte-|bge-|multimodal-|moka-)[-_a-z0-9.]*$/i.test(value);
}

interface ProviderErrorInfo {
  code?: string;
  message?: string;
  requestId?: string;
}

interface ProviderErrorExplanation {
  reason: string;
  solutions: string[];
}

function formatAgentProviderApiError(
  provider: AgentProviderId,
  httpStatus: number | null,
  json: Record<string, unknown>,
  fallback?: string,
): string {
  const info = providerErrorInfo(json);
  const message = info.message ?? fallback ?? "服务商返回了错误。";
  const explanation = explainAgentProviderError(provider, httpStatus, info.code, message);
  const raw = [
    httpStatus ? `HTTP ${httpStatus}` : null,
    info.code ? `code ${info.code}` : null,
    message,
  ].filter(Boolean).join(" · ");
  const lines = [
    `${agentProviderLabel(provider)} 接入失败`,
    `原因：${explanation.reason}`,
    "解决方式：",
    ...explanation.solutions.map((solution, index) => `${index + 1}. ${solution}`),
    "",
    `原始返回：${raw}`,
  ];
  if (info.requestId) lines.push(`请求 ID：${info.requestId}`);
  return lines.join("\n");
}

function explainAgentProviderError(
  provider: AgentProviderId,
  httpStatus: number | null,
  code: string | undefined,
  message: string,
): ProviderErrorExplanation {
  const normalized = `${code ?? ""} ${message}`.toLowerCase();
  if (provider === "deepseek") return explainDeepSeekError(httpStatus, normalized);
  if (provider === "zhipu") return explainZhipuError(httpStatus, normalized);
  return explainQwenError(httpStatus, normalized);
}

function explainDeepSeekError(httpStatus: number | null, normalized: string): ProviderErrorExplanation {
  if (httpStatus === 402 || normalized.includes("insufficient balance")) {
    return {
      reason: "DeepSeek API 账户余额不足。DeepSeek 官方文档把 402 / Insufficient Balance 解释为账户余额已用完。",
      solutions: [
        "登录 DeepSeek 开放平台，进入 Billing / Top up 页面检查 API 余额。",
        "充值后回到这里重新测试；网页版会员或聊天额度通常不能直接抵扣 API 调用。",
        "确认当前 API Key 属于刚充值的同一个 DeepSeek 账号。",
      ],
    };
  }
  if (httpStatus === 401 || normalized.includes("authentication")) {
    return {
      reason: "DeepSeek 认证失败，通常是 API Key 填错、复制不完整或填了别的平台的 Key。",
      solutions: [
        "在 DeepSeek 平台重新创建或复制 API Key。",
        "确认 API Key 前后没有空格、换行，Base URL 使用 https://api.deepseek.com。",
        "重新粘贴后等待自动保存并测试。",
      ],
    };
  }
  if (httpStatus === 422 || normalized.includes("invalid parameter")) {
    return {
      reason: "DeepSeek 认为请求参数不合法，常见是模型名、max tokens 或 Base URL 路径不匹配。",
      solutions: [
        "点击刷新模型，使用下拉列表里的模型，不要手动改模型名。",
        "把 Base URL 恢复为 https://api.deepseek.com 后再试。",
        "降低最大输出长度后重新测试。",
      ],
    };
  }
  if (httpStatus === 429 || normalized.includes("rate limit")) {
    return {
      reason: "DeepSeek 限流，请求发送太快或当前额度的并发限制被触发。",
      solutions: [
        "等待几十秒后重试。",
        "减少并发请求，或换用更高额度/更高限额的账号。",
      ],
    };
  }
  if (httpStatus === 500 || httpStatus === 503 || normalized.includes("overloaded")) {
    return {
      reason: "DeepSeek 服务端繁忙或临时故障。",
      solutions: [
        "稍后重试。",
        "如果持续失败，去 DeepSeek 状态页或控制台确认服务是否异常。",
      ],
    };
  }
  return genericProviderErrorExplanation(httpStatus);
}

function explainZhipuError(httpStatus: number | null, normalized: string): ProviderErrorExplanation {
  if (httpStatus === 402 || normalized.includes("insufficient") || normalized.includes("余额不足") || normalized.includes("account balance")) {
    return {
      reason: "智谱开放平台账户余额或套餐额度不足。",
      solutions: [
        "登录智谱开放平台，进入财务/充值页面检查余额和套餐。",
        "确认当前 API Key 属于刚充值的同一个智谱账号。",
        "充值或套餐恢复后，回到这里重新测试。",
      ],
    };
  }
  if (httpStatus === 401 || normalized.includes("invalid api key") || normalized.includes("unauthorized") || normalized.includes("authentication")) {
    return {
      reason: "智谱 API Key 无效或未正确发送。",
      solutions: [
        "在智谱开放平台 API Key 页面重新复制或创建 Key。",
        "确认 API Key 前后没有空格、换行，且来自智谱开放平台。",
        "确认 Base URL 使用 https://open.bigmodel.cn/api/paas/v4。",
      ],
    };
  }
  if (normalized.includes("model") && (normalized.includes("not found") || normalized.includes("invalid"))) {
    return {
      reason: "智谱模型名不可用，常见是账号未开通该模型或模型名已经变更。",
      solutions: [
        "点击刷新模型，从下拉列表选择当前账号可用模型。",
        "如果模型列表为空，先在智谱控制台确认账号已开通 GLM 文本模型。",
      ],
    };
  }
  if (httpStatus === 400 || normalized.includes("invalid parameter") || normalized.includes("bad request")) {
    return {
      reason: "智谱认为请求参数不合法，常见是模型名、temperature 或 max_tokens 超出当前模型限制。",
      solutions: [
        "刷新模型列表并选择下拉列表里的模型。",
        "把 Base URL 恢复为 https://open.bigmodel.cn/api/paas/v4。",
        "降低最大输出长度后重试。",
      ],
    };
  }
  if (httpStatus === 429 || normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return {
      reason: "智谱请求过快，被限流了。",
      solutions: [
        "等待一会儿后重试。",
        "减少并发调用，或检查账号的速率限制。",
      ],
    };
  }
  if (normalized.includes("timeout") || httpStatus === 408) {
    return {
      reason: "智谱请求超时。",
      solutions: [
        "检查网络和代理是否能访问 open.bigmodel.cn。",
        "稍后重试，必要时降低最大输出长度。",
      ],
    };
  }
  if (httpStatus !== null && httpStatus >= 500) {
    return {
      reason: "智谱服务端临时故障或繁忙。",
      solutions: [
        "稍后重试。",
        "如果连续失败，复制原始返回和请求 ID 去智谱控制台或工单排查。",
      ],
    };
  }
  return genericProviderErrorExplanation(httpStatus);
}

function explainQwenError(httpStatus: number | null, normalized: string): ProviderErrorExplanation {
  if (normalized.includes("100011") || normalized.includes("no available quota") || normalized.includes("insufficient") || httpStatus === 402) {
    return {
      reason: "阿里百炼账户没有可用额度。",
      solutions: [
        "登录阿里云百炼控制台，检查当前地域和业务空间的可用额度。",
        "开通按量付费、充值，或确认套餐仍然有效。",
        "如果使用 Coding Plan 专属 Key，确认 Base URL 也切到 Coding Plan 专属地址。",
      ],
    };
  }
  if (httpStatus === 401 || normalized.includes("invalidapikey") || normalized.includes("invalid_api_key") || normalized.includes("incorrect api key") || normalized.includes("no api key")) {
    return {
      reason: "阿里百炼 API Key 无效。常见原因是 Key 填错、复制带空格、Key 和 Base URL 地域不一致，或 Coding Plan 专属 Key 使用了普通地址。",
      solutions: [
        "重新复制阿里百炼 API Key，确认是 sk- 开头且没有空格/换行。",
        "确认 API Key 所在地域和 Base URL 一致：北京通常用 https://dashscope.aliyuncs.com，海外/新加坡/美国要用控制台对应地址。",
        "如果 Key 是 sk-sp- 开头的 Coding Plan 专属 Key，请按阿里文档使用对应专属 Base URL。",
      ],
    };
  }
  if (normalized.includes("app.accessdenied") || normalized.includes("workspace.accessdenied") || normalized.includes("model.accessdenied") || httpStatus === 403) {
    return {
      reason: "阿里百炼权限不足，当前 API Key 没有访问这个应用、模型或业务空间的权限。",
      solutions: [
        "确认使用的是应用/模型所在业务空间的 API Key。",
        "检查智能体应用是否已发布，APP_ID 是否复制正确。",
        "必要时使用主账号 API Key，或给子账号/业务空间补授权。",
      ],
    };
  }
  if (normalized.includes("100012") || normalized.includes("app id") || normalized.includes("app_id")) {
    return {
      reason: "阿里百炼应用 ID 不合法或和当前 API Key 不属于同一业务空间。",
      solutions: [
        "到百炼应用管理页重新复制 APP_ID。",
        "确认 API Key 和 APP_ID 属于同一个地域、同一个业务空间。",
        "确认应用已经发布后再测试。",
      ],
    };
  }
  if (normalized.includes("notfound") || normalized.includes("request path not found") || httpStatus === 404) {
    return {
      reason: "阿里百炼请求地址不正确，通常是 Base URL 地域、路径或模式填错。",
      solutions: [
        "千问模型模式使用 OpenAI 兼容 Base URL，例如北京地域 https://dashscope.aliyuncs.com/compatible-mode/v1。",
        "百炼智能体应用模式使用 DashScope Base URL，例如北京地域 https://dashscope.aliyuncs.com/api/v1。",
        "海外地域请以百炼控制台 API Key 页面展示的地址为准。",
      ],
    };
  }
  if (normalized.includes("100019") || normalized.includes("model not") || normalized.includes("model_not_found")) {
    return {
      reason: "阿里百炼模型不存在或当前账号不可用。",
      solutions: [
        "点击刷新模型，从下拉列表选择可用模型。",
        "确认 API Key 所在业务空间已开通该模型。",
      ],
    };
  }
  if (normalized.includes("100013") || normalized.includes("timeout") || httpStatus === 408) {
    return {
      reason: "阿里百炼请求超时。",
      solutions: [
        "检查网络和代理。",
        "稍后重试；如果是智能体应用，检查应用内插件或工作流是否超时。",
      ],
    };
  }
  if (httpStatus === 429 || normalized.includes("rate limit")) {
    return {
      reason: "阿里百炼请求过快，被限流了。",
      solutions: [
        "等待一会儿后重试。",
        "减少并发调用，或检查控制台限流配置。",
      ],
    };
  }
  return genericProviderErrorExplanation(httpStatus);
}

function genericProviderErrorExplanation(httpStatus: number | null): ProviderErrorExplanation {
  if (httpStatus === 400) {
    return {
      reason: "请求参数不符合服务商要求。",
      solutions: [
        "刷新模型列表并使用下拉选择的模型。",
        "检查 Base URL、模型、应用 ID 和最大输出长度。",
      ],
    };
  }
  if (httpStatus === 401) {
    return {
      reason: "认证失败，API Key 无效或没有被正确发送。",
      solutions: [
        "重新复制 API Key，确认没有空格或换行。",
        "确认 API Key 来自当前选择的服务商。",
      ],
    };
  }
  if (httpStatus === 403) {
    return {
      reason: "权限不足，当前账号或 API Key 没有访问该模型/应用的权限。",
      solutions: [
        "检查模型权限、业务空间、应用发布状态和账号套餐。",
        "在服务商控制台开通对应模型或换用有权限的 API Key。",
      ],
    };
  }
  if (httpStatus === 404) {
    return {
      reason: "请求地址不存在，通常是 Base URL 或接口模式填错。",
      solutions: [
        "把 Base URL 恢复为默认值后再试。",
        "确认当前选择的是模型模式还是智能体应用模式。",
      ],
    };
  }
  if (httpStatus === 429) {
    return {
      reason: "请求过快，被服务商限流。",
      solutions: [
        "等待一会儿后重试。",
        "减少并发请求或升级服务商额度。",
      ],
    };
  }
  if (httpStatus !== null && httpStatus >= 500) {
    return {
      reason: "服务商接口临时故障或繁忙。",
      solutions: [
        "稍后重试。",
        "如果持续失败，复制原始返回去服务商控制台排查。",
      ],
    };
  }
  return {
    reason: "服务商返回了未识别的错误。",
    solutions: [
      "查看下面的原始返回，并核对 API Key、Base URL、模型和账号额度。",
      "如果原始返回里有 request_id，请带上它去服务商控制台或工单排查。",
    ],
  };
}

function agentProviderLabel(provider: AgentProviderId): string {
  if (provider === "deepseek") return "DeepSeek";
  if (provider === "zhipu") return "智谱 GLM";
  return "阿里千问/百炼";
}

function providerErrorInfo(json: Record<string, unknown>): ProviderErrorInfo {
  const error = asRecord(json.error);
  const baseResp = asRecord(json.base_resp);
  const output = asRecord(json.output);
  const code =
    textValue(error?.code) ??
    textValue(json.code) ??
    textValue(json.status_code) ??
    textValue(baseResp?.status_code) ??
    textValue(output?.code);
  const message =
    textValue(error?.message) ??
    textValue(json.message) ??
    textValue(json.msg) ??
    textValue(json.status_msg) ??
    textValue(baseResp?.status_msg) ??
    textValue(output?.message);
  const requestId =
    textValue(json.request_id) ??
    textValue(json.requestId) ??
    textValue(error?.request_id) ??
    textValue(baseResp?.trace_id);
  return { code, message, requestId };
}

function providerErrorMessage(json: Record<string, unknown>): string | null {
  const info = providerErrorInfo(json);
  if (isProviderSuccessCode(info.code) && !info.message) return null;
  if (isProviderSuccessCode(info.code) && isProviderSuccessMessage(info.message)) return null;
  return info.message ?? info.code ?? null;
}

function isProviderSuccessCode(code: string | undefined): boolean {
  return Boolean(code && /^(0|200|success|ok)$/i.test(code.trim()));
}

function isProviderSuccessMessage(message: string | undefined): boolean {
  return Boolean(message && /^(success|ok|succeeded)$/i.test(message.trim()));
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function textValue(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function extractContentText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value
    .map((part) => {
      if (typeof part === "string") return part;
      const record = asRecord(part);
      return stringValue(record?.text) ?? "";
    })
    .filter(Boolean)
    .join("\n");
}

function isPathInside(parent: string, target: string): boolean {
  const rel = relative(resolve(parent), resolve(target));
  return rel === "" || (!!rel && !rel.startsWith("..") && !isAbsolute(rel));
}

function log(level: "info" | "warn" | "error", ...args: unknown[]): void {
  const line = `[${new Date().toISOString()}] [${level}] ${args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
    .join(" ")}\n`;
  try {
    appendCappedLog(LOG_FILE, line);
  } catch {}
  if (level === "error") console.error("[codex-plusplus]", ...args);
}

function installSparkleUpdateHook(): void {
  if (process.platform !== "darwin") return;

  const Module = require("node:module") as typeof import("node:module") & {
    _load?: (request: string, parent: unknown, isMain: boolean) => unknown;
  };
  const originalLoad = Module._load;
  if (typeof originalLoad !== "function") return;

  Module._load = function codexPlusPlusModuleLoad(request: string, parent: unknown, isMain: boolean) {
    const loaded = originalLoad.apply(this, [request, parent, isMain]) as unknown;
    if (typeof request === "string" && /sparkle(?:\.node)?$/i.test(request)) {
      wrapSparkleExports(loaded);
    }
    return loaded;
  };
}

function wrapSparkleExports(loaded: unknown): void {
  if (!loaded || typeof loaded !== "object") return;
  const exports = loaded as Record<string, unknown> & { __codexppSparkleWrapped?: boolean };
  if (exports.__codexppSparkleWrapped) return;
  exports.__codexppSparkleWrapped = true;

  for (const name of ["installUpdatesIfAvailable"]) {
    const fn = exports[name];
    if (typeof fn !== "function") continue;
    exports[name] = function codexPlusPlusSparkleWrapper(this: unknown, ...args: unknown[]) {
      prepareSignedCodexForSparkleInstall();
      return Reflect.apply(fn, this, args);
    };
  }

  if (exports.default && exports.default !== exports) {
    wrapSparkleExports(exports.default);
  }
}

function prepareSignedCodexForSparkleInstall(): void {
  if (process.platform !== "darwin") return;
  if (existsSync(UPDATE_MODE_FILE)) {
    log("info", "Sparkle update prep skipped; update mode already active");
    return;
  }
  if (!existsSync(SIGNED_CODEX_BACKUP)) {
    log("warn", "Sparkle update prep skipped; signed Codex.app backup is missing");
    return;
  }
  if (!isDeveloperIdSignedApp(SIGNED_CODEX_BACKUP)) {
    log("warn", "Sparkle update prep skipped; Codex.app backup is not Developer ID signed");
    return;
  }

  const state = readInstallerState();
  const appRoot = state?.appRoot ?? inferMacAppRoot();
  if (!appRoot) {
    log("warn", "Sparkle update prep skipped; could not infer Codex.app path");
    return;
  }

  const mode = {
    enabledAt: new Date().toISOString(),
    appRoot,
    codexVersion: state?.codexVersion ?? null,
  };
  writeFileSync(UPDATE_MODE_FILE, JSON.stringify(mode, null, 2));

  try {
    execFileSync("ditto", [SIGNED_CODEX_BACKUP, appRoot], { stdio: "ignore" });
    try {
      execFileSync("xattr", ["-dr", "com.apple.quarantine", appRoot], { stdio: "ignore" });
    } catch {}
    log("info", "Restored signed Codex.app before Sparkle install", { appRoot });
  } catch (e) {
    log("error", "Failed to restore signed Codex.app before Sparkle install", {
      message: (e as Error).message,
    });
  }
}

function isDeveloperIdSignedApp(appRoot: string): boolean {
  const result = spawnSync("codesign", ["-dv", "--verbose=4", appRoot], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  return (
    result.status === 0 &&
    /Authority=Developer ID Application:/.test(output) &&
    !/Signature=adhoc/.test(output) &&
    !/TeamIdentifier=not set/.test(output)
  );
}

function inferMacAppRoot(): string | null {
  const marker = ".app/Contents/MacOS/";
  const idx = process.execPath.indexOf(marker);
  return idx >= 0 ? process.execPath.slice(0, idx + ".app".length) : null;
}

// Surface unhandled errors from anywhere in the main process to our log.
process.on("uncaughtException", (e: Error & { code?: string }) => {
  log("error", "uncaughtException", { code: e.code, message: e.message, stack: e.stack });
});
process.on("unhandledRejection", (e) => {
  log("error", "unhandledRejection", { value: String(e) });
});

installSparkleUpdateHook();

interface LoadedMainTweak {
  stop?: () => void;
  storage: DiskStorage;
}

interface CodexWindowServices {
  createFreshWindow?: (route?: string) => Promise<Electron.BrowserWindow | null>;
  createFreshLocalWindow?: (route?: string) => Promise<Electron.BrowserWindow | null>;
  ensureHostWindow?: (hostId?: string) => Promise<Electron.BrowserWindow | null>;
  getPrimaryWindow?: (hostId?: string) => Electron.BrowserWindow | null;
  getContext?: (hostId: string) => { registerWindow?: (windowLike: CodexWindowLike) => void } | null;
  windowManager?: {
    createWindow?: (opts: Record<string, unknown>) => Promise<Electron.BrowserWindow | null>;
    getPrimaryWindow?: () => Electron.BrowserWindow | null;
    registerWindow?: (
      windowLike: CodexWindowLike,
      hostId: string,
      primary: boolean,
      appearance: string,
    ) => void;
    options?: {
      allowDevtools?: boolean;
      preloadPath?: string;
    };
  };
}

interface CodexWindowLike {
  id: number;
  webContents: Electron.WebContents;
  on(event: "closed", listener: () => void): unknown;
  once?(event: string, listener: (...args: unknown[]) => void): unknown;
  off?(event: string, listener: (...args: unknown[]) => void): unknown;
  removeListener?(event: string, listener: (...args: unknown[]) => void): unknown;
  isDestroyed?(): boolean;
  isFocused?(): boolean;
  focus?(): void;
  show?(): void;
  hide?(): void;
  getBounds?(): Electron.Rectangle;
  getContentBounds?(): Electron.Rectangle;
  getSize?(): [number, number];
  getContentSize?(): [number, number];
  setTitle?(title: string): void;
  getTitle?(): string;
  setRepresentedFilename?(filename: string): void;
  setDocumentEdited?(edited: boolean): void;
  setWindowButtonVisibility?(visible: boolean): void;
}

interface CodexCreateWindowOptions {
  route: string;
  hostId?: string;
  show?: boolean;
  appearance?: string;
  parentWindowId?: number;
  bounds?: Electron.Rectangle;
}

interface CodexCreateViewOptions {
  route: string;
  hostId?: string;
  appearance?: string;
}

type OwlViewAttachMode = "contentView" | "browserView";

interface ManagedOwlView {
  key: string;
  tweakId: string;
  id: string;
  view: Electron.BrowserView;
  parentWindowId: number | null;
  attachMode: OwlViewAttachMode | null;
  disposeBindings: Array<() => void>;
  disposed: boolean;
}

const tweakState = {
  discovered: [] as DiscoveredTweak[],
  loadedMain: new Map<string, LoadedMainTweak>(),
};

const nativeBridge = new NativeBridge(log, {
  nativeHostPath: join(runtimeDir, "native", "codexpp_native_host.node"),
});
const owlViews = new Map<string, ManagedOwlView>();

const tweakLifecycleDeps = {
  logInfo: (message: string) => log("info", message),
  setTweakEnabled,
  stopAllMainTweaks,
  clearTweakModuleCache,
  loadAllMainTweaks,
  broadcastReload,
};

function applyCodexPlusPlusEnabledState(enabled: boolean): void {
  if (enabled) {
    log("info", "codex-plusplus plugin switch enabled");
    ensureCodexModelBridgeFromState();
    reloadTweaks("plugin-enabled", tweakLifecycleDeps);
    broadcastPluginEnabledChanged(true);
    return;
  }

  log("info", "codex-plusplus plugin switch disabled; stopping features");
  stopAllMainTweaks();
  clearTweakModuleCache();
  syncMcpServersFromEnabledTweaks();
  stopCodexModelBridgeServer();
  syncDesktopCodexAuthFromGlobal("plugin-disabled");
  writeCodexNativeConfig(readState().codexPlusPlus?.modelBridgeBackup);
  broadcastPluginEnabledChanged(false);
}

// 1. Hook every session so our preload runs in every renderer.
//
// We use Electron's modern `session.registerPreloadScript` API (added in
// Electron 35). The deprecated `setPreloads` path silently no-ops in some
// configurations (notably with sandboxed renderers), so registerPreloadScript
// is the only reliable way to inject into Codex's BrowserWindows.
function registerPreload(s: Electron.Session, label: string): void {
  try {
    const reg = (s as unknown as {
      registerPreloadScript?: (opts: {
        type?: "frame" | "service-worker";
        id?: string;
        filePath: string;
      }) => string;
    }).registerPreloadScript;
    if (typeof reg === "function") {
      reg.call(s, { type: "frame", filePath: PRELOAD_PATH, id: "codex-plusplus" });
      log("info", `preload registered (registerPreloadScript) on ${label}:`, PRELOAD_PATH);
      return;
    }
    // Fallback for older Electron versions.
    const existing = s.getPreloads();
    if (!existing.includes(PRELOAD_PATH)) {
      s.setPreloads([...existing, PRELOAD_PATH]);
    }
    log("info", `preload registered (setPreloads) on ${label}:`, PRELOAD_PATH);
  } catch (e) {
    if (e instanceof Error && e.message.includes("existing ID")) {
      log("info", `preload already registered on ${label}:`, PRELOAD_PATH);
      return;
    }
    log("error", `preload registration on ${label} failed:`, e);
  }
}

const LOCALIZED_APPLICATION_MENU_LABELS: Record<string, string> = {
  File: "\u6587\u4ef6",
  Edit: "\u7f16\u8f91",
  Selection: "\u9009\u62e9",
  View: "\u67e5\u770b",
  Go: "\u8f6c\u5230",
  Run: "\u8fd0\u884c",
  Window: "\u7a97\u53e3",
  Help: "\u5e2e\u52a9",
  "New Chat": "\u65b0\u5bf9\u8bdd",
  "New Window": "\u65b0\u5efa\u7a97\u53e3",
  "Quick Chat": "\u5feb\u901f\u5bf9\u8bdd",
  "Open Folder...": "\u6253\u5f00\u6587\u4ef6\u5939...",
  "Open Folder\u2026": "\u6253\u5f00\u6587\u4ef6\u5939...",
  "Open Settings": "\u6253\u5f00\u8bbe\u7f6e",
  Settings: "\u8bbe\u7f6e",
  "Settings...": "\u8bbe\u7f6e...",
  "Settings\u2026": "\u8bbe\u7f6e...",
  "Log Out": "\u9000\u51fa\u767b\u5f55",
  "Close Window": "\u5173\u95ed\u7a97\u53e3",
  Close: "\u5173\u95ed",
  Quit: "\u9000\u51fa",
  Exit: "\u9000\u51fa",
  Undo: "\u64a4\u9500",
  Redo: "\u91cd\u505a",
  Cut: "\u526a\u5207",
  Copy: "\u590d\u5236",
  Paste: "\u7c98\u8d34",
  "Select All": "\u5168\u9009",
  "Toggle Sidebar": "\u5207\u6362\u4fa7\u8fb9\u680f",
  "Toggle Bottom Panel": "\u5207\u6362\u5e95\u90e8\u9762\u677f",
  "Open Terminal": "\u6253\u5f00\u7ec8\u7aef",
  "Toggle File Tree": "\u5207\u6362\u6587\u4ef6\u6811",
  "Open Browser Tab": "\u6253\u5f00\u6d4f\u89c8\u5668\u6807\u7b7e\u9875",
  "Reload Browser Page": "\u91cd\u65b0\u52a0\u8f7d\u6d4f\u89c8\u5668\u9875\u9762",
  "Toggle Side Panel": "\u5207\u6362\u4fa7\u8fb9\u9762\u677f",
  Find: "\u67e5\u627e",
  "Previous Chat": "\u4e0a\u4e00\u4e2a\u5bf9\u8bdd",
  "Next Chat": "\u4e0b\u4e00\u4e2a\u5bf9\u8bdd",
  Back: "\u540e\u9000",
  Forward: "\u524d\u8fdb",
  "Zoom In": "\u653e\u5927",
  "Zoom Out": "\u7f29\u5c0f",
  "Actual Size": "\u5b9e\u9645\u5927\u5c0f",
  "Toggle Full Screen": "\u5207\u6362\u5168\u5c4f",
  Minimize: "\u6700\u5c0f\u5316",
  "Codex Documentation": "Codex \u6587\u6863",
  "What's new": "\u65b0\u589e\u5185\u5bb9",
  "What's New": "\u65b0\u589e\u5185\u5bb9",
  Automations: "\u81ea\u52a8\u5316",
  "Local Environments": "\u672c\u5730\u73af\u5883",
  Worktrees: "\u5de5\u4f5c\u6811",
  Skills: "\u6280\u80fd",
  "Model Context Protocol": "\u6a21\u578b\u4e0a\u4e0b\u6587\u534f\u8bae",
  Troubleshooting: "\u6545\u969c\u6392\u67e5",
  "Send Feedback": "\u53d1\u9001\u53cd\u9988",
  "Start Performance Trace": "\u5f00\u59cb\u6027\u80fd\u8ddf\u8e2a",
  "Keyboard Shortcuts": "\u952e\u76d8\u5feb\u6377\u952e",
  "About Codex": "\u5173\u4e8e Codex",
};

const XIAOBAI_AI_TOOLBOX_LABEL = "\u5c0f\u767d AI\u5de5\u5177\u7bb1";
const DEFAULT_XIAOBAI_TOOLBOX_PATH = "E:\\git\\aitool";
const XIAOBAI_TOOLBOX_EXECUTABLE_CANDIDATES = [
  "\u5c0f\u767dAI\u5de5\u5177\u7bb1.exe",
  "XiaoBaiAIToolbox.exe",
  "aitool.exe",
];

let applicationMenuLocalizationHookInstalled = false;
let trayActivationHookInstalled = false;
let appActivationRestoreHookInstalled = false;
let codexPlusPlusTray: Electron.Tray | null = null;

function installApplicationMenuLocalizationHook(): void {
  if (applicationMenuLocalizationHookInstalled) return;
  applicationMenuLocalizationHookInstalled = true;

  try {
    const originalSetApplicationMenu = Menu.setApplicationMenu.bind(Menu);
    const menuApi = Menu as typeof Menu & {
      setApplicationMenu: (menu: Electron.Menu | null) => void;
    };

    menuApi.setApplicationMenu = (menu: Electron.Menu | null): void => {
      customizeApplicationMenu(menu);
      originalSetApplicationMenu(menu);
    };

    const windowPrototype = BrowserWindow.prototype as unknown as {
      setMenu?: (this: BrowserWindow, menu: Electron.Menu | null) => void;
    };
    const originalSetWindowMenu = windowPrototype.setMenu;
    if (typeof originalSetWindowMenu === "function") {
      windowPrototype.setMenu = function setLocalizedWindowMenu(
        this: BrowserWindow,
        menu: Electron.Menu | null,
      ): void {
        customizeApplicationMenu(menu);
        originalSetWindowMenu.call(this, menu);
      };
    }

    customizeApplicationMenu(Menu.getApplicationMenu());
    log("info", "application menu localization hook installed");
  } catch (e) {
    log("warn", "failed to install application menu localization hook:", e);
  }
}

function customizeApplicationMenu(menu: Electron.Menu | null): void {
  if (!menu) return;
  localizeApplicationMenuLabels(menu);
  ensureXiaobaiAiToolboxMenuItem(menu);
}

function localizeApplicationMenuLabels(menu: Electron.Menu | null): void {
  if (!menu) return;

  for (const item of menu.items) {
    const translated = localizedApplicationMenuLabel(item.label);
    if (translated && translated !== item.label) {
      (item as unknown as { label: string }).label = translated;
    }
    if (item.submenu) {
      localizeApplicationMenuLabels(item.submenu);
    }
  }
}

function localizedApplicationMenuLabel(label?: string): string | undefined {
  if (!label) return undefined;

  const normalized = label.replace(/&/g, "").trim();
  return LOCALIZED_APPLICATION_MENU_LABELS[normalized];
}

function ensureXiaobaiAiToolboxMenuItem(menu: Electron.Menu): void {
  const helpItem = menu.items.find((item) => {
    const label = normalizedMenuLabel(item.label);
    return label === "Help" || label === "\u5e2e\u52a9";
  });
  const submenu = helpItem?.submenu;
  if (!submenu) return;
  if (submenu.items.some((item) => normalizedMenuLabel(item.label) === XIAOBAI_AI_TOOLBOX_LABEL)) return;

  const item = Menu.buildFromTemplate([
    {
      label: XIAOBAI_AI_TOOLBOX_LABEL,
      accelerator: "Alt+Shift+S",
      click: () => {
        openXiaobaiAiToolbox().catch((e) => {
          log("warn", "\u5c0f\u767d AI\u5de5\u5177\u7bb1 launch failed:", e);
        });
      },
    },
  ]).items[0];
  if (item) submenu.insert(0, item);
}

function normalizedMenuLabel(label?: string): string {
  return (label ?? "").replace(/&/g, "").trim();
}

function installCodexPlusPlusTrayRestoreEntry(): void {
  if (codexPlusPlusTray || process.platform !== "win32") return;
  if (!isCodexPlusPlusEnabled()) return;

  try {
    const iconPath = join(dirname(process.execPath), "resources", "icon.ico");
    if (!existsSync(iconPath)) {
      log("warn", "codex-plusplus tray restore entry skipped; icon missing:", iconPath);
      return;
    }

    const tray = new Tray(iconPath);
    const restore = (): void => {
      log("info", "codex-plusplus tray restore requested");
      scheduleTrayRestoreBursts("codexpp-tray");
    };

    tray.setToolTip("codex汉化增强plus版 - 打开 Codex");
    tray.on("click", restore);
    tray.on("double-click", restore);
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: "打开 Codex",
          click: restore,
        },
      ]),
    );

    codexPlusPlusTray = tray;
    log("info", "codex-plusplus tray restore entry installed");
  } catch (e) {
    log("warn", "failed to install codex-plusplus tray restore entry:", String((e as Error)?.stack ?? e));
  }
}

function installTrayActivationHook(): void {
  if (trayActivationHookInstalled || process.platform !== "win32") return;
  trayActivationHookInstalled = true;

  try {
    const electronModule = require("electron") as typeof import("electron") & {
      Tray: typeof Electron.Tray;
    };
    const trayPrototype = electronModule.Tray?.prototype as (Electron.Tray & {
      emit?: (eventName: string | symbol, ...args: unknown[]) => boolean;
      __codexppTrayEmitWrapped?: boolean;
    }) | undefined;
    if (!trayPrototype || trayPrototype.__codexppTrayEmitWrapped) return;

    const originalEmit = trayPrototype.emit;
    if (typeof originalEmit !== "function") {
      log("warn", "tray activation hook skipped; Tray.prototype.emit is unavailable");
      return;
    }

    trayPrototype.__codexppTrayEmitWrapped = true;
    trayPrototype.emit = function codexPlusPlusTrayEmit(
      this: Electron.Tray,
      eventName: string | symbol,
      ...args: unknown[]
    ): boolean {
      const activation = trayActivationEventName(eventName);
      if (activation) {
        log("info", `tray activation event (${activation})`);
        restoreCodexWindowFromTray(`tray-${activation}:before`);
      }
      const handled = originalEmit.call(this, eventName, ...args);
      if (activation) scheduleTrayRestoreBursts(`tray-${activation}:after`);
      return handled;
    };
    log("info", "tray activation hook installed (prototype emit)");
  } catch (e) {
    log("warn", "failed to install tray activation hook:", String((e as Error)?.stack ?? e));
  }
}

function installAppActivationRestoreHook(): void {
  if (appActivationRestoreHookInstalled || process.platform !== "win32") return;
  appActivationRestoreHookInstalled = true;

  try {
    const appEmitter = app as typeof app & {
      emit: (eventName: string | symbol, ...args: unknown[]) => boolean;
      __codexppAppEmitWrapped?: boolean;
    };
    if (appEmitter.__codexppAppEmitWrapped) return;

    const originalEmit = appEmitter.emit;
    if (typeof originalEmit !== "function") {
      log("warn", "app activation restore hook skipped; app.emit is unavailable");
      return;
    }

    appEmitter.__codexppAppEmitWrapped = true;
    appEmitter.emit = function codexPlusPlusAppEmit(
      this: typeof app,
      eventName: string | symbol,
      ...args: unknown[]
    ): boolean {
      const activation = appActivationEventName(eventName);
      if (activation) {
        log("info", `app activation event (${activation})`);
        scheduleTrayRestoreBursts(`app-${activation}:before`);
      }
      const handled = originalEmit.call(this, eventName, ...args);
      if (activation) scheduleTrayRestoreBursts(`app-${activation}:after`);
      return handled;
    };
    log("info", "app activation restore hook installed (app.emit)");
  } catch (e) {
    log("warn", "failed to install app activation restore hook:", String((e as Error)?.stack ?? e));
  }
}

function trayActivationEventName(eventName: string | symbol): string | null {
  if (eventName === "click") return "click";
  if (eventName === "double-click") return "double-click";
  if (eventName === "balloon-click") return "balloon-click";
  return null;
}

function appActivationEventName(eventName: string | symbol): string | null {
  if (eventName === "activate") return "activate";
  if (eventName === "second-instance") return "second-instance";
  if (eventName === "open-url") return "open-url";
  if (eventName === "open-file") return "open-file";
  return null;
}

function scheduleTrayRestoreBursts(reason: string): void {
  for (const delay of [0, 80, 240, 700, 1400, 3000]) {
    setTimeout(() => restoreCodexWindowFromTray(`${reason}+${delay}ms`), delay);
  }
}

function scheduleExistingWindowRestoreBursts(reason: string): void {
  for (const delay of [350, 900, 1800, 3200, 5600]) {
    setTimeout(() => restoreExistingCodexWindow(`${reason}+${delay}ms`), delay);
  }
}

function restoreCodexWindowFromTray(reason: string): void {
  void restoreCodexWindowFromTrayAsync(reason).catch((e) => {
    log("warn", `tray restore failed (${reason}):`, e);
  });
}

function restoreExistingCodexWindow(reason: string): void {
  try {
    const win = getPreferredRestorableCodexWindow();
    if (!win || win.isDestroyed() || isCompactFloatingWindow(win)) return;
    if (safeWindowIsVisible(win) && !safeWindowIsMinimized(win)) return;

    bringCodexWindowToFront(win);
    log("info", `restored existing Codex window (${reason})`, {
      id: win.id,
      bounds: safeWindowBounds(win),
    });
  } catch (e) {
    log("warn", `existing window restore failed (${reason}):`, e);
  }
}

async function restoreCodexWindowFromTrayAsync(reason: string): Promise<void> {
  let win = getPreferredRestorableCodexWindow();
  if (!win || win.isDestroyed() || isCompactFloatingWindow(win)) {
    win = await createOrEnsureLocalCodexWindow(reason);
  }
  if (!win || win.isDestroyed()) {
    log("warn", `tray restore skipped (${reason}); no restorable window`);
    return;
  }
  if (safeWindowIsVisible(win) && !safeWindowIsMinimized(win)) return;

  bringCodexWindowToFront(win);
  log("info", `tray restored Codex window (${reason})`, {
    id: win.id,
    bounds: safeWindowBounds(win),
  });
}

function getPreferredRestorableCodexWindow(): BrowserWindow | null {
  const candidates = BrowserWindow.getAllWindows()
    .filter((win) => !win.isDestroyed())
    .map((win) => ({ win, bounds: safeWindowBounds(win) }))
    .filter((item) => item.bounds.width > 0 && item.bounds.height > 0);

  const mainSized = candidates
    .filter((item) => !isCompactBounds(item.bounds))
    .sort((a, b) => areaOfBounds(b.bounds) - areaOfBounds(a.bounds));
  if (mainSized[0]) return mainSized[0].win;

  const serviceWindow = getPrimaryCodexWindow();
  if (serviceWindow && !serviceWindow.isDestroyed() && !isCompactFloatingWindow(serviceWindow)) {
    return serviceWindow;
  }
  return null;
}

async function createOrEnsureLocalCodexWindow(reason: string): Promise<BrowserWindow | null> {
  const services = getCodexWindowServices();
  try {
    if (typeof services?.ensureHostWindow === "function") {
      const win = await services.ensureHostWindow("local");
      if (win && !win.isDestroyed() && !isCompactFloatingWindow(win)) return win;
    }
    if (typeof services?.createFreshLocalWindow === "function") {
      const win = await services.createFreshLocalWindow("/");
      if (win && !win.isDestroyed()) return win;
    }
    if (typeof services?.createFreshWindow === "function") {
      const win = await services.createFreshWindow("/");
      if (win && !win.isDestroyed()) return win;
    }
    const created = await createCodexWindow({ route: "/", hostId: "local", show: true, appearance: "secondary" });
    return BrowserWindow.fromId(created.windowId);
  } catch (e) {
    log("warn", `failed to create local Codex window from tray (${reason}):`, e);
    return getPrimaryCodexWindow();
  }
}

function bringCodexWindowToFront(win: BrowserWindow): void {
  try {
    if (win.isMinimized()) win.restore();
  } catch {}
  try {
    win.show();
  } catch {}
  try {
    win.setSkipTaskbar(false);
  } catch {}
  try {
    if (process.platform === "win32") {
      win.setAlwaysOnTop(true, "screen-saver");
      win.setAlwaysOnTop(false);
    }
  } catch {}
  try {
    win.focus();
  } catch {}
}

function isCompactFloatingWindow(win: BrowserWindow): boolean {
  return isCompactBounds(safeWindowBounds(win));
}

function isCompactBounds(bounds: Electron.Rectangle): boolean {
  return bounds.width < 700 || bounds.height < 420 || areaOfBounds(bounds) < 300_000;
}

function areaOfBounds(bounds: Electron.Rectangle): number {
  return Math.max(0, bounds.width) * Math.max(0, bounds.height);
}

function safeWindowBounds(win: BrowserWindow): Electron.Rectangle {
  try {
    return win.getBounds();
  } catch {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
}

function safeWindowIsVisible(win: BrowserWindow): boolean {
  try {
    return win.isVisible();
  } catch {
    return false;
  }
}

function safeWindowIsMinimized(win: BrowserWindow): boolean {
  try {
    return win.isMinimized();
  } catch {
    return false;
  }
}

function attachTrayRestoreWindowListeners(win: BrowserWindow): void {
  if (process.platform !== "win32") return;

  const markedWindow = win as BrowserWindow & { __codexppTrayRestoreListenersAttached?: boolean };
  if (markedWindow.__codexppTrayRestoreListenersAttached) return;
  markedWindow.__codexppTrayRestoreListenersAttached = true;

  const onWindowSignal = (eventName: string): void => {
    const bounds = safeWindowBounds(win);
    const visible = safeWindowIsVisible(win);
    const minimized = safeWindowIsMinimized(win);
    log("info", `tray restore window signal (${eventName})`, {
      id: win.id,
      visible,
      minimized,
      bounds,
    });

    if (isCompactBounds(bounds)) {
      scheduleTrayRestoreBursts(`compact-window-${eventName}`);
    }
  };

  win.on("show", () => onWindowSignal("show"));
  win.on("focus", () => onWindowSignal("focus"));
  win.on("restore", () => onWindowSignal("restore"));
  win.once("ready-to-show", () => onWindowSignal("ready-to-show"));
}

function getXiaobaiToolboxConfig(): Required<XiaobaiToolboxConfig> {
  return normalizeXiaobaiToolboxConfig(readState().codexPlusPlus?.xiaobaiToolbox, true);
}

function setXiaobaiToolboxConfig(config: Partial<XiaobaiToolboxConfig>): Required<XiaobaiToolboxConfig> {
  const state = readState();
  state.codexPlusPlus ??= {};
  const current = state.codexPlusPlus.xiaobaiToolbox ?? {};
  const next = normalizeXiaobaiToolboxConfig({ ...current, ...config }, false);
  state.codexPlusPlus.xiaobaiToolbox = next;
  writeState(state);
  return next;
}

function normalizeXiaobaiToolboxConfig(
  input: Partial<XiaobaiToolboxConfig> | undefined,
  allowEnvOverride: boolean,
): Required<XiaobaiToolboxConfig> {
  return {
    path: (
      allowEnvOverride ? cleanOptionalString(process.env.CODEXPP_XIAOBAI_TOOLBOX_PATH) : undefined
    ) ?? cleanOptionalString(input?.path) ?? DEFAULT_XIAOBAI_TOOLBOX_PATH,
    executable: (
      allowEnvOverride ? cleanOptionalString(process.env.CODEXPP_XIAOBAI_TOOLBOX_EXE) : undefined
    ) ?? cleanOptionalString(input?.executable) ?? "",
    args: Array.isArray(input?.args) ? input.args.filter((arg): arg is string => typeof arg === "string") : [],
  };
}

async function openXiaobaiAiToolbox(): Promise<XiaobaiToolboxLaunchResult> {
  const config = getXiaobaiToolboxConfig();
  const target = resolveXiaobaiToolboxTarget(config);
  if (target.executable) {
    const child = spawn(target.executable, config.args, {
      cwd: target.cwd,
      detached: true,
      stdio: "ignore",
      windowsHide: false,
    });
    child.unref();
  } else {
    const error = await shell.openPath(target.cwd);
    if (error) throw new Error(error);
  }
  return {
    path: target.cwd,
    executable: target.executable,
    args: config.args,
    openedAt: new Date().toISOString(),
  };
}

function resolveXiaobaiToolboxTarget(config: Required<XiaobaiToolboxConfig>): {
  cwd: string;
  executable: string | null;
} {
  const configuredPath = resolve(config.path);
  const configuredStats = safeStat(configuredPath);
  if (configuredStats?.isFile()) {
    return { cwd: dirname(configuredPath), executable: configuredPath };
  }

  if (configuredStats?.isDirectory()) {
    const executable = findXiaobaiToolboxExecutable(configuredPath, config.executable);
    return { cwd: configuredPath, executable };
  }

  if (config.executable) {
    const executable = isAbsolute(config.executable)
      ? config.executable
      : resolve(configuredPath, config.executable);
    if (safeStat(executable)?.isFile()) {
      return { cwd: dirname(executable), executable };
    }
  }

  throw new Error(`\u627e\u4e0d\u5230\u5c0f\u767d AI\u5de5\u5177\u7bb1\u8def\u5f84\uff1a${configuredPath}`);
}

function findXiaobaiToolboxExecutable(dir: string, configuredExecutable: string): string | null {
  const candidates = configuredExecutable
    ? [configuredExecutable, ...XIAOBAI_TOOLBOX_EXECUTABLE_CANDIDATES]
    : XIAOBAI_TOOLBOX_EXECUTABLE_CANDIDATES;
  for (const candidate of candidates) {
    const executable = isAbsolute(candidate) ? candidate : join(dir, candidate);
    if (safeStat(executable)?.isFile()) return executable;
  }
  return null;
}

function safeStat(path: string): ReturnType<typeof statSync> | null {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

function installLocalizedApplicationMenu(): void {
  try {
    const template: MenuItemConstructorOptions[] = [
      {
        label: "文件",
        submenu: [
          menuShortcut("新对话", "CommandOrControl+N", "N", ["control"]),
          menuShortcut("打开设置", "CommandOrControl+,", ",", ["control"]),
          { type: "separator" },
          { label: "关闭窗口", role: "close" },
          { label: "退出", role: "quit" },
        ],
      },
      {
        label: "编辑",
        submenu: [
          { label: "撤销", role: "undo" },
          { label: "重做", role: "redo" },
          { type: "separator" },
          { label: "剪切", role: "cut" },
          { label: "复制", role: "copy" },
          { label: "粘贴", role: "paste" },
          { label: "全选", role: "selectAll" },
        ],
      },
      {
        label: "查看",
        submenu: [
          menuShortcut("切换侧边栏", "CommandOrControl+B", "B", ["control"]),
          menuShortcut("切换底部面板", "CommandOrControl+J", "J", ["control"]),
          menuShortcut("打开终端", "CommandOrControl+`", "`", ["control"]),
          menuShortcut("切换文件树", "CommandOrControl+Shift+E", "E", ["control", "shift"]),
          menuShortcut("打开浏览器标签页", "CommandOrControl+T", "T", ["control"]),
          menuShortcut("重新加载浏览器页面", "CommandOrControl+R", "R", ["control"]),
          menuShortcut("切换侧边面板", "Alt+CommandOrControl+B", "B", ["alt", "control"]),
          menuShortcut("查找", "CommandOrControl+F", "F", ["control"]),
          { type: "separator" },
          menuShortcut("上一个对话", "CommandOrControl+Shift+[", "[", ["control", "shift"]),
          menuShortcut("下一个对话", "CommandOrControl+Shift+]", "]", ["control", "shift"]),
          menuShortcut("后退", "CommandOrControl+[", "[", ["control"]),
          menuShortcut("前进", "CommandOrControl+]", "]", ["control"]),
          { type: "separator" },
          { label: "放大", role: "zoomIn" },
          { label: "缩小", role: "zoomOut" },
          { label: "实际大小", role: "resetZoom" },
          { type: "separator" },
          { label: "切换全屏", role: "togglefullscreen" },
        ],
      },
      {
        label: "窗口",
        submenu: [
          { label: "最小化", role: "minimize" },
          { label: "关闭窗口", role: "close" },
        ],
      },
      {
        label: "帮助",
        submenu: [
          {
            label: "打开 Codex 文档",
            click: () => {
              shell.openExternal("https://developers.openai.com/codex").catch(() => {});
            },
          },
        ],
      },
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    log("info", "localized application menu installed");
  } catch (e) {
    log("warn", "failed to install localized application menu:", e);
  }
}

function menuShortcut(
  label: string,
  accelerator: string,
  keyCode: string,
  modifiers: Electron.KeyboardInputEvent["modifiers"] = [],
): MenuItemConstructorOptions {
  return {
    label,
    accelerator,
    click: () => dispatchMenuShortcut(keyCode, modifiers),
  };
}

function dispatchMenuShortcut(
  keyCode: string,
  modifiers: Electron.KeyboardInputEvent["modifiers"],
): void {
  const target = BrowserWindow.getFocusedWindow()?.webContents ?? webContents.getFocusedWebContents();
  if (!target) return;
  target.sendInputEvent({ type: "keyDown", keyCode, modifiers });
  target.sendInputEvent({ type: "keyUp", keyCode, modifiers });
}

app.whenReady().then(() => {
  log("info", "app ready fired");
  if (isCodexPlusPlusSafeModeEnabled()) {
    log("warn", "safe mode is enabled; preload will not be registered");
    return;
  }
  installLocalizedApplicationMenu();
  installCodexPlusPlusTrayRestoreEntry();
  registerPreload(session.defaultSession, "defaultSession");
  if (isCodexPlusPlusEnabled()) {
    maybeStartBrowserUiServer({
      getWindowServices: getCodexWindowServices,
      log,
    });
  } else {
    log("info", "plugin switch is off; browser UI server is disabled");
  }
  scheduleExistingWindowRestoreBursts("app-ready");
});

app.on("session-created", (s) => {
  if (isCodexPlusPlusSafeModeEnabled()) return;
  registerPreload(s, "session-created");
});

app.on("browser-window-created", (_e, win) => {
  try {
    const bounds = safeWindowBounds(win);
    log("info", "browser-window-created", { id: win.id, bounds });
    attachTrayRestoreWindowListeners(win);
    if (process.platform === "win32" && isCompactBounds(bounds)) {
      scheduleTrayRestoreBursts("compact-window-created");
    }
  } catch (e) {
    log("warn", "browser-window-created handler failed:", e);
  }
});

// DIAGNOSTIC: log every webContents creation. Useful for verifying our
// preload reaches every renderer Codex spawns.
app.on("web-contents-created", (_e, wc) => {
  try {
    const wp = (wc as unknown as { getLastWebPreferences?: () => Record<string, unknown> })
      .getLastWebPreferences?.();
    log("info", "web-contents-created", {
      id: wc.id,
      type: wc.getType(),
      sessionIsDefault: wc.session === session.defaultSession,
      sandbox: wp?.sandbox,
      contextIsolation: wp?.contextIsolation,
    });
    wc.on("preload-error", (_ev, p, err) => {
      log("error", `wc ${wc.id} preload-error path=${p}`, String(err?.stack ?? err));
    });
  } catch (e) {
    log("error", "web-contents-created handler failed:", String((e as Error)?.stack ?? e));
  }
});

log("info", "main.ts evaluated; app.isReady=" + app.isReady());
if (isCodexPlusPlusSafeModeEnabled()) {
  log("warn", "safe mode is enabled; tweaks will not be loaded");
}
if (isCodexPlusPlusEnabled()) {
  ensureCodexModelBridgeFromState();
} else {
  log("info", "plugin switch is off; model bridge will not be started");
}
scheduleDesktopCodexConfigSanitization("startup");

// 2. Initial tweak discovery + main-scope load.
loadAllMainTweaks();

app.on("will-quit", () => {
  stopAllMainTweaks();
  modelBridgeServer?.close();
  nativeBridge.disposeAll();
  disposeAllOwlViews();
  // Best-effort flush of any pending storage writes.
  for (const t of tweakState.loadedMain.values()) {
    try {
      t.storage.flush();
    } catch {}
  }
});

// 3. IPC: expose tweak metadata + reveal-in-finder.
ipcMain.handle("codexpp:list-tweaks", async () => {
  await Promise.all(tweakState.discovered.map((t) => ensureTweakUpdateCheck(t)));
  const updateChecks = readState().tweakUpdateChecks ?? {};
  return tweakState.discovered.map((t) => ({
    manifest: t.manifest,
    entry: t.entry,
    dir: t.dir,
    entryExists: existsSync(t.entry),
    enabled: isTweakEnabled(t.manifest.id),
    update: updateChecks[t.manifest.id] ?? null,
  }));
});

ipcMain.handle("codexpp:get-tweak-enabled", (_e, id: string) => isTweakEnabled(id));
ipcMain.handle("codexpp:set-tweak-enabled", (_e, id: string, enabled: boolean) => {
  return setTweakEnabledAndReload(id, enabled, tweakLifecycleDeps);
});

ipcMain.handle("codexpp:get-config", () => {
  const s = readState();
  const installerState = readInstallerState();
  const sourceRoot = installerState?.sourceRoot ?? fallbackSourceRoot();
  return {
    version: CODEX_PLUSPLUS_VERSION,
    enabled: s.codexPlusPlus?.enabled !== false,
    autoUpdate: s.codexPlusPlus?.autoUpdate !== false,
    safeMode: s.codexPlusPlus?.safeMode === true,
    updateChannel: s.codexPlusPlus?.updateChannel ?? "stable",
    updateRepo: s.codexPlusPlus?.updateRepo ?? CODEX_PLUSPLUS_REPO,
    updateRef: s.codexPlusPlus?.updateRef ?? "",
    updateCheck: s.codexPlusPlus?.updateCheck ?? null,
    selfUpdate: readSelfUpdateState(),
    installationSource: describeInstallationSource(sourceRoot),
    xiaobaiToolbox: getXiaobaiToolboxConfig(),
  };
});

ipcMain.handle("codexpp:set-plugin-enabled", (_e, enabled: boolean) => {
  const next = !!enabled;
  setCodexPlusPlusEnabled(next);
  applyCodexPlusPlusEnabledState(next);
  return { enabled: isCodexPlusPlusEnabled() };
});

ipcMain.handle("codexpp:set-auto-update", (_e, enabled: boolean) => {
  setCodexPlusPlusAutoUpdate(!!enabled);
  return { autoUpdate: isCodexPlusPlusAutoUpdateEnabled() };
});

ipcMain.handle("codexpp:set-update-config", (_e, config: {
  updateChannel?: SelfUpdateChannel;
  updateRepo?: string;
  updateRef?: string;
}) => {
  setCodexPlusPlusUpdateConfig(config);
  const s = readState();
  return {
    updateChannel: s.codexPlusPlus?.updateChannel ?? "stable",
    updateRepo: s.codexPlusPlus?.updateRepo ?? CODEX_PLUSPLUS_REPO,
    updateRef: s.codexPlusPlus?.updateRef ?? "",
  };
});

ipcMain.handle("codexpp:get-xiaobai-toolbox-config", () => getXiaobaiToolboxConfig());

ipcMain.handle("codexpp:set-xiaobai-toolbox-config", (_e, config: Partial<XiaobaiToolboxConfig>) => {
  return setXiaobaiToolboxConfig(config);
});

ipcMain.handle("codexpp:open-xiaobai-toolbox", () => openXiaobaiAiToolbox());

ipcMain.handle("codexpp:get-agent-provider-config", (_e, providerInput: unknown) => {
  const provider = assertAgentProviderId(providerInput);
  return getAgentProviderConfig(provider);
});

ipcMain.handle(
  "codexpp:set-agent-provider-config",
  (_e, providerInput: unknown, config: Partial<AgentProviderConfig>) => {
    const provider = assertAgentProviderId(providerInput);
    return setAgentProviderConfig(provider, config);
  },
);

ipcMain.handle("codexpp:set-active-agent-provider", (_e, selection: unknown) => {
  if (selection === "codex-native") return setActiveAgentProvider("codex-native");
  return setActiveAgentProvider(assertAgentProviderId(selection));
});

ipcMain.handle("codexpp:get-active-agent-provider", () => getActiveAgentProvider());

ipcMain.handle(
  "codexpp:activate-agent-provider",
  (_e, providerInput: unknown, configPatch: Partial<AgentProviderConfig> = {}) => {
    const provider = assertAgentProviderId(providerInput);
    const saved = getAgentProviderConfig(provider);
    const config = normalizeAgentProviderConfig(provider, { ...saved, ...configPatch });
    return activateCodexModelBridge(provider, config);
  },
);

ipcMain.handle(
  "codexpp:list-agent-provider-models",
  async (_e, providerInput: unknown, configPatch: Partial<AgentProviderConfig> = {}) => {
    const provider = assertAgentProviderId(providerInput);
    const saved = getAgentProviderConfig(provider);
    const config = normalizeAgentProviderConfig(provider, { ...saved, ...configPatch });
    return listAgentProviderModels(provider, config);
  },
);

ipcMain.handle(
  "codexpp:test-agent-provider",
  async (_e, providerInput: unknown, request: AgentProviderTestRequest = {}) => {
    const provider = assertAgentProviderId(providerInput);
    const saved = getAgentProviderConfig(provider);
    const config = normalizeAgentProviderConfig(provider, { ...saved, ...(request.config ?? {}) });
    return callAgentProvider(provider, config, request.prompt ?? "");
  },
);

ipcMain.handle("codexpp:check-codexpp-update", async (_e, force?: boolean) => {
  return ensureCodexPlusPlusUpdateCheck(force === true);
});

ipcMain.handle("codexpp:run-codexpp-update", async () => {
  const sourceRoot = readInstallerState()?.sourceRoot ?? fallbackSourceRoot();
  if (!sourceRoot) {
    throw new Error("codex汉化增强plus版 source CLI was not found. Run the installer once, then try again.");
  }
  const cli = join(sourceRoot, "packages", "installer", "dist", "cli.js");
  if (!existsSync(cli)) {
    throw new Error("codex汉化增强plus版 source CLI was not found. Run the installer once, then try again.");
  }
  const pending = markSelfUpdateStarted(sourceRoot);
  startInstalledCli(cli, ["update", "--watcher"]);
  return pending;
});

ipcMain.handle("codexpp:get-watcher-health", () => getWatcherHealth(userRoot!));

ipcMain.handle("codexpp:get-tweak-store", async () => {
  const store = await fetchTweakStoreRegistry();
  const registry = store.registry;
  const installed = new Map(tweakState.discovered.map((t) => [t.manifest.id, t]));
  const entries = shuffleStoreEntries(registry.entries, randomInt);
  return {
    ...registry,
    sourceUrl: TWEAK_STORE_INDEX_URL,
    fetchedAt: store.fetchedAt,
    entries: entries.map((entry) => {
      const local = installed.get(entry.id);
      const platform = storeEntryPlatformCompatibility(entry);
      const runtime = storeEntryRuntimeCompatibility(entry);
      return {
        ...entry,
        platform,
        runtime,
        installed: local
          ? {
              version: local.manifest.version,
              enabled: isTweakEnabled(local.manifest.id),
            }
          : null,
      };
    }),
  };
});

ipcMain.handle("codexpp:install-store-tweak", async (_e, id: string) => {
  const { registry } = await fetchTweakStoreRegistry();
  const entry = registry.entries.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Tweak store entry not found: ${id}`);
  assertStoreEntryPlatformCompatible(entry);
  assertStoreEntryRuntimeCompatible(entry);
  await installStoreTweak(entry);
  reloadTweaks("store-install", tweakLifecycleDeps);
  return { installed: entry.id };
});

ipcMain.handle("codexpp:prepare-tweak-store-submission", async (_e, repoInput: string) => {
  return prepareTweakStoreSubmission(repoInput);
});

// Sandboxed renderer preload can't use Node fs to read tweak source. Main
// reads it on the renderer's behalf. Path must live under tweaksDir for
// security — we refuse anything else.
ipcMain.handle("codexpp:read-tweak-source", (_e, entryPath: string) => {
  const resolved = resolve(entryPath);
  if (!isPathInside(TWEAKS_DIR, resolved)) {
    throw new Error("path outside tweaks dir");
  }
  return require("node:fs").readFileSync(resolved, "utf8");
});

/**
 * Read an arbitrary asset file from inside a tweak's directory and return it
 * as a `data:` URL. Used by the settings injector to render manifest icons
 * (the renderer is sandboxed; `file://` won't load).
 *
 * Security: caller passes `tweakDir` and `relPath`; we (1) require tweakDir
 * to live under TWEAKS_DIR, (2) resolve relPath against it and re-check the
 * result still lives under TWEAKS_DIR, (3) cap output size at 1 MiB.
 */
const ASSET_MAX_BYTES = 1024 * 1024;
const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};
ipcMain.handle(
  "codexpp:read-tweak-asset",
  (_e, tweakDir: string, relPath: string) => {
    const fs = require("node:fs") as typeof import("node:fs");
    const dir = resolve(tweakDir);
    if (!isPathInside(TWEAKS_DIR, dir)) {
      throw new Error("tweakDir outside tweaks dir");
    }
    const full = resolve(dir, relPath);
    if (!isPathInside(dir, full) || full === dir) {
      throw new Error("path traversal");
    }
    const stat = fs.statSync(full);
    if (stat.size > ASSET_MAX_BYTES) {
      throw new Error(`asset too large (${stat.size} > ${ASSET_MAX_BYTES})`);
    }
    const ext = full.slice(full.lastIndexOf(".")).toLowerCase();
    const mime = MIME_BY_EXT[ext] ?? "application/octet-stream";
    const buf = fs.readFileSync(full);
    return `data:${mime};base64,${buf.toString("base64")}`;
  },
);

// Sandboxed preload can't write logs to disk; forward to us via IPC.
ipcMain.on("codexpp:preload-log", (_e, level: "info" | "warn" | "error", msg: string) => {
  const lvl = level === "error" || level === "warn" ? level : "info";
  try {
    appendCappedLog(join(LOG_DIR, "preload.log"), `[${new Date().toISOString()}] [${lvl}] ${msg}\n`);
  } catch {}
});

// Sandbox-safe filesystem ops for renderer-scope tweaks. Each tweak gets
// a sandboxed dir under userRoot/tweak-data/<id>. Renderer side calls these
// over IPC instead of using Node fs directly.
ipcMain.handle("codexpp:tweak-fs", (_e, op: string, id: string, p: string, c?: string) => {
  if (!/^[a-zA-Z0-9._-]+$/.test(id)) throw new Error("bad tweak id");
  const dir = join(userRoot!, "tweak-data", id);
  mkdirSync(dir, { recursive: true });
  const full = resolve(dir, p);
  if (!isPathInside(dir, full) || full === dir) throw new Error("path traversal");
  const fs = require("node:fs") as typeof import("node:fs");
  switch (op) {
    case "read": return fs.readFileSync(full, "utf8");
    case "write": return fs.writeFileSync(full, c ?? "", "utf8");
    case "exists": return fs.existsSync(full);
    case "dataDir": return dir;
    default: throw new Error(`unknown op: ${op}`);
  }
});

ipcMain.handle("codexpp:user-paths", () => ({
  userRoot,
  runtimeDir,
  tweaksDir: TWEAKS_DIR,
  logDir: LOG_DIR,
}));

ipcMain.handle("codexpp:codex-runtime-info", () => currentRuntimeInfo());
ipcMain.handle("codexpp:codex-runtime-capabilities", () => currentRuntimeCapabilities());
ipcMain.handle("codexpp:codex-cdp-status", () => getCdpStatus());
ipcMain.handle("codexpp:codex-cdp-targets", () => listCdpTargets());
ipcMain.handle("codexpp:codex-window-create", (_e, opts: CodexCreateWindowOptions) => {
  return createCodexWindow(opts);
});
ipcMain.handle("codexpp:codex-window-primary", () => getPrimaryCodexWindowRef());
ipcMain.handle("codexpp:codex-window-focus", (_e, windowId: number) => focusCodexWindow(windowId));
ipcMain.handle("codexpp:codex-window-show", (_e, windowId: number) => showCodexWindow(windowId));
ipcMain.handle(
  "codexpp:codex-view-create",
  async (_e, tweakId: string, options: CodexViewCreateOptions) => {
    const tweak = assertTweakViewPermissionForId(tweakId);
    const ref = await createOwlView({ id: tweak.manifest.id, dir: tweak.dir }, options);
    return {
      id: ref.id,
      webContentsId: ref.webContentsId,
      parentWindowId: ref.parentWindowId,
    };
  },
);
ipcMain.handle(
  "codexpp:codex-view-call",
  (_e, tweakId: string, viewId: string, method: string, arg?: unknown, arg2?: unknown) => {
    assertTweakViewPermissionForId(tweakId);
    return callOwlView(tweakId, viewId, method, arg, arg2);
  },
);
ipcMain.handle("codexpp:codex-view-dispose-tweak", (_e, tweakId: string) => {
  assertTweakId(tweakId);
  disposeOwlViewsForTweak(tweakId);
});
ipcMain.handle(
  "codexpp:native-load-module",
  (_e, tweakId: string, options: NativeModuleLoadOptions) => {
    const ref = nativeBridge.loadModule(tweakContext(tweakId, "native-module"), options);
    return { id: ref.id, kind: ref.kind };
  },
);
ipcMain.handle(
  "codexpp:native-module-request",
  (_e, tweakId: string, moduleId: string, method: string, payload?: unknown, timeoutMs?: number) => {
    assertTweakPermissionForId(tweakId, "native-module");
    return nativeBridge.requestModule(tweakId, moduleId, method, payload, timeoutMs);
  },
);
ipcMain.handle("codexpp:native-module-dispose", (_e, tweakId: string, moduleId: string) => {
  assertTweakPermissionForId(tweakId, "native-module");
  return nativeBridge.disposeModule(tweakId, moduleId);
});
ipcMain.handle("codexpp:native-dispose-tweak", (_e, tweakId: string) => {
  assertTweakId(tweakId);
  nativeBridge.disposeTweak(tweakId);
});
ipcMain.handle(
  "codexpp:native-create-panel",
  async (_e, tweakId: string, options: NativePanelCreateOptions) => {
    const ref = await nativeBridge.createPanel(tweakContext(tweakId, "native-view"), options);
    return { id: ref.id, windowId: ref.windowId };
  },
);
ipcMain.handle(
  "codexpp:native-attach-view",
  async (_e, tweakId: string, options: NativeViewAttachOptions) => {
    const ref = await nativeBridge.attachView(tweakContext(tweakId, "native-view"), options);
    return { id: ref.id };
  },
);
ipcMain.handle(
  "codexpp:native-instance-call",
  async (_e, tweakId: string, kind: "panel" | "view", instanceId: string, method: string, arg?: unknown) => {
    assertTweakPermissionForId(tweakId, "native-view");
    return nativeBridge.callInstance(tweakId, kind, instanceId, method, arg);
  },
);
ipcMain.handle(
  "codexpp:native-launch-helper",
  (_e, tweakId: string, options: NativeHelperLaunchOptions) => {
    const ref = nativeBridge.launchHelper(tweakContext(tweakId, "native-helper"), options);
    return { id: ref.id, pid: ref.pid };
  },
);
ipcMain.handle(
  "codexpp:native-helper-call",
  (_e, tweakId: string, helperId: string, method: string, payload?: unknown, timeoutMs?: number) => {
    assertTweakPermissionForId(tweakId, "native-helper");
    return nativeBridge.callHelper(tweakId, helperId, method, payload, timeoutMs);
  },
);

ipcMain.handle("codexpp:reveal", (_e, p: string) => {
  shell.openPath(p).catch(() => {});
});

ipcMain.handle("codexpp:open-external", (_e, url: string) => {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== "github.com") {
    throw new Error("only github.com links can be opened from tweak metadata");
  }
  shell.openExternal(parsed.toString()).catch(() => {});
});

ipcMain.handle("codexpp:copy-text", (_e, text: string) => {
  clipboard.writeText(String(text));
  return true;
});

// Manual force-reload trigger from the renderer (e.g. the "Force Reload"
// button on our injected Tweaks page). Bypasses the watcher debounce.
ipcMain.handle("codexpp:reload-tweaks", () => {
  reloadTweaks("manual", tweakLifecycleDeps);
  return { at: Date.now(), count: tweakState.discovered.length };
});

// 4. Filesystem watcher → debounced reload + broadcast.
//    We watch the tweaks dir for any change. On the first tick of inactivity
//    we stop main-side tweaks, clear their cached modules, re-discover, then
//    restart and broadcast `codexpp:tweaks-changed` to every renderer so it
//    can re-init its host.
const RELOAD_DEBOUNCE_MS = 250;
let reloadTimer: NodeJS.Timeout | null = null;
function scheduleReload(reason: string): void {
  if (!isCodexPlusPlusEnabled()) return;
  if (reloadTimer) clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    reloadTimer = null;
    reloadTweaks(reason, tweakLifecycleDeps);
  }, RELOAD_DEBOUNCE_MS);
}

try {
  const watcher = chokidar.watch(TWEAKS_DIR, {
    ignoreInitial: true,
    // Wait for files to settle before triggering — guards against partially
    // written tweak files during editor saves / git checkouts.
    awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
    // Avoid eating CPU on huge node_modules trees inside tweak folders.
    ignored: (p) => p.includes(`${TWEAKS_DIR}/`) && /\/node_modules\//.test(p),
  });
  watcher.on("all", (event, path) => scheduleReload(`${event} ${path}`));
  watcher.on("error", (e) => log("warn", "watcher error:", e));
  log("info", "watching", TWEAKS_DIR);
  app.on("will-quit", () => watcher.close().catch(() => {}));
} catch (e) {
  log("error", "failed to start watcher:", e);
}

// --- helpers ---

function loadAllMainTweaks(): void {
  try {
    tweakState.discovered = discoverTweaks(TWEAKS_DIR);
    log(
      "info",
      `discovered ${tweakState.discovered.length} tweak(s):`,
      tweakState.discovered.map((t) => t.manifest.id).join(", "),
    );
  } catch (e) {
    log("error", "tweak discovery failed:", e);
    tweakState.discovered = [];
  }

  syncMcpServersFromEnabledTweaks();

  for (const t of tweakState.discovered) {
    if (!isMainProcessTweakScope(t.manifest.scope)) continue;
    if (!isTweakEnabled(t.manifest.id)) {
      log("info", `skipping disabled main tweak: ${t.manifest.id}`);
      continue;
    }
    try {
      const mod = require(t.entry);
      const tweak = mod.default ?? mod;
      if (typeof tweak?.start === "function") {
        const storage = createDiskStorage(userRoot!, t.manifest.id);
        tweak.start({
          manifest: t.manifest,
          process: "main",
          log: makeLogger(t.manifest.id),
          storage,
          ipc: makeMainIpc(t.manifest.id),
          fs: makeMainFs(t.manifest.id),
          codex: makeCodexApi(t),
        });
        tweakState.loadedMain.set(t.manifest.id, {
          stop: tweak.stop,
          storage,
        });
        log("info", `started main tweak: ${t.manifest.id}`);
      }
    } catch (e) {
      log("error", `tweak ${t.manifest.id} failed to start:`, e);
    }
  }
}

function syncMcpServersFromEnabledTweaks(): void {
  try {
    const result = syncManagedMcpServers({
      configPath: CODEX_CONFIG_FILE,
      tweaks: tweakState.discovered.filter((t) => isTweakEnabled(t.manifest.id)),
    });
    if (result.changed) {
      log("info", `synced Codex MCP config: ${result.serverNames.join(", ") || "none"}`);
    }
    if (result.skippedServerNames.length > 0) {
      log(
        "info",
        `skipped codex汉化增强plus版 managed MCP server(s) already configured by user: ${result.skippedServerNames.join(", ")}`,
      );
    }
  } catch (e) {
    log("warn", "failed to sync Codex MCP config:", e);
  }
}

function stopAllMainTweaks(): void {
  for (const [id, t] of tweakState.loadedMain) {
    try {
      t.stop?.();
      t.storage.flush();
      log("info", `stopped main tweak: ${id}`);
    } catch (e) {
      log("warn", `stop failed for ${id}:`, e);
    } finally {
      nativeBridge.disposeTweak(id);
      disposeOwlViewsForTweak(id);
    }
  }
  tweakState.loadedMain.clear();
}

function clearTweakModuleCache(): void {
  const rootSet = new Set<string>([TWEAKS_DIR, safeRealpath(TWEAKS_DIR)]);
  const entrySet = new Set<string>();
  for (const tweak of tweakState.discovered) {
    rootSet.add(tweak.dir);
    rootSet.add(safeRealpath(tweak.dir));
    entrySet.add(tweak.entry);
    entrySet.add(safeRealpath(tweak.entry));
  }

  const roots = [...rootSet];
  for (const key of Object.keys(require.cache)) {
    const realKey = safeRealpath(key);
    const isTweakModule =
      entrySet.has(key) ||
      entrySet.has(realKey) ||
      roots.some((root) => isPathInside(root, key) || isPathInside(root, realKey));
    if (isTweakModule) delete require.cache[key];
  }
}

function safeRealpath(filePath: string): string {
  try {
    return realpathSync(filePath);
  } catch {
    return filePath;
  }
}

const UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const VERSION_RE = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;

async function ensureCodexPlusPlusUpdateCheck(force = false): Promise<CodexPlusPlusUpdateCheck> {
  const state = readState();
  const cached = state.codexPlusPlus?.updateCheck;
  const channel = state.codexPlusPlus?.updateChannel ?? "stable";
  const repo = state.codexPlusPlus?.updateRepo ?? CODEX_PLUSPLUS_REPO;
  if (
    !force &&
    cached &&
    cached.currentVersion === CODEX_PLUSPLUS_VERSION &&
    Date.now() - Date.parse(cached.checkedAt) < UPDATE_CHECK_INTERVAL_MS
  ) {
    return cached;
  }

  const release = await fetchLatestRelease(repo, CODEX_PLUSPLUS_VERSION, channel === "prerelease");
  const latestVersion = release.latestTag ? normalizeVersion(release.latestTag) : null;
  const check: CodexPlusPlusUpdateCheck = {
    checkedAt: new Date().toISOString(),
    currentVersion: CODEX_PLUSPLUS_VERSION,
    latestVersion,
    releaseUrl: release.releaseUrl,
    releaseNotes: release.releaseNotes,
    updateAvailable: latestVersion
      ? compareVersions(normalizeVersion(latestVersion), CODEX_PLUSPLUS_VERSION) > 0
      : false,
    ...(release.error ? { error: release.error } : {}),
  };
  state.codexPlusPlus ??= {};
  state.codexPlusPlus.updateCheck = check;
  writeState(state);
  return check;
}

async function ensureTweakUpdateCheck(t: DiscoveredTweak): Promise<void> {
  const id = t.manifest.id;
  const repo = t.manifest.githubRepo;
  const state = readState();
  const cached = state.tweakUpdateChecks?.[id];
  if (
    cached &&
    cached.repo === repo &&
    cached.currentVersion === t.manifest.version &&
    Date.now() - Date.parse(cached.checkedAt) < UPDATE_CHECK_INTERVAL_MS
  ) {
    return;
  }

  const next = await fetchLatestRelease(repo, t.manifest.version);
  const latestVersion = next.latestTag ? normalizeVersion(next.latestTag) : null;
  const check: TweakUpdateCheck = {
    checkedAt: new Date().toISOString(),
    repo,
    currentVersion: t.manifest.version,
    latestVersion,
    latestTag: next.latestTag,
    releaseUrl: next.releaseUrl,
    updateAvailable: latestVersion
      ? compareVersions(latestVersion, normalizeVersion(t.manifest.version)) > 0
      : false,
    ...(next.error ? { error: next.error } : {}),
  };
  state.tweakUpdateChecks ??= {};
  state.tweakUpdateChecks[id] = check;
  writeState(state);
}

async function fetchLatestRelease(
  repo: string,
  currentVersion: string,
  includePrerelease = false,
): Promise<{ latestTag: string | null; releaseUrl: string | null; releaseNotes: string | null; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const endpoint = includePrerelease ? "releases?per_page=20" : "releases/latest";
      const res = await fetch(`https://api.github.com/repos/${repo}/${endpoint}`, {
        headers: {
          "Accept": "application/vnd.github+json",
          "User-Agent": `codex-plusplus/${currentVersion}`,
        },
        signal: controller.signal,
      });
      if (res.status === 404) {
        return { latestTag: null, releaseUrl: null, releaseNotes: null, error: "no GitHub release found" };
      }
      if (!res.ok) {
        return { latestTag: null, releaseUrl: null, releaseNotes: null, error: `GitHub returned ${res.status}` };
      }
      const json = await res.json() as { tag_name?: string; html_url?: string; body?: string; draft?: boolean } | Array<{ tag_name?: string; html_url?: string; body?: string; draft?: boolean }>;
      const body = Array.isArray(json) ? json.find((release) => !release.draft) : json;
      if (!body) {
        return { latestTag: null, releaseUrl: null, releaseNotes: null, error: "no GitHub release found" };
      }
      return {
        latestTag: body.tag_name ?? null,
        releaseUrl: body.html_url ?? null,
        releaseNotes: body.body ?? null,
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch (e) {
    return {
      latestTag: null,
      releaseUrl: null,
      releaseNotes: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

interface TweakStoreFetchResult {
  registry: TweakStoreRegistry;
  fetchedAt: string;
}

interface StoreInstallMetadata {
  repo: string;
  approvedCommitSha: string;
  installedAt: string;
  storeIndexUrl: string;
  files?: Record<string, string>;
}

interface StoreEntryPlatformCompatibility {
  current: NodeJS.Platform;
  supported: TweakStorePlatform[] | null;
  compatible: boolean;
  reason: string | null;
}

interface StoreEntryRuntimeCompatibility {
  current: string;
  required: string | null;
  compatible: boolean;
  reason: string | null;
}

class StoreTweakModifiedError extends Error {
  constructor(tweakName: string) {
    super(
      `${tweakName} has local source changes, so codex汉化增强plus版 can't auto-update it. Revert your local changes or reinstall the tweak manually.`,
    );
    this.name = "StoreTweakModifiedError";
  }
}

function storeEntryPlatformCompatibility(entry: TweakStoreEntry): StoreEntryPlatformCompatibility {
  const supported = entry.platforms ?? null;
  const compatible = !supported || supported.includes(process.platform as TweakStorePlatform);
  return {
    current: process.platform,
    supported,
    compatible,
    reason: compatible ? null : `${entry.manifest.name} is only available on ${formatStorePlatforms(supported)}.`,
  };
}

function assertStoreEntryPlatformCompatible(entry: TweakStoreEntry): void {
  const platform = storeEntryPlatformCompatibility(entry);
  if (!platform.compatible) {
    throw new Error(platform.reason ?? `${entry.manifest.name} is not available on this platform.`);
  }
}

function storeEntryRuntimeCompatibility(entry: TweakStoreEntry): StoreEntryRuntimeCompatibility {
  const required = cleanMinRuntime(entry.manifest.minRuntime);
  const compatible = !required || compareVersions(CODEX_PLUSPLUS_VERSION, required) >= 0;
  return {
    current: CODEX_PLUSPLUS_VERSION,
    required,
    compatible,
    reason: compatible || !required
      ? null
      : `${entry.manifest.name} requires codex汉化增强plus版 ${required} or newer.`,
  };
}

function assertStoreEntryRuntimeCompatible(entry: TweakStoreEntry): void {
  const runtime = storeEntryRuntimeCompatibility(entry);
  if (!runtime.compatible) {
    throw new Error(runtime.reason ?? `${entry.manifest.name} requires a newer codex汉化增强plus版 runtime.`);
  }
}

function cleanMinRuntime(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const version = normalizeVersion(value.replace(/^>=?\s*/, ""));
  return VERSION_RE.test(version) ? version : null;
}

function formatStorePlatforms(platforms: TweakStorePlatform[] | null): string {
  if (!platforms || platforms.length === 0) return "supported platforms";
  return platforms.map((platform) => {
    if (platform === "darwin") return "macOS";
    if (platform === "win32") return "Windows";
    return "Linux";
  }).join(", ");
}

async function fetchTweakStoreRegistry(): Promise<TweakStoreFetchResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(TWEAK_STORE_INDEX_URL, {
        headers: {
          "Accept": "application/json",
          "User-Agent": `codex-plusplus/${CODEX_PLUSPLUS_VERSION}`,
        },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`store returned ${res.status}`);
      return {
        registry: normalizeStoreRegistry(await res.json()),
        fetchedAt,
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    log("warn", "failed to fetch tweak store registry:", error.message);
    throw error;
  }
}

async function installStoreTweak(entry: TweakStoreEntry): Promise<void> {
  const url = storeArchiveUrl(entry);
  const work = mkdtempSync(join(tmpdir(), "codexpp-store-tweak-"));
  const archive = join(work, "source.tar.gz");
  const extractDir = join(work, "extract");
  const target = join(TWEAKS_DIR, entry.id);
  const stagedTarget = join(work, "staged", entry.id);

  try {
    log("info", `installing store tweak ${entry.id} from ${entry.repo}@${entry.approvedCommitSha}`);
    const res = await fetch(url, {
      headers: { "User-Agent": `codex-plusplus/${CODEX_PLUSPLUS_VERSION}` },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`download failed: ${res.status}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    writeFileSync(archive, bytes);
    mkdirSync(extractDir, { recursive: true });
    extractTarArchive(archive, extractDir);
    const source = findTweakRoot(extractDir);
    if (!source) throw new Error("downloaded archive did not contain manifest.json");
    validateStoreTweakSource(entry, source);
    rmSync(stagedTarget, { recursive: true, force: true });
    copyTweakSource(source, stagedTarget);
    const stagedFiles = hashTweakSource(stagedTarget);
    writeFileSync(
      join(stagedTarget, ".codexpp-store.json"),
      JSON.stringify(
        {
          repo: entry.repo,
          approvedCommitSha: entry.approvedCommitSha,
          installedAt: new Date().toISOString(),
          storeIndexUrl: TWEAK_STORE_INDEX_URL,
          files: stagedFiles,
        },
        null,
        2,
      ),
    );
    await assertStoreTweakCleanForAutoUpdate(entry, target, work);
    rmSync(target, { recursive: true, force: true });
    cpSync(stagedTarget, target, { recursive: true });
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

async function prepareTweakStoreSubmission(repoInput: string): Promise<TweakStorePublishSubmission> {
  const repo = normalizeGitHubRepo(repoInput);
  const repoInfo = await fetchGithubJson<{ default_branch?: string }>(`https://api.github.com/repos/${repo}`);
  const defaultBranch = repoInfo.default_branch;
  if (!defaultBranch) throw new Error(`Could not resolve default branch for ${repo}`);

  const commit = await fetchGithubJson<{
    sha?: string;
    html_url?: string;
  }>(`https://api.github.com/repos/${repo}/commits/${encodeURIComponent(defaultBranch)}`);
  if (!commit.sha) throw new Error(`Could not resolve current commit for ${repo}`);

  const manifest = await fetchManifestAtCommit(repo, commit.sha).catch((e) => {
    log("warn", `could not read manifest for store submission ${repo}@${commit.sha}:`, e);
    return undefined;
  });

  return {
    repo,
    defaultBranch,
    commitSha: commit.sha,
    commitUrl: commit.html_url ?? `https://github.com/${repo}/commit/${commit.sha}`,
    manifest: manifest
      ? {
          id: typeof manifest.id === "string" ? manifest.id : undefined,
          name: typeof manifest.name === "string" ? manifest.name : undefined,
          version: typeof manifest.version === "string" ? manifest.version : undefined,
          description: typeof manifest.description === "string" ? manifest.description : undefined,
          iconUrl: typeof manifest.iconUrl === "string" ? manifest.iconUrl : undefined,
        }
      : undefined,
  };
}

async function fetchGithubJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: {
        "Accept": "application/vnd.github+json",
        "User-Agent": `codex-plusplus/${CODEX_PLUSPLUS_VERSION}`,
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`GitHub returned ${res.status}`);
    return await res.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchManifestAtCommit(repo: string, commitSha: string): Promise<Partial<TweakManifest>> {
  const res = await fetch(`https://raw.githubusercontent.com/${repo}/${commitSha}/manifest.json`, {
    headers: {
      "Accept": "application/json",
      "User-Agent": `codex-plusplus/${CODEX_PLUSPLUS_VERSION}`,
    },
  });
  if (!res.ok) throw new Error(`manifest fetch returned ${res.status}`);
  return await res.json() as Partial<TweakManifest>;
}

function extractTarArchive(archive: string, targetDir: string): void {
  const result = spawnSync("tar", ["-xzf", archive, "-C", targetDir], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`tar extraction failed: ${result.stderr || result.stdout || result.status}`);
  }
}

function validateStoreTweakSource(entry: TweakStoreEntry, source: string): void {
  const manifestPath = join(source, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as TweakManifest;
  if (manifest.id !== entry.manifest.id) {
    throw new Error(`downloaded tweak id ${manifest.id} does not match approved id ${entry.manifest.id}`);
  }
  if (manifest.githubRepo !== entry.repo) {
    throw new Error(`downloaded tweak repo ${manifest.githubRepo} does not match approved repo ${entry.repo}`);
  }
  if (manifest.version !== entry.manifest.version) {
    throw new Error(`downloaded tweak version ${manifest.version} does not match approved version ${entry.manifest.version}`);
  }
}

function findTweakRoot(dir: string): string | null {
  if (!existsSync(dir)) return null;
  if (existsSync(join(dir, "manifest.json"))) return dir;
  for (const name of readdirSync(dir)) {
    const child = join(dir, name);
    try {
      if (!statSync(child).isDirectory()) continue;
    } catch {
      continue;
    }
    const found = findTweakRoot(child);
    if (found) return found;
  }
  return null;
}

function copyTweakSource(source: string, target: string): void {
  cpSync(source, target, {
    recursive: true,
    filter: (src) => !/(^|[/\\])(?:\.git|node_modules)(?:[/\\]|$)/.test(src),
  });
}

async function assertStoreTweakCleanForAutoUpdate(
  entry: TweakStoreEntry,
  target: string,
  work: string,
): Promise<void> {
  if (!existsSync(target)) return;
  const metadata = readStoreInstallMetadata(target);
  if (!metadata) return;
  if (metadata.repo !== entry.repo) {
    throw new StoreTweakModifiedError(entry.manifest.name);
  }
  const currentFiles = hashTweakSource(target);
  const baselineFiles = metadata.files ?? await fetchBaselineStoreTweakHashes(metadata, work);
  if (!sameFileHashes(currentFiles, baselineFiles)) {
    throw new StoreTweakModifiedError(entry.manifest.name);
  }
}

function readStoreInstallMetadata(target: string): StoreInstallMetadata | null {
  const metadataPath = join(target, ".codexpp-store.json");
  if (!existsSync(metadataPath)) return null;
  try {
    const parsed = JSON.parse(readFileSync(metadataPath, "utf8")) as Partial<StoreInstallMetadata>;
    if (typeof parsed.repo !== "string" || typeof parsed.approvedCommitSha !== "string") return null;
    return {
      repo: parsed.repo,
      approvedCommitSha: parsed.approvedCommitSha,
      installedAt: typeof parsed.installedAt === "string" ? parsed.installedAt : "",
      storeIndexUrl: typeof parsed.storeIndexUrl === "string" ? parsed.storeIndexUrl : "",
      files: isHashRecord(parsed.files) ? parsed.files : undefined,
    };
  } catch {
    return null;
  }
}

async function fetchBaselineStoreTweakHashes(
  metadata: StoreInstallMetadata,
  work: string,
): Promise<Record<string, string>> {
  const baselineDir = join(work, "baseline");
  const archive = join(work, "baseline.tar.gz");
  const res = await fetch(`https://codeload.github.com/${metadata.repo}/tar.gz/${metadata.approvedCommitSha}`, {
    headers: { "User-Agent": `codex-plusplus/${CODEX_PLUSPLUS_VERSION}` },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Could not verify local tweak changes before update: ${res.status}`);
  writeFileSync(archive, Buffer.from(await res.arrayBuffer()));
  mkdirSync(baselineDir, { recursive: true });
  extractTarArchive(archive, baselineDir);
  const source = findTweakRoot(baselineDir);
  if (!source) throw new Error("Could not verify local tweak changes before update: baseline manifest missing");
  return hashTweakSource(source);
}

function hashTweakSource(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  collectTweakFileHashes(root, root, out);
  return out;
}

function collectTweakFileHashes(root: string, dir: string, out: Record<string, string>): void {
  for (const name of readdirSync(dir).sort()) {
    if (name === ".git" || name === "node_modules" || name === ".codexpp-store.json") continue;
    const full = join(dir, name);
    const rel = relative(root, full).split("\\").join("/");
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectTweakFileHashes(root, full, out);
      continue;
    }
    if (!stat.isFile()) continue;
    out[rel] = createHash("sha256").update(readFileSync(full)).digest("hex");
  }
}

function sameFileHashes(a: Record<string, string>, b: Record<string, string>): boolean {
  const ak = Object.keys(a).sort();
  const bk = Object.keys(b).sort();
  if (ak.length !== bk.length) return false;
  for (let i = 0; i < ak.length; i++) {
    const key = ak[i];
    if (key !== bk[i] || a[key] !== b[key]) return false;
  }
  return true;
}

function isHashRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every((v) => typeof v === "string");
}

function normalizeVersion(v: string): string {
  return v.trim().replace(/^v/i, "");
}

function compareVersions(a: string, b: string): number {
  const av = VERSION_RE.exec(a);
  const bv = VERSION_RE.exec(b);
  if (!av || !bv) return 0;
  for (let i = 1; i <= 3; i++) {
    const diff = Number(av[i]) - Number(bv[i]);
    if (diff !== 0) return diff;
  }
  return 0;
}

function fallbackSourceRoot(): string | null {
  const candidates = [
    join(homedir(), ".codex-plusplus", "source"),
    join(userRoot!, "source"),
  ];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, "packages", "installer", "dist", "cli.js"))) return candidate;
  }
  return null;
}

function describeInstallationSource(sourceRoot: string | null): InstallationSource {
  if (!sourceRoot) {
    return {
      kind: "unknown",
      label: "Unknown",
      detail: "codex汉化增强plus版 source location is not recorded yet.",
    };
  }
  const normalized = sourceRoot.replace(/\\/g, "/");
  if (/\/(?:Homebrew|homebrew)\/Cellar\/codexplusplus\//.test(normalized)) {
    return { kind: "homebrew", label: "Homebrew", detail: sourceRoot };
  }
  if (existsSync(join(sourceRoot, ".git"))) {
    return { kind: "local-dev", label: "Local development checkout", detail: sourceRoot };
  }
  if (normalized.endsWith("/.codex-plusplus/source") || normalized.includes("/.codex-plusplus/source/")) {
    return { kind: "github-source", label: "GitHub source installer", detail: sourceRoot };
  }
  if (existsSync(join(sourceRoot, "package.json"))) {
    return { kind: "source-archive", label: "Source archive", detail: sourceRoot };
  }
  return { kind: "unknown", label: "Unknown", detail: sourceRoot };
}

function startInstalledCli(cli: string, args: string[]): void {
  if (process.platform === "darwin" && startInstalledCliWithLaunchd(cli, args)) {
    return;
  }
  const child = spawn(nodeExecutableForInstalledCli(), [cli, ...args], {
    cwd: dirname(sourceRootFromInstalledCli(cli)),
    env: { ...process.env, CODEX_PLUSPLUS_MANUAL_UPDATE: "1" },
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
}

function sourceRootFromInstalledCli(cli: string): string {
  return resolve(dirname(cli), "..", "..", "..");
}

function nodeExecutableForInstalledCli(): string {
  if (process.platform !== "win32") return process.execPath;
  const candidates = [
    cleanOptionalString(process.env.CODEXPP_NODE_PATH),
    cleanOptionalString(process.env.NODE),
    "C:\\Program Files\\nodejs\\node.exe",
    "C:\\Program Files (x86)\\nodejs\\node.exe",
    "node.exe",
  ].filter((candidate): candidate is string => Boolean(candidate));
  for (const candidate of candidates) {
    if (candidate === "node.exe" || existsSync(candidate)) return candidate;
  }
  return process.execPath;
}

function startInstalledCliWithLaunchd(cli: string, args: string[]): boolean {
  const label = `com.codexplusplus.patch-helper.${process.pid}.${Date.now()}`;
  const cleanup = `launchctl remove ${label} >/dev/null 2>&1 || launchctl bootout gui/$(id -u)/${label} >/dev/null 2>&1 || true`;
  const command = [
    `trap ${shellQuote(cleanup)} EXIT`,
    `cd ${shellQuote(resolve(dirname(cli), "..", "..", ".."))}`,
    `CODEX_PLUSPLUS_MANUAL_UPDATE=1 ${[process.execPath, cli, ...args].map(shellQuote).join(" ")}`,
  ].join(" && ");
  const result = spawnSync(
    "launchctl",
    [
      "submit",
      "-l",
      label,
      "--",
      "/bin/sh",
      "-c",
      `${command} || true`,
    ],
    {
      encoding: "utf8",
      stdio: "ignore",
    },
  );
  if (result.status === 0) return true;
  log("warn", `launchctl submit failed for codex汉化增强plus版 patch helper: ${result.error?.message ?? result.status}`);
  return false;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function markSelfUpdateStarted(sourceRoot: string): SelfUpdateState {
  const config = readState().codexPlusPlus;
  const channel = config?.updateChannel ?? "stable";
  const state: SelfUpdateState = {
    checkedAt: new Date().toISOString(),
    status: "checking",
    currentVersion: CODEX_PLUSPLUS_VERSION,
    latestVersion: null,
    targetRef: config?.updateChannel === "custom" ? config.updateRef ?? null : null,
    releaseUrl: null,
    repo: config?.updateRepo ?? CODEX_PLUSPLUS_REPO,
    channel,
    sourceRoot,
    installationSource: describeInstallationSource(sourceRoot),
  };
  writeSelfUpdateState(state);
  return state;
}

function broadcastReload(): void {
  const payload = {
    at: Date.now(),
    tweaks: tweakState.discovered.map((t) => t.manifest.id),
  };
  for (const wc of webContents.getAllWebContents()) {
    try {
      wc.send("codexpp:tweaks-changed", payload);
    } catch (e) {
      log("warn", "broadcast send failed:", e);
    }
  }
}

function broadcastPluginEnabledChanged(enabled: boolean): void {
  const payload = { enabled, at: Date.now() };
  for (const wc of webContents.getAllWebContents()) {
    try {
      wc.send("codexpp:plugin-enabled-changed", payload);
    } catch (e) {
      log("warn", "plugin-enabled broadcast failed:", e);
    }
  }
}

function makeLogger(scope: string) {
  return {
    debug: (...a: unknown[]) => log("info", `[${scope}]`, ...a),
    info: (...a: unknown[]) => log("info", `[${scope}]`, ...a),
    warn: (...a: unknown[]) => log("warn", `[${scope}]`, ...a),
    error: (...a: unknown[]) => log("error", `[${scope}]`, ...a),
  };
}

function makeMainIpc(id: string) {
  const ch = (c: string) => `codexpp:${id}:${c}`;
  return {
    on: (c: string, h: (...args: unknown[]) => void) => {
      const wrapped = (_e: unknown, ...args: unknown[]) => h(...args);
      ipcMain.on(ch(c), wrapped);
      return () => ipcMain.removeListener(ch(c), wrapped as never);
    },
    send: (_c: string) => {
      throw new Error("ipc.send is renderer→main; main side uses handle/on");
    },
    invoke: (_c: string) => {
      throw new Error("ipc.invoke is renderer→main; main side uses handle");
    },
    handle: (c: string, handler: (...args: unknown[]) => unknown) => {
      ipcMain.handle(ch(c), (_e: unknown, ...args: unknown[]) => handler(...args));
    },
  };
}

function makeMainFs(id: string) {
  const dir = join(userRoot!, "tweak-data", id);
  mkdirSync(dir, { recursive: true });
  const fs = require("node:fs/promises") as typeof import("node:fs/promises");
  return {
    dataDir: dir,
    read: (p: string) => fs.readFile(join(dir, p), "utf8"),
    write: (p: string, c: string) => fs.writeFile(join(dir, p), c, "utf8"),
    exists: async (p: string) => {
      try {
        await fs.access(join(dir, p));
        return true;
      } catch {
        return false;
      }
    },
  };
}

function currentRuntimeInfo(): CodexRuntimeInfo {
  const installerState = readInstallerState();
  return getRuntimeInfo({
    userRoot: userRoot!,
    runtimeDir: runtimeDir!,
    codexVersion: installerState?.codexVersion ?? null,
    channel: null,
    getWindowServices: getCodexWindowServices,
  });
}

function currentRuntimeCapabilities(): CodexRuntimeCapabilities {
  const installerState = readInstallerState();
  return getRuntimeCapabilities({
    userRoot: userRoot!,
    runtimeDir: runtimeDir!,
    codexVersion: installerState?.codexVersion ?? null,
    channel: null,
    getWindowServices: getCodexWindowServices,
    getNativeCapabilities: () => nativeBridge.getCapabilities(),
    getViewCapabilities: () => getOwlViewCapabilities(),
  });
}

function tweakContext(tweakId: string, permission?: TweakPermission): NativeTweakContext {
  const tweak = permission
    ? assertTweakPermissionForId(tweakId, permission)
    : tweakById(tweakId);
  return { id: tweak.manifest.id, dir: tweak.dir };
}

function tweakById(tweakId: string): DiscoveredTweak {
  assertTweakId(tweakId);
  const tweak = tweakState.discovered.find((item) => item.manifest.id === tweakId);
  if (!tweak) throw new Error(`unknown tweak: ${tweakId}`);
  if (!isTweakEnabled(tweakId)) throw new Error(`tweak is disabled: ${tweakId}`);
  return tweak;
}

function assertTweakPermissionForId(tweakId: string, permission: TweakPermission): DiscoveredTweak {
  const tweak = tweakById(tweakId);
  assertTweakPermission(tweak, permission);
  return tweak;
}

function assertTweakViewPermissionForId(tweakId: string): DiscoveredTweak {
  const tweak = tweakById(tweakId);
  assertTweakViewPermission(tweak);
  return tweak;
}

function assertTweakPermission(tweak: DiscoveredTweak, permission: TweakPermission): void {
  if (tweak.manifest.permissions?.includes(permission)) return;
  throw new Error(`tweak ${tweak.manifest.id} must declare ${permission} permission`);
}

function assertTweakViewPermission(tweak: DiscoveredTweak): void {
  if (
    tweak.manifest.permissions?.includes("codex-views") ||
    tweak.manifest.permissions?.includes("codex.views")
  ) {
    return;
  }
  throw new Error(`tweak ${tweak.manifest.id} must declare codex-views permission`);
}

function assertTweakId(tweakId: string): void {
  if (!/^[a-zA-Z0-9._-]+$/.test(tweakId)) throw new Error("bad tweak id");
}

function getPrimaryCodexWindow(): Electron.BrowserWindow | null {
  const services = getCodexWindowServices();
  const fromServices = typeof services?.getPrimaryWindow === "function"
    ? services.getPrimaryWindow("local")
    : null;
  if (fromServices && !fromServices.isDestroyed()) return fromServices;
  const fromManager = typeof services?.windowManager?.getPrimaryWindow === "function"
    ? services.windowManager.getPrimaryWindow.call(services.windowManager)
    : null;
  if (fromManager && !fromManager.isDestroyed()) return fromManager;
  const focused = BrowserWindow.getFocusedWindow();
  if (focused && !focused.isDestroyed()) return focused;
  return BrowserWindow.getAllWindows().find((win) => !win.isDestroyed()) ?? null;
}

function getPrimaryCodexWindowRef(): CodexWindowRef | null {
  const win = getPrimaryCodexWindow();
  if (!win || win.isDestroyed()) return null;
  return { windowId: win.id, webContentsId: win.webContents.id };
}

function focusCodexWindow(windowId: number): boolean {
  const win = BrowserWindow.fromId(windowId);
  if (!win || win.isDestroyed()) return false;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  return true;
}

function showCodexWindow(windowId: number): boolean {
  const win = BrowserWindow.fromId(windowId);
  if (!win || win.isDestroyed()) return false;
  win.show();
  return true;
}

function getOwlViewCapabilities(): CodexRuntimeCapabilities["views"] {
  const parent = getPrimaryCodexWindow() ?? BrowserWindow.getFocusedWindow();
  const contentView = asRecord(parent)?.contentView;
  let sampleView: Electron.BrowserView | null = null;
  try {
    sampleView = new BrowserView({ webPreferences: { sandbox: true } });
  } catch {}
  const webContentsView = asRecord(sampleView)?.webContentsView;
  const privateViewTree = typeof asRecord(contentView)?.addChildView === "function" &&
    typeof asRecord(contentView)?.removeChildView === "function";
  const webContentsViewAvailable = Boolean(webContentsView) &&
    typeof asRecord(webContentsView)?.setBounds === "function";
  const privateAttach = privateViewTree && webContentsViewAvailable;
  const browserViewFallback = typeof asRecord(parent)?.addBrowserView === "function";
  try {
    if (sampleView && !sampleView.webContents.isDestroyed()) {
      sampleView.webContents.close({ waitForBeforeUnload: false });
    }
  } catch {}
  return {
    create: privateAttach || browserViewFallback,
    privateViewTree: privateAttach,
    webContentsView: webContentsViewAvailable,
    browserViewFallback,
  };
}

async function createOwlView(
  ctx: NativeTweakContext,
  opts: CodexViewCreateOptions,
): Promise<CodexViewRef> {
  const id = assertBridgeId(opts.id ?? randomUUID(), "Codex view id");
  const key = owlViewKey(ctx.id, id);
  if (owlViews.has(key)) throw new Error(`Codex view already exists: ${ctx.id}:${id}`);

  const parent = typeof opts.parentWindowId === "number"
    ? BrowserWindow.fromId(opts.parentWindowId)
    : getPrimaryCodexWindow();
  if (!parent || isWindowDestroyed(parent)) {
    throw new Error("Codex view needs an active parent window");
  }

  const services = getCodexWindowServices();
  const windowManager = services?.windowManager;
  const route = opts.route === undefined ? null : normalizeCodexRoute(opts.route);
  const hostId = opts.hostId || "local";
  const view = new BrowserView({
    webPreferences: {
      preload: opts.registerWithCodex === false ? undefined : windowManager?.options?.preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      devTools: windowManager?.options?.allowDevtools,
    },
  });

  if (opts.backgroundColor) {
    callObjectMethod(view, "setBackgroundColor", [opts.backgroundColor]);
    callObjectMethod(asRecord(view)?.webContentsView, "setBackgroundColor", [opts.backgroundColor]);
  }

  const managed: ManagedOwlView = {
    key,
    tweakId: ctx.id,
    id,
    view,
    parentWindowId: windowIdFor(parent),
    attachMode: null,
    disposeBindings: [],
    disposed: false,
  };
  owlViews.set(key, managed);

  try {
    if (route !== null && opts.registerWithCodex !== false && windowManager?.registerWindow) {
      const appearance = opts.appearance || "secondary";
      const windowLike = makeWindowLikeForView(view);
      windowManager.registerWindow(windowLike, hostId, false, appearance);
      services?.getContext?.(hostId)?.registerWindow?.(windowLike);
    }

    attachOwlView(managed, parent);
    if (opts.bounds) setOwlViewBounds(managed, opts.bounds);
    if (opts.visible === false) setOwlViewVisible(managed, false);

    if (route !== null) {
      await view.webContents.loadURL(codexAppUrl(route, hostId));
    } else if (opts.url) {
      await view.webContents.loadURL(normalizeOwlViewUrl(opts.url));
    } else {
      await view.webContents.loadURL("about:blank");
    }
  } catch (e) {
    disposeOwlView(managed);
    throw e;
  }

  log("info", `created Owl view ${ctx.id}:${id}`, {
    parentWindowId: managed.parentWindowId,
    webContentsId: view.webContents.id,
    attachMode: managed.attachMode,
  });
  return owlViewRef(managed);
}

async function callOwlView(
  tweakId: string,
  id: string,
  method: string,
  arg?: unknown,
  arg2?: unknown,
): Promise<unknown> {
  const view = owlViewFor(tweakId, id);
  if (method === "setBounds") return setOwlViewBounds(view, arg as Electron.Rectangle);
  if (method === "setVisible") return setOwlViewVisible(view, Boolean(arg));
  if (method === "bringToFront") return bringOwlViewToFront(view);
  if (method === "loadRoute") {
    const route = normalizeCodexRoute(String(arg));
    const hostId = typeof arg2 === "string" && arg2 ? arg2 : "local";
    return view.view.webContents.loadURL(codexAppUrl(route, hostId));
  }
  if (method === "loadUrl") return view.view.webContents.loadURL(normalizeOwlViewUrl(String(arg)));
  if (method === "dispose") return disposeOwlViewById(tweakId, id);
  throw new Error(`unknown Codex view method: ${method}`);
}

function owlViewRef(view: ManagedOwlView): CodexViewRef {
  return {
    id: view.id,
    webContentsId: view.view.webContents.id,
    parentWindowId: view.parentWindowId,
    setBounds: (bounds) => Promise.resolve(setOwlViewBounds(view, bounds)),
    setVisible: (visible) => Promise.resolve(setOwlViewVisible(view, visible)),
    bringToFront: () => Promise.resolve(bringOwlViewToFront(view)),
    loadRoute: (route, hostId) => view.view.webContents.loadURL(codexAppUrl(normalizeCodexRoute(route), hostId || "local")).then(() => {}),
    loadUrl: (url) => view.view.webContents.loadURL(normalizeOwlViewUrl(url)).then(() => {}),
    dispose: () => Promise.resolve(disposeOwlViewById(view.tweakId, view.id)),
  };
}

function attachOwlView(view: ManagedOwlView, parent: Electron.BrowserWindow): void {
  const contentView = asRecord(parent)?.contentView;
  const webContentsView = asRecord(view.view)?.webContentsView;
  if (typeof asRecord(parent)?.addBrowserView === "function") {
    callObjectMethod(parent, "addBrowserView", [view.view]);
    view.attachMode = "browserView";
  } else if (
    typeof asRecord(contentView)?.addChildView === "function" &&
    webContentsView
  ) {
    try {
      addOwlChildView(parent, view.view);
      view.attachMode = "contentView";
    } catch (e) {
      log("warn", "Owl contentView attachment failed; falling back to BrowserView", {
        tweakId: view.tweakId,
        viewId: view.id,
        error: String(e),
      });
    }
  }
  if (!view.attachMode) {
    throw new Error("Owl view attachment is not available on this Codex window");
  }

  const dispose = () => disposeOwlViewById(view.tweakId, view.id);
  bindWindowEvent(parent, view, "closed", dispose);
  bindWindowEvent(parent, view, "close", dispose);
}

function bringOwlViewToFront(view: ManagedOwlView): void {
  if (view.disposed) return;
  const parent = view.parentWindowId === null ? null : BrowserWindow.fromId(view.parentWindowId);
  if (!parent || isWindowDestroyed(parent)) return;
  const contentView = asRecord(parent)?.contentView;
  const webContentsView = asRecord(view.view)?.webContentsView;
  if (view.attachMode === "contentView" && webContentsView) {
    try {
      if (typeof asRecord(parent)?.setTopBrowserView === "function") {
        callObjectMethod(parent, "setTopBrowserView", [view.view]);
      } else {
        callObjectMethod(contentView, "addChildView", [webContentsView]);
      }
      return;
    } catch (e) {
      log("warn", "Owl contentView bring-to-front failed", {
        tweakId: view.tweakId,
        viewId: view.id,
        error: String(e),
      });
    }
  }
  if (typeof asRecord(parent)?.setTopBrowserView === "function") {
    callObjectMethod(parent, "setTopBrowserView", [view.view]);
  }
}

function setOwlViewBounds(view: ManagedOwlView, bounds: Electron.Rectangle): void {
  assertBounds(bounds);
  callObjectMethod(view.view, "setBounds", [bounds]);
  callObjectMethod(asRecord(view.view)?.webContentsView, "setBounds", [bounds]);
}

function setOwlViewVisible(view: ManagedOwlView, visible: boolean): void {
  callObjectMethod(asRecord(view.view)?.webContentsView, "setVisible", [visible]);
}

function disposeOwlViewById(tweakId: string, id: string): void {
  const view = owlViews.get(owlViewKey(tweakId, id));
  if (!view) return;
  disposeOwlView(view);
}

function disposeOwlViewsForTweak(tweakId: string): void {
  for (const view of [...owlViews.values()]) {
    if (view.tweakId === tweakId) disposeOwlView(view);
  }
}

function disposeAllOwlViews(): void {
  for (const view of [...owlViews.values()]) disposeOwlView(view);
}

function disposeOwlView(view: ManagedOwlView): void {
  if (view.disposed) return;
  view.disposed = true;
  owlViews.delete(view.key);
  for (const dispose of view.disposeBindings.splice(0)) {
    try {
      dispose();
    } catch {}
  }
  const parent = view.parentWindowId === null ? null : BrowserWindow.fromId(view.parentWindowId);
  if (parent && !isWindowDestroyed(parent)) {
    try {
      if (view.attachMode === "contentView") {
        removeOwlChildView(parent, view.view);
      } else if (view.attachMode === "browserView") {
        callObjectMethod(parent, "removeBrowserView", [view.view]);
      }
    } catch (e) {
      log("warn", "Owl view detach failed during dispose", {
        tweakId: view.tweakId,
        viewId: view.id,
        error: String(e),
      });
    }
  }
  try {
    if (!view.view.webContents.isDestroyed()) {
      view.view.webContents.close({ waitForBeforeUnload: false });
    }
  } catch {}
}

function owlViewFor(tweakId: string, id: string): ManagedOwlView {
  const view = owlViews.get(owlViewKey(tweakId, id));
  if (!view || view.disposed) throw new Error(`Codex view is not loaded: ${tweakId}:${id}`);
  return view;
}

function owlViewKey(tweakId: string, viewId: string): string {
  return `${tweakId}:${viewId}`;
}

function addOwlChildView(parent: Electron.BrowserWindow, child: Electron.BrowserView): void {
  const ownerWindow = asRecord(child)?.ownerWindow;
  if (ownerWindow && ownerWindow !== parent) {
    callObjectMethod(ownerWindow, "removeBrowserView", [child]);
  }

  callObjectMethod(asRecord(parent)?.contentView, "addChildView", [asRecord(child)?.webContentsView]);
  try {
    (child as unknown as { ownerWindow: Electron.BrowserWindow | null }).ownerWindow = parent;
  } catch {}
  callObjectMethod(asRecord(child.webContents), "_setOwnerWindow", [parent]);

  const browserViews = asRecord(parent)?._browserViews;
  if (Array.isArray(browserViews) && !browserViews.includes(child)) {
    browserViews.push(child);
  }
}

function removeOwlChildView(parent: Electron.BrowserWindow, child: Electron.BrowserView): void {
  callObjectMethod(asRecord(parent)?.contentView, "removeChildView", [asRecord(child)?.webContentsView]);
  try {
    (child as unknown as { ownerWindow: Electron.BrowserWindow | null }).ownerWindow = null;
  } catch {}

  const browserViews = asRecord(parent)?._browserViews;
  if (Array.isArray(browserViews)) {
    const index = browserViews.indexOf(child);
    if (index >= 0) browserViews.splice(index, 1);
  }
}

async function createCodexBrowserView(opts: CodexCreateViewOptions): Promise<unknown> {
  const services = getCodexWindowServices();
  const windowManager = services?.windowManager;
  if (!services || !windowManager?.registerWindow) {
    throw new Error(
      "Codex embedded view services are not available. Reinstall codex汉化增强plus版 1.0.0 or later.",
    );
  }

  const route = normalizeCodexRoute(opts.route);
  const hostId = opts.hostId || "local";
  const appearance = opts.appearance || "secondary";
  const view = new BrowserView({
    webPreferences: {
      preload: windowManager.options?.preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      devTools: windowManager.options?.allowDevtools,
    },
  });
  const windowLike = makeWindowLikeForView(view);
  windowManager.registerWindow(windowLike, hostId, false, appearance);
  services.getContext?.(hostId)?.registerWindow?.(windowLike);
  await view.webContents.loadURL(codexAppUrl(route, hostId));
  return view;
}

async function createCodexWindow(opts: CodexCreateWindowOptions): Promise<CodexWindowRef> {
  const services = getCodexWindowServices();
  if (!services) {
    throw new Error(
      "Codex window services are not available. Reinstall codex汉化增强plus版 1.0.0 or later.",
    );
  }

  const route = normalizeCodexRoute(opts.route);
  const hostId = opts.hostId || "local";
  const parent = typeof opts.parentWindowId === "number"
    ? BrowserWindow.fromId(opts.parentWindowId)
    : BrowserWindow.getFocusedWindow();
  const createWindow = services.windowManager?.createWindow;

  let win: Electron.BrowserWindow | null | undefined;
  if (typeof createWindow === "function") {
    win = await createWindow.call(services.windowManager, {
      initialRoute: route,
      hostId,
      show: opts.show !== false,
      appearance: opts.appearance || "secondary",
      parent,
    });
  } else if (hostId === "local" && typeof services.createFreshWindow === "function") {
    win = await services.createFreshWindow(route);
  } else if (hostId === "local" && typeof services.createFreshLocalWindow === "function") {
    win = await services.createFreshLocalWindow(route);
  } else if (typeof services.ensureHostWindow === "function") {
    win = await services.ensureHostWindow(hostId);
  }

  if (!win || win.isDestroyed()) {
    throw new Error("Codex did not return a window for the requested route");
  }

  if (opts.bounds) {
    win.setBounds(opts.bounds);
  }
  if (parent && !parent.isDestroyed()) {
    try {
      win.setParentWindow(parent);
    } catch {}
  }
  if (opts.show !== false) {
    win.show();
  }

  return {
    windowId: win.id,
    webContentsId: win.webContents.id,
  };
}

function makeCodexApi(tweak: DiscoveredTweak) {
  const ctx = (): NativeTweakContext => ({ id: tweak.manifest.id, dir: tweak.dir });
  return {
    runtime: {
      getInfo: async () => currentRuntimeInfo(),
      getCapabilities: async () => currentRuntimeCapabilities(),
    },
    windows: {
      create: createCodexWindow,
      getPrimary: async () => getPrimaryCodexWindowRef(),
      focus: async (windowId: number) => focusCodexWindow(windowId),
      show: async (windowId: number) => showCodexWindow(windowId),
    },
    views: {
      create: async (options: CodexViewCreateOptions) => {
        assertTweakViewPermission(tweak);
        return createOwlView(ctx(), options);
      },
    },
    cdp: {
      getStatus: async () => getCdpStatus(),
      listTargets: async () => listCdpTargets(),
    },
    native: {
      loadModule: async (options: NativeModuleLoadOptions) => {
        assertTweakPermission(tweak, "native-module");
        return nativeBridge.loadModule(ctx(), options);
      },
      createPanel: async (options: NativePanelCreateOptions) => {
        assertTweakPermission(tweak, "native-view");
        return nativeBridge.createPanel(ctx(), options);
      },
      attachView: async (options: NativeViewAttachOptions) => {
        assertTweakPermission(tweak, "native-view");
        return nativeBridge.attachView(ctx(), options);
      },
      launchHelper: async (options: NativeHelperLaunchOptions) => {
        assertTweakPermission(tweak, "native-helper");
        return nativeBridge.launchHelper(ctx(), options);
      },
    },
    createBrowserView: createCodexBrowserView,
    createWindow: createCodexWindow,
  };
}

function makeWindowLikeForView(view: Electron.BrowserView): CodexWindowLike {
  const viewBounds = () => view.getBounds();
  return {
    id: view.webContents.id,
    webContents: view.webContents,
    on: (event: "closed", listener: () => void) => {
      if (event === "closed") {
        view.webContents.once("destroyed", listener);
      } else {
        view.webContents.on(event, listener);
      }
      return view;
    },
    once: (event: string, listener: (...args: unknown[]) => void) => {
      view.webContents.once(event as "destroyed", listener);
      return view;
    },
    off: (event: string, listener: (...args: unknown[]) => void) => {
      view.webContents.off(event as "destroyed", listener);
      return view;
    },
    removeListener: (event: string, listener: (...args: unknown[]) => void) => {
      view.webContents.removeListener(event as "destroyed", listener);
      return view;
    },
    isDestroyed: () => view.webContents.isDestroyed(),
    isFocused: () => view.webContents.isFocused(),
    focus: () => view.webContents.focus(),
    show: () => {},
    hide: () => {},
    getBounds: viewBounds,
    getContentBounds: viewBounds,
    getSize: () => {
      const b = viewBounds();
      return [b.width, b.height];
    },
    getContentSize: () => {
      const b = viewBounds();
      return [b.width, b.height];
    },
    setTitle: () => {},
    getTitle: () => "",
    setRepresentedFilename: () => {},
    setDocumentEdited: () => {},
    setWindowButtonVisibility: () => {},
  };
}

function codexAppUrl(route: string, hostId: string): string {
  const url = new URL("app://-/index.html");
  url.searchParams.set("hostId", hostId);
  if (route !== "/") url.searchParams.set("initialRoute", route);
  return url.toString();
}

function normalizeOwlViewUrl(url: string): string {
  if (typeof url !== "string" || url.includes("\n") || url.includes("\r")) {
    throw new Error("Owl view URL must be a string without control characters");
  }
  const parsed = new URL(url);
  if (!["http:", "https:", "app:", "file:", "data:", "about:"].includes(parsed.protocol)) {
    throw new Error(`unsupported Owl view URL protocol: ${parsed.protocol}`);
  }
  return parsed.toString();
}

function getCodexWindowServices(): CodexWindowServices | null {
  const services = (globalThis as unknown as Record<string, unknown>)[CODEX_WINDOW_SERVICES_KEY];
  return services && typeof services === "object" ? (services as CodexWindowServices) : null;
}

function normalizeCodexRoute(route: string): string {
  if (typeof route !== "string" || !route.startsWith("/")) {
    throw new Error("Codex route must be an absolute app route");
  }
  if (route.includes("://") || route.includes("\n") || route.includes("\r")) {
    throw new Error("Codex route must not include a protocol or control characters");
  }
  return route;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

function callObjectMethod(target: unknown, method: string, args: unknown[]): unknown {
  const fn = asRecord(target)?.[method];
  if (typeof fn !== "function") return undefined;
  return fn.apply(target, args);
}

function isWindowDestroyed(win: Electron.BrowserWindow | null | undefined): boolean {
  if (!win) return true;
  const fn = asRecord(win)?.isDestroyed;
  if (typeof fn !== "function") return false;
  try {
    return Boolean(fn.call(win));
  } catch {
    return true;
  }
}

function windowIdFor(win: Electron.BrowserWindow | null | undefined): number | null {
  const id = asRecord(win)?.id;
  return typeof id === "number" ? id : null;
}

function bindWindowEvent(
  win: Electron.BrowserWindow,
  view: ManagedOwlView,
  event: string,
  listener: (...args: unknown[]) => void,
): void {
  const on = asRecord(win)?.on;
  const off = asRecord(win)?.off;
  if (typeof on !== "function") return;
  on.call(win, event, listener);
  view.disposeBindings.push(() => {
    if (typeof off === "function") off.call(win, event, listener);
    else callObjectMethod(win, "removeListener", [event, listener]);
  });
}

function assertBridgeId(value: string, label: string): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9._-]+$/.test(value)) {
    throw new Error(`${label} may only contain letters, numbers, dots, underscores, and dashes`);
  }
  return value;
}

function assertBounds(bounds: Electron.Rectangle): void {
  const values = [bounds?.x, bounds?.y, bounds?.width, bounds?.height];
  if (!values.every((value) => typeof value === "number" && Number.isFinite(value))) {
    throw new Error("bounds must contain finite x, y, width, and height numbers");
  }
  if (bounds.width < 0 || bounds.height < 0) {
    throw new Error("bounds width and height must be non-negative");
  }
}

// Touch BrowserWindow to keep its import — older Electron lint rules.
void BrowserWindow;
