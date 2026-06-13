import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const injectorSource = readFileSync(resolve(repoRoot, "packages/runtime/src/preload/settings-injector.ts"), "utf8");
const bundledInjector = readFileSync(resolve(repoRoot, "packages/installer/assets/runtime/preload/settings-injector.js"), "utf8");

test("source agent provider page waits for main-process active provider", () => {
  assertAgentProviderPageUsesMainProcessState(injectorSource);
});

test("bundled agent provider page waits for main-process active provider", () => {
  assertAgentProviderPageUsesMainProcessState(bundledInjector);
});

test("source agent provider page ignores synthetic selection changes", () => {
  assertAgentProviderPageIgnoresSyntheticSelectionChanges(injectorSource);
});

test("bundled agent provider page ignores synthetic selection changes", () => {
  assertAgentProviderPageIgnoresSyntheticSelectionChanges(bundledInjector);
});

test("source auto activation requires a recent trusted user edit", () => {
  assertAutoActivationRequiresTrustedUserEdit(injectorSource);
});

test("bundled auto activation requires a recent trusted user edit", () => {
  assertAutoActivationRequiresTrustedUserEdit(bundledInjector);
});

test("source agent provider page exposes pure API access mode", () => {
  assertAgentProviderAccessModePicker(injectorSource);
});

test("bundled agent provider page exposes pure API access mode", () => {
  assertAgentProviderAccessModePicker(bundledInjector);
});

test("source zhipu provider exposes API key entry", () => {
  assertZhipuApiKeyEntry(injectorSource);
});

test("bundled zhipu provider exposes API key entry", () => {
  assertZhipuApiKeyEntry(bundledInjector);
});

test("source agent provider page offers Xiaobai API registration assist", () => {
  assertXiaobaiApiRegistrationAssist(injectorSource);
});

test("bundled agent provider page offers Xiaobai API registration assist", () => {
  assertXiaobaiApiRegistrationAssist(bundledInjector);
});

function assertAgentProviderPageUsesMainProcessState(source: string): void {
  const body = extractFunctionBody(source, "renderAgentProvidersPage");
  assert.match(body, /codexpp:get-active-agent-provider/);
  assert.match(body, /picker\.disabled\s*=\s*true/);
  assert.match(body, /正在读取当前模型来源/);
  assert.doesNotMatch(body, /const selected\s*=\s*readAgentProviderSelection/);
  assert.doesNotMatch(body, /renderSelected\(selected\)/);
}

function assertAgentProviderPageIgnoresSyntheticSelectionChanges(source: string): void {
  const body = extractFunctionBody(source, "renderAgentProvidersPage");
  assert.match(body, /addEventListener\("change",\s*\(?event/);
  assert.match(body, /event\.isTrusted/);
}

function assertAutoActivationRequiresTrustedUserEdit(source: string): void {
  const body = extractFunctionBody(source, "renderAgentProviderConfig");
  assert.match(body, /lastTrustedUserEditAt/);
  assert.match(body, /markTrustedUserEdit/);
  assert.match(body, /Date\.now\(\)\s*-\s*lastTrustedUserEditAt\s*<\s*120_000/);
  assert.match(body, /codexpp:activate-agent-provider/);
}

function assertAgentProviderAccessModePicker(source: string): void {
  const body = extractFunctionBody(source, "renderAgentProviderConfig");
  assert.match(body, /accessModeSelect/);
  assert.match(body, /pure-api/);
  assert.match(body, /accessMode:\s*accessModeSelect\.value/);
  assert.match(body, /bindAutoSave\(accessModeSelect,\s*"change"/);
}

function assertZhipuApiKeyEntry(source: string): void {
  assert.match(source, /id:\s*"zhipu"/);
  assert.match(source, /keyUrl:\s*"https:\/\/open\.bigmodel\.cn\/usercenter\/apikeys"/);

  const body = extractFunctionBody(source, "renderAgentProviderConfig");
  assert.match(body, /meta\.keyUrl/);
  assert.match(body, /codexpp:open-external/);
  assert.match(body, /申请 API Key/);
}

function assertXiaobaiApiRegistrationAssist(source: string): void {
  const listBody = extractFunctionBody(source, "renderAgentProvidersPage");
  assert.match(listBody, /promptXiaobaiRegistration:\s*true/);

  assert.match(source, /function renderAgentProviderPage[\s\S]*maybePromptXiaobaiRegistration/);

  const configBody = extractFunctionBody(source, "renderAgentProviderConfig");
  assert.match(configBody, /apiKeyInputWithXiaobaiAssist/);

  const promptBody = extractFunctionBody(source, "shouldPromptXiaobaiRegistration");
  assert.match(promptBody, /providerId\s*!==\s*"zhipu"/);
  assert.match(promptBody, /!config\.apiKey/);

  const openerBody = extractFunctionBody(source, "openXiaobaiAiToolboxForApiRegistration");
  assert.match(openerBody, /codexpp:open-xiaobai-toolbox/);
  assert.match(openerBody, /api-registration/);
  assertSourceContainsText(source, "小白AI辅助申请");
  assertSourceContainsText(source, "是否启用小白AI辅助自动注册 API");
}

function assertSourceContainsText(source: string, text: string): void {
  const literal = escapeRegex(text);
  const unicodeEscaped = text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      return code > 0x7f ? `\\\\u${code.toString(16).padStart(4, "0")}` : escapeRegex(char);
    })
    .join("");
  assert.match(source, new RegExp(`${literal}|${unicodeEscaped}`, "i"));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
