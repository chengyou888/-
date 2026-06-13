import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const runtimeSource = readFileSync(resolve(repoRoot, "packages/runtime/src/main.ts"), "utf8");
const bundledRuntime = readFileSync(resolve(repoRoot, "packages/installer/assets/runtime/main.js"), "utf8");

test("source bridge accepts Responses messages without explicit type", () => {
  assertResponsesMessageFallback(runtimeSource);
});

test("bundled bridge accepts Responses messages without explicit type", () => {
  assertResponsesMessageFallback(bundledRuntime);
});

test("source bridge injects active provider identity", () => {
  assertProviderIdentityPrompt(runtimeSource);
});

test("bundled bridge injects active provider identity", () => {
  assertProviderIdentityPrompt(bundledRuntime);
});

test("source native restore replaces third-party model residue without a backup", () => {
  assertNativeRestoreReplacesThirdPartyResidue(runtimeSource);
});

test("bundled native restore replaces third-party model residue without a backup", () => {
  assertNativeRestoreReplacesThirdPartyResidue(bundledRuntime);
});

test("source model catalog is compatible with Codex model manager", () => {
  assertModelCatalogCompatibility(runtimeSource);
});

test("bundled model catalog is compatible with Codex model manager", () => {
  assertModelCatalogCompatibility(bundledRuntime);
});

test("source bridge forwards Codex session context downstream", () => {
  assertSessionContextPropagation(runtimeSource);
});

test("bundled bridge forwards Codex session context downstream", () => {
  assertSessionContextPropagation(bundledRuntime);
});

test("source bridge supports pure API desktop auth mode", () => {
  assertPureApiModeSupport(runtimeSource);
});

test("bundled bridge supports pure API desktop auth mode", () => {
  assertPureApiModeSupport(bundledRuntime);
});

test("source runtime state tolerates UTF-8 BOM", () => {
  assertStateReadStripsBom(runtimeSource);
});

test("bundled runtime state tolerates UTF-8 BOM", () => {
  assertStateReadStripsBom(bundledRuntime);
});

test("source runtime installs localized desktop menu", () => {
  assertLocalizedDesktopMenu(runtimeSource);
});

test("bundled runtime installs localized desktop menu", () => {
  assertLocalizedDesktopMenu(bundledRuntime);
});

test("source runtime restores Codex from tray activation", () => {
  assertTrayActivationRestore(runtimeSource);
});

test("bundled runtime restores Codex from tray activation", () => {
  assertTrayActivationRestore(bundledRuntime);
});

function assertResponsesMessageFallback(source: string): void {
  const converter = extractFunctionBody(source, "responsesInputToChatMessages");
  assert.match(converter, /type === "message" \|\|/);
  assert.match(converter, /!type && isResponseMessageRecord\(record\)/);

  const helper = extractFunctionBody(source, "isResponseMessageRecord");
  assert.match(helper, /stringValue\(record\.role\)/);
  assert.match(helper, /"content" in record/);
}

function assertProviderIdentityPrompt(source: string): void {
  const builder = extractFunctionBody(source, "buildChatCompletionRequest");
  assert.match(builder, /insertBridgeSystemMessages\(messages,\s*config(?:,\s*sessionContext)?\)/);

  const inserter = extractFunctionBody(source, "insertBridgeSystemMessages");
  assert.match(inserter, /bridgeProviderIdentityPrompt\(config\)/);

  const prompt = extractFunctionBody(source, "bridgeProviderIdentityPrompt");
  assert.match(prompt, /providerLabel/);
  assert.match(prompt, /config\.model/);
  assert.match(prompt, /Claude|Anthropic/);
}

