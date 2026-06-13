/**
 * Settings injector for Codex's Settings page.
 *
 * Codex's settings is a routed page (URL stays at `/index.html?hostId=local`)
 * NOT a modal dialog. The sidebar lives inside a `<div class="flex flex-col
 * gap-1 gap-0">` wrapper that holds one or more `<div class="flex flex-col
 * gap-px">` groups of buttons. There are no stable `role` / `aria-label` /
 * `data-testid` hooks on the shell so we identify the sidebar by text-content
 * match against known item labels (General, Appearance, Configuration, …).
 *
 * Layout we inject:
 *
 *   GENERAL                       (uppercase group label)
 *   [Codex's existing items group]
 *   codex汉化增强plus版             (uppercase group label)
 *   ⓘ Config
 *   ☰ Tweaks
 *   ◇ Tweak Store
 *
 * Clicking Config / Tweaks / Tweak Store hides Codex's content panel children and renders
 * our own `main-surface` panel in their place. Clicking any of Codex's
 * sidebar items restores the original view.
 */

import { ipcRenderer } from "electron";
import type {
  SettingsSection,
  SettingsPage,
  SettingsHandle,
  TweakManifest,
} from "@codex-plusplus/sdk";
import type { TweakStoreEntry } from "../tweak-store";

const AI_OPEN_TOOL_URL = "https://aiopentool.com/";

interface TweakDisplayText {
  name: string;
  description?: string;
}

const STORE_TWEAK_ZH: Record<string, TweakDisplayText> = {
  "co.sakushi.add-project-by-path": {
    name: "按路径添加项目",
    description: "在项目菜单中添加一个原生风格入口，可通过输入路径添加工作区。",
  },
  "co.bennett.ui-improvements": {
    name: "Bennett 的界面改进",
    description: "Codex 易用性界面优化：隐藏升级提示，并显示用量和消息指标。",
  },
  "co.bennett.better-browser": {
    name: "增强浏览器",
    description: "增强 Codex 浏览器侧边栏，支持更多标签、内联开发者工具和浏览器导航快捷键。",
  },
  "co.bennett.better-terminal": {
    name: "增强终端",
    description: "升级 Codex 终端，加入分屏、原生弹出窗口、标签控制、快捷键和内存监控。",
  },
  "co.bennett.codex-horizontal-tabs": {
    name: "Codex 横向标签栏",
    description: "为已打开的 Codex 对话添加类似 Chrome 的顶部标签栏。",
  },
  "co.bennett.codex-tab-switcher": {
    name: "Codex 标签切换器",
    description: "使用 Ctrl-Tab 浮层和小预览在最近的 Codex 对话之间切换。",
  },
  "com.jumang.completion-sound": {
    name: "完成提示音",
    description: "播放 Codex 活动提示音，并加宽聊天列。",
  },
  "co.Arconte112.followup": {
    name: "上下文追问",
    description: "在助手消息下方添加可点击的上下文下一步提示，并可同步托管的 AGENTS.md 指令。",
  },
  "co.bennett.custom-keyboard-shortcuts": {
    name: "自定义键盘快捷键",
    description: "发现、重映射或禁用 Codex 的键盘快捷键。",
  },
  "co.qoli.disable-escape": {
    name: "禁用 Escape",
    description: "拦截 Codex 渲染窗口中的 Escape 键，避免中文等输入法组合输入打断正在运行的回复。",
  },
  "me.erkin.codex-plusplus-account-switcher": {
    name: "账号快速切换",
    description: "从账号菜单保存、切换和管理本地 Codex 登录会话，并在设置中缓存用量状态。",
  },
  "co.bennett.file-editor": {
    name: "文件编辑器",
    description: "让 Codex 右侧面板的文件标签可直接编辑，并支持防抖自动保存。",
  },
  "co.bennett.goal": {
    name: "目标",
    description: "把 Codex 的 /goal 命令和活动目标界面加入桌面 App。",
  },
  "co.bennett.ios-simulator": {
    name: "iOS 模拟器",
    description: "在 Codex 右侧面板添加 iOS 模拟器标签，并支持镜像和点击/滑动转发。",
  },
  "co.bennett.computer-use": {
    name: "OpenAI 电脑操控",
    description: "在 codex汉化增强plus版 中启用 OpenAI Computer Use，包含原生风格设置、启动自修复和功能注册。",
  },
  "me.xtawfik.codex-plusplus-package-run": {
    name: "Package 脚本运行",
    description: "在 Codex 原生文件查看器中显示 package.json 脚本，并把选中的命令发送到终端。",
  },
  "co.bennett.project-home": {
    name: "项目主页",
    description: "添加一个 Project Home 看板，用 Linear 风格管理每个项目的问题。",
  },
  "com.imsakushi.quick-actions": {
    name: "快捷操作",
    description: "为 Codex 的 Git 面板添加自定义工作流操作。",
  },
  "co.shivam94.reasoning-fixes": {
    name: "推理与探索显示修复",
    description: "保持探索面板打开、推理过程可见，并展开工具输出，包含源码补丁和运行时增强。",
  },
  "co.bennett.windows-computer-use": {
    name: "Windows 电脑操控",
    description: "为 codex汉化增强plus版 提供 Windows Computer Use 的 MCP 界面。",
  },
};

// Mirrors the runtime's main-side ListedTweak shape (kept in sync manually).
interface ListedTweak {
  manifest: TweakManifest;
  entry: string;
  dir: string;
  entryExists: boolean;
  enabled: boolean;
  update: TweakUpdateCheck | null;
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

interface CodexPlusPlusConfig {
  version: string;
  enabled: boolean;
  autoUpdate: boolean;
  updateChannel: SelfUpdateChannel;
  updateRepo: string;
  updateRef: string;
  updateCheck: CodexPlusPlusUpdateCheck | null;
  selfUpdate: SelfUpdateState | null;
  installationSource: InstallationSource;
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

type AgentProviderId = "deepseek" | "zhipu" | "qwen";
type AgentProviderSelection = "codex-native" | AgentProviderId;
type AgentProviderMode = "chat" | "app";
type AgentProviderAccessMode = "bridge" | "pure-api";
type BuiltinPage = "config" | "agent-providers" | "tweaks" | "store";

interface AgentProviderMeta {
  id: AgentProviderId;
  label: string;
  title: string;
  description: string;
  docsUrl: string;
  keyUrl?: string;
}

interface AgentProviderConfigView {
  provider: AgentProviderId;
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  model: string;
  appId: string;
  mode: AgentProviderMode;
  accessMode: AgentProviderAccessMode;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  sessionId: string;
}

interface AgentProviderTestResult {
  provider: AgentProviderId;
  text: string;
  model?: string;
  sessionId?: string;
  usage?: unknown;
  raw?: unknown;
}

interface AgentProviderModelView {
  id: string;
  label?: string;
  ownedBy?: string;
}

interface AgentProviderModelsView {
  provider: AgentProviderId;
  models: AgentProviderModelView[];
  sourceUrl?: string;
  disabledReason?: string;
}

interface AgentProviderActivationView {
  activeProvider: AgentProviderSelection;
  bridgeUrl: string | null;
  configPath: string;
  restartRequired: boolean;
  message: string;
}

interface WatcherHealth {
  checkedAt: string;
  status: "ok" | "warn" | "error";
  title: string;
  summary: string;
  watcher: string;
  checks: WatcherHealthCheck[];
}

interface WatcherHealthCheck {
  name: string;
  status: "ok" | "warn" | "error";
  detail: string;
}

interface TweakStoreRegistryView {
  schemaVersion: 1;
  generatedAt?: string;
  sourceUrl: string;
  fetchedAt: string;
  entries: TweakStoreEntryView[];
}

interface TweakStoreEntryView extends TweakStoreEntry {
  installed: {
    version: string;
    enabled: boolean;
  } | null;
  platform?: {
    current: string;
    supported: string[] | null;
    compatible: boolean;
    reason: string | null;
  };
  runtime?: {
    current: string;
    required: string | null;
    compatible: boolean;
    reason: string | null;
  };
}

/**
 * A tweak-registered page. We carry the owning tweak's manifest so we can
 * resolve relative iconUrls and show authorship in the page header.
 */
interface RegisteredPage {
  /** Fully-qualified id: `<tweakId>:<pageId>`. */
  id: string;
  tweakId: string;
  manifest: TweakManifest;
  page: SettingsPage;
  /** Per-page DOM teardown returned by `page.render`, if any. */
  teardown?: (() => void) | null;
  /** The injected sidebar button (so we can update its active state). */
  navButton?: HTMLButtonElement | null;
}

/** What page is currently selected in our injected nav. */
type ActivePage =
  | { kind: "config" }
  | { kind: "store" }
  | { kind: "tweaks" }
  | { kind: "agent-providers" }
  | { kind: "registered"; id: string };

interface InjectorState {
  sections: Map<string, SettingsSection>;
  pages: Map<string, RegisteredPage>;
  listedTweaks: ListedTweak[];
  /** Outer wrapper that holds Codex's items group + our injected groups. */
  outerWrapper: HTMLElement | null;
  /** Our "General" label for Codex's native settings group. */
  nativeNavHeader: HTMLElement | null;
  /** Our "codex汉化增强plus版" nav group (Config/Tweaks). */
  navGroup: HTMLElement | null;
  navButtons: Record<BuiltinPage, HTMLButtonElement> | null;
  /** Sidebar update pill shown only when GitHub has a newer codex汉化增强plus版 release. */
  codexPlusPlusUpdateButton: HTMLButtonElement | null;
  /** Our "Tweaks" nav group (per-tweak pages). Created lazily. */
  pagesGroup: HTMLElement | null;
  pagesGroupKey: string | null;
  panelHost: HTMLElement | null;
  observer: MutationObserver | null;
  fingerprint: string | null;
  sidebarDumped: boolean;
  activePage: ActivePage | null;
  sidebarRoot: HTMLElement | null;
  sidebarRestoreHandler: ((e: Event) => void) | null;
  settingsSurfaceVisible: boolean;
  settingsSurfaceHideTimer: ReturnType<typeof setTimeout> | null;
  tweakStore: TweakStoreRegistryView | null;
  tweakStorePromise: Promise<TweakStoreRegistryView> | null;
  tweakStoreError: unknown;
  modelSourceLabel: string | null;
  modelSourceTitle: string | null;
  modelSourceLoading: boolean;
}

const state: InjectorState = {
  sections: new Map(),
  pages: new Map(),
  listedTweaks: [],
  outerWrapper: null,
  nativeNavHeader: null,
  navGroup: null,
  navButtons: null,
  codexPlusPlusUpdateButton: null,
  pagesGroup: null,
  pagesGroupKey: null,
  panelHost: null,
  observer: null,
  fingerprint: null,
  sidebarDumped: false,
  activePage: null,
  sidebarRoot: null,
  sidebarRestoreHandler: null,
  settingsSurfaceVisible: false,
  settingsSurfaceHideTimer: null,
  tweakStore: null,
  tweakStorePromise: null,
  tweakStoreError: null,
  modelSourceLabel: null,
  modelSourceTitle: null,
  modelSourceLoading: false,
};

const AGENT_PROVIDERS: AgentProviderMeta[] = [
  {
    id: "deepseek",
    label: "DeepSeek",
    title: "DeepSeek",
    description: "配置 DeepSeek Chat Completions 接入，并发送测试请求。",
    docsUrl: "https://api-docs.deepseek.com/api/create-chat-completion",
  },
  {
    id: "qwen",
    label: "阿里千问",
    title: "阿里千问",
    description: "配置阿里云百炼千问模型接入，默认使用 OpenAI 兼容模式接管主聊天。",
    docsUrl: "https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope",
  },
  {
    id: "zhipu",
    label: "智谱 GLM",
    title: "智谱 GLM",
    description: "配置智谱开放平台 GLM 的 OpenAI 兼容接口，并发送测试请求。",
    docsUrl: "https://docs.bigmodel.cn/cn/guide/develop/openai/introduction",
    keyUrl: "https://open.bigmodel.cn/usercenter/apikeys",
  },
];
const DEFAULT_AGENT_TEST_PROMPT = "用一句话介绍你是谁，并说明当前接入是否可用。";

function agentProviderMeta(id: AgentProviderId): AgentProviderMeta {
  return AGENT_PROVIDERS.find((provider) => provider.id === id) ?? AGENT_PROVIDERS[0]!;
}

function plog(msg: string, extra?: unknown): void {
  ipcRenderer.send(
    "codexpp:preload-log",
    "info",
    `[settings-injector] ${msg}${extra === undefined ? "" : " " + safeStringify(extra)}`,
  );
}
function safeStringify(v: unknown): string {
  try {
    return typeof v === "string" ? v : JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function localizeBackToAppLabel(value: string): boolean {
  const text = compactSettingsText(value);
  return text === "Back to app" || text === "返回应用";
}

function storeTweakText(entry: TweakStoreEntryView): TweakDisplayText | null {
  return STORE_TWEAK_ZH[entry.id] ?? null;
}

function manifestTweakText(manifest: TweakManifest): TweakDisplayText | null {
  if (STORE_TWEAK_ZH[manifest.id]) return STORE_TWEAK_ZH[manifest.id];
  return null;
}

function tweakDisplayName(manifest: TweakManifest): string {
  return manifestTweakText(manifest)?.name ?? manifest.name;
}

function tweakDisplayDescription(manifest: TweakManifest): string | undefined {
  return manifestTweakText(manifest)?.description ?? manifest.description;
}

function storeEntryDisplayName(entry: TweakStoreEntryView): string {
  return storeTweakText(entry)?.name ?? entry.manifest.name;
}

function storeEntryDisplayDescription(entry: TweakStoreEntryView): string | undefined {
  return storeTweakText(entry)?.description ?? entry.manifest.description;
}

function localizeInstallationSource(source: InstallationSource): string {
  const label =
    source.kind === "github-source" ? "GitHub 源码安装" :
    source.kind === "homebrew" ? "Homebrew 安装" :
    source.kind === "local-dev" ? "本地开发源码" :
    source.kind === "source-archive" ? "源码归档安装" :
    "未知来源";
  return `${label}: ${source.detail}`;
}

function localizeReleaseNotes(markdown: string): string {
  const text = markdown.trim();
  if (!text) return "暂无发布说明。";
  if (
    !text.includes(["Codex", "++ 1.0.0 is the first stable release"].join("")) &&
    !text.includes("codex汉化增强plus版 1.0.0 is the first stable release")
  ) return text;
  return [
    "codex汉化增强plus版 1.0.0 是本地 tweak/runtime 层的第一个稳定版。",
    "",
    "亮点：",
    "",
    "- 为现代 Codex App 更新提供更干净的 patch 和重新 patch 流程，包括重启/重新打开处理，以及刷新未 patch 的备份。",
    "- 新增调试命令：`codexplusplus debug`，可显示 Codex 安装路径、runtime 类型、数据路径、打开状态和 bridge 状态。",
    "- 增加 Owl runtime 检测，并为 OS 级 tweak 能力加入原生 macOS bridge 基础。",
    "- 多文件 tweak 编写文档覆盖 SDK、manifest、生命周期、UI/DOM、native bridge 和分发。",
    "- 移除默认 tweak 安装逻辑，1.0.0 会保持干净启动。",
    "- 修复 Settings 侧边栏注入问题，避免 codex汉化增强plus版 导航卡在 Codex 主侧边栏里。",
    "- 加强 Windows 卸载清理，覆盖 watcher 任务、watcher 脚本和残留 watcher 进程。",
    "- 新增 `codexplusplus uninstall --purge`，用于完整重置 codex汉化增强plus版 和用户数据。",
  ].join("\n");
}

// ───────────────────────────────────────────────────────────── public API ──

export function startSettingsInjector(): void {
  if (state.observer) return;

  const obs = new MutationObserver(() => {
    tryInject();
    syncComposerModelSourceLabel();
    maybeDumpDom();
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
  state.observer = obs;

  window.addEventListener("popstate", onNav);
  window.addEventListener("hashchange", onNav);
  document.addEventListener("click", onDocumentClick, true);
  for (const m of ["pushState", "replaceState"] as const) {
    const orig = history[m];
    history[m] = function (this: History, ...args: Parameters<typeof orig>) {
      const r = orig.apply(this, args);
      window.dispatchEvent(new Event(`codexpp-${m}`));
      return r;
    } as typeof orig;
    window.addEventListener(`codexpp-${m}`, onNav);
  }

  tryInject();
  refreshComposerModelSourceLabel();
  syncComposerModelSourceLabel();
  maybeDumpDom();
  let ticks = 0;
  const interval = setInterval(() => {
    ticks++;
    tryInject();
    syncComposerModelSourceLabel();
    maybeDumpDom();
    if (ticks > 60) clearInterval(interval);
  }, 500);
}

function onNav(): void {
  state.fingerprint = null;
  tryInject();
  syncComposerModelSourceLabel();
  maybeDumpDom();
}

function refreshComposerModelSourceLabel(): void {
  if (state.modelSourceLoading) return;
  state.modelSourceLoading = true;
  void ipcRenderer.invoke("codexpp:get-active-agent-provider")
    .then(async (active) => {
      const provider = asAgentProviderSelection(active);
      if (provider === "codex-native") {
        state.modelSourceLabel = null;
        state.modelSourceTitle = null;
        syncComposerModelSourceLabel();
        return;
      }
      const config = await ipcRenderer.invoke("codexpp:get-agent-provider-config", provider) as AgentProviderConfigView;
      const meta = agentProviderMeta(provider);
      state.modelSourceLabel = meta.label;
      state.modelSourceTitle = config.model?.trim()
        ? `${meta.label} · ${config.model.trim()}`
        : meta.label;
      syncComposerModelSourceLabel();
    })
    .catch(() => {
      state.modelSourceLabel = null;
      state.modelSourceTitle = null;
    })
    .finally(() => {
      state.modelSourceLoading = false;
    });
}

function syncComposerModelSourceLabel(): void {
  const label = state.modelSourceLabel;
  const title = state.modelSourceTitle ?? label;
  if (!label || !title) return;
  const button = document.querySelector<HTMLButtonElement>('button[data-codex-intelligence-trigger="true"]');
  if (!button) return;
  button.dataset.codexppAgentProviderLabel = label;
  button.title = title;
  button.setAttribute("aria-label", `当前模型：${title}`);

  const labelSpan = findComposerModelNameSpan(button);
  if (labelSpan && labelSpan.textContent !== label) {
    labelSpan.textContent = label;
  }
}

function findComposerModelNameSpan(button: HTMLElement): HTMLElement | null {
  const leafSpans = Array.from(button.querySelectorAll<HTMLElement>("span"))
    .filter((span) => span.children.length === 0 && !!span.textContent?.trim());
  return (
    leafSpans.find((span) => span.className.includes("text-token-foreground")) ??
    leafSpans.find((span) => !span.className.includes("description")) ??
    null
  );
}

function onDocumentClick(e: MouseEvent): void {
  const target = e.target instanceof Element ? e.target : null;
  const control = target?.closest("[role='link'],button,a");
  if (!(control instanceof HTMLElement)) return;
  if (!localizeBackToAppLabel(control.textContent || "")) return;
  setTimeout(() => {
    setSettingsSurfaceVisible(false, "back-to-app");
  }, 0);
}

export function registerSection(section: SettingsSection): SettingsHandle {
  state.sections.set(section.id, section);
  if (state.activePage?.kind === "tweaks") rerender();
  return {
    unregister: () => {
      state.sections.delete(section.id);
      if (state.activePage?.kind === "tweaks") rerender();
    },
  };
}

export function clearSections(): void {
  state.sections.clear();
  // Drop registered pages too — they're owned by tweaks that just got
  // torn down by the host. Run any teardowns before forgetting them.
  for (const p of state.pages.values()) {
    try {
      p.teardown?.();
    } catch (e) {
      plog("page teardown failed", { id: p.id, err: String(e) });
    }
  }
  state.pages.clear();
  syncPagesGroup();
  // If we were on a registered page that no longer exists, fall back to
  // restoring Codex's view.
  if (
    state.activePage?.kind === "registered" &&
    !state.pages.has(state.activePage.id)
  ) {
    restoreCodexView();
  } else if (state.activePage?.kind === "tweaks") {
    rerender();
  }
}

/**
 * Register a tweak-owned settings page. The runtime injects a sidebar entry
 * under a "TWEAKS" group header (which appears only when at least one page
 * is registered) and routes clicks to the page's `render(root)`.
 */
export function registerPage(
  tweakId: string,
  manifest: TweakManifest,
  page: SettingsPage,
): SettingsHandle {
  const id = page.id; // already namespaced by tweak-host as `${tweakId}:${page.id}`
  const entry: RegisteredPage = { id, tweakId, manifest, page };
  state.pages.set(id, entry);
  plog("registerPage", { id, title: page.title, tweakId });
  syncPagesGroup();
  // If the user was already on this page (hot reload), re-mount its body.
  if (state.activePage?.kind === "registered" && state.activePage.id === id) {
    rerender();
  }
  return {
    unregister: () => {
      const e = state.pages.get(id);
      if (!e) return;
      try {
        e.teardown?.();
      } catch {}
      state.pages.delete(id);
      syncPagesGroup();
      if (state.activePage?.kind === "registered" && state.activePage.id === id) {
        restoreCodexView();
      }
    },
  };
}

/** Called by the tweak host after fetching the tweak list from main. */
export function setListedTweaks(list: ListedTweak[]): void {
  state.listedTweaks = list;
  if (state.activePage?.kind === "tweaks") rerender();
}

// ───────────────────────────────────────────────────────────── injection ──

function tryInject(): void {
  removeMisplacedSettingsGroups();

  const itemsGroup = findSidebarItemsGroup();
  if (!itemsGroup) {
    scheduleSettingsSurfaceHidden();
    plog("sidebar not found");
    return;
  }
  if (state.settingsSurfaceHideTimer) {
    clearTimeout(state.settingsSurfaceHideTimer);
    state.settingsSurfaceHideTimer = null;
  }
  setSettingsSurfaceVisible(true, "sidebar-found");
  // Codex's items group lives inside an outer wrapper that's already styled
  // to hold multiple groups (`flex flex-col gap-1 gap-0`). We inject our
  // group as a sibling so the natural gap-1 acts as our visual separator.
  const outer = itemsGroup.parentElement ?? itemsGroup;
  if (!isSettingsSidebarCandidate(itemsGroup) || !isSettingsSidebarCandidate(outer)) {
    scheduleSettingsSurfaceHidden();
    plog("rejected non-settings sidebar candidate", {
      itemsGroup: describe(itemsGroup),
      outer: describe(outer),
    });
    return;
  }
  state.sidebarRoot = outer;
  syncNativeSettingsHeader(itemsGroup, outer);

  if (state.navGroup && outer.contains(state.navGroup)) {
    syncPagesGroup();
    // Codex re-renders its native sidebar buttons on its own state changes.
    // If one of our pages is active, re-strip Codex's active styling so
    // General doesn't reappear as selected.
    if (state.activePage !== null) syncCodexNativeNavActive(true);
    return;
  }

  // Sidebar was either freshly mounted (Settings just opened) or re-mounted
  // (closed and re-opened, or navigated away and back). In all of those
  // cases Codex resets to its default page (General), but our in-memory
  // `activePage` may still reference the last tweak/page the user had open
  // — which would cause that nav button to render with the active styling
  // even though Codex is showing General. Clear it so `syncPagesGroup` /
  // `setNavActive` start from a neutral state. The panelHost reference is
  // also stale (its DOM was discarded with the previous content area).
  if (state.activePage !== null || state.panelHost !== null) {
    plog("sidebar re-mount detected; clearing stale active state", {
      prevActive: state.activePage,
    });
    state.activePage = null;
    state.panelHost = null;
  }

  const existingCodexPpNavGroup =
    outer.querySelector<HTMLElement>(':scope > [data-codexpp="nav-group"]') ??
    outer.querySelector<HTMLElement>('[data-codexpp="nav-group"]');

  if (existingCodexPpNavGroup) {
    state.navGroup = existingCodexPpNavGroup;
    state.codexPlusPlusUpdateButton = existingCodexPpNavGroup.querySelector<HTMLButtonElement>(
      "[data-codexpp-sidebar-update]",
    );
    state.sidebarRoot = outer;
    syncPagesGroup();
    refreshSidebarCodexPlusPlusUpdateButton();
    if (state.activePage !== null) syncCodexNativeNavActive(true);
    return;
  }

  // ── Group container ───────────────────────────────────────────────────
  const group = document.createElement("div");
  group.dataset.codexpp = "nav-group";
  group.className = "flex flex-col gap-px";

  const updateButton = sidebarUpdatePillButton();
  state.codexPlusPlusUpdateButton = updateButton;
  group.appendChild(sidebarGroupHeader("codex汉化增强plus版", "pt-3", updateButton));
  refreshSidebarCodexPlusPlusUpdateButton();

  // ── Sidebar items ────────────────────────────────────────────────────
  const configBtn = makeSidebarItem("配置", configIconSvg());
  const agentProvidersBtn = makeSidebarItem("模型接入", agentProviderIconSvg());
  const tweaksBtn = makeSidebarItem("插件", tweaksIconSvg());
  const storeBtn = makeSidebarItem("插件商店", storeIconSvg());
  appendSidebarStoreUpdateBadge(storeBtn);

  configBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    activatePage({ kind: "config" });
  });
  agentProvidersBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    activatePage({ kind: "agent-providers" });
  });
  tweaksBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    activatePage({ kind: "tweaks" });
  });
  storeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    activatePage({ kind: "store" });
  });

  group.appendChild(configBtn);
  group.appendChild(agentProvidersBtn);
  group.appendChild(tweaksBtn);
  group.appendChild(storeBtn);
  outer.appendChild(group);

  state.navGroup = group;
  state.navButtons = { config: configBtn, "agent-providers": agentProvidersBtn, tweaks: tweaksBtn, store: storeBtn };
  plog("nav group injected", { outerTag: outer.tagName });
  syncPagesGroup();
}

