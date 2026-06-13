import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { analyzeWatcherLogTail, getWatcherHealth } from "../src/watcher-health";

test("watcher health reports missing install state as not ready", () => {
  withTempDir((root) => {
    const health = getWatcherHealth(root);

    assert.equal(health.status, "error");
    assert.equal(health.watcher, "none");
    assert.equal(health.checks[0]?.name, "Install state");
    assert.equal(health.checks[0]?.status, "error");
  });
});

test("watcher health warns when automatic refresh is disabled", () => {
  withTempDir((root) => {
    writeFileSync(
      join(root, "state.json"),
      JSON.stringify({ version: "0.1.2", watcher: "none", appRoot: "/missing" }),
    );
    writeFileSync(
      join(root, "config.json"),
      JSON.stringify({ codexPlusPlus: { autoUpdate: false } }),
    );

    const health = getWatcherHealth(root);

    assert.equal(
      health.checks.find((check) => check.name === "Automatic refresh")?.status,
      "warn",
    );
    assert.equal(
      health.checks.find((check) => check.name === "Watcher kind")?.status,
      "error",
    );
  });
});

test("watcher log health points privileged repair failures to terminal repair", () => {
  const check = analyzeWatcherLogTail(`
✗ codex-plusplus failed
Cannot write to /Applications/Codex.app/Contents/Info.plist.

macOS App Management or file ownership is blocking modification of /Applications/Codex.app/Contents/Info.plist.
Fix:
  Open Terminal and run: codexplusplus repair
`);

  assert.equal(check.name, "watcher log");
  assert.equal(check.status, "warn");
  assert.equal(check.detail, "auto-repair needs app permissions; run `codexplusplus repair` from Terminal");
});

test("watcher log health ignores stale release 404 self-update blocks", () => {
  const check = analyzeWatcherLogTail(`[2026-06-12T20:04:37.3299873Z] ✗ codex-plusplus failed
Release check failed: 404 Not Found

If the message above does not explain how to fix it, please report this on GitHub:
https://aiopentool.com/?title=Codex%2B%2B+update+failed
Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\\win\\async.c, line 76
[2026-06-12T20:04:37.3299873Z] node E:\\git\\codex+\\packages\\installer\\dist\\cli.js update --watcher --quiet --no-repair failed: exit status 0xc0000409
[2026-06-13T01:03:53.3713516Z] codex-plusplus watcher service started
`);

  assert.equal(check.name, "watcher log");
  assert.equal(check.status, "ok");
});

function withTempDir(fn: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), "codexpp-watcher-health-"));
  try {
    fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
