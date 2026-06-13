import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

test("windows env launcher points desktop app-server at isolated CODEX_HOME", () => {
  const source = readFileSync(
    resolve(repoRoot, "packages/installer/assets/windows-codex-env-launcher/main.go"),
    "utf8",
  );

  assert.match(source, /APPDATA/);
  assert.match(source, /codex-plusplus/);
  assert.match(source, /desktop-codex-home/);
  assert.match(source, /CODEX_HOME=/);
  assert.match(source, /CODEXPP_DESKTOP_CODEX_HOME=/);
  assert.match(source, /HideWindow:\s*true/);
  assert.match(source, /CreationFlags:\s*windowsCreateNoWindow/);
  assert.match(source, /hiddenCommand\("reg\.exe"/);
});

test("installer wraps and restores only the desktop resources codex exe", () => {
  const installSource = readFileSync(
    resolve(repoRoot, "packages/installer/src/commands/install.ts"),
    "utf8",
  );
  const uninstallSource = readFileSync(
    resolve(repoRoot, "packages/installer/src/commands/uninstall.ts"),
    "utf8",
  );

  assert.match(installSource, /WINDOWS_CODEX_ENV_LAUNCHER_ORIGINAL = "codexpp-codex-original\.exe"/);
  assert.match(installSource, /join\(codex\.resourcesDir,\s*"codex\.exe"\)/);
  assert.match(installSource, /-H windowsgui/);
  assert.match(uninstallSource, /restoreWindowsCodexEnvLauncher\(codex\)/);
});