function assertNativeRestoreReplacesThirdPartyResidue(source: string): void {
  const writer = extractFunctionBody(source, "writeCodexNativeConfig");
  assert.match(writer, /removeCodexBridgeBlock/);
  assert.match(writer, /resolveCodexNativeBackup\(backup\)/);
  assert.match(writer, /upsertTopLevelTomlString\(text,\s*"model",\s*nativeBackup\.model\)/);
  assert.match(writer, /removeTopLevelTomlKey\(text,\s*"model_provider"\)/);
  assert.match(writer, /removeTopLevelTomlKey\(text,\s*"model_reasoning_effort"\)/);

  const resolver = extractFunctionBody(source, "resolveCodexNativeBackup");
  assert.match(resolver, /readGlobalCodexNativeBackup\(\)/);
  assert.match(resolver, /FALLBACK_NATIVE_CODEX_MODEL/);
  assert.match(resolver, /isThirdPartyAgentModel\(backup\.model\)/);
}

function assertModelCatalogCompatibility(source: string): void {
  const handler = extractFunctionBody(source, "handleCodexModelBridgeRequest");
  assert.match(handler, /models:\s*\[model\]/);
  assert.match(handler, /data:\s*\[model\]/);

  const entry = extractFunctionBody(source, "bridgeModelCatalogEntry");
  assert.match(entry, /slug:\s*config\.model/);
  assert.match(entry, /display_name/);
  assert.match(entry, /default_reasoning_level/);
  assert.match(entry, /supported_reasoning_levels/);
  assert.match(entry, /shell_type:\s*"shell_command"/);
  assert.match(entry, /visibility:\s*"list"/);
  assert.match(entry, /model_messages/);
  assert.match(entry, /instructions_template/);
  assert.match(entry, /context_window/);
  assert.match(entry, /input_modalities/);
  assert.match(entry, /wire_api:\s*"responses"/);
}

function assertSessionContextPropagation(source: string): void {
  const proxy = extractFunctionBody(source, "proxyCodexResponseRequest");
  assert.match(proxy, /codexBridgeSessionContext\(request,\s*headers\)/);
  assert.match(proxy, /chatCompletionHeaders\(config,\s*sessionContext\)/);

  const builder = extractFunctionBody(source, "buildChatCompletionRequest");
  assert.match(builder, /body\.user\s*=\s*sessionContext\.id/);
  assert.match(builder, /insertBridgeSystemMessages\(messages,\s*config,\s*sessionContext\)/);

  const headers = extractFunctionBody(source, "chatCompletionHeaders");
  assert.match(headers, /X-Codex-Session-Id/);
  assert.match(headers, /X-Codex-Session-Source/);

  const extractor = extractFunctionBody(source, "codexBridgeSessionContext");
  assert.match(extractor, /sessionContextFromHeaders/);
  assert.match(extractor, /sessionContextFromRecord/);
  assert.match(extractor, /derivedSessionContext/);

  const prompt = extractFunctionBody(source, "bridgeSessionSystemPrompt");
  assert.match(prompt, /Codex/);
  assert.match(prompt, /sessionContext\.id/);
}

function assertPureApiModeSupport(source: string): void {
  const normalizer = extractFunctionBody(source, "normalizeAgentProviderConfig");
  assert.match(normalizer, /accessMode/);
  assert.match(normalizer, /pure-api/);

  const activate = extractFunctionBody(source, "activateCodexModelBridge");
  assert.match(activate, /accessMode:\s*config\.accessMode/);
  assert.match(activate, /syncDesktopCodexAuthFromState\("agent-activated"\)/);
  assert.match(activate, /writeCodexBridgeConfig\(config\)/);

  const authSync = extractFunctionBody(source, "syncDesktopCodexAuthFromState");
  assert.match(authSync, /activePureApiAgentProviderConfig/);
  assert.match(authSync, /writeCodexPureApiAuth/);
  assert.match(authSync, /syncDesktopCodexAuthFromGlobal/);

  const authGlobalSync = extractFunctionBody(source, "syncDesktopCodexAuthFromGlobal");
  assert.match(authGlobalSync, /desktopCodexAuthIsPureApiOnly\(\)/);

  const pureApiOnlyCheck = extractFunctionBody(source, "desktopCodexAuthIsPureApiOnly");
  assert.match(pureApiOnlyCheck, /OPENAI_API_KEY/);
  assert.match(pureApiOnlyCheck, /!auth\.tokens/);

  const authWriter = extractFunctionBody(source, "writeCodexPureApiAuth");
  assert.match(authWriter, /OPENAI_API_KEY/);
  assert.match(authWriter, /CODEX_AUTH_FILE/);

  const bridgeBlock = extractFunctionBody(source, "appendCodexBridgeBlock");
  assert.match(bridgeBlock, /requires_openai_auth/);
  assert.match(bridgeBlock, /pure-api/);
}

