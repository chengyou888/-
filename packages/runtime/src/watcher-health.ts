import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

type CheckStatus = "ok" | "warn" | "error";

export interface WatcherHealthCheck {
  name: string;
  status: CheckStatus;
  detail: string;
}

export interface WatcherHealth {
  checkedAt: string;
  status: CheckStatus;
  title: string;
  summary: string;
  watcher: string;
  checks: WatcherHealthCheck[];
}

interface InstallerState {
  appRoot?: string;
  version?: string;
  watcher?: "launchd" | "login-item" | "scheduled-task" | "windows-service" | "systemd" | "none";
}

interface RuntimeConfig {
  codexPlusPlus?: {
    enabled?: boolean;
    autoUpdate?: boolean;
  };
}

interface SelfUpdateState {
  status?: "checking" | "up-to-date" | "updated" | "failed" | "disabled" | "no-release";
  completedAt?: string;
  checkedAt?: string;
  latestVersion?: string | null;
  error?: string;
}

const LAUNCHD_LABEL = "com.codexplusplus.watcher";
const WATCHER_LOG = join(homedir(), "Library", "Logs", "codex-plusplus-watcher.log");

export function getWatcherHealth(userRoot: string): WatcherHealth {
  const checks: WatcherHealthCheck[] = [];
  const state = readJson<InstallerState>(join(userRoot, "state.json"));
  const config = readJson<RuntimeConfig>(join(userRoot, "config.json")) ?? {};
  const selfUpdate = readJson<SelfUpdateState>(join(userRoot, "self-update-state.json"));

  checks.push({
    name: "Install state",
    status: state ? "ok" : "error",
    detail: state ? `codex汉化增强plus版 ${state.version ?? "(unknown version)"}` : "state.json is missing",
  });

  if (!state) return summarize("none", checks);

  const pluginEnabled = config.codexPlusPlus?.enabled !== false;
  checks.push({
    name: "Plugin switch",
    status: pluginEnabled ? "ok" : "warn",
    detail: pluginEnabled ? "enabled" : "disabled in codex-plusplus config",
  });

  const autoUpdate = config.codexPlusPlus?.autoUpdate !== false;
  checks.push({
    name: "Automatic refresh",
    status: pluginEnabled && autoUpdate ? "ok" : "warn",
    detail: pluginEnabled
      ? (autoUpdate ? "enabled" : "disabled in codex-plusplus config")
      : "skipped because plugin switch is off",
  });

  checks.push({
    name: "Watcher kind",
    status: state.watcher && state.watcher !== "none" ? "ok" : "error",
    detail: state.watcher ?? "none",
  });

  if (selfUpdate) {
    checks.push(selfUpdateCheck(selfUpdate));
  }

  const appRoot = state.appRoot ?? "";
  checks.push({
    name: "Codex app",
    status: appRoot && existsSync(appRoot) ? "ok" : "error",
    detail: appRoot || "missing appRoot in state",
  });

  switch (platform()) {
    case "darwin":
      checks.push(...checkLaunchdWatcher(appRoot));
      break;
    case "linux":
      checks.push(...checkSystemdWatcher(appRoot));
      break;
    case "win32":
      if (state.watcher === "windows-service") {
        checks.push(...checkWindowsServiceWatcher(userRoot));
      } else {
        checks.push(...checkScheduledTaskWatcher());
      }
      break;
    default:
      checks.push({
        name: "Platform watcher",
        status: "warn",
        detail: `unsupported platform: ${platform()}`,
      });
  }

  return summarize(state.watcher ?? "none", checks);
}

function selfUpdateCheck(state: SelfUpdateState): WatcherHealthCheck {
  const at = state.completedAt ?? state.checkedAt ?? "unknown time";
  if (state.status === "failed") {
    return {
      name: "last codex汉化增强plus版 update",
      status: "warn",
      detail: state.error ? `failed ${at}: ${state.error}` : `failed ${at}`,
    };
  }
  if (state.status === "disabled") {
    return { name: "last codex汉化增强plus版 update", status: "warn", detail: `skipped ${at}: automatic refresh disabled` };
  }
  if (state.status === "no-release") {
    return { name: "last codex汉化增强plus版 update", status: "ok", detail: `no published release found ${at}` };
  }
  if (state.status === "updated") {
    return { name: "last codex汉化增强plus版 update", status: "ok", detail: `updated ${at} to ${state.latestVersion ?? "new release"}` };
  }
  if (state.status === "up-to-date") {
    return { name: "last codex汉化增强plus版 update", status: "ok", detail: `up to date ${at}` };
  }
  return { name: "last codex汉化增强plus版 update", status: "warn", detail: `checking since ${at}` };
}

