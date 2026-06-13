/**
 * Watcher: a small process scheduled to run at user login that compares the
 * current Codex.app's asar hash against the patched hash we recorded at
 * install. If they don't match, Sparkle has updated Codex over our patch —
 * we either auto-`repair` or surface a notification, depending on user prefs.
 *
 * Implementation per OS:
 *   macOS:   ~/Library/LaunchAgents/com.codexplusplus.watcher.plist (launchd)
 *   Linux:   ~/.config/systemd/user/codex-plusplus-watcher.service (systemd --user)
 *   Windows: Task Scheduler entry via schtasks.exe
 *
 * The watcher itself is just `codex-plusplus repair --quiet` triggered on the
 * relevant event (app launch / login). The simplest cross-platform approach
 * is "run at login" + "run when Codex.app is modified" (FSEvents/inotify on
 * unix, but launchd's WatchPaths handles it on mac).
 */
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { homedir, platform, userInfo } from "node:os";
import { execFileSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chownForTargetUser, targetUserHome, targetUserOwnership } from "./ownership.js";
import { ensureUserPaths } from "./paths.js";

export type WatcherKind = "launchd" | "login-item" | "scheduled-task" | "windows-service" | "systemd" | "none";

export function installWatcher(appRoot: string): WatcherKind {
  switch (platform()) {
    case "darwin":
      return installLaunchd(appRoot);
    case "linux":
      return installSystemd(appRoot);
    case "win32":
      return installWindowsService(appRoot);
    default:
      return "none";
  }
}

export function uninstallWatcher(): void {
  switch (platform()) {
    case "darwin":
      return uninstallLaunchd();
    case "linux":
      return uninstallSystemd();
    case "win32":
      return uninstallWindowsWatcher();
  }
}

const LABEL = "com.codexplusplus.watcher";
const WINDOWS_SERVICE_NAME = "codex-plusplus-watcher";
const WATCHER_INTERVAL_SECONDS = 5 * 60;

function launchdPath(): string {
  return join(targetUserHome(), "Library", "LaunchAgents", `${LABEL}.plist`);
}

function launchdLogPath(): string {
  return join(targetUserHome(), "Library", "Logs", "codex-plusplus-watcher.log");
}

