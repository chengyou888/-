"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWatcherHealth = getWatcherHealth;
exports.analyzeWatcherLogTail = analyzeWatcherLogTail;
const node_child_process_1 = require("node:child_process");
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const LAUNCHD_LABEL = "com.codexplusplus.watcher";
const WATCHER_LOG = (0, node_path_1.join)((0, node_os_1.homedir)(), "Library", "Logs", "codex-plusplus-watcher.log");
function getWatcherHealth(userRoot) {
    const checks = [];
    const state = readJson((0, node_path_1.join)(userRoot, "state.json"));
    const config = readJson((0, node_path_1.join)(userRoot, "config.json")) ?? {};
    const selfUpdate = readJson((0, node_path_1.join)(userRoot, "self-update-state.json"));
    checks.push({
        name: "Install state",
        status: state ? "ok" : "error",
        detail: state ? `codex汉化增强plus版 ${state.version ?? "(unknown version)"}` : "state.json is missing",
    });
    if (!state)
        return summarize("none", checks);
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
        status: appRoot && (0, node_fs_1.existsSync)(appRoot) ? "ok" : "error",
        detail: appRoot || "missing appRoot in state",
    });
    switch ((0, node_os_1.platform)()) {
        case "darwin":
            checks.push(...checkLaunchdWatcher(appRoot));
            break;
        case "linux":
            checks.push(...checkSystemdWatcher(appRoot));
            break;
        case "win32":
            if (state.watcher === "windows-service") {
                checks.push(...checkWindowsServiceWatcher(userRoot));
            }
            else {
                checks.push(...checkScheduledTaskWatcher());
            }
            break;
        default:
            checks.push({
                name: "Platform watcher",
                status: "warn",
                detail: `unsupported platform: ${(0, node_os_1.platform)()}`,
            });
    }
    return summarize(state.watcher ?? "none", checks);
}
function selfUpdateCheck(state) {
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
function checkLaunchdWatcher(appRoot) {
    const checks = [];
    const plistPath = (0, node_path_1.join)((0, node_os_1.homedir)(), "Library", "LaunchAgents", `${LAUNCHD_LABEL}.plist`);
    const plist = (0, node_fs_1.existsSync)(plistPath) ? readFileSafe(plistPath) : "";
    const asarPath = appRoot ? (0, node_path_1.join)(appRoot, "Contents", "Resources", "app.asar") : "";
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
                status: (0, node_fs_1.existsSync)(cliPath) ? "ok" : "error",
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
function checkSystemdWatcher(appRoot) {
    const dir = (0, node_path_1.join)((0, node_os_1.homedir)(), ".config", "systemd", "user");
    const service = (0, node_path_1.join)(dir, "codex-plusplus-watcher.service");
    const timer = (0, node_path_1.join)(dir, "codex-plusplus-watcher.timer");
    const pathUnit = (0, node_path_1.join)(dir, "codex-plusplus-watcher.path");
    const expectedPath = appRoot ? (0, node_path_1.join)(appRoot, "resources", "app.asar") : "";
    const pathBody = (0, node_fs_1.existsSync)(pathUnit) ? readFileSafe(pathUnit) : "";
    return [
        {
            name: "systemd service",
            status: (0, node_fs_1.existsSync)(service) ? "ok" : "error",
            detail: service,
        },
        {
            name: "systemd timer",
            status: (0, node_fs_1.existsSync)(timer) ? "ok" : "error",
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
function checkScheduledTaskWatcher() {
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
function checkWindowsServiceWatcher(userRoot) {
    const serviceName = "codex-plusplus-watcher";
    const query = commandOutput("sc.exe", ["query", serviceName]);
    const installed = query !== null && !/FAILED\s+1060/i.test(query);
    const running = installed && /STATE\s*:\s*\d+\s+RUNNING/i.test(query);
    const legacyTaskExists = commandSucceeds("schtasks.exe", ["/Query", "/TN", "codex-plusplus-watcher"]) ||
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
        watcherLogCheck((0, node_path_1.join)(userRoot, "log", "watcher-service.log")),
    ];
}
function watcherLogCheck(path = WATCHER_LOG) {
    if (!(0, node_fs_1.existsSync)(path)) {
        return { name: "watcher log", status: "warn", detail: "no watcher log yet" };
    }
    const tail = readFileSafe(path).split(/\r?\n/).slice(-40).join("\n");
    return analyzeWatcherLogTail(tail, path);
}
function analyzeWatcherLogTail(tail, path = WATCHER_LOG) {
    const relevantTail = stripBenignWatcherLogNoise(recentWatcherSessionTail(tail));
    const hasError = /✗ codex-plusplus failed|codex-plusplus failed|error|failed/i.test(relevantTail);
    const needsManualRepair = hasError &&
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
function recentWatcherSessionTail(tail) {
    const marker = "codex-plusplus watcher service started";
    const index = tail.lastIndexOf(marker);
    if (index < 0)
        return tail;
    const lineStart = tail.lastIndexOf("\n", index);
    return tail.slice(lineStart >= 0 ? lineStart + 1 : index);
}
function stripBenignWatcherLogNoise(tail) {
    return tail
        .replace(/^\[[^\n]+\] .*codex-plusplus failed\r?\nRelease check failed: 404 Not Found[\s\S]*?^\[[^\n]+\] node .* update --watcher --quiet --no-repair failed: exit status 0xc0000409\r?$/gim, "")
        .replace(/^\[[^\n]+\] .*codex-plusplus failed\r?\nRelease check failed: 404 Not Found[\s\S]*?(?=^\[[^\n]+\] |\s*$)/gim, "")
        .replace(/^\[[^\n]+\] node .* update --watcher --quiet --no-repair failed: exit status 0xc0000409\r?$/gim, "");
}
function summarize(watcher, checks) {
    const hasError = checks.some((c) => c.status === "error");
    const hasWarn = checks.some((c) => c.status === "warn");
    const status = hasError ? "error" : hasWarn ? "warn" : "ok";
    const failed = checks.filter((c) => c.status === "error").length;
    const warned = checks.filter((c) => c.status === "warn").length;
    const title = status === "ok"
        ? "Auto-repair watcher is ready"
        : status === "warn"
            ? "Auto-repair watcher needs review"
            : "Auto-repair watcher is not ready";
    const summary = status === "ok"
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
function commandSucceeds(command, args) {
    try {
        (0, node_child_process_1.execFileSync)(command, args, { stdio: "ignore", timeout: 5_000 });
        return true;
    }
    catch {
        return false;
    }
}
function commandOutput(command, args) {
    try {
        return (0, node_child_process_1.execFileSync)(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 5_000 });
    }
    catch (e) {
        const err = e;
        const stdout = typeof err.stdout === "string" ? err.stdout : "";
        const stderr = typeof err.stderr === "string" ? err.stderr : "";
        return stdout || stderr || null;
    }
}
function commandSummary(plist) {
    const command = extractFirst(plist, /<string>([^<]*(?:update --watcher --quiet|repair --quiet)[^<]*)<\/string>/);
    return command ? unescapeXml(command).replace(/\s+/g, " ").trim() : "watcher command not found";
}
function extractFirst(source, pattern) {
    return source.match(pattern)?.[1] ?? null;
}
function readJson(path) {
    try {
        return JSON.parse((0, node_fs_1.readFileSync)(path, "utf8"));
    }
    catch {
        return null;
    }
}
function readFileSafe(path) {
    try {
        return (0, node_fs_1.readFileSync)(path, "utf8");
    }
    catch {
        return "";
    }
}
function unescapeXml(value) {
    return value
        .replace(/&quot;/g, "\"")
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");
}
//# sourceMappingURL=watcher-health.js.map