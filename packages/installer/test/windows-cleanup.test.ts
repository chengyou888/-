import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWindowsManagedCleanupScript,
  WINDOWS_CODEX_CONTEXT_MENU_KEYS,
  WINDOWS_WATCHER_SERVICE_NAME,
  WINDOWS_WATCHER_TASK_NAMES,
} from "../src/windows-cleanup";

test("Windows cleanup removes only Codex++ managed context menu entries", () => {
  const script = buildWindowsManagedCleanupScript({
    localAppData: "C:\\Users\\Admin\\AppData\\Local",
    appData: "C:\\Users\\Admin\\AppData\\Roaming",
    home: "C:\\Users\\Admin",
  });

  assert.match(script, /OpenProjectInCodex/);
  assert.match(script, /GetValue\(''\)/);
  assert.match(script, /\\codex-plusplus\\store-apps\\/);
  assert.match(script, /Remove-Item -LiteralPath \$key -Recurse -Force/);
  assert.match(script, /codex-plusplus-codex\.cmd/);
  assert.match(script, /watcher\.cmd/);
  assert.match(script, /service-host/);
  assert.match(script, new RegExp(WINDOWS_WATCHER_SERVICE_NAME.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")));
  assert.match(script, /sc\.exe queryex \$watcherService/);
  assert.match(script, /taskkill\.exe \/PID \$servicePid \/T \/F/);
  assert.match(script, /sc\.exe delete \$watcherService/);
  assert.match(script, /Codex\+\+\.lnk/);
  assert.match(script, /store-apps/);
  assert.match(script, /Get-ScheduledTask -TaskName \$taskName/);
  assert.match(script, /Unregister-ScheduledTask -InputObject \$_ -Confirm:\$false/);
  assert.match(script, /Stop-Process -Id \$_\.ProcessId -Force/);
  for (const key of WINDOWS_CODEX_CONTEXT_MENU_KEYS) {
    assert.match(script, new RegExp(key.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")));
  }
  for (const taskName of WINDOWS_WATCHER_TASK_NAMES) {
    assert.match(script, new RegExp(taskName.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")));
  }
});