function syncNativeSettingsHeader(itemsGroup: HTMLElement, outer: HTMLElement): void {
  if (state.nativeNavHeader && outer.contains(state.nativeNavHeader)) return;
  if (outer === itemsGroup) return;

  const header = sidebarGroupHeader("常规");
  header.dataset.codexpp = "native-nav-header";
  outer.insertBefore(header, itemsGroup);
  state.nativeNavHeader = header;
}

function sidebarGroupHeader(text: string, topPadding = "pt-2", trailing?: HTMLElement): HTMLElement {
  const header = document.createElement("div");
  header.className =
    `px-row-x ${topPadding} pb-1 flex items-center justify-between gap-2 text-[11px] font-medium uppercase tracking-wider text-token-description-foreground select-none`;
  const label = document.createElement("span");
  label.className = "truncate";
  label.textContent = text;
  header.appendChild(label);
  if (trailing) header.appendChild(trailing);
  return header;
}

function scheduleSettingsSurfaceHidden(): void {
  if (!state.settingsSurfaceVisible || state.settingsSurfaceHideTimer) return;
  state.settingsSurfaceHideTimer = setTimeout(() => {
    state.settingsSurfaceHideTimer = null;
    const sidebar = findSidebarItemsGroup();
    if (sidebar && isSettingsSidebarCandidate(sidebar)) return;
    if (isSettingsTextVisible()) return;
    setSettingsSurfaceVisible(false, "sidebar-not-found");
  }, 1500);
}

function isSettingsTextVisible(): boolean {
  return isCodexPpSettingsLabelSet(codexPpSettingsLabelsFrom(document));
}

function compactSettingsText(value: string): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

const CODEXPP_CORE_SETTINGS_LABELS = [
  "General",
  "常规",
  "通用",
  "Appearance",
  "外观",
  "Configuration",
  "配置",
  "默认权限",
  "Personalization",
  "个性化",
  "Profile",
  "个人资料",
].map(normalizeCodexPpSettingsLabel);

const CODEXPP_EXTENDED_SETTINGS_LABELS = [
  "Account",
  "账户",
  "账号",
  "Personal",
  "个人",
  "Profile",
  "个人资料",
  "General",
  "常规",
  "通用",
  "Appearance",
  "外观",
  "Configuration",
  "配置",
  "默认权限",
  "Personalization",
  "个性化",
  "Keyboard shortcuts",
  "键盘快捷键",
  "Archived chats",
  "已归档对话",
  "Usage",
  "Usage and billing",
  "使用情况和计费",
  "Computer use",
  "电脑操控",
  "Browser use",
  "Browser",
  "浏览器",
  "MCP servers",
  "MCP Servers",
  "MCP 服务器",
  "Hooks",
  "钩子",
  "Git",
  "Environments",
  "环境",
  "Cloud Environments",
  "Worktrees",
  "工作树",
  "Connections",
  "连接",
  "Plugins",
  "Skills",
].map(normalizeCodexPpSettingsLabel);

const CODEXPP_SETTINGS_ONLY_LABELS = [
  "General",
  "常规",
  "通用",
  "Appearance",
  "外观",
  "Configuration",
  "配置",
  "默认权限",
  "Personalization",
  "个性化",
  "Profile",
  "个人资料",
  "Keyboard shortcuts",
  "键盘快捷键",
  "Archived chats",
  "已归档对话",
  "Usage",
  "Usage and billing",
  "使用情况和计费",
  "Computer use",
  "电脑操控",
  "Browser use",
  "Browser",
  "浏览器",
  "MCP servers",
  "MCP Servers",
  "MCP 服务器",
  "Hooks",
  "钩子",
  "Git",
  "Environments",
  "环境",
  "Cloud Environments",
  "Worktrees",
  "工作树",
  "Connections",
  "连接",
].map(normalizeCodexPpSettingsLabel);

const CODEXPP_MAIN_APP_NAV_LABELS = [
  "New chat",
  "Quick chat",
  "快速对话",
  "Search",
  "搜索",
  "Plugins",
  "插件",
  "Automations",
  "Automation",
  "自动化",
  "Chats",
  "Chat",
  "对话",
  "Projects",
  "项目",
  "Pinned",
  "Settings",
  "设置",
  "Work locally",
].map(normalizeCodexPpSettingsLabel);

function normalizeCodexPpSettingsLabel(value: string): string {
  return compactSettingsText(value)
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function codexPpControlLabel(el: HTMLElement): string {
  return normalizeCodexPpSettingsLabel(
    el.getAttribute("aria-label") ||
      el.getAttribute("title") ||
      el.textContent ||
      "",
  );
}

function codexPpSettingsLabelsFrom(root: ParentNode): string[] {
  const controls = Array.from(
    root.querySelectorAll<HTMLElement>("button,a,[role='button'],[role='link']"),
  );

  return [
    ...new Set(
      controls
        .map(codexPpControlLabel)
        .filter(Boolean),
    ),
  ];
}

function codexPpSettingsLabelScore(labels: string[]): { core: number; total: number } {
  const core = new Set<string>();
  const total = new Set<string>();

  for (const label of labels) {
    for (const marker of CODEXPP_CORE_SETTINGS_LABELS) {
      if (codexPpLabelMatchesMarker(label, marker)) core.add(marker);
    }

    for (const marker of CODEXPP_EXTENDED_SETTINGS_LABELS) {
      if (codexPpLabelMatchesMarker(label, marker)) total.add(marker);
    }
  }

  return { core: core.size, total: total.size };
}

function codexPpLabelMatchesMarker(label: string, marker: string): boolean {
  return label === marker || label.includes(marker);
}

function codexPpMarkerCount(labels: string[], markers: string[]): number {
  const matched = new Set<string>();
  for (const label of labels) {
    for (const marker of markers) {
      if (codexPpLabelMatchesMarker(label, marker)) matched.add(marker);
    }
  }
  return matched.size;
}

function hasCodexPpSettingsOnlySignal(labels: string[]): boolean {
  return codexPpMarkerCount(labels, CODEXPP_SETTINGS_ONLY_LABELS) > 0;
}

function hasMainAppSidebarSignals(labels: string[]): boolean {
  return codexPpMarkerCount(labels, CODEXPP_MAIN_APP_NAV_LABELS) >= 2;
}

function isCodexPpSettingsLabelSet(labels: string[]): boolean {
  const score = codexPpSettingsLabelScore(labels);
  return score.core >= 2 && score.total >= 3;
}

function codexPpVisibleBox(el: HTMLElement): DOMRect | null {
  if (!el.isConnected) return null;
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return null;

  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return rect;
}

function setSettingsSurfaceVisible(visible: boolean, reason: string): void {
  if (state.settingsSurfaceVisible === visible) return;
  state.settingsSurfaceVisible = visible;
  if (visible) warmTweakStore();
  try {
    (window as Window & { __codexppSettingsSurfaceVisible?: boolean }).__codexppSettingsSurfaceVisible = visible;
    document.documentElement.dataset.codexppSettingsSurface = visible ? "true" : "false";
    window.dispatchEvent(
      new CustomEvent("codexpp:settings-surface", {
        detail: { visible, reason },
      }),
    );
  } catch {}
  plog("settings surface", { visible, reason, url: location.href });
}

/**
 * Render (or re-render) the second sidebar group of per-tweak pages. The
 * group is created lazily and removed when the last page unregisters, so
 * users with no page-registering tweaks never see an empty "Tweaks" header.
 */
function syncPagesGroup(): void {
  const outer = state.sidebarRoot;
  if (!outer) return;
  if (!isSettingsSidebarCandidate(outer)) {
    state.sidebarRoot = null;
    state.pagesGroup = null;
    state.pagesGroupKey = null;
    for (const p of state.pages.values()) p.navButton = null;
    return;
  }
  const pages = [...state.pages.values()];

  // Build a deterministic fingerprint of the desired group state. If the
  // current DOM group already matches, this is a no-op — critical, because
  // syncPagesGroup is called on every MutationObserver tick and any DOM
  // write would re-trigger that observer (infinite loop, app freeze).
  const desiredKey = pages.length === 0
    ? "EMPTY"
    : pages.map((p) => `${p.id}|${p.page.title}|${p.page.iconSvg ?? ""}`).join("\n");
  const groupAttached = !!state.pagesGroup && outer.contains(state.pagesGroup);
  if (state.pagesGroupKey === desiredKey && (pages.length === 0 ? !groupAttached : groupAttached)) {
    return;
  }

  if (pages.length === 0) {
    if (state.pagesGroup) {
      state.pagesGroup.remove();
      state.pagesGroup = null;
    }
    for (const p of state.pages.values()) p.navButton = null;
    state.pagesGroupKey = desiredKey;
    return;
  }

  let group = state.pagesGroup;
  if (!group || !outer.contains(group)) {
    group = document.createElement("div");
    group.dataset.codexpp = "pages-group";
    group.className = "flex flex-col gap-px";
    group.appendChild(sidebarGroupHeader("插件", "pt-3"));
    outer.appendChild(group);
    state.pagesGroup = group;
  } else {
    // Strip prior buttons (keep the header at index 0).
    while (group.children.length > 1) group.removeChild(group.lastChild!);
  }

  for (const p of pages) {
    const icon = p.page.iconSvg ?? defaultPageIconSvg();
    const btn = makeSidebarItem(p.page.title, icon);
    btn.dataset.codexpp = `nav-page-${p.id}`;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      activatePage({ kind: "registered", id: p.id });
    });
    p.navButton = btn;
    group.appendChild(btn);
  }
  state.pagesGroupKey = desiredKey;
  plog("pages group synced", {
    count: pages.length,
    ids: pages.map((p) => p.id),
  });
  // Reflect current active state across the rebuilt buttons.
  setNavActive(state.activePage);
}

function makeSidebarItem(label: string, iconSvg: string): HTMLButtonElement {
  // Class string copied verbatim from Codex's sidebar buttons (General etc).
  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.codexpp = `nav-${label.toLowerCase()}`;
  btn.setAttribute("aria-label", label);
  btn.className =
    "focus-visible:outline-token-border relative px-row-x py-row-y cursor-interaction shrink-0 items-center overflow-hidden rounded-lg text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 gap-2 flex w-full hover:bg-token-list-hover-background font-normal";

  const inner = document.createElement("div");
  inner.className =
    "flex min-w-0 items-center text-base gap-2 flex-1 text-token-foreground";
  inner.innerHTML = `${iconSvg}<span class="truncate">${label}</span>`;
  btn.appendChild(inner);
  return btn;
}

function appendSidebarStoreUpdateBadge(btn: HTMLButtonElement): void {
  const inner = btn.firstElementChild as HTMLElement | null;
  if (!inner) return;
  const badge = document.createElement("span");
  badge.dataset.codexppStoreUpdateBadge = "true";
  badge.hidden = true;
  badge.title = "已安装插件有审核通过的更新";
  badge.className = "inline-flex shrink-0 items-center justify-center";
  Object.assign(badge.style, {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: "1",
  });
  applyStoreUpdateBadgeStyle(badge, null);
  btn.appendChild(badge);
}

function setNavActive(active: ActivePage | null): void {
  // Built-in (Config/Tweaks) buttons.
  if (state.navButtons) {
    const builtin: BuiltinPage | null =
      active?.kind === "config" ? "config" :
      active?.kind === "tweaks" ? "tweaks" :
      active?.kind === "store" ? "store" :
      active?.kind === "agent-providers" ? "agent-providers" : null;
    for (const [key, btn] of Object.entries(state.navButtons) as [BuiltinPage, HTMLButtonElement][]) {
      applyNavActive(btn, key === builtin);
    }
  }
  // Per-page registered buttons.
  for (const p of state.pages.values()) {
    if (!p.navButton) continue;
    const isActive = active?.kind === "registered" && active.id === p.id;
    applyNavActive(p.navButton, isActive);
  }
  // Codex's own sidebar buttons (General, Appearance, etc). When one of
  // our pages is active, Codex still has aria-current="page" and the
  // active-bg class on whichever item it considered the route — typically
  // General. That makes both buttons look selected. Strip Codex's active
  // styling while one of ours is active; restore it when none is.
  syncCodexNativeNavActive(active !== null);
}

