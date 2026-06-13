import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const runtimeSource = readFileSync(resolve(repoRoot, "packages/runtime/src/main.ts"), "utf8");
const bundledRuntime = readFileSync(resolve(repoRoot, "packages/installer/assets/runtime/main.js"), "utf8");

test("source runtime injects desktop CODEX_HOME into Codex child processes", () => {
  assertDesktopEnvHook(runtimeSource);
});

test("bundled runtime injects desktop CODEX_HOME into Codex child processes", () => {
  assertDesktopEnvHook(bundledRuntime);
});

function assertDesktopEnvHook(source: string): void {
  assert.match(source, /ensureDesktopCodexHome\(\);\s*installCodexChildProcessEnvHook\(\);/);

  const hook = extractFunctionBody(source, "installCodexChildProcessEnvHook");
  for (const name of ["spawn", "execFile", "fork", "spawnSync", "execFileSync"]) {
    assert.match(hook, new RegExp(`childProcess\\.${name}\\s*=`), `missing child_process.${name} hook`);
  }

  const envHelper = extractFunctionBody(source, "desktopCodexChildEnv");
  assert.match(envHelper, /CODEX_HOME:\s*DESKTOP_CODEX_HOME/);
  assert.match(envHelper, /CODEXPP_DESKTOP_CODEX_HOME:\s*DESKTOP_CODEX_HOME/);

  const argHelper = extractFunctionBody(source, "withDesktopCodexEnv");
  assert.match(argHelper, /callbackIndex/);
  assert.match(argHelper, /searchEnd/);
  assert.match(argHelper, /\.splice\(searchEnd,\s*0,\s*\{\s*env:/);
  assert.doesNotMatch(argHelper, /\.push\(\{\s*env:/);
}

function extractFunctionBody(source: string, name: string): string {
  const marker = `function ${name}`;
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `missing function: ${name}`);

  return extractBlockStartingAt(source, source.indexOf("{", markerIndex));
}

function extractBlockStartingAt(source: string, startBrace: number): string {
  assert.notEqual(startBrace, -1, "missing opening brace");

  let depth = 0;
  for (let i = startBrace; i < source.length; i++) {
    const char = source[i];
    if (char === "{") depth++;
    if (char === "}") depth--;
    if (depth === 0) return source.slice(startBrace + 1, i);
  }

  assert.fail("missing closing brace");
}