function installLaunchd(appRoot: string): WatcherKind {
  if (isRunningFromWatcher()) return "launchd";

  const plPath = launchdPath();
  mkdirSync(dirname(plPath), { recursive: true });
  const logPath = launchdLogPath();
  mkdirSync(dirname(logPath), { recursive: true });
  // Trigger on login + when Codex.app's asar changes. Run this installed CLI
  // directly so auto-repair does not depend on npm availability. The CLI
  // throttles GitHub release checks, so this interval keeps app repair prompt.
  const repair = xmlEscape(watcherShellScript(logPath));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string>
    <string>-c</string>
    <string>${repair}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StartInterval</key>
  <integer>${WATCHER_INTERVAL_SECONDS}</integer>
  <key>WatchPaths</key>
  <array>
    <string>${appRoot}/Contents/Resources/app.asar</string>
  </array>
  <key>ThrottleInterval</key>
  <integer>10</integer>
  <key>StandardOutPath</key>
  <string>${logPath}</string>
  <key>StandardErrorPath</key>
  <string>${logPath}</string>
  </dict>
</plist>`;
  writeFileSync(plPath, xml);
  writeFileSync(logPath, "", { flag: "a" });
  chownForTargetUser(plPath);
  chownForTargetUser(logPath);
  if (!bootstrapLaunchd(plPath)) {
    try {
      execLaunchctlForTargetUser(["unload", plPath]);
    } catch {}
    execLaunchctlForTargetUser(["load", plPath]);
  }
  return "launchd";
}

function isRunningFromWatcher(): boolean {
  return process.env.CODEX_PLUSPLUS_WATCHER === "1" || process.env.XPC_SERVICE_NAME === LABEL;
}

function uninstallLaunchd(): void {
  const plPath = launchdPath();
  if (!existsSync(plPath)) return;
  bootoutLaunchd(plPath);
  try {
    execLaunchctlForTargetUser(["unload", plPath]);
  } catch {}
  rmSync(plPath, { force: true });
}

function bootstrapLaunchd(plPath: string): boolean {
  const domain = launchdGuiDomain();
  if (!domain) return false;
  bootoutLaunchd(plPath);
  try {
    execFileSync("launchctl", ["bootstrap", domain, plPath], { stdio: "ignore" });
    execFileSync("launchctl", ["enable", `${domain}/${LABEL}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function bootoutLaunchd(plPath: string): void {
  const domain = launchdGuiDomain();
  if (!domain) return;
  try {
    execFileSync("launchctl", ["bootout", domain, plPath], { stdio: "ignore" });
  } catch {}
}

function launchdGuiDomain(): string | null {
  const uid = targetUserOwnership()?.uid ?? (typeof process.getuid === "function" ? process.getuid() : userInfo().uid);
  return typeof uid === "number" ? `gui/${uid}` : null;
}

function execLaunchctlForTargetUser(args: string[]): void {
  const owner = targetUserOwnership();
  const currentUid = typeof process.getuid === "function" ? process.getuid() : null;
  if (owner && currentUid === 0 && owner.uid !== 0) {
    execFileSync("launchctl", ["asuser", String(owner.uid), "launchctl", ...args], {
      stdio: "ignore",
    });
    return;
  }
  execFileSync("launchctl", args, { stdio: "ignore" });
}

function installSystemd(appRoot: string): WatcherKind {
  const dir = join(homedir(), ".config", "systemd", "user");
  mkdirSync(dir, { recursive: true });
  const repair = shellSingleQuote(watcherShellScript());
  const unit = `[Unit]
Description=codex-plusplus repair watcher

[Service]
Type=oneshot
ExecStart=/bin/sh -c ${repair}

[Install]
WantedBy=default.target
`;
  writeFileSync(join(dir, "codex-plusplus-watcher.service"), unit);
  writeFileSync(join(dir, "codex-plusplus-watcher.timer"), `[Unit]
Description=codex-plusplus repair watcher interval

[Timer]
OnBootSec=5m
OnUnitActiveSec=${Math.round(WATCHER_INTERVAL_SECONDS / 60)}m
Persistent=true

[Install]
WantedBy=timers.target
`);
  writeFileSync(join(dir, "codex-plusplus-watcher.path"), `[Unit]
Description=codex-plusplus app.asar watcher

[Path]
PathChanged=${appRoot}/resources/app.asar

[Install]
WantedBy=default.target
`);
  try {
    execFileSync("systemctl", ["--user", "daemon-reload"], { stdio: "ignore" });
    execFileSync("systemctl", ["--user", "enable", "codex-plusplus-watcher.service"], {
      stdio: "ignore",
    });
    execFileSync("systemctl", ["--user", "enable", "--now", "codex-plusplus-watcher.timer"], {
      stdio: "ignore",
    });
    execFileSync("systemctl", ["--user", "enable", "--now", "codex-plusplus-watcher.path"], {
      stdio: "ignore",
    });
  } catch {
    /* systemd may not be available */
  }
  return "systemd";
}

function uninstallSystemd(): void {
  const path = join(homedir(), ".config", "systemd", "user", "codex-plusplus-watcher.service");
  if (!existsSync(path)) return;
  try {
    execFileSync("systemctl", ["--user", "disable", "codex-plusplus-watcher.service"], {
      stdio: "ignore",
    });
    execFileSync("systemctl", ["--user", "disable", "--now", "codex-plusplus-watcher.path"], {
      stdio: "ignore",
    });
    execFileSync("systemctl", ["--user", "disable", "--now", "codex-plusplus-watcher.timer"], {
      stdio: "ignore",
    });
  } catch {}
  rmSync(path, { force: true });
  rmSync(join(homedir(), ".config", "systemd", "user", "codex-plusplus-watcher.path"), {
    force: true,
  });
  rmSync(join(homedir(), ".config", "systemd", "user", "codex-plusplus-watcher.timer"), {
    force: true,
  });
}

function installScheduledTask(_appRoot: string): WatcherKind {
  // schtasks.exe creates a logon-trigger task. We pass the watcher command via /TR.
  const repair = windowsWatcherTaskCommand();
  try {
    deleteScheduledTask("codex-plusplus-watcher-daily");
    execFileSync("schtasks.exe", [
      "/Create",
      "/F",
      "/SC",
      "ONLOGON",
      "/TN",
      "codex-plusplus-watcher",
      "/TR",
      repair,
    ]);
    deleteScheduledTask("codex-plusplus-watcher-hourly");
    deleteScheduledTask("codex-plusplus-watcher-interval");
    execFileSync("schtasks.exe", [
      "/Create",
      "/F",
      "/SC",
      "MINUTE",
      "/MO",
      String(Math.round(WATCHER_INTERVAL_SECONDS / 60)),
      "/TN",
      "codex-plusplus-watcher-interval",
      "/TR",
      repair,
    ]);
    return "scheduled-task";
  } catch {
    return "none";
  }
}

function installWindowsService(_appRoot: string): WatcherKind {
  uninstallScheduledTask();
  removeLegacyWindowsWatcherScript();

  const paths = ensureUserPaths();
  const cli = currentCliPath();
  const sourceRoot = sourceRootFromCli(cli);
  const logPath = join(paths.logDir, "watcher-service.log");
  const serviceExe = buildWindowsServiceHost(paths.root);
  const commandLine = windowsCommandLine([
    serviceExe,
    "--service-name",
    WINDOWS_SERVICE_NAME,
    "--home",
    paths.root,
    "--log",
    logPath,
    "--node",
    process.execPath,
    "--cli",
    cli,
    "--workdir",
    dirname(sourceRoot),
    "--interval-seconds",
    String(WATCHER_INTERVAL_SECONDS),
  ]);

  uninstallWindowsService();
  try {
    execFileSync("sc.exe", [
      "create",
      WINDOWS_SERVICE_NAME,
      "binPath=",
      commandLine,
      "start=",
      "auto",
      "DisplayName=",
      "Codex++ Watcher Service",
    ], { stdio: "ignore" });
    try {
      execFileSync("sc.exe", ["description", WINDOWS_SERVICE_NAME, "Keeps Codex++ loaded after Codex desktop updates."], { stdio: "ignore" });
    } catch {}
    try {
      execFileSync("sc.exe", ["failure", WINDOWS_SERVICE_NAME, "reset=", "60", "actions=", "restart/60000/restart/60000/\"\"/0"], { stdio: "ignore" });
    } catch {}
    try {
      execFileSync("sc.exe", ["start", WINDOWS_SERVICE_NAME], { stdio: "ignore" });
    } catch {}
    return "windows-service";
  } catch {
    uninstallWindowsService();
    return "none";
  }
}

function buildWindowsServiceHost(userRoot: string): string {
  const serviceSrc = resolve(dirname(currentCliPath()), "..", "assets", "windows-service-host");
  const outDir = join(userRoot, "service-host");
  const outExe = join(outDir, "codex-plusplus-watcher-service.exe");
  mkdirSync(outDir, { recursive: true });
  execFileSync("go", ["build", "-trimpath", "-ldflags", "-s -w -H windowsgui", "-o", outExe, "."], {
    cwd: serviceSrc,
    stdio: "ignore",
    env: {
      ...process.env,
      GOOS: "windows",
      GOARCH: process.env.GOARCH || "amd64",
    },
  });
  return outExe;
}

function cliShellCommand(command: string, args: string[] = []): string {
  const cli = currentCliPath();
  return [
    "CODEX_PLUSPLUS_WATCHER=1",
    shellQuote(process.execPath),
    ...nodeExecArgsForCli(cli).map(shellQuote),
    shellQuote(cli),
    command,
    ...args,
  ].join(" ");
}

export function watcherShellScript(logPath?: string): string {
  const commands = [
    "sleep 3",
    `${cliShellCommand("update", ["--watcher", "--quiet", "--no-repair"])} || true`,
    `${cliShellCommand("repair", ["--watcher", "--quiet"])} || true`,
  ];
  if (logPath) commands.unshift(`: > ${shellSingleQuote(logPath)}`);
  return commands.join("; ");
}

function currentCliPath(): string {
  const currentModulePath = fileURLToPath(import.meta.url);
  const extension = currentModulePath.endsWith(".ts") ? ".ts" : ".js";
  return join(dirname(currentModulePath), `cli${extension}`);
}

function sourceRootFromCli(cli: string): string {
  return resolve(dirname(cli), "..", "..", "..");
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function windowsCommand(command: string, args: string[] = []): string {
  const cli = currentCliPath();
  return [
    windowsQuote(process.execPath),
    ...nodeExecArgsForCli(cli).map(windowsQuote),
    windowsQuote(cli),
    command,
    ...args,
  ].join(" ");
}

function nodeExecArgsForCli(cliPath: string): string[] {
  return cliPath.endsWith(".ts") ? process.execArgv : [];
}

function windowsWatcherTaskCommand(): string {
  const scriptPath = join(windowsCodexPlusPlusDir(), "bin", "watcher.cmd");
  mkdirSync(dirname(scriptPath), { recursive: true });
  writeFileSync(
    scriptPath,
    [
      "@echo off",
      "set CODEX_PLUSPLUS_WATCHER=1",
      `${windowsCommand("update", ["--watcher", "--quiet", "--no-repair"])}`,
      `${windowsCommand("repair", ["--watcher", "--quiet"])}`,
      "exit /b 0",
      "",
    ].join("\r\n"),
  );
  return windowsQuote(scriptPath);
}

function windowsQuote(value: string): string {
  return `"${value.replace(/"/g, `\\"`)}"`;
}

function windowsCommandLine(args: string[]): string {
  return args.map(windowsQuote).join(" ");
}

function windowsCodexPlusPlusDir(): string {
  return join(process.env.APPDATA ?? join(homedir(), "AppData", "Roaming"), "codex-plusplus");
}

function uninstallScheduledTask(): void {
  deleteScheduledTask("codex-plusplus-watcher");
  deleteScheduledTask("codex-plusplus-watcher-interval");
  deleteScheduledTask("codex-plusplus-watcher-hourly");
  deleteScheduledTask("codex-plusplus-watcher-daily");
}

function uninstallWindowsWatcher(): void {
  uninstallWindowsService();
  uninstallScheduledTask();
  removeLegacyWindowsWatcherScript();
}

function uninstallWindowsService(): void {
  try {
    execFileSync("sc.exe", ["stop", WINDOWS_SERVICE_NAME], { stdio: "ignore" });
  } catch {}
  stopWindowsServiceProcess();
  try {
    execFileSync("sc.exe", ["delete", WINDOWS_SERVICE_NAME], { stdio: "ignore" });
  } catch {}
}

function stopWindowsServiceProcess(): void {
  try {
    const output = execFileSync("sc.exe", ["queryex", WINDOWS_SERVICE_NAME], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const pid = Number(output.match(/PID\s*:\s*(\d+)/i)?.[1] ?? 0);
    if (pid > 0) {
      execFileSync("taskkill.exe", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
    }
  } catch {}
}

function removeLegacyWindowsWatcherScript(): void {
  try {
    rmSync(join(windowsCodexPlusPlusDir(), "bin", "watcher.cmd"), { force: true });
  } catch {}
}

function deleteScheduledTask(name: string): void {
  for (const taskName of [name, `\\${name}`]) {
    try {
      execFileSync("schtasks.exe", ["/End", "/TN", taskName], { stdio: "ignore" });
    } catch {}
    try {
      execFileSync("schtasks.exe", ["/Change", "/Disable", "/TN", taskName], { stdio: "ignore" });
    } catch {}
    try {
      execFileSync("schtasks.exe", ["/Delete", "/F", "/TN", taskName], {
        stdio: "ignore",
      });
    } catch {}
  }
}