/**
 * Mute Codex's own active-state styling on its sidebar buttons. We don't
 * touch Codex's React state — when the user clicks a native item, Codex
 * re-renders the buttons and re-applies its own correct state, then our
 * sidebar-click listener fires `restoreCodexView` (which calls back into
 * `setNavActive(null)` and lets Codex's styling stand).
 *
 * `mute=true`  → strip aria-current and swap active bg → hover bg
 * `mute=false` → no-op (Codex's own re-render already restored things)
 */
function syncCodexNativeNavActive(mute: boolean): void {
  if (!mute) return;
  const root = state.sidebarRoot;
  if (!root) return;
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("button"));
  for (const btn of buttons) {
    // Skip our own buttons.
    if (btn.dataset.codexpp) continue;
    if (btn.getAttribute("aria-current") === "page") {
      btn.removeAttribute("aria-current");
    }
    if (btn.classList.contains("bg-token-list-hover-background")) {
      btn.classList.remove("bg-token-list-hover-background");
      btn.classList.add("hover:bg-token-list-hover-background");
    }
  }
}

function applyNavActive(btn: HTMLButtonElement, active: boolean): void {
  const inner = btn.firstElementChild as HTMLElement | null;
  if (active) {
      btn.classList.remove("hover:bg-token-list-hover-background", "font-normal");
      btn.classList.add("bg-token-list-hover-background");
      btn.setAttribute("aria-current", "page");
      if (inner) {
        inner.classList.remove("text-token-foreground");
        inner.classList.add("text-token-list-active-selection-foreground");
        inner
          .querySelector("svg")
          ?.classList.add("text-token-list-active-selection-icon-foreground");
      }
    } else {
      btn.classList.add("hover:bg-token-list-hover-background", "font-normal");
      btn.classList.remove("bg-token-list-hover-background");
      btn.removeAttribute("aria-current");
      if (inner) {
        inner.classList.add("text-token-foreground");
        inner.classList.remove("text-token-list-active-selection-foreground");
        inner
          .querySelector("svg")
          ?.classList.remove("text-token-list-active-selection-icon-foreground");
      }
    }
}

// ─────────────────────────────────────────────────────────── activation ──

function activatePage(page: ActivePage): void {
  const content = findContentArea();
  if (!content) {
    plog("activate: content area not found");
    return;
  }
  state.activePage = page;
  plog("activate", { page });

  // Hide Codex's content children, show ours.
  for (const child of Array.from(content.children) as HTMLElement[]) {
    if (child.dataset.codexpp === "tweaks-panel") continue;
    if (child.dataset.codexppHidden === undefined) {
      child.dataset.codexppHidden = child.style.display || "";
    }
    child.style.display = "none";
  }
  let panel = content.querySelector<HTMLElement>('[data-codexpp="tweaks-panel"]');
  if (!panel) {
    panel = document.createElement("div");
    panel.dataset.codexpp = "tweaks-panel";
    panel.style.cssText = "width:100%;height:100%;overflow:auto;";
    content.appendChild(panel);
  }
  panel.style.display = "block";
  state.panelHost = panel;
  rerender();
  setNavActive(page);
  // restore Codex's view. Re-register if needed.
  const sidebar = state.sidebarRoot;
  if (sidebar) {
    if (state.sidebarRestoreHandler) {
      sidebar.removeEventListener("click", state.sidebarRestoreHandler, true);
    }
    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (state.navGroup?.contains(target)) return; // our buttons
      if (state.pagesGroup?.contains(target)) return; // our page buttons
      if (target.closest("[data-codexpp-settings-search]")) return;
      restoreCodexView();
    };
    state.sidebarRestoreHandler = handler;
    sidebar.addEventListener("click", handler, true);
  }
}

function restoreCodexView(): void {
  plog("restore codex view");
  const content = findContentArea();
  if (!content) return;
  if (state.panelHost) state.panelHost.style.display = "none";
  for (const child of Array.from(content.children) as HTMLElement[]) {
    if (child === state.panelHost) continue;
    if (child.dataset.codexppHidden !== undefined) {
      child.style.display = child.dataset.codexppHidden;
      delete child.dataset.codexppHidden;
    }
  }
  state.activePage = null;
  setNavActive(null);
  if (state.sidebarRoot && state.sidebarRestoreHandler) {
    state.sidebarRoot.removeEventListener(
      "click",
      state.sidebarRestoreHandler,
      true,
    );
    state.sidebarRestoreHandler = null;
  }
}

function rerender(): void {
  if (!state.activePage) return;
  const host = state.panelHost;
  if (!host) return;
  host.innerHTML = "";

  const ap = state.activePage;
  if (ap.kind === "registered") {
    const entry = state.pages.get(ap.id);
    if (!entry) {
      restoreCodexView();
      return;
    }
    const root = panelShell(entry.page.title, entry.page.description);
    host.appendChild(root.outer);
    try {
      // Tear down any prior render before re-rendering (hot reload).
      try { entry.teardown?.(); } catch {}
      entry.teardown = null;
      const ret = entry.page.render(root.sectionsWrap);
      if (typeof ret === "function") entry.teardown = ret;
    } catch (e) {
      const err = document.createElement("div");
      err.className = "text-token-charts-red text-sm";
      err.textContent = `渲染页面出错：${(e as Error).message}`;
      root.sectionsWrap.appendChild(err);
    }
    return;
  }

  if (ap.kind === "agent-providers") {
    const root = panelShell("模型接入", "默认使用 Codex / OpenAI 原生模型，也可以切换到第三方模型服务。");
    host.appendChild(root.outer);
    renderAgentProvidersPage(root.sectionsWrap, root.subtitle);
    return;
  }

  const title =
    ap.kind === "tweaks" ? "插件" :
    ap.kind === "store" ? "插件商店" : "codex汉化增强plus版";
  const subtitle =
    ap.kind === "tweaks"
      ? "管理已安装的 codex汉化增强plus版 插件。"
      : ap.kind === "store"
        ? "安装已审核、并固定到指定 GitHub commit 的插件。"
        : "正在检查已安装的 codex汉化增强plus版 版本。";
  const root = panelShell(title, subtitle);
  host.appendChild(root.outer);
  if (ap.kind === "tweaks") renderTweaksPage(root.sectionsWrap);
  else if (ap.kind === "store") renderTweakStorePage(root.sectionsWrap, root.headerActions);
  else renderConfigPage(root.sectionsWrap, root.subtitle);
}

// ───────────────────────────────────────────────────────────── pages ──

function renderConfigPage(
  sectionsWrap: HTMLElement,
  subtitle?: HTMLElement,
): void {
  const section = document.createElement("section");
  section.className = "flex flex-col gap-2";
  section.appendChild(sectionTitle("codex汉化增强plus版 更新"));
  const card = roundedCard();
  card.dataset.codexppConfigCard = "true";
  const loading = rowSimple("正在加载更新设置", "正在检查当前 codex汉化增强plus版 配置。");
  card.appendChild(loading);
  section.appendChild(card);
  sectionsWrap.appendChild(section);

  void ipcRenderer
    .invoke("codexpp:get-config")
    .then((config) => {
      if (subtitle) {
        subtitle.textContent = `已安装 codex汉化增强plus版 ${(config as CodexPlusPlusConfig).version}。`;
      }
      card.textContent = "";
      renderCodexPlusPlusConfig(card, config as CodexPlusPlusConfig);
    })
    .catch((e) => {
      if (subtitle) subtitle.textContent = "无法加载已安装的 codex汉化增强plus版 版本。";
      card.textContent = "";
      card.appendChild(rowSimple("无法加载更新设置", String(e)));
    });

  const watcher = document.createElement("section");
  watcher.className = "flex flex-col gap-2";
  watcher.appendChild(sectionTitle("后台修复服务"));
  const watcherCard = roundedCard();
  watcherCard.appendChild(rowSimple("正在检查后台服务", "正在验证更新器修复服务。"));
  watcher.appendChild(watcherCard);
  sectionsWrap.appendChild(watcher);
  renderWatcherHealthCard(watcherCard);

  const maintenance = document.createElement("section");
  maintenance.className = "flex flex-col gap-2";
  maintenance.appendChild(sectionTitle("维护"));
  const maintenanceCard = roundedCard();
  maintenanceCard.appendChild(uninstallRow());
  maintenanceCard.appendChild(reportBugRow());
  maintenance.appendChild(maintenanceCard);
  sectionsWrap.appendChild(maintenance);
}

const AGENT_PROVIDER_SELECTION_KEY = "codexpp:agent-provider-selection";

function renderAgentProvidersPage(
  sectionsWrap: HTMLElement,
  subtitle?: HTMLElement,
): void {
  const pickerSection = document.createElement("section");
  pickerSection.className = "flex flex-col gap-2";
  pickerSection.appendChild(sectionTitle("接入方式"));
  const pickerCard = roundedCard();
  const picker = agentSelect("codex-native", [
    ["codex-native", "Codex / OpenAI 原生模型"],
    ...AGENT_PROVIDERS.map((provider) => [provider.id, provider.label] as [string, string]),
  ]);
  picker.disabled = true;
  pickerCard.appendChild(
    agentControlRow(
      "当前模型来源",
      "默认沿用 Codex 自带模型；选择第三方后在下方配置 API Key 和模型。",
      picker,
    ),
  );
  pickerSection.appendChild(pickerCard);
  sectionsWrap.appendChild(pickerSection);

  const providerContent = document.createElement("div");
  providerContent.className = "flex flex-col gap-[var(--padding-panel)]";
  sectionsWrap.appendChild(providerContent);
  providerContent.appendChild(rowSimple("正在读取当前模型来源", "正在从主进程读取真实接管状态。"));

  const renderSelected = (
    selection: AgentProviderSelection,
    options: { syncSelection?: boolean; promptXiaobaiRegistration?: boolean } = {},
  ): void => {
    providerContent.textContent = "";
    writeAgentProviderSelection(selection);
    if (options.syncSelection) {
      void ipcRenderer.invoke("codexpp:set-active-agent-provider", selection)
        .then(() => refreshComposerModelSourceLabel())
        .catch(() => undefined);
    }
    if (selection === "codex-native") {
      if (subtitle) subtitle.textContent = "使用 Codex 当前的 OpenAI 原生模型配置，不需要额外填写服务商信息。";
      renderCodexNativeProvider(providerContent);
      return;
    }
    const meta = agentProviderMeta(selection);
    if (subtitle) subtitle.textContent = meta.description;
    renderAgentProviderPage(providerContent, selection, subtitle, {
      promptXiaobaiRegistration: options.promptXiaobaiRegistration === true,
    });
  };

  picker.addEventListener("change", (event) => {
    if (!event.isTrusted) return;
    renderSelected(asAgentProviderSelection(picker.value), {
      syncSelection: true,
      promptXiaobaiRegistration: true,
    });
  });
  void ipcRenderer.invoke("codexpp:get-active-agent-provider")
    .then((active) => {
      const next = asAgentProviderSelection(active);
      picker.value = next;
      renderSelected(next);
    })
    .catch((e) => {
      providerContent.textContent = "";
      providerContent.appendChild(rowSimple("无法读取当前模型来源", formatAgentProviderCaughtError(e)));
    })
    .finally(() => {
      picker.disabled = false;
    });
}

function renderCodexNativeProvider(sectionsWrap: HTMLElement): void {
  const section = document.createElement("section");
  section.className = "flex flex-col gap-2";
  section.appendChild(sectionTitle("Codex 原生模型"));
  const card = roundedCard();
  card.appendChild(
    rowSimple(
      "使用 Codex / OpenAI 原生模型",
      "当前会继续使用 Codex 自身的模型选择和鉴权配置；第三方接入不会覆盖它。",
    ),
  );
  section.appendChild(card);
  sectionsWrap.appendChild(section);
}

function readAgentProviderSelection(): AgentProviderSelection {
  return asAgentProviderSelection(localStorage.getItem(AGENT_PROVIDER_SELECTION_KEY));
}

function writeAgentProviderSelection(selection: AgentProviderSelection): void {
  localStorage.setItem(AGENT_PROVIDER_SELECTION_KEY, selection);
}

function asAgentProviderSelection(value: unknown): AgentProviderSelection {
  if (value === "deepseek" || value === "zhipu" || value === "qwen") return value;
  return "codex-native";
}

function renderAgentProviderPage(
  sectionsWrap: HTMLElement,
  providerId: AgentProviderId,
  subtitle?: HTMLElement,
  options: { promptXiaobaiRegistration?: boolean } = {},
): void {
  const meta = agentProviderMeta(providerId);

  const settings = document.createElement("section");
  settings.className = "flex flex-col gap-2";
  settings.appendChild(sectionTitle("连接设置"));
  const settingsCard = roundedCard();
  settingsCard.appendChild(rowSimple("正在加载连接设置", "正在读取本机保存的接入配置。"));
  settings.appendChild(settingsCard);
  sectionsWrap.appendChild(settings);

  void ipcRenderer
    .invoke("codexpp:get-agent-provider-config", providerId)
    .then((config) => {
      if (subtitle) subtitle.textContent = meta.description;
      settingsCard.textContent = "";
      const viewConfig = config as AgentProviderConfigView;
      renderAgentProviderConfig(settingsCard, providerId, viewConfig);
      if (options.promptXiaobaiRegistration) {
        maybePromptXiaobaiRegistration(providerId, viewConfig);
      }
    })
    .catch((e) => {
      if (subtitle) subtitle.textContent = `无法加载 ${meta.label} 配置。`;
      settingsCard.textContent = "";
      settingsCard.appendChild(rowSimple("无法加载连接设置", String(e)));
    });
}