function checkLaunchdWatcher(appRoot: string): WatcherHealthCheck[] {
  const checks: WatcherHealthCheck[] = [];
  const plistPath = join(homedir(), "Library", "LaunchAgents", `${LAUNCHD_LABEL}.plist`);
  const plist = existsSync(plistPath) ? readFileSafe(plistPath) : "";
  const asarPath = appRoot ? join(appRoot, "Contents", "Resources", "app.asar") : "";

  checks.push({
    name: "launchd plist",
    status: plist ? "ok" : "error",
    detail: plistPath,
  });

  if (plist) {
    checks.push({
      name: "launchd label",
      status: plist.includes(LAUNCHD_LABEL) ? "ok" : "error",
      detail: LAUNCHD_LABEL,
    });
    checks.push({
      name: "launchd trigger",
      status: asarPath && plist.includes(asarPath) ? "ok" : "error",
      detail: asarPath || "missing appRoot",
    });
    checks.push({
      name: "watcher command",
      status: plist.includes("CODEX_PLUSPLUS_WATCHER=1") && plist.includes(" update --watcher --quiet")
        ? "ok"
        : "error",
      detail: commandSummary(plist),
    });

    const cliPath = extractFirst(plist, /'([^']*packages\/installer\/dist\/cli\.js)'/);
    if (cliPath) {
      checks.push({
        name: "repair CLI",
        status: existsSync(cliPath) ? "ok" : "error",
        detail: cliPath,
      });
    }
  }

  const loaded = commandSucceeds("launchctl", ["list", LAUNCHD_LABEL]);
  checks.push({
    name: "launchd loaded",
    status: loaded ? "ok" : "error",
    detail: loaded ? "service is loaded" : "launchctl cannot find the watcher",
  });

  checks.push(watcherLogCheck());
  return checks;
}

function checkSystemdWatcher(appRoot: string): WatcherHealthCheck[] {
  const dir = join(homedir(), ".config", "systemd", "user");
  const service = join(dir, "codex-plusplus-watcher.service");
  const timer = join(dir, "codex-plusplus-watcher.timer");
  const pathUnit = join(dir, "codex-plusplus-watcher.path");
  const expectedPath = appRoot ? join(appRoot, "resources", "app.asar") : "";
  const pathBody = existsSync(pathUnit) ? readFileSafe(pathUnit) : "";

  return [
    {
      name: "systemd service",
      status: existsSync(service) ? "ok" : "error",
      detail: service,
    },
    {
      name: "systemd timer",
      status: existsSync(timer) ? "ok" : "error",
      detail: timer,
    },
    {
      name: "systemd path",
      status: pathBody && expectedPath && pathBody.includes(expectedPath) ? "ok" : "error",
      detail: expectedPath || pathUnit,
    },
    {
      name: "path unit active",
      status: commandSucceeds("systemctl", ["--user", "is-active", "--quiet", "codex-plusplus-watcher.path"]) ? "ok" : "warn",
      detail: "systemctl --user is-active codex-plusplus-watcher.path",
    },
    {
      name: "timer active",
      status: commandSucceeds("systemctl", ["--user", "is-active", "--quiet", "codex-plusplus-watcher.timer"]) ? "ok" : "warn",
      detail: "systemctl --user is-active codex-plusplus-watcher.timer",
    },
  ];
}

function checkScheduledTaskWatcher(): WatcherHealthCheck[] {
  return [
    {
      name: "logon task",
      status: commandSucceeds("schtasks.exe", ["/Query", "/TN", "codex-plusplus-watcher"]) ? "ok" : "error",
      detail: "codex-plusplus-watcher",
    },
    {
      name: "hourly task",
      status: commandSucceeds("schtasks.exe", ["/Query", "/TN", "codex-plusplus-watcher-hourly"]) ? "ok" : "warn",
      detail: "codex-plusplus-watcher-hourly",
    },
  ];
}

function checkWindowsServiceWatcher(userRoot: string): WatcherHealthCheck[] {
  const serviceName = "codex-plusplus-watcher";
  const query = commandOutput("sc.exe", ["query", serviceName]);
  const installed = query !== null && !/FAILED\s+1060/i.test(query);
  const running = installed && /STATE\s*:\s*\d+\s+RUNNING/i.test(query);
  const legacyTaskExists =
    commandSucceeds("schtasks.exe", ["/Query", "/TN", "codex-plusplus-watcher"]) ||
    commandSucceeds("schtasks.exe", ["/Query", "/TN", "codex-plusplus-watcher-interval"]) ||
    commandSucceeds("schtasks.exe", ["/Query", "/TN", "codex-plusplus-watcher-hourly"]);
  return [
    {
      name: "Windows service",
      status: installed ? "ok" : "error",
      detail: serviceName,
    },
    {
      name: "service state",
      status: running ? "ok" : "warn",
      detail: running ? "running" : "installed but not running",
    },
    {
      name: "legacy scheduled tasks",
      status: legacyTaskExists ? "warn" : "ok",
      detail: legacyTaskExists ? "old watcher tasks still exist" : "removed",
    },
    watcherLogCheck(join(userRoot, "log", "watcher-service.log")),
  ];
}