function assertStateReadStripsBom(source: string): void {
  const reader = extractFunctionBody(source, "readState");
  assert.match(reader, /stripUtf8Bom/);

  const helper = extractFunctionBody(source, "stripUtf8Bom");
  assert.match(helper, /0xfeff|65279/);
}

function assertLocalizedDesktopMenu(source: string): void {
  assert.match(source, /installApplicationMenuLocalizationHook/);
  assert.match(source, /installLocalizedApplicationMenu/);
  assert.match(source, /Menu\.setApplicationMenu/);
  assert.match(source, /setLocalizedWindowMenu/);
  assert.match(source, /ensureXiaobaiAiToolboxMenuItem/);
  assert.match(source, /Alt\+Shift\+S/);
  assert.match(source, /DEFAULT_XIAOBAI_TOOLBOX_PATH/);
  assert.match(source, /CODEXPP_XIAOBAI_TOOLBOX_PATH/);
  assert.match(source, /codexpp:get-xiaobai-toolbox-config/);
  assert.match(source, /codexpp:set-xiaobai-toolbox-config/);
  assert.match(source, /codexpp:open-xiaobai-toolbox/);
  assert.match(source, /LOCALIZED_APPLICATION_MENU_LABELS/);
  assert.match(source, /Toggle Sidebar/);
  assert.match(source, /Previous Chat/);
  assert.match(source, /New Window/);
  assert.match(source, /Quick Chat/);
  assert.match(source, /Open Folder/);
  assert.match(source, /Log Out/);
  assert.match(source, /Codex Documentation/);
  assert.match(source, /Keyboard Shortcuts/);
  assertSourceContainsText(source, "新建窗口");
  assertSourceContainsText(source, "快速对话");
  assertSourceContainsText(source, "打开文件夹");
  assertSourceContainsText(source, "退出登录");
  assertSourceContainsText(source, "切换侧边栏");
  assertSourceContainsText(source, "打开终端");
  assertSourceContainsText(source, "上一个对话");
  assertSourceContainsText(source, "故障排查");
  assertSourceContainsText(source, "键盘快捷键");
  assertSourceContainsText(source, "小白 AI工具箱");
  assert.doesNotMatch(source, /打开 codex汉化增强plus版发布页/);
}

function assertTrayActivationRestore(source: string): void {
  assert.match(source, /installTrayActivationHook/);
  assert.match(source, /codexPlusPlusTray/);
  assert.match(source, /installAppActivationRestoreHook/);
  assert.match(source, /Tray\.prototype|trayPrototype/);
  assert.match(source, /restoreCodexWindowFromTray/);
  assert.match(source, /double-click/);
  assert.match(source, /codex-plusplus tray restore entry/);
  assert.match(source, /second-instance/);
  assert.match(source, /scheduleExistingWindowRestoreBursts/);
  assert.match(source, /setAlwaysOnTop/);
  assert.match(source, /createFreshLocalWindow/);
}

function assertSourceContainsText(source: string, text: string): void {
  const escaped = text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      return code > 0x7f ? `\\\\u${code.toString(16).toUpperCase().padStart(4, "0")}` : char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("");
  assert.match(source, new RegExp(`${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${escaped}`, "i"));
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