function renderAgentProviderConfig(
  settingsCard: HTMLElement,
  providerId: AgentProviderId,
  config: AgentProviderConfigView,
): void {
  const meta = agentProviderMeta(providerId);
  let enabled = config.enabled;
  const apiKeyInput = agentTextInput(config.apiKey, "sk-...", "password");
  const apiKeyControl = apiKeyInputWithXiaobaiAssist(apiKeyInput, providerId);
  const baseUrlInput = agentTextInput(config.baseUrl, agentBaseUrlPlaceholder(providerId, config.mode));
  const modelSelect = agentModelSelect(config.model);
  const modelStatus = document.createElement("div");
  modelStatus.className = "min-h-5 text-xs text-token-text-secondary";
  const refreshModelsButton = compactButton("刷新模型", () => {
    void refreshModels();
  });
  const appIdInput = agentTextInput(config.appId, "app-...");
  const sessionIdInput = agentTextInput(config.sessionId, "可选，用于连续对话");
  const systemPromptInput = agentTextarea(config.systemPrompt, "可选，例如：你是一个严谨的代码助手。", 3);
  const temperatureInput = agentNumberInput(config.temperature, "0.7", "0", "2", "0.1");
  const maxTokensInput = agentNumberInput(config.maxTokens, "2048", "1", "384000", "1");
  const modeSelect = agentSelect(config.mode, [
    ["app", "百炼智能体应用"],
    ["chat", "千问模型（OpenAI 兼容）"],
  ]);
  const accessModeSelect = agentSelect(config.accessMode ?? "bridge", [
    ["bridge", "桥接模式（保留 Codex 登录）"],
    ["pure-api", "纯 API 模式（不依赖官方登录）"],
  ]);
  let savedStatus: HTMLElement | null = null;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let lastAutoTestFingerprint = "";
  let lastTrustedUserEditAt = 0;

  const markTrustedUserEdit = (event?: Event): void => {
    if (event && !event.isTrusted) return;
    lastTrustedUserEditAt = Date.now();
  };

  modeSelect.addEventListener("change", (event) => {
    markTrustedUserEdit(event);
    if (providerId !== "qwen") return;
    const appBase = agentBaseUrlPlaceholder("qwen", "app");
    const chatBase = agentBaseUrlPlaceholder("qwen", "chat");
    const current = baseUrlInput.value.trim();
    if (!current || current === appBase || current === chatBase) {
      baseUrlInput.value = modeSelect.value === "chat" ? chatBase : appBase;
    }
    syncModelSelectState();
    scheduleAutoSave({ refreshModels: true, autoTest: true });
  });

  const collect = (): Partial<AgentProviderConfigView> => ({
    provider: providerId,
    enabled,
    apiKey: apiKeyInput.value.trim(),
    baseUrl: baseUrlInput.value.trim(),
    model: modelSelect.value,
    appId: appIdInput.value.trim(),
    mode: modeSelect.value === "chat" ? "chat" : "app",
    accessMode: accessModeSelect.value === "pure-api" ? "pure-api" : "bridge",
    systemPrompt: systemPromptInput.value.trim(),
    temperature: clampNumber(Number(temperatureInput.value), 0, 2, config.temperature),
    maxTokens: Math.round(clampNumber(Number(maxTokensInput.value), 1, 384000, config.maxTokens)),
    sessionId: sessionIdInput.value.trim(),
  });

  const refreshModels = async (options: { autoTest?: boolean } = {}): Promise<void> => {
    if (!shouldUseModelSelect(providerId, modeSelect.value)) {
      setAgentModelOptions(modelSelect, [], "");
      modelSelect.disabled = true;
      modelStatus.className = "min-h-5 text-xs text-token-text-secondary";
      modelStatus.textContent = "百炼智能体应用模式不需要选择模型。";
      if (options.autoTest) void maybeAutoTest();
      return;
    }
    if (!apiKeyInput.value.trim()) {
      setAgentModelOptions(modelSelect, [], "");
      modelSelect.disabled = true;
      modelStatus.className = "min-h-5 text-xs text-token-text-secondary";
      modelStatus.textContent = "填写 API Key 后会自动读取模型列表。";
      return;
    }
    refreshModelsButton.disabled = true;
    modelSelect.disabled = true;
    modelStatus.className = "min-h-5 text-xs text-token-text-secondary";
    modelStatus.textContent = "正在请求模型列表。";
    try {
      const result = await ipcRenderer.invoke(
        "codexpp:list-agent-provider-models",
        providerId,
        collect(),
      ) as AgentProviderModelsView;
      if (result.disabledReason) {
        setAgentModelOptions(modelSelect, [], "");
        modelSelect.disabled = true;
        modelStatus.textContent = result.disabledReason;
        if (options.autoTest) void maybeAutoTest();
        return;
      }
      setAgentModelOptions(modelSelect, result.models, modelSelect.value || config.model);
      modelSelect.disabled = result.models.length === 0;
      modelStatus.className = result.models.length > 0
        ? "min-h-5 text-xs text-token-charts-green"
        : "min-h-5 text-xs text-token-charts-red";
      modelStatus.textContent = result.models.length > 0
        ? `已加载 ${result.models.length} 个模型。`
        : "服务商没有返回可选模型。";
      if (options.autoTest) {
        if (result.models.length > 0) void maybeAutoTest();
        else showAgentProviderTestDialog("测试失败", "服务商没有返回可选模型，暂时无法发送测试请求。请确认 API Key 权限、账号地域和 Base URL 是否匹配。", "error");
      }
    } catch (e) {
      setAgentModelOptions(modelSelect, [], "");
      modelSelect.disabled = true;
      modelStatus.className = "min-h-5 text-xs text-token-charts-red";
      modelStatus.textContent = firstLine(formatAgentProviderCaughtError(e));
      if (options.autoTest && isCompleteAgentApiKey(apiKeyInput.value)) {
        showAgentProviderTestDialog("测试失败", `无法读取模型列表。\n\n${formatAgentProviderCaughtError(e)}`, "error");
      }
    } finally {
      refreshModelsButton.disabled = false;
    }
  };

  const syncModelSelectState = (): void => {
    refreshModelsButton.disabled = !shouldUseModelSelect(providerId, modeSelect.value);
    if (!shouldUseModelSelect(providerId, modeSelect.value)) {
      setAgentModelOptions(modelSelect, [], "");
      modelSelect.disabled = true;
      modelStatus.className = "min-h-5 text-xs text-token-text-secondary";
      modelStatus.textContent = "百炼智能体应用模式不需要选择模型。";
    }
  };

  const saveConfig = async (options: { quiet?: boolean; status?: string } = {}): Promise<AgentProviderConfigView> => {
    if (savedStatus && !options.quiet) {
      savedStatus.className = "min-h-5 text-sm text-token-text-secondary";
      savedStatus.textContent = options.status ?? "正在自动保存。";
    }
    const saved = await ipcRenderer.invoke(
      "codexpp:set-agent-provider-config",
      providerId,
      collect(),
    ) as AgentProviderConfigView;
    if (savedStatus && !options.quiet) {
      savedStatus.className = "min-h-5 text-sm text-token-charts-green";
      savedStatus.textContent = "已自动保存。";
    }
    refreshComposerModelSourceLabel();
    return saved;
  };

  const maybeAutoTest = async (): Promise<void> => {
    const current = collect();
    if (!isAgentProviderReadyForAutoTest(providerId, current)) return;
    const apiKey = current.apiKey ?? "";
    const fingerprint = JSON.stringify({
      providerId,
      enabled: current.enabled,
      mode: current.mode,
      accessMode: current.accessMode,
      baseUrl: current.baseUrl,
      model: current.model,
      appId: current.appId,
      apiKey: `${apiKey.length}:${apiKey.slice(-8)}`,
    });
    if (fingerprint === lastAutoTestFingerprint) return;
    lastAutoTestFingerprint = fingerprint;

    showAgentProviderTestDialog("正在测试接入", "已检测到完整 API Key，正在向服务商发送一次测试请求。", "pending");
    try {
      await saveConfig({ quiet: true });
      const result = await ipcRenderer.invoke(
        "codexpp:test-agent-provider",
        providerId,
        { prompt: DEFAULT_AGENT_TEST_PROMPT, config: current },
      ) as AgentProviderTestResult;
      if (result.sessionId) sessionIdInput.value = result.sessionId;
      const shouldAutoActivate = Date.now() - lastTrustedUserEditAt < 120_000;
      const activation = shouldAutoActivate
        ? await ipcRenderer.invoke(
            "codexpp:activate-agent-provider",
            providerId,
            current,
          ) as AgentProviderActivationView
        : null;
      if (activation) refreshComposerModelSourceLabel();
      showAgentProviderTestDialog(
        "测试成功",
        activation
          ? `${formatAgentProviderTestResult(result)}\n\n主界面接管：${activation.message}\n桥接地址：${activation.bridgeUrl ?? "Codex 原生"}\n配置文件：${activation.configPath}`
          : `${formatAgentProviderTestResult(result)}\n\n主界面接管：未自动切换。该测试不是本次手动输入触发，已避免旧页面状态覆盖当前 Codex 原生模型。`,
        "success",
      );
    } catch (e) {
      showAgentProviderTestDialog("测试失败", formatAgentProviderCaughtError(e), "error");
    }
  };

  const scheduleAutoSave = (options: { refreshModels?: boolean; autoTest?: boolean } = {}): void => {
    if (saveTimer) clearTimeout(saveTimer);
    if (savedStatus) {
      savedStatus.className = "min-h-5 text-sm text-token-text-secondary";
      savedStatus.textContent = "正在等待输入完成后自动保存。";
    }
    saveTimer = setTimeout(() => {
      saveTimer = null;
      void saveConfig()
        .then(() => {
          if (options.refreshModels) return refreshModels({ autoTest: options.autoTest });
          if (options.autoTest) return maybeAutoTest();
          return undefined;
        })
        .catch((e) => {
          if (!savedStatus) return;
          savedStatus.className = "min-h-5 text-sm text-token-charts-red";
          savedStatus.textContent = firstLine(formatAgentProviderCaughtError(e));
        });
    }, 700);
  };

  const bindAutoSave = (
    el: HTMLElement,
    event: "input" | "change",
    options?: { refreshModels?: boolean; autoTest?: boolean },
  ): void => {
    el.addEventListener(event, (domEvent) => {
      markTrustedUserEdit(domEvent);
      scheduleAutoSave(options);
    });
  };

  settingsCard.appendChild(
    agentControlRow(
      "启用入口",
      "关闭后保留配置，但测试请求会被阻止。",
      switchControl(enabled, async (next) => {
        enabled = next;
        await saveConfig({ quiet: true });
      }),
    ),
  );
  settingsCard.appendChild(
    agentControlRow(
      "认证模式",
      "桥接模式保留 Codex 官方登录态；纯 API 模式把 API Key 写入桌面 Codex 隔离 auth.json。",
      accessModeSelect,
    ),
  );
  settingsCard.appendChild(agentControlRow("API Key", "保存在本机 codex汉化增强plus版 配置中。", apiKeyControl));
  if (providerId === "qwen") {
    settingsCard.appendChild(agentControlRow("调用方式", "智能体应用使用 APP_ID；千问模型使用 OpenAI 兼容接口。", modeSelect));
  }
  const modelControl = agentStackControl(
    modelSelect,
    agentInlineActions([refreshModelsButton, modelStatus]),
  );
  if (providerId === "qwen") {
    settingsCard.appendChild(agentControlRow("应用 ID", "百炼智能体应用模式必填。", appIdInput));
    settingsCard.appendChild(agentControlRow("会话 ID", "可选；百炼应用会返回 session_id，可用于下一轮对话。", sessionIdInput));
    settingsCard.appendChild(agentControlRow("模型", "从服务商接口读取；百炼智能体应用模式会忽略。", modelControl, "start"));
  } else {
    settingsCard.appendChild(agentControlRow("模型", "通过服务商模型列表接口读取，不支持手动填写。", modelControl, "start"));
  }

  const advanced = agentDetails("高级配置", "Base URL、系统提示词、采样和输出长度默认折叠。");
  advanced.body.appendChild(agentControlRow("Base URL", agentBaseUrlDescription(providerId), baseUrlInput));
  advanced.body.appendChild(agentControlRow("系统提示词", "可选；用于 Chat Completions 模式。", systemPromptInput, "start"));
  advanced.body.appendChild(
    agentControlRow(
      "采样与长度",
      "temperature 控制发散程度；最大输出限制本次回答长度。",
      agentInlineControls([
        ["temperature", temperatureInput],
        ["max tokens", maxTokensInput],
      ]),
    ),
  );
  const docsRow = actionRow("文档", "打开服务商接口文档或 API Key 页面。");
  const docsActions = docsRow.querySelector<HTMLElement>("[data-codexpp-row-actions]");
  docsActions?.appendChild(
    compactButton("打开文档", () => {
      void ipcRenderer.invoke("codexpp:open-external", meta.docsUrl);
    }),
  );
  if (meta.keyUrl) {
    docsActions?.appendChild(
      compactButton("申请 API Key", () => {
        void ipcRenderer.invoke("codexpp:open-external", meta.keyUrl);
      }),
    );
  }
  advanced.body.appendChild(docsRow);
  settingsCard.appendChild(advanced.outer);

  const statusRow = document.createElement("div");
  statusRow.className = "p-3";
  savedStatus = document.createElement("div");
  savedStatus.className = "min-h-5 text-sm text-token-text-secondary";
  savedStatus.textContent = config.apiKey ? "已加载本机配置，输入后会自动保存。" : "尚未填写 API Key。";
  statusRow.appendChild(savedStatus);
  settingsCard.appendChild(statusRow);

  bindAutoSave(apiKeyInput, "input", { refreshModels: true, autoTest: true });
  bindAutoSave(accessModeSelect, "change", { autoTest: true });
  bindAutoSave(baseUrlInput, "input", { refreshModels: true, autoTest: true });
  bindAutoSave(modelSelect, "change", { autoTest: true });
  bindAutoSave(appIdInput, "input", { autoTest: true });
  bindAutoSave(sessionIdInput, "input");
  bindAutoSave(systemPromptInput, "input");
  bindAutoSave(temperatureInput, "input");
  bindAutoSave(maxTokensInput, "input");

  syncModelSelectState();
  void refreshModels();
}

function formatAgentProviderTestResult(result: AgentProviderTestResult): string {
  const lines = [result.text.trim() || "(空响应)"];
  const meta: string[] = [];
  if (result.model) meta.push(`model: ${result.model}`);
  if (result.sessionId) meta.push(`session_id: ${result.sessionId}`);
  if (result.usage) meta.push(`usage: ${JSON.stringify(result.usage)}`);
  if (meta.length > 0) lines.push("", meta.join("\n"));
  return lines.join("\n");
}

function formatAgentProviderCaughtError(e: unknown): string {
  const raw = String((e as Error).message ?? e);
  return raw
    .replace(/^Error invoking remote method '[^']+':\s*/i, "")
    .replace(/^Error:\s*/i, "")
    .trim() || "服务商返回了未知错误。";
}

function firstLine(text: string): string {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.find((line) => line.startsWith("原因：")) ?? lines[0] ?? text;
}

function isAgentProviderReadyForAutoTest(
  providerId: AgentProviderId,
  config: Partial<AgentProviderConfigView>,
): boolean {
  if (!config.enabled) return false;
  if (!isCompleteAgentApiKey(config.apiKey ?? "")) return false;
  if (!config.baseUrl?.trim()) return false;
  if (providerId === "qwen" && config.mode === "app") return Boolean(config.appId?.trim());
  return Boolean(config.model?.trim());
}

function isCompleteAgentApiKey(value: string): boolean {
  const key = value.trim();
  return key.length >= 24 && !/\s/.test(key);
}

function shouldPromptXiaobaiRegistration(providerId: AgentProviderId, config: AgentProviderConfigView): boolean {
  return providerId !== "zhipu" && !config.apiKey?.trim();
}

function maybePromptXiaobaiRegistration(providerId: AgentProviderId, config: AgentProviderConfigView): void {
  if (!shouldPromptXiaobaiRegistration(providerId, config)) return;
  const label = agentProviderMeta(providerId).label;
  const accepted = window.confirm(
    `${label} 尚未填写 API Key。\n\n是否启用小白AI辅助自动注册 API？`,
  );
  if (!accepted) return;
  void openXiaobaiAiToolboxForApiRegistration(providerId);
}

function apiKeyInputWithXiaobaiAssist(input: HTMLInputElement, providerId: AgentProviderId): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "flex w-full min-w-0 items-center gap-2";
  input.classList.add("min-w-0", "flex-1");
  const button = compactButton("小白AI辅助申请", () => {
    void openXiaobaiAiToolboxForApiRegistration(providerId);
  });
  button.classList.add("shrink-0");
  button.title = "打开小白AI工具箱，辅助申请并注册 API Key";
  wrap.appendChild(input);
  wrap.appendChild(button);
  return wrap;
}

async function openXiaobaiAiToolboxForApiRegistration(providerId: AgentProviderId): Promise<void> {
  try {
    await ipcRenderer.invoke("codexpp:open-xiaobai-toolbox", {
      provider: providerId,
      purpose: "api-registration",
    });
  } catch (e) {
    showAgentProviderTestDialog(
      "无法打开小白AI工具箱",
      formatAgentProviderCaughtError(e),
      "error",
    );
  }
}

function showAgentProviderTestDialog(
  titleText: string,
  bodyText: string,
  tone: "pending" | "success" | "error",
): void {
  const existing = document.querySelector<HTMLElement>("[data-codexpp-agent-test-dialog]");
  existing?.remove();

  const overlay = document.createElement("div");
  overlay.dataset.codexppAgentTestDialog = "true";
  overlay.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  const dialog = document.createElement("div");
  dialog.className =
    "flex w-full max-w-xl flex-col gap-4 rounded-lg border border-token-border bg-token-main-surface-primary p-4 shadow-xl";
  overlay.appendChild(dialog);

  const header = document.createElement("div");
  header.className = "flex items-start justify-between gap-3";
  const titleStack = document.createElement("div");
  titleStack.className = "flex min-w-0 flex-col gap-1";
  const title = document.createElement("div");
  title.className = "text-base font-medium text-token-text-primary";
  title.textContent = titleText;
  const status = document.createElement("div");
  status.className = tone === "success"
    ? "text-sm text-token-charts-green"
    : tone === "error"
      ? "text-sm text-token-charts-red"
      : "text-sm text-token-text-secondary";
  status.textContent = tone === "success" ? "接入可用" : tone === "error" ? "接入不可用" : "正在验证";
  titleStack.appendChild(title);
  titleStack.appendChild(status);
  header.appendChild(titleStack);
  const close = compactButton("关闭", () => overlay.remove());
  header.appendChild(close);
  dialog.appendChild(header);

  const body = document.createElement("pre");
  body.className =
    "max-h-80 whitespace-pre-wrap overflow-auto rounded-md border border-token-border bg-token-foreground/5 p-3 text-sm leading-5 text-token-text-primary";
  body.textContent = bodyText;
  dialog.appendChild(body);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
  close.focus();
}

function agentControlRow(
  titleText: string,
  description: string,
  control: HTMLElement,
  align: "center" | "start" = "center",
): HTMLElement {
  const row = document.createElement("div");
  row.className = `flex ${align === "start" ? "items-start" : "items-center"} justify-between gap-4 p-3`;
  const left = document.createElement("div");
  left.className = "flex min-w-0 flex-col gap-1";
  const title = document.createElement("div");
  title.className = "min-w-0 text-sm text-token-text-primary";
  title.textContent = titleText;
  const desc = document.createElement("div");
  desc.className = "text-token-text-secondary min-w-0 text-sm";
  desc.textContent = description;
  left.appendChild(title);
  left.appendChild(desc);
  const right = document.createElement("div");
  right.className = "flex w-full max-w-sm shrink-0 justify-end";
  right.appendChild(control);
  row.appendChild(left);
  row.appendChild(right);
  return row;
}

function agentDetails(title: string, description: string): { outer: HTMLElement; body: HTMLElement } {
  const outer = document.createElement("details");
  outer.className = "group";
  const summary = document.createElement("summary");
  summary.className =
    "flex cursor-pointer list-none items-center justify-between gap-4 p-3 text-sm text-token-text-primary";
  const left = document.createElement("div");
  left.className = "flex min-w-0 flex-col gap-1";
  const name = document.createElement("div");
  name.textContent = title;
  const desc = document.createElement("div");
  desc.className = "text-token-text-secondary min-w-0 text-sm";
  desc.textContent = description;
  left.appendChild(name);
  left.appendChild(desc);
  const marker = document.createElement("span");
  marker.className = "shrink-0 text-token-text-secondary";
  marker.textContent = "展开";
  summary.appendChild(left);
  summary.appendChild(marker);
  const body = document.createElement("div");
  body.className = "flex flex-col divide-y-[0.5px] divide-token-border border-t-[0.5px] border-token-border";
  outer.appendChild(summary);
  outer.appendChild(body);
  outer.addEventListener("toggle", () => {
    marker.textContent = outer.open ? "收起" : "展开";
  });
  return { outer, body };
}

function agentTextInput(value: string, placeholder: string, type = "text"): HTMLInputElement {
  const input = document.createElement("input");
  input.type = type;
  input.value = value;
  input.placeholder = placeholder;
  input.autocomplete = "off";
  input.spellcheck = false;
  input.className =
    "h-9 w-full rounded-lg border border-token-border bg-transparent px-3 text-sm text-token-text-primary focus:outline-none";
  return input;
}

function agentNumberInput(
  value: number,
  placeholder: string,
  min: string,
  max: string,
  step: string,
): HTMLInputElement {
  const input = agentTextInput(String(value), placeholder, "number");
  input.min = min;
  input.max = max;
  input.step = step;
  return input;
}

function agentTextarea(value: string, placeholder: string, rows: number): HTMLTextAreaElement {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.placeholder = placeholder;
  textarea.rows = rows;
  textarea.spellcheck = false;
  textarea.className =
    "w-full resize-y rounded-lg border border-token-border bg-transparent px-3 py-2 text-sm leading-5 text-token-text-primary focus:outline-none";
  return textarea;
}

function agentSelect(
  value: string,
  options: Array<[value: string, label: string]>,
): HTMLSelectElement {
  const select = document.createElement("select");
  select.className =
    "h-9 w-full rounded-lg border border-token-border bg-transparent px-2 text-sm text-token-text-primary focus:outline-none";
  for (const [optionValue, label] of options) {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = label;
    option.selected = value === optionValue;
    select.appendChild(option);
  }
  return select;
}

function agentModelSelect(selected: string): HTMLSelectElement {
  const select = agentSelect("", [["", "请刷新模型列表"]]);
  select.value = selected;
  select.disabled = true;
  return select;
}

function setAgentModelOptions(
  select: HTMLSelectElement,
  models: AgentProviderModelView[],
  preferred: string,
): void {
  const previous = select.value || preferred;
  select.textContent = "";
  if (models.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "无可选模型";
    select.appendChild(option);
    select.value = "";
    return;
  }
  for (const model of models) {
    const option = document.createElement("option");
    option.value = model.id;
    option.textContent = model.label && model.label !== model.id
      ? `${model.label} (${model.id})`
      : model.id;
    option.title = model.ownedBy ? `${model.id} · ${model.ownedBy}` : model.id;
    select.appendChild(option);
  }
  const ids = new Set(models.map((model) => model.id));
  select.value = ids.has(previous) ? previous : models[0]!.id;
}

function agentStackControl(primary: HTMLElement, secondary: HTMLElement): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "flex w-full flex-col gap-2";
  wrap.appendChild(primary);
  wrap.appendChild(secondary);
  return wrap;
}