function watcherLogCheck(path = WATCHER_LOG): WatcherHealthCheck {
  if (!existsSync(path)) {
    return { name: "watcher log", status: "warn", detail: "no watcher log yet" };
  }
  const tail = readFileSafe(path).split(/\r?\n/).slice(-40).join("\n");
  return analyzeWatcherLogTail(tail, path);
}

export function analyzeWatcherLogTail(tail: string, path = WATCHER_LOG): WatcherHealthCheck {
  const relevantTail = stripBenignWatcherLogNoise(recentWatcherSessionTail(tail));
  const hasError = /✗ codex-plusplus failed|codex-plusplus failed|error|failed/i.test(relevantTail);
  const needsManualRepair =
    hasError &&
    /Cannot write to .*Codex.*\.app|App Management|file ownership|sudo codexplusplus (?:install|repair)|EACCES|EPERM/i.test(relevantTail);
  return {
    name: "watcher log",
    status: hasError ? "warn" : "ok",
    detail: hasError
      ? needsManualRepair
        ? "auto-repair needs app permissions; run `codexplusplus repair` from Terminal"
        : "recent watcher log contains an error"
      : path,
  };
}

function recentWatcherSessionTail(tail: string): string {
  const marker = "codex-plusplus watcher service started";
  const index = tail.lastIndexOf(marker);
  if (index < 0) return tail;
  const lineStart = tail.lastIndexOf("\n", index);
  return tail.slice(lineStart >= 0 ? lineStart + 1 : index);
}

function stripBenignWatcherLogNoise(tail: string): string {
  return tail
    .replace(/^\[[^\n]+\] .*codex-plusplus failed\r?\nRelease check failed: 404 Not Found[\s\S]*?^\[[^\n]+\] node .* update --watcher --quiet --no-repair failed: exit status 0xc0000409\r?$/gim, "")
    .replace(/^\[[^\n]+\] .*codex-plusplus failed\r?\nRelease check failed: 404 Not Found[\s\S]*?(?=^\[[^\n]+\] |\s*$)/gim, "")
    .replace(/^\[[^\n]+\] node .* update --watcher --quiet --no-repair failed: exit status 0xc0000409\r?$/gim, "");
}

function summarize(watcher: string, checks: WatcherHealthCheck[]): WatcherHealth {
  const hasError = checks.some((c) => c.status === "error");
  const hasWarn = checks.some((c) => c.status === "warn");
  const status: CheckStatus = hasError ? "error" : hasWarn ? "warn" : "ok";
  const failed = checks.filter((c) => c.status === "error").length;
  const warned = checks.filter((c) => c.status === "warn").length;
  const title =
    status === "ok"
      ? "Auto-repair watcher is ready"
      : status === "warn"
        ? "Auto-repair watcher needs review"
        : "Auto-repair watcher is not ready";
  const summary =
    status === "ok"
      ? "codex汉化增强plus版 should automatically repair itself after Codex updates."
      : `${failed} failing check(s), ${warned} warning(s).`;

  return {
    checkedAt: new Date().toISOString(),
    status,
    title,
    summary,
    watcher,
    checks,
  };
}

function commandSucceeds(command: string, args: string[]): boolean {
  try {
    execFileSync(command, args, { stdio: "ignore", timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

function commandOutput(command: string, args: string[]): string | null {
  try {
    return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 5_000 });
  } catch (e) {
    const err = e as { stdout?: unknown; stderr?: unknown };
    const stdout = typeof err.stdout === "string" ? err.stdout : "";
    const stderr = typeof err.stderr === "string" ? err.stderr : "";
    return stdout || stderr || null;
  }
}

function commandSummary(plist: string): string {
  const command = extractFirst(plist, /<string>([^<]*(?:update --watcher --quiet|repair --quiet)[^<]*)<\/string>/);
  return command ? unescapeXml(command).replace(/\s+/g, " ").trim() : "watcher command not found";
}

function extractFirst(source: string, pattern: RegExp): string | null {
  return source.match(pattern)?.[1] ?? null;
}

function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

function readFileSafe(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function unescapeXml(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