function agentInlineActions(items: HTMLElement[]): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "flex min-w-0 items-center gap-2";
  for (const item of items) wrap.appendChild(item);
  return wrap;
}

function shouldUseModelSelect(providerId: AgentProviderId, mode: string): boolean {
  return providerId !== "qwen" || mode === "chat";
}

function agentInlineControls(items: Array<[label: string, input: HTMLInputElement]>): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "grid w-full grid-cols-2 gap-2";
  for (const [label, input] of items) {
    const box = document.createElement("label");
    box.className = "flex min-w-0 flex-col gap-1 text-xs text-token-text-secondary";
    const text = document.createElement("span");
    text.textContent = label;
    box.appendChild(text);
    box.appendChild(input);
    wrap.appendChild(box);
  }
  return wrap;
}

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function agentBaseUrlPlaceholder(providerId: AgentProviderId, mode: AgentProviderMode): string {
  if (providerId === "deepseek") return "https://api.deepseek.com";
  if (providerId === "zhipu") return "https://open.bigmodel.cn/api/paas/v4";
  return mode === "chat"
    ? "https://dashscope.aliyuncs.com/compatible-mode/v1"
    : "https://dashscope.aliyuncs.com/api/v1";
}

function agentBaseUrlDescription(providerId: AgentProviderId): string {
  if (providerId === "deepseek") return "默认追加 /chat/completions。";
  if (providerId === "zhipu") return "默认追加 /chat/completions，使用智谱 OpenAI 兼容接口。";
  return "百炼应用模式追加 /apps/APP_ID/completion；千问模型模式追加 /chat/completions。";
}

function renderCodexPlusPlusConfig(card: HTMLElement, config: CodexPlusPlusConfig): void {
  setSidebarCodexPlusPlusUpdateButton(config.updateCheck);
  card.appendChild(pluginEnabledRow(config));
  card.appendChild(autoUpdateRow(config));
  card.appendChild(updateChannelRow(config));
  card.appendChild(installationSourceRow(config.installationSource));
  card.appendChild(selfUpdateStatusRow(config.selfUpdate));
  card.appendChild(checkForUpdatesRow(config));
  if (config.updateCheck) card.appendChild(releaseNotesRow(config.updateCheck));
}

function pluginEnabledRow(config: CodexPlusPlusConfig): HTMLElement {
  const row = document.createElement("div");
  row.className = "flex items-center justify-between gap-4 p-3";
  const left = document.createElement("div");
  left.className = "flex min-w-0 flex-col gap-1";
  const title = document.createElement("div");
  title.className = "min-w-0 text-sm text-token-text-primary";
  title.textContent = "插件总开关";
  const desc = document.createElement("div");
  desc.className = "text-token-text-secondary min-w-0 text-sm";
  desc.textContent = "关闭后只保留设置页和开关监听，第三方模型桥、插件功能和后台自动修复都会暂停。";
  left.appendChild(title);
  left.appendChild(desc);
  row.appendChild(left);
  row.appendChild(
    switchControl(config.enabled, async (next) => {
      await ipcRenderer.invoke("codexpp:set-plugin-enabled", next);
      refreshConfigCard(row);
    }),
  );
  return row;
}

function autoUpdateRow(config: CodexPlusPlusConfig): HTMLElement {
  const row = document.createElement("div");
  row.className = "flex items-center justify-between gap-4 p-3";
  const left = document.createElement("div");
  left.className = "flex min-w-0 flex-col gap-1";
  const title = document.createElement("div");
  title.className = "min-w-0 text-sm text-token-text-primary";
  title.textContent = "自动刷新 codex汉化增强plus版";
  const desc = document.createElement("div");
  desc.className = "text-token-text-secondary min-w-0 text-sm";
  desc.textContent = `已安装版本 v${config.version}。后台服务会静默检查更新，并在 Codex 更新后自动恢复 codex汉化增强plus版 runtime。`;
  left.appendChild(title);
  left.appendChild(desc);
  row.appendChild(left);
  row.appendChild(
    switchControl(config.autoUpdate, async (next) => {
      await ipcRenderer.invoke("codexpp:set-auto-update", next);
    }),
  );
  return row;
}

function updateChannelRow(config: CodexPlusPlusConfig): HTMLElement {
  const row = actionRow("发布通道", updateChannelSummary(config));
  const action = row.querySelector<HTMLElement>("[data-codexpp-row-actions]");
  const select = document.createElement("select");
  select.className =
    "h-8 rounded-lg border border-token-border bg-transparent px-2 text-sm text-token-text-primary focus:outline-none";
  for (const [value, label] of [
    ["stable", "稳定版"],
    ["prerelease", "预发布版"],
    ["custom", "自定义"],
  ] as const) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = config.updateChannel === value;
    select.appendChild(option);
  }
  select.addEventListener("change", () => {
    void ipcRenderer
      .invoke("codexpp:set-update-config", { updateChannel: select.value })
      .then(() => refreshConfigCard(row))
      .catch((e) => plog("set update channel failed", String(e)));
  });
  action?.appendChild(select);
  if (config.updateChannel === "custom") {
    action?.appendChild(
      compactButton("编辑", () => {
        const repo = window.prompt("GitHub 仓库", config.updateRepo || "chengyou888/-");
        if (repo === null) return;
        const ref = window.prompt("Git 引用", config.updateRef || "main");
        if (ref === null) return;
        void ipcRenderer
          .invoke("codexpp:set-update-config", {
            updateChannel: "custom",
            updateRepo: repo,
            updateRef: ref,
          })
          .then(() => refreshConfigCard(row))
          .catch((e) => plog("set custom update source failed", String(e)));
      }),
    );
  }
  return row;
}

function installationSourceRow(source: InstallationSource): HTMLElement {
  return rowSimple("安装来源", localizeInstallationSource(source));
}

function selfUpdateStatusRow(state: SelfUpdateState | null): HTMLElement {
  const row = rowSimple("上次 codex汉化增强plus版 更新", selfUpdateSummary(state));
  const left = row.firstElementChild as HTMLElement | null;
  if (left && state) left.prepend(statusBadge(selfUpdateStatusTone(state.status), selfUpdateStatusLabel(state.status)));
  return row;
}

function checkForUpdatesRow(config: CodexPlusPlusConfig): HTMLElement {
  const check = config.updateCheck;
  const row = document.createElement("div");
  row.className = "flex items-center justify-between gap-4 p-3";
  const left = document.createElement("div");
  left.className = "flex min-w-0 flex-col gap-1";
  const title = document.createElement("div");
  title.className = "min-w-0 text-sm text-token-text-primary";
  title.textContent = check?.updateAvailable ? "codex汉化增强plus版 有可用更新" : "检查 codex汉化增强plus版 更新";
  const desc = document.createElement("div");
  desc.className = "text-token-text-secondary min-w-0 text-sm";
  desc.textContent = updateSummary(check);
  left.appendChild(title);
  left.appendChild(desc);
  row.appendChild(left);

  const actions = document.createElement("div");
  actions.className = "flex shrink-0 items-center gap-2";
  actions.appendChild(
    compactButton("立即检查", () => {
      row.style.opacity = "0.65";
      void ipcRenderer
        .invoke("codexpp:check-codexpp-update", true)
        .then((check) => {
          setSidebarCodexPlusPlusUpdateButton(check as CodexPlusPlusUpdateCheck);
          refreshConfigCard(row);
        })
        .catch((e) => plog("codex汉化增强plus版 release check failed", String(e)))
        .finally(() => {
          row.style.opacity = "";
        });
    }),
  );
  actions.appendChild(
    compactButton("下载更新", () => {
      row.style.opacity = "0.65";
      const buttons = actions.querySelectorAll("button");
      buttons.forEach((button) => (button.disabled = true));
      void ipcRenderer
        .invoke("codexpp:run-codexpp-update")
        .then(() => {
          refreshSidebarCodexPlusPlusUpdateButton(true);
          refreshConfigCard(row);
        })
        .catch((e) => {
          plog("codex汉化增强plus版 self-update failed", String(e));
          void refreshConfigCard(row);
        })
        .finally(() => {
          row.style.opacity = "";
          buttons.forEach((button) => (button.disabled = false));
        });
    }),
  );
  row.appendChild(actions);
  return row;
}

function releaseNotesRow(check: CodexPlusPlusUpdateCheck): HTMLElement {
  const row = document.createElement("div");
  row.className = "flex flex-col gap-2 p-3";
  const title = document.createElement("div");
  title.className = "text-sm text-token-text-primary";
  title.textContent = "最新发布说明";
  row.appendChild(title);
  const body = document.createElement("div");
  body.className =
    "max-h-60 overflow-auto rounded-md border border-token-border bg-token-foreground/5 p-3 text-sm text-token-text-secondary";
  body.appendChild(renderReleaseNotesMarkdown(localizeReleaseNotes(check.releaseNotes?.trim() || check.error || "")));
  row.appendChild(body);
  return row;
}

function renderReleaseNotesMarkdown(markdown: string): HTMLElement {
  const root = document.createElement("div");
  root.className = "flex flex-col gap-2";
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: HTMLOListElement | HTMLUListElement | null = null;
  let codeLines: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const p = document.createElement("p");
    p.className = "m-0 leading-5";
    appendInlineMarkdown(p, paragraph.join(" ").trim());
    root.appendChild(p);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    root.appendChild(list);
    list = null;
  };
  const flushCode = () => {
    if (!codeLines) return;
    const pre = document.createElement("pre");
    pre.className =
      "m-0 overflow-auto rounded-md border border-token-border bg-token-foreground/10 p-2 text-xs text-token-text-primary";
    const code = document.createElement("code");
    code.textContent = codeLines.join("\n");
    pre.appendChild(code);
    root.appendChild(pre);
    codeLines = null;
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (codeLines) flushCode();
      else {
        flushParagraph();
        flushList();
        codeLines = [];
      }
      continue;
    }
    if (codeLines) {
      codeLines.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      flushList();
      const h = document.createElement(heading[1].length === 1 ? "h3" : "h4");
      h.className = "m-0 text-sm font-medium text-token-text-primary";
      appendInlineMarkdown(h, heading[2]);
      root.appendChild(h);
      continue;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(trimmed);
    const ordered = /^\d+[.)]\s+(.+)$/.exec(trimmed);
    if (unordered || ordered) {
      flushParagraph();
      const wantOrdered = Boolean(ordered);
      if (!list || (wantOrdered && list.tagName !== "OL") || (!wantOrdered && list.tagName !== "UL")) {
        flushList();
        list = document.createElement(wantOrdered ? "ol" : "ul");
        list.className = wantOrdered
          ? "m-0 list-decimal space-y-1 pl-5 leading-5"
          : "m-0 list-disc space-y-1 pl-5 leading-5";
      }
      const li = document.createElement("li");
      appendInlineMarkdown(li, (unordered ?? ordered)?.[1] ?? "");
      list.appendChild(li);
      continue;
    }

    const quote = /^>\s?(.+)$/.exec(trimmed);
    if (quote) {
      flushParagraph();
      flushList();
      const blockquote = document.createElement("blockquote");
      blockquote.className = "m-0 border-l-2 border-token-border pl-3 leading-5";
      appendInlineMarkdown(blockquote, quote[1]);
      root.appendChild(blockquote);
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushCode();
  return root;
}

function appendInlineMarkdown(parent: HTMLElement, text: string): void {
  const pattern = /(`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index === undefined) continue;
    appendText(parent, text.slice(lastIndex, match.index));
    if (match[2] !== undefined) {
      const code = document.createElement("code");
      code.className =
        "rounded border border-token-border bg-token-foreground/10 px-1 py-0.5 text-xs text-token-text-primary";
      code.textContent = match[2];
      parent.appendChild(code);
    } else if (match[3] !== undefined && match[4] !== undefined) {
      const a = document.createElement("a");
      a.className = "text-token-text-primary underline underline-offset-2";
      a.href = match[4];
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = match[3];
      parent.appendChild(a);
    } else if (match[5] !== undefined) {
      const strong = document.createElement("strong");
      strong.className = "font-medium text-token-text-primary";
      strong.textContent = match[5];
      parent.appendChild(strong);
    } else if (match[6] !== undefined) {
      const em = document.createElement("em");
      em.textContent = match[6];
      parent.appendChild(em);
    }
    lastIndex = match.index + match[0].length;
  }
  appendText(parent, text.slice(lastIndex));
}

function appendText(parent: HTMLElement, text: string): void {
  if (text) parent.appendChild(document.createTextNode(text));
}

function renderWatcherHealthCard(card: HTMLElement): void {
  void ipcRenderer
    .invoke("codexpp:get-watcher-health")
    .then((health) => {
      card.textContent = "";
      renderWatcherHealth(card, health as WatcherHealth);
    })
    .catch((e) => {
      card.textContent = "";
      card.appendChild(rowSimple("无法检查后台服务", String(e)));
    });
}

function renderWatcherHealth(card: HTMLElement, health: WatcherHealth): void {
  card.appendChild(watcherSummaryRow(health));
  for (const check of health.checks) {
    if (check.status === "ok") continue;
    card.appendChild(watcherCheckRow(check));
  }
}

function watcherSummaryRow(health: WatcherHealth): HTMLElement {
  const row = document.createElement("div");
  row.className = "flex items-center justify-between gap-4 p-3";
  const left = document.createElement("div");
  left.className = "flex min-w-0 items-start gap-3";
  left.appendChild(statusBadge(health.status, health.watcher));
  const stack = document.createElement("div");
  stack.className = "flex min-w-0 flex-col gap-1";
  const title = document.createElement("div");
  title.className = "min-w-0 text-sm text-token-text-primary";
  title.textContent = localizeWatcherText(health.title);
  const desc = document.createElement("div");
  desc.className = "text-token-text-secondary min-w-0 text-sm";
  desc.textContent = `${localizeWatcherText(health.summary)} 检查时间：${new Date(health.checkedAt).toLocaleString()}。`;
  stack.appendChild(title);
  stack.appendChild(desc);
  left.appendChild(stack);
  row.appendChild(left);

  const action = document.createElement("div");
  action.className = "flex shrink-0 items-center gap-2";
  action.appendChild(
    compactButton("立即检查", () => {
      const card = row.parentElement;
      if (!card) return;
      card.textContent = "";
      card.appendChild(rowSimple("正在检查后台服务", "正在验证更新器修复服务。"));
      renderWatcherHealthCard(card);
    }),
  );
  row.appendChild(action);
  return row;
}

function watcherCheckRow(check: WatcherHealthCheck): HTMLElement {
  const row = rowSimple(localizeWatcherText(check.name), localizeWatcherText(check.detail));
  const left = row.firstElementChild as HTMLElement | null;
  if (left) left.prepend(statusBadge(check.status));
  return row;
}

function statusBadge(status: "ok" | "warn" | "error", label?: string): HTMLElement {
  const badge = document.createElement("span");
  const tone =
    status === "ok"
      ? "border-token-charts-green text-token-charts-green"
      : status === "warn"
        ? "border-token-charts-yellow text-token-charts-yellow"
        : "border-token-charts-red text-token-charts-red";
  badge.className = `inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`;
  badge.textContent = label ? localizeWatcherText(label) : (status === "ok" ? "正常" : status === "warn" ? "需检查" : "错误");
  return badge;
}

function localizeWatcherText(text: string): string {
  return text
    .replace(/^scheduled-task$/i, "计划任务")
    .replace(/^windows-service$/i, "Windows 服务")
    .replace(/^launchd$/i, "launchd")
    .replace(/^Auto-repair watcher needs review$/i, "后台修复服务需要检查")
    .replace(/^Auto-repair watcher is healthy$/i, "后台修复服务正常")
    .replace(/^Auto-repair watcher failed$/i, "后台修复服务失败")
    .replace(/(\d+) failing check\(s\), (\d+) warning\(s\)\./i, "$1 项检查失败，$2 项警告。")
    .replace(/^watcher task$/i, "后台任务")
    .replace(/^watcher log$/i, "服务日志")
    .replace(/^Plugin switch$/i, "插件总开关")
    .replace(/^Windows service$/i, "Windows 服务")
    .replace(/^service state$/i, "服务状态")
    .replace(/^legacy scheduled tasks$/i, "旧计划任务")
    .replace(/^disabled in codex-plusplus config$/i, "已在 codex汉化增强plus版 配置中关闭")
    .replace(/^skipped because plugin switch is off$/i, "插件总开关已关闭，已跳过")
    .replace(/^installed but not running$/i, "已安装但未运行")
    .replace(/^old watcher tasks still exist$/i, "仍有旧计划任务残留")
    .replace(/^removed$/i, "已移除")
    .replace(/^install state$/i, "安装状态")
    .replace(/^runtime$/i, "runtime")
    .replace(/^repair state$/i, "修复状态");
}

function updateSummary(check: CodexPlusPlusUpdateCheck | null): string {
  if (!check) return "尚未检查更新。";
  const latest = check.latestVersion ? `最新 v${check.latestVersion}。` : "";
  const checked = `检查时间：${new Date(check.checkedAt).toLocaleString()}。`;
  if (check.error) return `${latest}${checked} ${check.error}`;
  return `${latest}${checked}`;
}

function updateChannelSummary(config: CodexPlusPlusConfig): string {
  if (config.updateChannel === "custom") {
    return `${config.updateRepo || "chengyou888/-"} ${config.updateRef || "（未设置 ref）"}`;
  }
  if (config.updateChannel === "prerelease") {
    return "使用最新发布的 GitHub release，包括预发布版本。";
  }
  return "使用最新稳定版 GitHub release。";
}

function selfUpdateSummary(state: SelfUpdateState | null): string {
  if (!state) return "尚未运行过自动 codex汉化增强plus版 更新。";
  const checked = new Date(state.completedAt ?? state.checkedAt).toLocaleString();
  const target = state.latestVersion ? ` 目标 v${state.latestVersion}。` : state.targetRef ? ` 目标 ${state.targetRef}。` : "";
  const source = state.installationSource ? localizeInstallationSource(state.installationSource) : "未知来源";
  if (state.status === "failed") return `失败于 ${checked}。${target} ${state.error ?? "未知错误"}`;
  if (state.status === "updated") return `已更新于 ${checked}。${target} 来源：${source}。`;
  if (state.status === "up-to-date") return `已是最新 ${checked}。${target} 来源：${source}。`;
  if (state.status === "disabled") return `已跳过 ${checked}；自动刷新已关闭。`;
  return `正在检查更新。来源：${source}。`;
}

function selfUpdateStatusTone(status: SelfUpdateStatus): "ok" | "warn" | "error" {
  if (status === "failed") return "error";
  if (status === "disabled" || status === "checking") return "warn";
  return "ok";
}

function selfUpdateStatusLabel(status: SelfUpdateStatus): string {
  if (status === "up-to-date") return "最新";
  if (status === "updated") return "已更新";
  if (status === "failed") return "失败";
  if (status === "disabled") return "已关闭";
  return "检查中";
}

function refreshConfigCard(row: HTMLElement): void {
  const card = row.closest("[data-codexpp-config-card]") as HTMLElement | null;
  if (!card) return;
  card.textContent = "";
  card.appendChild(rowSimple("正在刷新", "正在加载当前 codex汉化增强plus版 更新状态。"));
  void ipcRenderer
    .invoke("codexpp:get-config")
    .then((config) => {
      card.textContent = "";
      renderCodexPlusPlusConfig(card, config as CodexPlusPlusConfig);
    })
    .catch((e) => {
      card.textContent = "";
      card.appendChild(rowSimple("无法刷新更新设置", String(e)));
    });
}

function uninstallRow(): HTMLElement {
  const row = actionRow(
    "卸载 codex汉化增强plus版",
    "复制卸载命令。完全退出 Codex 后，在终端中运行它。",
  );
  const action = row.querySelector<HTMLElement>("[data-codexpp-row-actions]");
  action?.appendChild(
    compactButton("复制命令", () => {
      void ipcRenderer
        .invoke("codexpp:copy-text", "node ~/.codex-plusplus/source/packages/installer/dist/cli.js uninstall")
        .catch((e) => plog("copy uninstall command failed", String(e)));
    }),
  );
  return row;
}

function reportBugRow(): HTMLElement {
  const row = actionRow(
    "Ai Open Tool",
    "打开 Ai Open Tool 获取反馈、支持和工具箱相关信息。",
  );
  const action = row.querySelector<HTMLElement>("[data-codexpp-row-actions]");
  action?.appendChild(
    compactButton("打开 Ai Open Tool", () => {
      void ipcRenderer.invoke("codexpp:open-external", AI_OPEN_TOOL_URL);
    }),
  );
  return row;
}

function actionRow(titleText: string, description: string): HTMLElement {
  const row = document.createElement("div");
  row.className = "flex items-center justify-between gap-4 p-3";
  const left = document.createElement("div");
  left.className = "flex min-w-0 flex-col gap-1";
  const title = document.createElement("div");
  title.className = "min-w-0 text-sm text-token-text-primary";
  title.textContent = titleText;
  const desc = document.createElement("div");
  desc.className = "text-token-text-secondary min-w-0 text-sm";
  desc.textContent = description;
  left.appendChild(title);
  left.appendChild(desc);
  row.appendChild(left);
  const actions = document.createElement("div");
  actions.dataset.codexppRowActions = "true";
  actions.className = "flex shrink-0 items-center gap-2";
  row.appendChild(actions);
  return row;
}

function renderTweakStorePage(
  sectionsWrap: HTMLElement,
  headerActions?: HTMLElement,
): void {
  const section = document.createElement("section");
  section.className = "flex flex-col gap-4";

  const source = document.createElement("span");
  source.hidden = true;
  source.dataset.codexppStoreSource = "true";
  source.textContent = "正在加载在线插件索引";

  const actions = document.createElement("div");
  actions.className = "flex shrink-0 items-center gap-2";
  const refreshBtn = storeIconButton(refreshIconSvg(), "刷新插件商店", () => {
    refreshBtn.disabled = true;
    updateStoreUpdateBadge(null);
    grid.textContent = "";
    renderTweakStoreGhostGrid(grid);
    refreshTweakStoreGrid(grid, source, refreshBtn, true);
  });
  actions.appendChild(refreshBtn);
  if (headerActions) {
    headerActions.replaceChildren(actions);
  }

  const grid = document.createElement("div");
  grid.dataset.codexppStoreGrid = "true";
  grid.className = "grid gap-4";
  if (state.tweakStore) {
    grid.dataset.codexppStore = JSON.stringify(state.tweakStore);
    renderTweakStoreGrid(grid, source);
  } else {
    renderTweakStoreGhostGrid(grid);
  }
  section.appendChild(source);
  section.appendChild(grid);
  sectionsWrap.appendChild(section);
  refreshTweakStoreGrid(grid, source, refreshBtn);
}

function refreshTweakStoreGrid(
  grid: HTMLElement,
  source: HTMLElement,
  refreshBtn?: HTMLButtonElement,
  force = false,
): void {
  void getTweakStore(force)
    .then((store) => {
      grid.dataset.codexppStore = JSON.stringify(store);
      renderTweakStoreGrid(grid, source);
    })
    .catch((e) => {
      grid.dataset.codexppStore = "";
      grid.removeAttribute("aria-busy");
      source.textContent = "在线插件索引不可用";
      updateStoreUpdateBadge(null);
      grid.textContent = "";
      grid.appendChild(storeMessageCard("无法加载插件商店", String(e)));
    })
    .finally(() => {
      if (refreshBtn) refreshBtn.disabled = false;
    });
}

function warmTweakStore(): void {
  if (state.tweakStore || state.tweakStorePromise) return;
  void getTweakStore().then((store) => {
    updateStoreUpdateBadge(outdatedInstalledStoreCount(store.entries));
  });
}

function getTweakStore(force = false): Promise<TweakStoreRegistryView> {
  if (!force) {
    if (state.tweakStore) return Promise.resolve(state.tweakStore);
    if (state.tweakStorePromise) return state.tweakStorePromise;
  }
  state.tweakStoreError = null;
  const promise = ipcRenderer
    .invoke("codexpp:get-tweak-store")
    .then((store) => {
      state.tweakStore = store as TweakStoreRegistryView;
      return state.tweakStore;
    })
    .catch((e) => {
      state.tweakStoreError = e;
      throw e;
    })
    .finally(() => {
      if (state.tweakStorePromise === promise) state.tweakStorePromise = null;
    });
  state.tweakStorePromise = promise;
  return promise;
}

function renderTweakStoreGrid(grid: HTMLElement, source: HTMLElement): void {
  const store = parseStoreDataset(grid);
  if (!store) return;
  const entries = store.entries;
  grid.removeAttribute("aria-busy");
  source.textContent = `刷新时间：${new Date(store.fetchedAt).toLocaleString()}`;
  updateStoreUpdateBadge(outdatedInstalledStoreCount(entries));
  grid.textContent = "";
  if (store.entries.length === 0) {
    grid.appendChild(storeMessageCard("暂无插件", "当前没有可安装插件。"));
    return;
  }
  for (const entry of entries) grid.appendChild(tweakStoreCard(entry));
}

function parseStoreDataset(grid: HTMLElement): TweakStoreRegistryView | null {
  const raw = grid.dataset.codexppStore;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TweakStoreRegistryView;
  } catch {
    return null;
  }
}

function tweakStoreCard(entry: TweakStoreEntryView): HTMLElement {
  const shell = tweakStoreCardShell();
  const { card, left, stack, versions, actions } = shell;

  left.insertBefore(storeAvatar(entry), stack);

  const titleRow = tweakStoreTitleRow();
  const title = document.createElement("div");
  title.className = "min-w-0 text-lg font-semibold leading-7 text-token-foreground";
  title.textContent = storeEntryDisplayName(entry);
  titleRow.appendChild(title);
  titleRow.appendChild(verifiedSafeBadge());
  stack.appendChild(titleRow);

  if (entry.manifest.description) {
    const desc = tweakStoreDescription();
    desc.textContent = storeEntryDisplayDescription(entry) ?? "";
    stack.appendChild(desc);
  }

  stack.appendChild(tweakStoreReadMoreButton(entry.repo));
  versions.appendChild(tweakStoreVersionBadge(entry));

  if (entry.releaseUrl) {
    actions.appendChild(
      compactButton("版本", () => {
        void ipcRenderer.invoke("codexpp:open-external", entry.releaseUrl);
      }),
    );
  }
  const hasUpdate = !!entry.installed && entry.installed.version !== entry.manifest.version;
  if (entry.installed && !hasUpdate) {
    actions.appendChild(storeStatusPill("已安装"));
  } else if (entry.platform && !entry.platform.compatible) {
    card.classList.add("opacity-70");
    actions.appendChild(storeStatusPill(platformLockedLabel(entry.platform)));
  } else if (entry.runtime && !entry.runtime.compatible) {
    card.classList.add("opacity-70");
    actions.appendChild(storeStatusPill(runtimeLockedLabel(entry.runtime)));
  } else {
    const installLabel = entry.installed ? "更新" : "安装";
    if (hasUpdate) actions.appendChild(storeStatusPill("有可用更新", "info"));
    const installButton = storeInstallButton(installLabel, (button) => {
      const grid = card.closest("[data-codexpp-store-grid]") as HTMLElement | null;
      const source = grid?.parentElement?.querySelector("[data-codexpp-store-source]") as HTMLElement | null;
      showStoreButtonLoading(button, entry.installed ? "更新中" : "安装中");
      actions.querySelectorAll("button").forEach((button) => (button.disabled = true));
      void ipcRenderer
        .invoke("codexpp:install-store-tweak", entry.id)
        .then(() => {
          showStoreToast(`${storeEntryDisplayName(entry)} 已安装。`);
          showStoreButtonInstalled(button);
          versions.replaceChildren(tweakStoreVersionBadge(entry, entry.manifest.version));
          updateStoreUpdateBadge(Math.max(0, currentStoreUpdateBadgeCount() - 1));
          setTimeout(() => {
            actions.replaceChildren(storeStatusPill("已安装"));
            if (grid && source) refreshTweakStoreGrid(grid, source, undefined, true);
          }, 900);
        })
        .catch((e) => {
          resetStoreInstallButton(button, installLabel);
          actions.querySelectorAll("button").forEach((button) => (button.disabled = false));
          showStoreCardMessage(card, String((e as Error).message ?? e));
        });
    });
    actions.appendChild(installButton);
  }
  return card;
}

function platformLockedLabel(platform: NonNullable<TweakStoreEntryView["platform"]>): string {
  const supported = platform.supported ?? [];
  if (supported.includes("win32")) return "仅 Windows";
  if (supported.includes("darwin")) return "仅 macOS";
  if (supported.includes("linux")) return "仅 Linux";
  return "不可用";
}

function runtimeLockedLabel(runtime: NonNullable<TweakStoreEntryView["runtime"]>): string {
  return runtime.required ? `需要 codex汉化增强plus版 ${runtime.required}` : "需要更新版本的 codex汉化增强plus版";
}

function showStoreCardMessage(card: HTMLElement, message: string): void {
  card.querySelector("[data-codexpp-store-card-message]")?.remove();
  const notice = document.createElement("div");
  notice.dataset.codexppStoreCardMessage = "true";
  notice.className =
    "rounded-lg border border-token-border/50 bg-token-foreground/5 px-3 py-2 text-sm leading-5 text-token-description-foreground";
  notice.textContent = message;
  const actions = card.lastElementChild;
  if (actions) card.insertBefore(notice, actions);
  else card.appendChild(notice);
}

function tweakStoreCardShell(): {
  card: HTMLElement;
  left: HTMLElement;
  stack: HTMLElement;
  versions: HTMLElement;
  actions: HTMLElement;
} {
  const card = document.createElement("div");
  card.className =
    "border-token-border/40 flex min-h-[190px] flex-col justify-between gap-4 rounded-2xl border p-4 transition-colors hover:bg-token-foreground/5";

  const left = document.createElement("div");
  left.className = "flex min-w-0 flex-1 items-start gap-3";
  const stack = document.createElement("div");
  stack.className = "flex min-w-0 flex-1 flex-col gap-2";
  left.appendChild(stack);
  card.appendChild(left);

  const footer = document.createElement("div");
  footer.className = "mt-auto flex min-w-0 flex-wrap items-center justify-between gap-2";
  const versions = document.createElement("div");
  versions.className = "flex min-w-0 flex-1 items-center gap-2";
  footer.appendChild(versions);
  const actions = document.createElement("div");
  actions.className = "flex shrink-0 items-center justify-end gap-2";
  footer.appendChild(actions);
  card.appendChild(footer);

  return { card, left, stack, versions, actions };
}

function tweakStoreTitleRow(): HTMLElement {
  const titleRow = document.createElement("div");
  titleRow.className = "flex min-w-0 items-start justify-between gap-3";
  return titleRow;
}

function tweakStoreDescription(): HTMLElement {
  const desc = document.createElement("div");
  desc.className = "line-clamp-3 min-w-0 text-sm leading-5 text-token-text-secondary";
  return desc;
}

function tweakStoreReadMoreButton(repo: string): HTMLButtonElement {
  const readMore = document.createElement("button");
  readMore.type = "button";
  readMore.className =
    "inline-flex w-fit items-center gap-1 text-sm font-medium text-token-text-link-foreground hover:underline";
  readMore.innerHTML =
    `查看详情` +
    `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">` +
    `<path d="M6 3.5h6.5V10M12.25 3.75 4 12" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg>`;
  readMore.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    void ipcRenderer.invoke("codexpp:open-external", `https://github.com/${repo}`);
  });
  return readMore;
}

function renderTweakStoreGhostGrid(grid: HTMLElement): void {
  grid.setAttribute("aria-busy", "true");
  grid.textContent = "";
  grid.appendChild(tweakStoreGhostCard());
}

function tweakStoreGhostCard(): HTMLElement {
  const { card, left, stack, versions, actions } = tweakStoreCardShell();
  card.classList.add("pointer-events-none");
  card.setAttribute("aria-hidden", "true");

  left.insertBefore(storeAvatarGhost(), stack);

  const titleRow = tweakStoreTitleRow();
  const title = document.createElement("div");
  title.className = "min-w-0 text-lg font-semibold leading-7 text-token-foreground";
  title.appendChild(ghostBlock("my-1 h-5 w-44 rounded-md"));
  titleRow.appendChild(title);
  titleRow.appendChild(verifiedSafeGhostBadge());
  stack.appendChild(titleRow);

  const desc = tweakStoreDescription();
  desc.appendChild(ghostBlock("mt-1 h-3 w-full rounded"));
  desc.appendChild(ghostBlock("mt-2 h-3 w-11/12 rounded"));
  desc.appendChild(ghostBlock("mt-2 h-3 w-7/12 rounded"));
  stack.appendChild(desc);

  const readMore = tweakStoreReadMoreButton("");
  readMore.replaceChildren(ghostBlock("h-5 w-24 rounded"));
  stack.appendChild(readMore);

  versions.appendChild(storeVersionGhostBadge());
  actions.appendChild(storeStatusGhostPill());
  return card;
}

function storeAvatarGhost(): HTMLElement {
  const avatar = document.createElement("div");
  avatar.className =
    "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-token-border-default bg-transparent text-token-description-foreground";
  avatar.appendChild(ghostBlock("h-full w-full"));
  return avatar;
}

function verifiedSafeGhostBadge(): HTMLElement {
  const badge = verifiedSafeBadge();
  badge.replaceChildren(ghostBlock("h-[13px] w-[13px] rounded-sm"), ghostBlock("h-3 w-20 rounded"));
  return badge;
}

function storeStatusGhostPill(): HTMLElement {
  const pill = storeStatusPill("已安装");
  pill.classList.add("animate-pulse");
  pill.style.color = "transparent";
  return pill;
}

function storeVersionGhostBadge(): HTMLElement {
  const badge = storeVersionBadgeShell(false);
  badge.appendChild(ghostBlock("h-3 w-36 rounded"));
  return badge;
}

function ghostBlock(className: string): HTMLElement {
  const block = document.createElement("div");
  block.className = `animate-pulse bg-token-foreground/10 ${className}`;
  block.setAttribute("aria-hidden", "true");
  return block;
}

function storeAvatar(entry: TweakStoreEntryView): HTMLElement {
  const avatar = document.createElement("div");
  avatar.className =
    "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-token-border-default bg-transparent text-token-description-foreground";
  const initial = (entry.manifest.name?.[0] ?? "?").toUpperCase();
  const fallback = document.createElement("span");
  fallback.textContent = initial;
  avatar.appendChild(fallback);
  const iconUrl = storeEntryIconUrl(entry);
  if (iconUrl) {
    const img = document.createElement("img");
    img.alt = "";
    img.className = "h-full w-full object-cover";
    img.style.display = "none";
    img.addEventListener("load", () => {
      fallback.remove();
      img.style.display = "";
    });
    img.addEventListener("error", () => {
      img.remove();
    });
    img.src = iconUrl;
    avatar.appendChild(img);
  }
  return avatar;
}

function storeEntryIconUrl(entry: TweakStoreEntryView): string | null {
  const iconUrl = entry.manifest.iconUrl?.trim();
  if (!iconUrl) return null;
  if (/^(https?:|data:)/i.test(iconUrl)) return iconUrl;
  const rel = iconUrl.replace(/^\.?\//, "");
  if (!rel || rel.startsWith("../")) return null;
  return `https://raw.githubusercontent.com/${entry.repo}/${entry.approvedCommitSha}/${rel}`;
}

function sidebarUpdatePillButton(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.codexppSidebarUpdate = "true";
  btn.className =
    "user-select-none no-drag cursor-interaction inline-flex shrink-0 items-center justify-center whitespace-nowrap";
  Object.assign(btn.style, {
    display: "none",
    height: "20px",
    borderRadius: "9999px",
    border: "0",
    background: "#0A84FF",
    color: "#FFFFFF",
    padding: "0 8px",
    fontSize: "10px",
    fontWeight: "700",
    lineHeight: "20px",
    letterSpacing: "0",
    textTransform: "none",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.18)",
  });
  btn.textContent = "更新";
  btn.title = "打开 codex汉化增强plus版 更新";
  btn.addEventListener("mouseenter", () => {
    btn.style.background = "#0071E3";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = "#0A84FF";
  });
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    activatePage({ kind: "config" });
  });
  return btn;
}

function refreshSidebarCodexPlusPlusUpdateButton(force = false): void {
  const btn = state.codexPlusPlusUpdateButton;
  if (!btn) return;
  void ipcRenderer
    .invoke("codexpp:check-codexpp-update", force)
    .then((check) => setSidebarCodexPlusPlusUpdateButton(check as CodexPlusPlusUpdateCheck))
    .catch((e) => {
      plog("codex汉化增强plus版 sidebar release check failed", String(e));
      setSidebarCodexPlusPlusUpdateButton(null);
    });
}

function setSidebarCodexPlusPlusUpdateButton(check: CodexPlusPlusUpdateCheck | null): void {
  const btn = state.codexPlusPlusUpdateButton;
  if (!btn) return;
  const updateAvailable = check?.updateAvailable === true;
  btn.style.display = updateAvailable ? "inline-flex" : "none";
  btn.hidden = !updateAvailable;
  delete btn.dataset.codexppReleaseUrl;
  btn.title =
    updateAvailable && check?.latestVersion
      ? `查看 codex汉化增强plus版 ${check.latestVersion} 更新设置`
      : "查看 codex汉化增强plus版 更新设置";
}

function updateStoreUpdateBadge(count: number | null): void {
  const badge = document.querySelector<HTMLElement>("[data-codexpp-store-update-badge]");
  if (!badge) return;
  badge.dataset.codexppStoreUpdateCount = count === null ? "" : String(count);
  applyStoreUpdateBadgeStyle(badge, count);
  badge.hidden = count === null || count <= 0;
  badge.textContent = count && count > 0 ? String(count) : "";
  badge.title =
    count && count > 0
      ? `${count} 个已安装插件可以更新`
      : "已安装插件均为最新";
}

function applyStoreUpdateBadgeStyle(badge: HTMLElement, count: number | null): void {
  const hasUpdates = !!count && count > 0;
  Object.assign(badge.style, {
    minWidth: "24px",
    height: "20px",
    borderRadius: "9999px",
    border: "0",
    background: hasUpdates ? "#0A84FF" : "transparent",
    color: "#FFFFFF",
    padding: "0 7px",
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: "20px",
    letterSpacing: "0",
    boxShadow: hasUpdates ? "0 1px 2px rgba(0, 0, 0, 0.22)" : "none",
  });
}

function currentStoreUpdateBadgeCount(): number {
  const badge = document.querySelector<HTMLElement>("[data-codexpp-store-update-badge]");
  const raw = badge?.dataset.codexppStoreUpdateCount;
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function outdatedInstalledStoreCount(entries: TweakStoreEntryView[]): number {
  return entries.filter((entry) => !!entry.installed && entry.installed.version !== entry.manifest.version).length;
}

function storeToolbarButton(
  label: string,
  onClick: () => void,
  variant: "primary" | "secondary" = "secondary",
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    variant === "primary"
      ? "border-token-border user-select-none no-drag cursor-interaction flex h-8 items-center gap-1 whitespace-nowrap rounded-lg border border-token-border bg-token-bg-fog px-2 py-0 text-sm text-token-button-tertiary-foreground enabled:hover:bg-token-list-hover-background disabled:cursor-not-allowed disabled:opacity-40"
      : "border-token-border user-select-none no-drag cursor-interaction flex h-8 items-center gap-1 whitespace-nowrap rounded-lg border border-transparent bg-token-foreground/5 px-2 py-0 text-sm text-token-foreground enabled:hover:bg-token-foreground/10 disabled:cursor-not-allowed disabled:opacity-40";
  btn.textContent = label;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });
  return btn;
}

function storeIconButton(
  iconSvg: string,
  label: string,
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    "border-token-border user-select-none no-drag cursor-interaction flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-token-foreground/5 p-0 text-token-foreground enabled:hover:bg-token-foreground/10 disabled:cursor-not-allowed disabled:opacity-40";
  btn.innerHTML = iconSvg;
  btn.setAttribute("aria-label", label);
  btn.title = label;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });
  return btn;
}

function refreshIconSvg(): string {
  return (
    `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" class="icon-xs" aria-hidden="true">` +
    `<path d="M4.4 9.35A5.65 5.65 0 0 1 14 5.3L15.75 7M15.75 3.75V7h-3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M15.6 10.65A5.65 5.65 0 0 1 6 14.7L4.25 13M4.25 16.25V13H7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg>`
  );
}

function verifiedSafeBadge(): HTMLElement {
  const badge = document.createElement("span");
  badge.className =
    "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md border border-token-border/30 bg-transparent px-2 text-xs font-medium text-token-description-foreground";
  badge.innerHTML =
    `<svg width="13" height="13" viewBox="0 0 14 14" fill="none" class="text-blue-500" aria-hidden="true">` +
    `<path d="M7 1.75 11.25 3.4v3.2c0 2.6-1.65 4.25-4.25 5.4-2.6-1.15-4.25-2.8-4.25-5.4V3.4L7 1.75Z" stroke="currentColor" stroke-width="1.15" stroke-linejoin="round"/>` +
    `<path d="M4.85 7.05 6.3 8.45l2.85-3.05" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg>` +
    `<span>已安全审核</span>`;
  return badge;
}

function tweakStoreVersionBadge(entry: TweakStoreEntryView, installedOverride?: string): HTMLElement {
  const installed = installedOverride ?? entry.installed?.version ?? null;
  const latest = entry.manifest.version;
  const hasUpdate = !!installed && installed !== latest;
  const badge = storeVersionBadgeShell(hasUpdate);
  const label = document.createElement("span");
  label.className = "truncate";
  label.textContent = installed
    ? `已安装 v${installed} · 最新 v${latest}`
    : `最新 v${latest}`;
  badge.title = installed
    ? `已安装版本 ${installed}。最新审核版本 ${latest}。`
    : `最新审核版本 ${latest}。`;
  badge.appendChild(label);
  return badge;
}

function storeVersionBadgeShell(hasUpdate: boolean): HTMLElement {
  const badge = document.createElement("span");
  badge.className = [
    "inline-flex h-8 min-w-0 max-w-full items-center rounded-lg border px-2.5 text-xs font-medium",
    hasUpdate
      ? "border-blue-500/30 bg-blue-500/10 text-token-foreground"
      : "border-token-border/40 bg-token-foreground/5 text-token-description-foreground",
  ].join(" ");
  return badge;
}

function storeStatusPill(label: string, tone: "neutral" | "info" = "neutral"): HTMLElement {
  const pill = document.createElement("span");
  pill.className = [
    "inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-medium",
    tone === "info"
      ? "border border-blue-500/30 bg-blue-500/10 text-token-foreground"
      : "bg-token-foreground/5 text-token-description-foreground",
  ].join(" ");
  pill.textContent = label;
  return pill;
}

function storeInstallButton(label: string, onClick: (button: HTMLButtonElement) => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    storeInstallButtonClass();
  btn.textContent = label;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(btn);
  });
  return btn;
}

function storeInstallButtonClass(extra = ""): string {
  return [
    "border-token-border user-select-none no-drag cursor-interaction flex h-8 min-w-[82px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-blue-500/40 bg-blue-500 px-3 py-0 text-sm font-medium text-token-foreground shadow-sm transition-colors enabled:hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-80",
    extra,
  ].filter(Boolean).join(" ");
}

function showStoreButtonLoading(button: HTMLButtonElement, label: string): void {
  button.className = storeInstallButtonClass();
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.innerHTML =
    `<svg class="animate-spin" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">` +
    `<circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="2" opacity=".25"/>` +
    `<path d="M13.5 8A5.5 5.5 0 0 0 8 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>` +
    `</svg>` +
    `<span>${label}</span>`;
}

function showStoreButtonInstalled(button: HTMLButtonElement): void {
  button.className = storeInstallButtonClass("border-blue-500 bg-blue-500");
  button.disabled = true;
  button.removeAttribute("aria-busy");
  button.innerHTML =
    `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">` +
    `<path d="M3.75 8.15 6.65 11 12.25 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg>` +
    `<span>已安装</span>`;
}

function resetStoreInstallButton(button: HTMLButtonElement, label: string): void {
  button.className = storeInstallButtonClass();
  button.disabled = false;
  button.removeAttribute("aria-busy");
  button.textContent = label;
}

function showStoreToast(message: string): void {
  let host = document.querySelector<HTMLElement>("[data-codexpp-store-toast-host]");
  if (!host) {
    host = document.createElement("div");
    host.dataset.codexppStoreToastHost = "true";
    host.className = "pointer-events-none fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2";
    document.body.appendChild(host);
  }
  const toast = document.createElement("div");
  toast.className =
    "translate-y-2 rounded-xl border border-token-border/50 bg-token-main-surface-primary px-3 py-2 text-sm font-medium text-token-foreground opacity-0 shadow-lg transition-all duration-200";
  toast.textContent = message;
  host.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  });
  setTimeout(() => {
    toast.classList.add("translate-y-2", "opacity-0");
    setTimeout(() => {
      toast.remove();
      if (host && host.childElementCount === 0) host.remove();
    }, 220);
  }, 2600);
}

function storeMessageCard(title: string, description?: string): HTMLElement {
  const card = document.createElement("div");
  card.className =
    "border-token-border/40 flex min-h-[84px] flex-col justify-center gap-1 rounded-2xl border p-4 text-sm";
  const t = document.createElement("div");
  t.className = "font-medium text-token-text-primary";
  t.textContent = title;
  card.appendChild(t);
  if (description) {
    const d = document.createElement("div");
    d.className = "text-token-text-secondary";
    d.textContent = description;
    card.appendChild(d);
  }
  return card;
}

function shortSha(value: string): string {
  return value.slice(0, 7);
}

function renderTweaksPage(sectionsWrap: HTMLElement): void {
  const openBtn = openInPlaceButton("打开插件文件夹", () => {
    void ipcRenderer.invoke("codexpp:reveal", tweaksPath());
  });
  const reloadBtn = openInPlaceButton("强制重载", () => {
    // Full page refresh — same as DevTools Cmd-R / our CDP Page.reload.
    // Main re-discovers tweaks first so the new renderer comes up with a
    // fresh tweak set; then location.reload restarts the renderer so the
    // preload re-initializes against it.
    void ipcRenderer
      .invoke("codexpp:reload-tweaks")
      .catch((e) => plog("force reload (main) failed", String(e)))
      .finally(() => {
        location.reload();
      });
  });
  // Drop the diagonal-arrow icon from the reload button — it implies "open
  // out of app" which doesn't fit. Replace its trailing svg with a refresh.
  const reloadSvg = reloadBtn.querySelector("svg");
  if (reloadSvg) {
    reloadSvg.outerHTML =
      `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-2xs" aria-hidden="true">` +
      `<path d="M4 10a6 6 0 0 1 10.24-4.24L16 7.5M16 4v3.5h-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M16 10a6 6 0 0 1-10.24 4.24L4 12.5M4 16v-3.5h3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` +
      `</svg>`;
  }

  const trailing = document.createElement("div");
  trailing.className = "flex items-center gap-2";
  trailing.appendChild(reloadBtn);
  trailing.appendChild(openBtn);

  if (state.listedTweaks.length === 0) {
    const section = document.createElement("section");
    section.className = "flex flex-col gap-2";
    section.appendChild(sectionTitle("已安装插件", trailing));
    const card = roundedCard();
    card.appendChild(
      rowSimple(
        "尚未安装插件",
        `把插件文件夹放入 ${tweaksPath()}，然后重载。`,
      ),
    );
    section.appendChild(card);
    sectionsWrap.appendChild(section);
    return;
  }

  // Group registered SettingsSections by tweak id (prefix split at ":").
  const sectionsByTweak = new Map<string, SettingsSection[]>();
  for (const s of state.sections.values()) {
    const tweakId = s.id.split(":")[0];
    if (!sectionsByTweak.has(tweakId)) sectionsByTweak.set(tweakId, []);
    sectionsByTweak.get(tweakId)!.push(s);
  }

  const pagesByTweak = new Map<string, RegisteredPage[]>();
  for (const p of state.pages.values()) {
    if (!pagesByTweak.has(p.tweakId)) pagesByTweak.set(p.tweakId, []);
    pagesByTweak.get(p.tweakId)!.push(p);
  }

  const wrap = document.createElement("section");
  wrap.className = "flex flex-col gap-2";
  wrap.appendChild(sectionTitle("已安装插件", trailing));

  const card = roundedCard();
  for (const t of state.listedTweaks) {
    card.appendChild(
      tweakRow(
        t,
        sectionsByTweak.get(t.manifest.id) ?? [],
        pagesByTweak.get(t.manifest.id) ?? [],
      ),
    );
  }
  wrap.appendChild(card);
  sectionsWrap.appendChild(wrap);
}

function tweakRow(
  t: ListedTweak,
  sections: SettingsSection[],
  pages: RegisteredPage[],
): HTMLElement {
  const m = t.manifest;

  // Outer cell wraps the header row + (optional) nested sections so the
  // parent card's divider stays between *tweaks*, not between header and
  // body of the same tweak.
  const cell = document.createElement("div");
  cell.className = "flex flex-col";
  if (!t.enabled) cell.style.opacity = "0.7";

  const header = document.createElement("div");
  header.className = "flex items-start justify-between gap-4 p-3";

  const left = document.createElement("div");
  left.className = "flex min-w-0 flex-1 items-start gap-3";

  // ── Avatar ─────────────────────────────────────────────────────────────
  const avatar = document.createElement("div");
  avatar.className =
    "flex shrink-0 items-center justify-center rounded-md border border-token-border overflow-hidden text-token-text-secondary";
  avatar.style.width = "56px";
  avatar.style.height = "56px";
  avatar.style.backgroundColor = "var(--color-token-bg-fog, transparent)";
  if (m.iconUrl) {
    const img = document.createElement("img");
    img.alt = "";
    img.className = "size-full object-contain";
    // Initial: show fallback initial in case the icon fails to load.
    const initial = (m.name?.[0] ?? "?").toUpperCase();
    const fallback = document.createElement("span");
    fallback.className = "text-xl font-medium";
    fallback.textContent = initial;
    avatar.appendChild(fallback);
    img.style.display = "none";
    img.addEventListener("load", () => {
      fallback.remove();
      img.style.display = "";
    });
    img.addEventListener("error", () => {
      img.remove();
    });
    void resolveIconUrl(m.iconUrl, t.dir).then((url) => {
      if (url) img.src = url;
      else img.remove();
    });
    avatar.appendChild(img);
  } else {
    const initial = (m.name?.[0] ?? "?").toUpperCase();
    const span = document.createElement("span");
    span.className = "text-xl font-medium";
    span.textContent = initial;
    avatar.appendChild(span);
  }
  left.appendChild(avatar);

  // ── Text stack ────────────────────────────────────────────────────────
  const stack = document.createElement("div");
  stack.className = "flex min-w-0 flex-col gap-0.5";

  const titleRow = document.createElement("div");
  titleRow.className = "flex items-center gap-2";
  const name = document.createElement("div");
  name.className = "min-w-0 text-sm font-medium text-token-text-primary";
  name.textContent = tweakDisplayName(m);
  titleRow.appendChild(name);
  if (m.version) {
    const ver = document.createElement("span");
    ver.className =
      "text-token-text-secondary text-xs font-normal tabular-nums";
    ver.textContent = `v${m.version}`;
    titleRow.appendChild(ver);
  }
  if (t.update?.updateAvailable) {
    const badge = document.createElement("span");
    badge.className =
      "rounded-full border border-token-border bg-token-foreground/5 px-2 py-0.5 text-[11px] font-medium text-token-text-primary";
    badge.textContent = "有可用更新";
    titleRow.appendChild(badge);
  }
  stack.appendChild(titleRow);

  if (m.description) {
    const desc = document.createElement("div");
    desc.className = "text-token-text-secondary min-w-0 text-sm";
    desc.textContent = tweakDisplayDescription(m) ?? "";
    stack.appendChild(desc);
  }

  const meta = document.createElement("div");
  meta.className = "flex items-center gap-2 text-xs text-token-text-secondary";
  const authorEl = renderAuthor(m.author);
  if (authorEl) meta.appendChild(authorEl);
  if (m.githubRepo) {
    if (meta.children.length > 0) meta.appendChild(dot());
    const repo = document.createElement("button");
    repo.type = "button";
    repo.className = "inline-flex text-token-text-link-foreground hover:underline";
    repo.textContent = m.githubRepo;
    repo.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      void ipcRenderer.invoke("codexpp:open-external", `https://github.com/${m.githubRepo}`);
    });
    meta.appendChild(repo);
  }
  if (m.homepage) {
    if (meta.children.length > 0) meta.appendChild(dot());
    const link = document.createElement("a");
    link.href = m.homepage;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.className = "inline-flex text-token-text-link-foreground hover:underline";
    link.textContent = "主页";
    meta.appendChild(link);
  }
  if (meta.children.length > 0) stack.appendChild(meta);

  // Tags row (if any) — small pill chips below the meta line.
  if (m.tags && m.tags.length > 0) {
    const tagsRow = document.createElement("div");
    tagsRow.className = "flex flex-wrap items-center gap-1 pt-0.5";
    for (const tag of m.tags) {
      const pill = document.createElement("span");
      pill.className =
        "rounded-full border border-token-border bg-token-foreground/5 px-2 py-0.5 text-[11px] text-token-text-secondary";
      pill.textContent = tag;
      tagsRow.appendChild(pill);
    }
    stack.appendChild(tagsRow);
  }

  left.appendChild(stack);
  header.appendChild(left);

  // ── Toggle ────────────────────────────────────────────────────────────
  const right = document.createElement("div");
  right.className = "flex shrink-0 items-center gap-2 pt-0.5";
  if (t.enabled && pages.length > 0) {
    const configureBtn = compactButton("配置", () => {
      activatePage({ kind: "registered", id: pages[0]!.id });
    });
    configureBtn.title = pages.length === 1
      ? `打开 ${pages[0]!.page.title}`
      : `打开 ${pages.map((p) => p.page.title).join(", ")}`;
    right.appendChild(configureBtn);
  }
  if (t.update?.updateAvailable && t.update.releaseUrl) {
    right.appendChild(
      compactButton("查看版本", () => {
        void ipcRenderer.invoke("codexpp:open-external", t.update!.releaseUrl);
      }),
    );
  }
  right.appendChild(
    switchControl(t.enabled, async (next) => {
      await ipcRenderer.invoke("codexpp:set-tweak-enabled", m.id, next);
      // The main process broadcasts a reload which will re-fetch the list
      // and re-render. We don't optimistically toggle to avoid drift.
    }),
  );
  header.appendChild(right);

  cell.appendChild(header);

  // If the tweak is enabled and registered settings sections, render those
  // bodies as nested rows beneath the header inside the same cell.
  if (t.enabled && sections.length > 0) {
    const nested = document.createElement("div");
    nested.className =
      "flex flex-col divide-y-[0.5px] divide-token-border border-t-[0.5px] border-token-border";
    for (const s of sections) {
      const body = document.createElement("div");
      body.className = "p-3";
      try {
        s.render(body);
      } catch (e) {
        body.textContent = `渲染插件设置区域出错：${(e as Error).message}`;
      }
      nested.appendChild(body);
    }
    cell.appendChild(nested);
  }

  return cell;
}

function renderAuthor(author: TweakManifest["author"]): HTMLElement | null {
  if (!author) return null;
  const wrap = document.createElement("span");
  wrap.className = "inline-flex items-center gap-1";
  if (typeof author === "string") {
    wrap.textContent = `作者：${author}`;
    return wrap;
  }
  wrap.appendChild(document.createTextNode("作者："));
  if (author.url) {
    const a = document.createElement("a");
    a.href = author.url;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.className = "inline-flex text-token-text-link-foreground hover:underline";
    a.textContent = author.name;
    wrap.appendChild(a);
  } else {
    const span = document.createElement("span");
    span.textContent = author.name;
    wrap.appendChild(span);
  }
  return wrap;
}

// ───────────────────────────────────────────────────────────── components ──

/** The full panel shell (toolbar + scroll + heading + sections wrap). */
function panelShell(
  title: string,
  subtitle?: string,
  options?: { wide?: boolean },
): {
  outer: HTMLElement;
  sectionsWrap: HTMLElement;
  subtitle?: HTMLElement;
  headerActions: HTMLElement;
  headerTitleActions: HTMLElement;
} {
  const outer = document.createElement("div");
  outer.className = "main-surface flex h-full min-h-0 flex-col";

  const toolbar = document.createElement("div");
  toolbar.className =
    "draggable flex items-center px-panel electron:h-toolbar extension:h-toolbar-sm";
  outer.appendChild(toolbar);

  const scroll = document.createElement("div");
  scroll.className = "flex-1 overflow-y-auto p-panel";
  outer.appendChild(scroll);

  const inner = document.createElement("div");
  inner.className =
    options?.wide
      ? "mx-auto flex w-full max-w-5xl flex-col electron:min-w-[calc(320px*var(--codex-window-zoom))]"
      : "mx-auto flex w-full flex-col max-w-2xl electron:min-w-[calc(320px*var(--codex-window-zoom))]";
  scroll.appendChild(inner);

  const headerWrap = document.createElement("div");
  headerWrap.className = "flex items-center justify-between gap-3 pb-panel";
  const headerInner = document.createElement("div");
  headerInner.className = "flex min-w-0 flex-1 flex-col gap-1.5 pb-panel";
  const titleLine = document.createElement("div");
  titleLine.className = "flex min-w-0 items-center gap-2";
  const heading = document.createElement("div");
  heading.className = "electron:heading-lg heading-base truncate";
  heading.textContent = title;
  titleLine.appendChild(heading);
  const headerTitleActions = document.createElement("div");
  headerTitleActions.className = "flex shrink-0 items-center gap-2";
  titleLine.appendChild(headerTitleActions);
  headerInner.appendChild(titleLine);
  let subtitleElement: HTMLElement | undefined;
  if (subtitle) {
    const sub = document.createElement("div");
    sub.className = "text-token-text-secondary text-sm";
    sub.textContent = subtitle;
    headerInner.appendChild(sub);
    subtitleElement = sub;
  }
  headerWrap.appendChild(headerInner);
  const headerActions = document.createElement("div");
  headerActions.className = "flex shrink-0 items-center gap-2";
  headerWrap.appendChild(headerActions);
  inner.appendChild(headerWrap);

  const sectionsWrap = document.createElement("div");
  sectionsWrap.className = "flex flex-col gap-[var(--padding-panel)]";
  inner.appendChild(sectionsWrap);

  return { outer, sectionsWrap, subtitle: subtitleElement, headerActions, headerTitleActions };
}

function sectionTitle(text: string, trailing?: HTMLElement): HTMLElement {
  const titleRow = document.createElement("div");
  titleRow.className =
    "flex h-toolbar items-center justify-between gap-2 px-0 py-0";
  const titleInner = document.createElement("div");
  titleInner.className = "flex min-w-0 flex-1 flex-col gap-1";
  const t = document.createElement("div");
  t.className = "text-base font-medium text-token-text-primary";
  t.textContent = text;
  titleInner.appendChild(t);
  titleRow.appendChild(titleInner);
  if (trailing) {
    const right = document.createElement("div");
    right.className = "flex items-center gap-2";
    right.appendChild(trailing);
    titleRow.appendChild(right);
  }
  return titleRow;
}

/**
 * Codex's "Open config.toml"-style trailing button: ghost border, muted
 * label, top-right diagonal arrow icon. Markup mirrors Configuration panel.
 */
function openInPlaceButton(label: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    "border-token-border user-select-none no-drag cursor-interaction flex items-center gap-1 border whitespace-nowrap focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 rounded-lg text-token-description-foreground enabled:hover:bg-token-list-hover-background data-[state=open]:bg-token-list-hover-background border-transparent h-token-button-composer px-2 py-0 text-base leading-[18px]";
  btn.innerHTML =
    `${label}` +
    `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-2xs" aria-hidden="true">` +
    `<path d="M14.3349 13.3301V6.60645L5.47065 15.4707C5.21095 15.7304 4.78895 15.7304 4.52925 15.4707C4.26955 15.211 4.26955 14.789 4.52925 14.5293L13.3935 5.66504H6.66011C6.29284 5.66504 5.99507 5.36727 5.99507 5C5.99507 4.63273 6.29284 4.33496 6.66011 4.33496H14.9999L15.1337 4.34863C15.4369 4.41057 15.665 4.67857 15.665 5V13.3301C15.6649 13.6973 15.3672 13.9951 14.9999 13.9951C14.6327 13.9951 14.335 13.6973 14.3349 13.3301Z" fill="currentColor"></path>` +
    `</svg>`;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });
  return btn;
}

function compactButton(label: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    "border-token-border user-select-none no-drag cursor-interaction inline-flex h-8 items-center whitespace-nowrap rounded-lg border px-2 text-sm text-token-text-primary enabled:hover:bg-token-list-hover-background disabled:cursor-not-allowed disabled:opacity-40";
  btn.textContent = label;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });
  return btn;
}

function roundedCard(): HTMLElement {
  const card = document.createElement("div");
  card.className =
    "border-token-border flex flex-col divide-y-[0.5px] divide-token-border rounded-lg border";
  card.setAttribute(
    "style",
    "background-color: var(--color-background-panel, var(--color-token-bg-fog));",
  );
  return card;
}

function rowSimple(title: string | undefined, description?: string): HTMLElement {
  const row = document.createElement("div");
  row.className = "flex items-center justify-between gap-4 p-3";
  const left = document.createElement("div");
  left.className = "flex min-w-0 items-center gap-3";
  const stack = document.createElement("div");
  stack.className = "flex min-w-0 flex-col gap-1";
  if (title) {
    const t = document.createElement("div");
    t.className = "min-w-0 text-sm text-token-text-primary";
    t.textContent = title;
    stack.appendChild(t);
  }
  if (description) {
    const d = document.createElement("div");
    d.className = "text-token-text-secondary min-w-0 text-sm";
    d.textContent = description;
    stack.appendChild(d);
  }
  left.appendChild(stack);
  row.appendChild(left);
  return row;
}

/**
 * Codex-styled toggle switch. Markup mirrors the General > Permissions row
 * switch we captured: outer button (role=switch), inner pill, sliding knob.
 */
function switchControl(
  initial: boolean,
  onChange: (next: boolean) => void | Promise<void>,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("role", "switch");

  const pill = document.createElement("span");
  const knob = document.createElement("span");
  knob.className =
    "rounded-full border border-[color:var(--gray-0)] bg-[color:var(--gray-0)] shadow-sm transition-transform duration-200 ease-out h-4 w-4";
  pill.appendChild(knob);

  const apply = (on: boolean): void => {
    btn.setAttribute("aria-checked", String(on));
    btn.dataset.state = on ? "checked" : "unchecked";
    btn.className =
      "inline-flex items-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-focus-border focus-visible:rounded-full cursor-interaction";
    pill.className = `relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ease-out h-5 w-8 ${
      on ? "bg-token-charts-blue" : "bg-token-foreground/20"
    }`;
    pill.dataset.state = on ? "checked" : "unchecked";
    knob.dataset.state = on ? "checked" : "unchecked";
    knob.style.transform = on ? "translateX(14px)" : "translateX(2px)";
  };
  apply(initial);

  btn.appendChild(pill);
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = btn.getAttribute("aria-checked") !== "true";
    apply(next);
    btn.disabled = true;
    try {
      await onChange(next);
    } finally {
      btn.disabled = false;
    }
  });
  return btn;
}

function dot(): HTMLElement {
  const s = document.createElement("span");
  s.className = "text-token-description-foreground";
  s.textContent = "·";
  return s;
}

// ──────────────────────────────────────────────────────────────── icons ──

function configIconSvg(): string {
  // Sliders / settings glyph. 20x20 currentColor.
  return (
    `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm inline-block align-middle" aria-hidden="true">` +
    `<path d="M3 5h9M15 5h2M3 10h2M8 10h9M3 15h11M17 15h0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>` +
    `<circle cx="13" cy="5" r="1.6" fill="currentColor"/>` +
    `<circle cx="6" cy="10" r="1.6" fill="currentColor"/>` +
    `<circle cx="15" cy="15" r="1.6" fill="currentColor"/>` +
    `</svg>`
  );
}

function tweaksIconSvg(): string {
  // Sparkles / "++" glyph for tweaks.
  return (
    `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm inline-block align-middle" aria-hidden="true">` +
    `<path d="M10 2.5 L11.4 8.6 L17.5 10 L11.4 11.4 L10 17.5 L8.6 11.4 L2.5 10 L8.6 8.6 Z" fill="currentColor"/>` +
    `<path d="M15.5 3 L16 5 L18 5.5 L16 6 L15.5 8 L15 6 L13 5.5 L15 5 Z" fill="currentColor" opacity="0.7"/>` +
    `</svg>`
  );
}

function storeIconSvg(): string {
  return (
    `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm inline-block align-middle" aria-hidden="true">` +
    `<path d="M4 8.2 5.1 4.5A1.5 1.5 0 0 1 6.55 3.4h6.9a1.5 1.5 0 0 1 1.45 1.1L16 8.2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="M4.5 8h11v7.5A1.5 1.5 0 0 1 14 17H6a1.5 1.5 0 0 1-1.5-1.5V8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="M7.5 8v1a2.5 2.5 0 0 0 5 0V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>` +
    `</svg>`
  );
}

function agentProviderIconSvg(): string {
  return (
    `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm inline-block align-middle" aria-hidden="true">` +
    `<path d="M10 3.25a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5Z" stroke="currentColor" stroke-width="1.45"/>` +
    `<path d="M6.6 10h6.8M10 6.6v6.8" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"/>` +
    `<path d="M4.6 7.75h10.8M4.6 12.25h10.8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" opacity="0.65"/>` +
    `</svg>`
  );
}

function defaultPageIconSvg(): string {
  // Document/page glyph for tweak-registered pages without their own icon.
  return (
    `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm inline-block align-middle" aria-hidden="true">` +
    `<path d="M5 3h7l3 3v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="M12 3v3a1 1 0 0 0 1 1h2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="M7 11h6M7 14h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>` +
    `</svg>`
  );
}

async function resolveIconUrl(
  url: string,
  tweakDir: string,
): Promise<string | null> {
  if (/^(https?:|data:)/.test(url)) return url;
  // Relative path → ask main to read the file and return a data: URL.
  // Renderer is sandboxed so file:// won't load directly.
  const rel = url.startsWith("./") ? url.slice(2) : url;
  try {
    return (await ipcRenderer.invoke(
      "codexpp:read-tweak-asset",
      tweakDir,
      rel,
    )) as string;
  } catch (e) {
    plog("icon load failed", { url, tweakDir, err: String(e) });
    return null;
  }
}

// ─────────────────────────────────────────────────────── DOM heuristics ──

function findSidebarItemsGroup(): HTMLElement | null {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>("aside,nav,[role='navigation'],div"),
  );

  let best: HTMLElement | null = null;
  let bestScore = -1;
  let bestArea = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    if (candidate.dataset.codexpp) continue;
    if (!isSettingsSidebarCandidate(candidate)) continue;

    const labels = codexPpSettingsLabelsFrom(candidate);
    const score = codexPpSettingsLabelScore(labels);
    const rect = candidate.getBoundingClientRect();
    const area = rect.width * rect.height;
    const weighted = score.core * 100 + score.total;

    if (weighted > bestScore || (weighted === bestScore && area < bestArea)) {
      best = candidate;
      bestScore = weighted;
      bestArea = area;
    }
  }

  return best;
}

const FORBIDDEN_SETTINGS_SIDEBAR_SELECTOR = [
  "[data-composer-overlay-floating-ui='true']",
  "[data-codexpp-slash-menu='true']",
  "[data-codexpp-overlay-noise='true']",
  ".composer-home-top-menu",
  ".vertical-scroll-fade-mask",
  "[class*='[container-name:home-main-content]']",
].join(",");

function isForbiddenSettingsSidebarSurface(node: Element | null): boolean {
  if (!node) return false;
  const el = node instanceof HTMLElement ? node : node.parentElement;
  if (!el) return false;
  if (el.closest(FORBIDDEN_SETTINGS_SIDEBAR_SELECTOR)) return true;
  if (el.querySelector("[data-list-navigation-item='true'], [cmdk-item]")) return true;
  return false;
}

function isSettingsSidebarCandidate(el: HTMLElement): boolean {
  const rect = codexPpVisibleBox(el);
  if (!rect) return false;

  // Current Codex Settings sidebar: left column, not the main content panel.
  if (rect.width < 120 || rect.width > 620) return false;
  if (rect.height < 80) return false;
  if (rect.left > window.innerWidth * 0.65) return false;

  const labels = codexPpSettingsLabelsFrom(el);
  if (hasMainAppSidebarSignals(labels) && !hasCodexPpSettingsOnlySignal(labels)) {
    return false;
  }

  return isCodexPpSettingsLabelSet(labels);
}

function removeMisplacedSettingsGroups(): void {
  const groups = document.querySelectorAll<HTMLElement>(
    "[data-codexpp='nav-group'], [data-codexpp='pages-group'], [data-codexpp='native-nav-header']",
  );
  for (const group of Array.from(groups)) {
    if (isCodexPpInjectedSettingsGroupPlacementValid(group)) continue;
    resetCodexPpInjectedSettingsGroupState(group);
    group.remove();
  }
}

function isCodexPpInjectedSettingsGroupPlacementValid(group: HTMLElement): boolean {
  if (isForbiddenSettingsSidebarSurface(group)) return false;

  let node = group.parentElement;
  for (let depth = 0; node && depth < 4; depth++) {
    if (isForbiddenSettingsSidebarSurface(node)) return false;
    if (isSettingsSidebarCandidate(node)) return true;
    node = node.parentElement;
  }

  return false;
}

function resetCodexPpInjectedSettingsGroupState(group: HTMLElement): void {
  if (state.navGroup === group || (state.navGroup && group.contains(state.navGroup))) {
    state.navGroup = null;
    state.navButtons = null;
    state.codexPlusPlusUpdateButton = null;
  }
  if (state.pagesGroup === group || (state.pagesGroup && group.contains(state.pagesGroup))) {
    state.pagesGroup = null;
    state.pagesGroupKey = null;
    for (const p of state.pages.values()) p.navButton = null;
  }
  if (state.nativeNavHeader === group || (state.nativeNavHeader && group.contains(state.nativeNavHeader))) {
    state.nativeNavHeader = null;
  }
  if (state.sidebarRoot && state.sidebarRoot.contains(group)) {
    state.sidebarRoot = null;
  }
}

function findContentArea(): HTMLElement | null {
  const sidebar = findSidebarItemsGroup();
  if (!sidebar) return null;
  const sidebarRect = sidebar.getBoundingClientRect();
  const reusablePanel = document.querySelector<HTMLElement>('[data-codexpp="tweaks-panel"]');
  if (reusablePanel?.parentElement) return reusablePanel.parentElement;

  const candidates: Array<{ el: HTMLElement; score: number }> = [];
  let parent = sidebar.parentElement;
  let depth = 0;
  while (parent && depth < 8) {
    for (const child of Array.from(parent.children) as HTMLElement[]) {
      if (child === sidebar || child.contains(sidebar)) continue;
      if (sidebar.contains(child)) continue;
      const r = codexPpVisibleBox(child);
      if (!r) continue;
      if (r.width < 300 || r.height < 200) continue;

      // The settings content area is the large panel to the right of the
      // settings sidebar. Avoid selecting scroll/blank siblings inside the
      // sidebar itself, which causes provider pages to render in the left nav.
      const rightOfSidebar = r.left >= sidebarRect.right - 8;
      const meaningfullyWiderThanSidebar = r.width >= Math.max(360, sidebarRect.width * 1.05);
      if (!rightOfSidebar && !meaningfullyWiderThanSidebar) continue;

      const text = compactSettingsText(child.textContent ?? "");
      const nativeSettingsSignal = /工作模式|权限|默认权限|常规|General|Permissions|Work mode/i.test(text) ? 5000 : 0;
      const rightBias = Math.max(0, r.left - sidebarRect.left);
      const score = nativeSettingsSignal + rightBias + r.width + r.height - depth * 100;
      candidates.push({ el: child, score });
    }
    parent = parent.parentElement;
    depth += 1;
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.el ?? null;
}

function maybeDumpDom(): void {
  try {
    const sidebar = findSidebarItemsGroup();
    if (sidebar && !state.sidebarDumped) {
      state.sidebarDumped = true;
      const sbRoot = sidebar.parentElement ?? sidebar;
      plog(`codex sidebar HTML`, sbRoot.outerHTML.slice(0, 32000));
    }
    const content = findContentArea();
    if (!content) {
      if (state.fingerprint !== location.href) {
        state.fingerprint = location.href;
        plog("dom probe (no content)", {
          url: location.href,
          sidebar: sidebar ? describe(sidebar) : null,
        });
      }
      return;
    }
    let panel: HTMLElement | null = null;
    for (const child of Array.from(content.children) as HTMLElement[]) {
      if (child.dataset.codexpp === "tweaks-panel") continue;
      if (child.style.display === "none") continue;
      panel = child;
      break;
    }
    const activeNav = sidebar
      ? Array.from(sidebar.querySelectorAll<HTMLElement>("button, a")).find(
          (b) =>
            b.getAttribute("aria-current") === "page" ||
            b.getAttribute("data-active") === "true" ||
            b.getAttribute("aria-selected") === "true" ||
            b.classList.contains("active"),
        )
      : null;
    const heading = panel?.querySelector<HTMLElement>(
      "h1, h2, h3, [class*='heading']",
    );
    const fingerprint = `${activeNav?.textContent ?? ""}|${heading?.textContent ?? ""}|${panel?.children.length ?? 0}`;
    if (state.fingerprint === fingerprint) return;
    state.fingerprint = fingerprint;
    plog("dom probe", {
      url: location.href,
      activeNav: activeNav?.textContent?.trim() ?? null,
      heading: heading?.textContent?.trim() ?? null,
      content: describe(content),
    });
    if (panel) {
      const html = panel.outerHTML;
      plog(
        `codex panel HTML (${activeNav?.textContent?.trim() ?? "?"})`,
        html.slice(0, 32000),
      );
    }
  } catch (e) {
    plog("dom probe failed", String(e));
  }
}

function describe(el: HTMLElement): Record<string, unknown> {
  return {
    tag: el.tagName,
    cls: el.className.slice(0, 120),
    id: el.id || undefined,
    children: el.children.length,
    rect: (() => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    })(),
  };
}

function tweaksPath(): string {
  return (
    (window as unknown as { __codexpp_tweaks_dir__?: string }).__codexpp_tweaks_dir__ ??
    "<user dir>/tweaks"
  );
}
