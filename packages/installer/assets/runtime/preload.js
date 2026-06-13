"use strict";

// src/preload/index.ts
var import_electron4 = require("electron");

// src/preload/react-hook.ts
function installReactHook() {
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) return;
  const renderers = /* @__PURE__ */ new Map();
  let nextId = 1;
  const listeners = /* @__PURE__ */ new Map();
  const hook = {
    supportsFiber: true,
    renderers,
    inject(renderer) {
      const id = nextId++;
      renderers.set(id, renderer);
      console.debug(
        "[codex-plusplus] React renderer attached:",
        renderer.rendererPackageName,
        renderer.version
      );
      return id;
    },
    on(event, fn) {
      let s = listeners.get(event);
      if (!s) listeners.set(event, s = /* @__PURE__ */ new Set());
      s.add(fn);
    },
    off(event, fn) {
      listeners.get(event)?.delete(fn);
    },
    emit(event, ...args) {
      listeners.get(event)?.forEach((fn) => fn(...args));
    },
    onCommitFiberRoot() {
    },
    onCommitFiberUnmount() {
    },
    onScheduleFiberRoot() {
    },
    checkDCE() {
    }
  };
  Object.defineProperty(window, "__REACT_DEVTOOLS_GLOBAL_HOOK__", {
    configurable: true,
    enumerable: false,
    writable: true,
    // allow real DevTools to overwrite if user installs it
    value: hook
  });
  window.__codexpp__ = { hook, renderers };
}
function fiberForNode(node) {
  const renderers = window.__codexpp__?.renderers;
  if (renderers) {
    for (const r of renderers.values()) {
      const f = r.findFiberByHostInstance?.(node);
      if (f) return f;
    }
  }
  for (const k of Object.keys(node)) {
    if (k.startsWith("__reactFiber")) return node[k];
  }
  return null;
}

// src/preload/settings-injector.ts
var import_electron = require("electron");
var AI_OPEN_TOOL_URL = "https://aiopentool.com/";
var STORE_TWEAK_ZH = {
  "co.sakushi.add-project-by-path": {
    name: "\u6309\u8DEF\u5F84\u6DFB\u52A0\u9879\u76EE",
    description: "\u5728\u9879\u76EE\u83DC\u5355\u4E2D\u6DFB\u52A0\u4E00\u4E2A\u539F\u751F\u98CE\u683C\u5165\u53E3\uFF0C\u53EF\u901A\u8FC7\u8F93\u5165\u8DEF\u5F84\u6DFB\u52A0\u5DE5\u4F5C\u533A\u3002"
  },
  "co.bennett.ui-improvements": {
    name: "Bennett \u7684\u754C\u9762\u6539\u8FDB",
    description: "Codex \u6613\u7528\u6027\u754C\u9762\u4F18\u5316\uFF1A\u9690\u85CF\u5347\u7EA7\u63D0\u793A\uFF0C\u5E76\u663E\u793A\u7528\u91CF\u548C\u6D88\u606F\u6307\u6807\u3002"
  },
  "co.bennett.better-browser": {
    name: "\u589E\u5F3A\u6D4F\u89C8\u5668",
    description: "\u589E\u5F3A Codex \u6D4F\u89C8\u5668\u4FA7\u8FB9\u680F\uFF0C\u652F\u6301\u66F4\u591A\u6807\u7B7E\u3001\u5185\u8054\u5F00\u53D1\u8005\u5DE5\u5177\u548C\u6D4F\u89C8\u5668\u5BFC\u822A\u5FEB\u6377\u952E\u3002"
  },
  "co.bennett.better-terminal": {
    name: "\u589E\u5F3A\u7EC8\u7AEF",
    description: "\u5347\u7EA7 Codex \u7EC8\u7AEF\uFF0C\u52A0\u5165\u5206\u5C4F\u3001\u539F\u751F\u5F39\u51FA\u7A97\u53E3\u3001\u6807\u7B7E\u63A7\u5236\u3001\u5FEB\u6377\u952E\u548C\u5185\u5B58\u76D1\u63A7\u3002"
  },
  "co.bennett.codex-horizontal-tabs": {
    name: "Codex \u6A2A\u5411\u6807\u7B7E\u680F",
    description: "\u4E3A\u5DF2\u6253\u5F00\u7684 Codex \u5BF9\u8BDD\u6DFB\u52A0\u7C7B\u4F3C Chrome \u7684\u9876\u90E8\u6807\u7B7E\u680F\u3002"
  },
  "co.bennett.codex-tab-switcher": {
    name: "Codex \u6807\u7B7E\u5207\u6362\u5668",
    description: "\u4F7F\u7528 Ctrl-Tab \u6D6E\u5C42\u548C\u5C0F\u9884\u89C8\u5728\u6700\u8FD1\u7684 Codex \u5BF9\u8BDD\u4E4B\u95F4\u5207\u6362\u3002"
  },
  "com.jumang.completion-sound": {
    name: "\u5B8C\u6210\u63D0\u793A\u97F3",
    description: "\u64AD\u653E Codex \u6D3B\u52A8\u63D0\u793A\u97F3\uFF0C\u5E76\u52A0\u5BBD\u804A\u5929\u5217\u3002"
  },
  "co.Arconte112.followup": {
    name: "\u4E0A\u4E0B\u6587\u8FFD\u95EE",
    description: "\u5728\u52A9\u624B\u6D88\u606F\u4E0B\u65B9\u6DFB\u52A0\u53EF\u70B9\u51FB\u7684\u4E0A\u4E0B\u6587\u4E0B\u4E00\u6B65\u63D0\u793A\uFF0C\u5E76\u53EF\u540C\u6B65\u6258\u7BA1\u7684 AGENTS.md \u6307\u4EE4\u3002"
  },
  "co.bennett.custom-keyboard-shortcuts": {
    name: "\u81EA\u5B9A\u4E49\u952E\u76D8\u5FEB\u6377\u952E",
    description: "\u53D1\u73B0\u3001\u91CD\u6620\u5C04\u6216\u7981\u7528 Codex \u7684\u952E\u76D8\u5FEB\u6377\u952E\u3002"
  },
  "co.qoli.disable-escape": {
    name: "\u7981\u7528 Escape",
    description: "\u62E6\u622A Codex \u6E32\u67D3\u7A97\u53E3\u4E2D\u7684 Escape \u952E\uFF0C\u907F\u514D\u4E2D\u6587\u7B49\u8F93\u5165\u6CD5\u7EC4\u5408\u8F93\u5165\u6253\u65AD\u6B63\u5728\u8FD0\u884C\u7684\u56DE\u590D\u3002"
  },
  "me.erkin.codex-plusplus-account-switcher": {
    name: "\u8D26\u53F7\u5FEB\u901F\u5207\u6362",
    description: "\u4ECE\u8D26\u53F7\u83DC\u5355\u4FDD\u5B58\u3001\u5207\u6362\u548C\u7BA1\u7406\u672C\u5730 Codex \u767B\u5F55\u4F1A\u8BDD\uFF0C\u5E76\u5728\u8BBE\u7F6E\u4E2D\u7F13\u5B58\u7528\u91CF\u72B6\u6001\u3002"
  },
  "co.bennett.file-editor": {
    name: "\u6587\u4EF6\u7F16\u8F91\u5668",
    description: "\u8BA9 Codex \u53F3\u4FA7\u9762\u677F\u7684\u6587\u4EF6\u6807\u7B7E\u53EF\u76F4\u63A5\u7F16\u8F91\uFF0C\u5E76\u652F\u6301\u9632\u6296\u81EA\u52A8\u4FDD\u5B58\u3002"
  },
  "co.bennett.goal": {
    name: "\u76EE\u6807",
    description: "\u628A Codex \u7684 /goal \u547D\u4EE4\u548C\u6D3B\u52A8\u76EE\u6807\u754C\u9762\u52A0\u5165\u684C\u9762 App\u3002"
  },
  "co.bennett.ios-simulator": {
    name: "iOS \u6A21\u62DF\u5668",
    description: "\u5728 Codex \u53F3\u4FA7\u9762\u677F\u6DFB\u52A0 iOS \u6A21\u62DF\u5668\u6807\u7B7E\uFF0C\u5E76\u652F\u6301\u955C\u50CF\u548C\u70B9\u51FB/\u6ED1\u52A8\u8F6C\u53D1\u3002"
  },
  "co.bennett.computer-use": {
    name: "OpenAI \u7535\u8111\u64CD\u63A7",
    description: "\u5728 codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u4E2D\u542F\u7528 OpenAI Computer Use\uFF0C\u5305\u542B\u539F\u751F\u98CE\u683C\u8BBE\u7F6E\u3001\u542F\u52A8\u81EA\u4FEE\u590D\u548C\u529F\u80FD\u6CE8\u518C\u3002"
  },
  "me.xtawfik.codex-plusplus-package-run": {
    name: "Package \u811A\u672C\u8FD0\u884C",
    description: "\u5728 Codex \u539F\u751F\u6587\u4EF6\u67E5\u770B\u5668\u4E2D\u663E\u793A package.json \u811A\u672C\uFF0C\u5E76\u628A\u9009\u4E2D\u7684\u547D\u4EE4\u53D1\u9001\u5230\u7EC8\u7AEF\u3002"
  },
  "co.bennett.project-home": {
    name: "\u9879\u76EE\u4E3B\u9875",
    description: "\u6DFB\u52A0\u4E00\u4E2A Project Home \u770B\u677F\uFF0C\u7528 Linear \u98CE\u683C\u7BA1\u7406\u6BCF\u4E2A\u9879\u76EE\u7684\u95EE\u9898\u3002"
  },
  "com.imsakushi.quick-actions": {
    name: "\u5FEB\u6377\u64CD\u4F5C",
    description: "\u4E3A Codex \u7684 Git \u9762\u677F\u6DFB\u52A0\u81EA\u5B9A\u4E49\u5DE5\u4F5C\u6D41\u64CD\u4F5C\u3002"
  },
  "co.shivam94.reasoning-fixes": {
    name: "\u63A8\u7406\u4E0E\u63A2\u7D22\u663E\u793A\u4FEE\u590D",
    description: "\u4FDD\u6301\u63A2\u7D22\u9762\u677F\u6253\u5F00\u3001\u63A8\u7406\u8FC7\u7A0B\u53EF\u89C1\uFF0C\u5E76\u5C55\u5F00\u5DE5\u5177\u8F93\u51FA\uFF0C\u5305\u542B\u6E90\u7801\u8865\u4E01\u548C\u8FD0\u884C\u65F6\u589E\u5F3A\u3002"
  },
  "co.bennett.windows-computer-use": {
    name: "Windows \u7535\u8111\u64CD\u63A7",
    description: "\u4E3A codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u63D0\u4F9B Windows Computer Use \u7684 MCP \u754C\u9762\u3002"
  }
};
var state = {
  sections: /* @__PURE__ */ new Map(),
  pages: /* @__PURE__ */ new Map(),
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
  modelSourceLoading: false
};
var AGENT_PROVIDERS = [
  {
    id: "deepseek",
    label: "DeepSeek",
    title: "DeepSeek",
    description: "\u914D\u7F6E DeepSeek Chat Completions \u63A5\u5165\uFF0C\u5E76\u53D1\u9001\u6D4B\u8BD5\u8BF7\u6C42\u3002",
    docsUrl: "https://api-docs.deepseek.com/api/create-chat-completion"
  },
  {
    id: "qwen",
    label: "\u963F\u91CC\u5343\u95EE",
    title: "\u963F\u91CC\u5343\u95EE",
    description: "\u914D\u7F6E\u963F\u91CC\u4E91\u767E\u70BC\u5343\u95EE\u6A21\u578B\u63A5\u5165\uFF0C\u9ED8\u8BA4\u4F7F\u7528 OpenAI \u517C\u5BB9\u6A21\u5F0F\u63A5\u7BA1\u4E3B\u804A\u5929\u3002",
    docsUrl: "https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope"
  },
  {
    id: "zhipu",
    label: "\u667A\u8C31 GLM",
    title: "\u667A\u8C31 GLM",
    description: "\u914D\u7F6E\u667A\u8C31\u5F00\u653E\u5E73\u53F0 GLM \u7684 OpenAI \u517C\u5BB9\u63A5\u53E3\uFF0C\u5E76\u53D1\u9001\u6D4B\u8BD5\u8BF7\u6C42\u3002",
    docsUrl: "https://docs.bigmodel.cn/cn/guide/develop/openai/introduction",
    keyUrl: "https://open.bigmodel.cn/usercenter/apikeys"
  }
];
var DEFAULT_AGENT_TEST_PROMPT = "\u7528\u4E00\u53E5\u8BDD\u4ECB\u7ECD\u4F60\u662F\u8C01\uFF0C\u5E76\u8BF4\u660E\u5F53\u524D\u63A5\u5165\u662F\u5426\u53EF\u7528\u3002";
function agentProviderMeta(id) {
  return AGENT_PROVIDERS.find((provider) => provider.id === id) ?? AGENT_PROVIDERS[0];
}
function plog(msg, extra) {
  import_electron.ipcRenderer.send(
    "codexpp:preload-log",
    "info",
    `[settings-injector] ${msg}${extra === void 0 ? "" : " " + safeStringify(extra)}`
  );
}
function safeStringify(v) {
  try {
    return typeof v === "string" ? v : JSON.stringify(v);
  } catch {
    return String(v);
  }
}
function localizeBackToAppLabel(value) {
  const text = compactSettingsText(value);
  return text === "Back to app" || text === "\u8FD4\u56DE\u5E94\u7528";
}
function storeTweakText(entry) {
  return STORE_TWEAK_ZH[entry.id] ?? null;
}
function manifestTweakText(manifest) {
  if (STORE_TWEAK_ZH[manifest.id]) return STORE_TWEAK_ZH[manifest.id];
  return null;
}
function tweakDisplayName(manifest) {
  return manifestTweakText(manifest)?.name ?? manifest.name;
}
function tweakDisplayDescription(manifest) {
  return manifestTweakText(manifest)?.description ?? manifest.description;
}
function storeEntryDisplayName(entry) {
  return storeTweakText(entry)?.name ?? entry.manifest.name;
}
function storeEntryDisplayDescription(entry) {
  return storeTweakText(entry)?.description ?? entry.manifest.description;
}
function localizeInstallationSource(source) {
  const label = source.kind === "github-source" ? "GitHub \u6E90\u7801\u5B89\u88C5" : source.kind === "homebrew" ? "Homebrew \u5B89\u88C5" : source.kind === "local-dev" ? "\u672C\u5730\u5F00\u53D1\u6E90\u7801" : source.kind === "source-archive" ? "\u6E90\u7801\u5F52\u6863\u5B89\u88C5" : "\u672A\u77E5\u6765\u6E90";
  return `${label}: ${source.detail}`;
}
function localizeReleaseNotes(markdown) {
  const text = markdown.trim();
  if (!text) return "\u6682\u65E0\u53D1\u5E03\u8BF4\u660E\u3002";
  if (!text.includes(["Codex", "++ 1.0.0 is the first stable release"].join("")) && !text.includes("codex\u6C49\u5316\u589E\u5F3Aplus\u7248 1.0.0 is the first stable release")) return text;
  return [
    "codex\u6C49\u5316\u589E\u5F3Aplus\u7248 1.0.0 \u662F\u672C\u5730 tweak/runtime \u5C42\u7684\u7B2C\u4E00\u4E2A\u7A33\u5B9A\u7248\u3002",
    "",
    "\u4EAE\u70B9\uFF1A",
    "",
    "- \u4E3A\u73B0\u4EE3 Codex App \u66F4\u65B0\u63D0\u4F9B\u66F4\u5E72\u51C0\u7684 patch \u548C\u91CD\u65B0 patch \u6D41\u7A0B\uFF0C\u5305\u62EC\u91CD\u542F/\u91CD\u65B0\u6253\u5F00\u5904\u7406\uFF0C\u4EE5\u53CA\u5237\u65B0\u672A patch \u7684\u5907\u4EFD\u3002",
    "- \u65B0\u589E\u8C03\u8BD5\u547D\u4EE4\uFF1A`codexplusplus debug`\uFF0C\u53EF\u663E\u793A Codex \u5B89\u88C5\u8DEF\u5F84\u3001runtime \u7C7B\u578B\u3001\u6570\u636E\u8DEF\u5F84\u3001\u6253\u5F00\u72B6\u6001\u548C bridge \u72B6\u6001\u3002",
    "- \u589E\u52A0 Owl runtime \u68C0\u6D4B\uFF0C\u5E76\u4E3A OS \u7EA7 tweak \u80FD\u529B\u52A0\u5165\u539F\u751F macOS bridge \u57FA\u7840\u3002",
    "- \u591A\u6587\u4EF6 tweak \u7F16\u5199\u6587\u6863\u8986\u76D6 SDK\u3001manifest\u3001\u751F\u547D\u5468\u671F\u3001UI/DOM\u3001native bridge \u548C\u5206\u53D1\u3002",
    "- \u79FB\u9664\u9ED8\u8BA4 tweak \u5B89\u88C5\u903B\u8F91\uFF0C1.0.0 \u4F1A\u4FDD\u6301\u5E72\u51C0\u542F\u52A8\u3002",
    "- \u4FEE\u590D Settings \u4FA7\u8FB9\u680F\u6CE8\u5165\u95EE\u9898\uFF0C\u907F\u514D codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u5BFC\u822A\u5361\u5728 Codex \u4E3B\u4FA7\u8FB9\u680F\u91CC\u3002",
    "- \u52A0\u5F3A Windows \u5378\u8F7D\u6E05\u7406\uFF0C\u8986\u76D6 watcher \u4EFB\u52A1\u3001watcher \u811A\u672C\u548C\u6B8B\u7559 watcher \u8FDB\u7A0B\u3002",
    "- \u65B0\u589E `codexplusplus uninstall --purge`\uFF0C\u7528\u4E8E\u5B8C\u6574\u91CD\u7F6E codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u548C\u7528\u6237\u6570\u636E\u3002"
  ].join("\n");
}
function startSettingsInjector() {
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
  for (const m of ["pushState", "replaceState"]) {
    const orig = history[m];
    history[m] = function(...args) {
      const r = orig.apply(this, args);
      window.dispatchEvent(new Event(`codexpp-${m}`));
      return r;
    };
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
function onNav() {
  state.fingerprint = null;
  tryInject();
  syncComposerModelSourceLabel();
  maybeDumpDom();
}
function refreshComposerModelSourceLabel() {
  if (state.modelSourceLoading) return;
  state.modelSourceLoading = true;
  void import_electron.ipcRenderer.invoke("codexpp:get-active-agent-provider").then(async (active) => {
    const provider = asAgentProviderSelection(active);
    if (provider === "codex-native") {
      state.modelSourceLabel = null;
      state.modelSourceTitle = null;
      syncComposerModelSourceLabel();
      return;
    }
    const config = await import_electron.ipcRenderer.invoke("codexpp:get-agent-provider-config", provider);
    const meta = agentProviderMeta(provider);
    state.modelSourceLabel = meta.label;
    state.modelSourceTitle = config.model?.trim() ? `${meta.label} \xB7 ${config.model.trim()}` : meta.label;
    syncComposerModelSourceLabel();
  }).catch(() => {
    state.modelSourceLabel = null;
    state.modelSourceTitle = null;
  }).finally(() => {
    state.modelSourceLoading = false;
  });
}
function syncComposerModelSourceLabel() {
  const label = state.modelSourceLabel;
  const title = state.modelSourceTitle ?? label;
  if (!label || !title) return;
  const button2 = document.querySelector('button[data-codex-intelligence-trigger="true"]');
  if (!button2) return;
  button2.dataset.codexppAgentProviderLabel = label;
  button2.title = title;
  button2.setAttribute("aria-label", `\u5F53\u524D\u6A21\u578B\uFF1A${title}`);
  const labelSpan = findComposerModelNameSpan(button2);
  if (labelSpan && labelSpan.textContent !== label) {
    labelSpan.textContent = label;
  }
}
function findComposerModelNameSpan(button2) {
  const leafSpans = Array.from(button2.querySelectorAll("span")).filter((span) => span.children.length === 0 && !!span.textContent?.trim());
  return leafSpans.find((span) => span.className.includes("text-token-foreground")) ?? leafSpans.find((span) => !span.className.includes("description")) ?? null;
}
function onDocumentClick(e) {
  const target = e.target instanceof Element ? e.target : null;
  const control = target?.closest("[role='link'],button,a");
  if (!(control instanceof HTMLElement)) return;
  if (!localizeBackToAppLabel(control.textContent || "")) return;
  setTimeout(() => {
    setSettingsSurfaceVisible(false, "back-to-app");
  }, 0);
}
function registerSection(section) {
  state.sections.set(section.id, section);
  if (state.activePage?.kind === "tweaks") rerender();
  return {
    unregister: () => {
      state.sections.delete(section.id);
      if (state.activePage?.kind === "tweaks") rerender();
    }
  };
}
function clearSections() {
  state.sections.clear();
  for (const p of state.pages.values()) {
    try {
      p.teardown?.();
    } catch (e) {
      plog("page teardown failed", { id: p.id, err: String(e) });
    }
  }
  state.pages.clear();
  syncPagesGroup();
  if (state.activePage?.kind === "registered" && !state.pages.has(state.activePage.id)) {
    restoreCodexView();
  } else if (state.activePage?.kind === "tweaks") {
    rerender();
  }
}
function registerPage(tweakId, manifest, page) {
  const id = page.id;
  const entry = { id, tweakId, manifest, page };
  state.pages.set(id, entry);
  plog("registerPage", { id, title: page.title, tweakId });
  syncPagesGroup();
  if (state.activePage?.kind === "registered" && state.activePage.id === id) {
    rerender();
  }
  return {
    unregister: () => {
      const e = state.pages.get(id);
      if (!e) return;
      try {
        e.teardown?.();
      } catch {
      }
      state.pages.delete(id);
      syncPagesGroup();
      if (state.activePage?.kind === "registered" && state.activePage.id === id) {
        restoreCodexView();
      }
    }
  };
}
function setListedTweaks(list) {
  state.listedTweaks = list;
  if (state.activePage?.kind === "tweaks") rerender();
}
function tryInject() {
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
  const outer = itemsGroup.parentElement ?? itemsGroup;
  if (!isSettingsSidebarCandidate(itemsGroup) || !isSettingsSidebarCandidate(outer)) {
    scheduleSettingsSurfaceHidden();
    plog("rejected non-settings sidebar candidate", {
      itemsGroup: describe(itemsGroup),
      outer: describe(outer)
    });
    return;
  }
  state.sidebarRoot = outer;
  syncNativeSettingsHeader(itemsGroup, outer);
  if (state.navGroup && outer.contains(state.navGroup)) {
    syncPagesGroup();
    if (state.activePage !== null) syncCodexNativeNavActive(true);
    return;
  }
  if (state.activePage !== null || state.panelHost !== null) {
    plog("sidebar re-mount detected; clearing stale active state", {
      prevActive: state.activePage
    });
    state.activePage = null;
    state.panelHost = null;
  }
  const existingCodexPpNavGroup = outer.querySelector(':scope > [data-codexpp="nav-group"]') ?? outer.querySelector('[data-codexpp="nav-group"]');
  if (existingCodexPpNavGroup) {
    state.navGroup = existingCodexPpNavGroup;
    state.codexPlusPlusUpdateButton = existingCodexPpNavGroup.querySelector(
      "[data-codexpp-sidebar-update]"
    );
    state.sidebarRoot = outer;
    syncPagesGroup();
    refreshSidebarCodexPlusPlusUpdateButton();
    if (state.activePage !== null) syncCodexNativeNavActive(true);
    return;
  }
  const group = document.createElement("div");
  group.dataset.codexpp = "nav-group";
  group.className = "flex flex-col gap-px";
  const updateButton = sidebarUpdatePillButton();
  state.codexPlusPlusUpdateButton = updateButton;
  group.appendChild(sidebarGroupHeader("codex\u6C49\u5316\u589E\u5F3Aplus\u7248", "pt-3", updateButton));
  refreshSidebarCodexPlusPlusUpdateButton();
  const configBtn = makeSidebarItem("\u914D\u7F6E", configIconSvg());
  const agentProvidersBtn = makeSidebarItem("\u6A21\u578B\u63A5\u5165", agentProviderIconSvg());
  const tweaksBtn = makeSidebarItem("\u63D2\u4EF6", tweaksIconSvg());
  const storeBtn = makeSidebarItem("\u63D2\u4EF6\u5546\u5E97", storeIconSvg());
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
function syncNativeSettingsHeader(itemsGroup, outer) {
  if (state.nativeNavHeader && outer.contains(state.nativeNavHeader)) return;
  if (outer === itemsGroup) return;
  const header = sidebarGroupHeader("\u5E38\u89C4");
  header.dataset.codexpp = "native-nav-header";
  outer.insertBefore(header, itemsGroup);
  state.nativeNavHeader = header;
}
function sidebarGroupHeader(text, topPadding = "pt-2", trailing) {
  const header = document.createElement("div");
  header.className = `px-row-x ${topPadding} pb-1 flex items-center justify-between gap-2 text-[11px] font-medium uppercase tracking-wider text-token-description-foreground select-none`;
  const label = document.createElement("span");
  label.className = "truncate";
  label.textContent = text;
  header.appendChild(label);
  if (trailing) header.appendChild(trailing);
  return header;
}
function scheduleSettingsSurfaceHidden() {
  if (!state.settingsSurfaceVisible || state.settingsSurfaceHideTimer) return;
  state.settingsSurfaceHideTimer = setTimeout(() => {
    state.settingsSurfaceHideTimer = null;
    const sidebar = findSidebarItemsGroup();
    if (sidebar && isSettingsSidebarCandidate(sidebar)) return;
    if (isSettingsTextVisible()) return;
    setSettingsSurfaceVisible(false, "sidebar-not-found");
  }, 1500);
}
function isSettingsTextVisible() {
  return isCodexPpSettingsLabelSet(codexPpSettingsLabelsFrom(document));
}
function compactSettingsText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
var CODEXPP_CORE_SETTINGS_LABELS = [
  "General",
  "\u5E38\u89C4",
  "\u901A\u7528",
  "Appearance",
  "\u5916\u89C2",
  "Configuration",
  "\u914D\u7F6E",
  "\u9ED8\u8BA4\u6743\u9650",
  "Personalization",
  "\u4E2A\u6027\u5316",
  "Profile",
  "\u4E2A\u4EBA\u8D44\u6599"
].map(normalizeCodexPpSettingsLabel);
var CODEXPP_EXTENDED_SETTINGS_LABELS = [
  "Account",
  "\u8D26\u6237",
  "\u8D26\u53F7",
  "Personal",
  "\u4E2A\u4EBA",
  "Profile",
  "\u4E2A\u4EBA\u8D44\u6599",
  "General",
  "\u5E38\u89C4",
  "\u901A\u7528",
  "Appearance",
  "\u5916\u89C2",
  "Configuration",
  "\u914D\u7F6E",
  "\u9ED8\u8BA4\u6743\u9650",
  "Personalization",
  "\u4E2A\u6027\u5316",
  "Keyboard shortcuts",
  "\u952E\u76D8\u5FEB\u6377\u952E",
  "Archived chats",
  "\u5DF2\u5F52\u6863\u5BF9\u8BDD",
  "Usage",
  "Usage and billing",
  "\u4F7F\u7528\u60C5\u51B5\u548C\u8BA1\u8D39",
  "Computer use",
  "\u7535\u8111\u64CD\u63A7",
  "Browser use",
  "Browser",
  "\u6D4F\u89C8\u5668",
  "MCP servers",
  "MCP Servers",
  "MCP \u670D\u52A1\u5668",
  "Hooks",
  "\u94A9\u5B50",
  "Git",
  "Environments",
  "\u73AF\u5883",
  "Cloud Environments",
  "Worktrees",
  "\u5DE5\u4F5C\u6811",
  "Connections",
  "\u8FDE\u63A5",
  "Plugins",
  "Skills"
].map(normalizeCodexPpSettingsLabel);
var CODEXPP_SETTINGS_ONLY_LABELS = [
  "General",
  "\u5E38\u89C4",
  "\u901A\u7528",
  "Appearance",
  "\u5916\u89C2",
  "Configuration",
  "\u914D\u7F6E",
  "\u9ED8\u8BA4\u6743\u9650",
  "Personalization",
  "\u4E2A\u6027\u5316",
  "Profile",
  "\u4E2A\u4EBA\u8D44\u6599",
  "Keyboard shortcuts",
  "\u952E\u76D8\u5FEB\u6377\u952E",
  "Archived chats",
  "\u5DF2\u5F52\u6863\u5BF9\u8BDD",
  "Usage",
  "Usage and billing",
  "\u4F7F\u7528\u60C5\u51B5\u548C\u8BA1\u8D39",
  "Computer use",
  "\u7535\u8111\u64CD\u63A7",
  "Browser use",
  "Browser",
  "\u6D4F\u89C8\u5668",
  "MCP servers",
  "MCP Servers",
  "MCP \u670D\u52A1\u5668",
  "Hooks",
  "\u94A9\u5B50",
  "Git",
  "Environments",
  "\u73AF\u5883",
  "Cloud Environments",
  "Worktrees",
  "\u5DE5\u4F5C\u6811",
  "Connections",
  "\u8FDE\u63A5"
].map(normalizeCodexPpSettingsLabel);
var CODEXPP_MAIN_APP_NAV_LABELS = [
  "New chat",
  "Quick chat",
  "\u5FEB\u901F\u5BF9\u8BDD",
  "Search",
  "\u641C\u7D22",
  "Plugins",
  "\u63D2\u4EF6",
  "Automations",
  "Automation",
  "\u81EA\u52A8\u5316",
  "Chats",
  "Chat",
  "\u5BF9\u8BDD",
  "Projects",
  "\u9879\u76EE",
  "Pinned",
  "Settings",
  "\u8BBE\u7F6E",
  "Work locally"
].map(normalizeCodexPpSettingsLabel);
function normalizeCodexPpSettingsLabel(value) {
  return compactSettingsText(value).toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘`´]/g, "'").replace(/\s+/g, " ").trim();
}
function codexPpControlLabel(el) {
  return normalizeCodexPpSettingsLabel(
    el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || ""
  );
}
function codexPpSettingsLabelsFrom(root) {
  const controls = Array.from(
    root.querySelectorAll("button,a,[role='button'],[role='link']")
  );
  return [
    ...new Set(
      controls.map(codexPpControlLabel).filter(Boolean)
    )
  ];
}
function codexPpSettingsLabelScore(labels) {
  const core = /* @__PURE__ */ new Set();
  const total = /* @__PURE__ */ new Set();
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
function codexPpLabelMatchesMarker(label, marker) {
  return label === marker || label.includes(marker);
}
function codexPpMarkerCount(labels, markers) {
  const matched = /* @__PURE__ */ new Set();
  for (const label of labels) {
    for (const marker of markers) {
      if (codexPpLabelMatchesMarker(label, marker)) matched.add(marker);
    }
  }
  return matched.size;
}
function hasCodexPpSettingsOnlySignal(labels) {
  return codexPpMarkerCount(labels, CODEXPP_SETTINGS_ONLY_LABELS) > 0;
}
function hasMainAppSidebarSignals(labels) {
  return codexPpMarkerCount(labels, CODEXPP_MAIN_APP_NAV_LABELS) >= 2;
}
function isCodexPpSettingsLabelSet(labels) {
  const score = codexPpSettingsLabelScore(labels);
  return score.core >= 2 && score.total >= 3;
}
function codexPpVisibleBox(el) {
  if (!el.isConnected) return null;
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return null;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return rect;
}
function setSettingsSurfaceVisible(visible, reason) {
  if (state.settingsSurfaceVisible === visible) return;
  state.settingsSurfaceVisible = visible;
  if (visible) warmTweakStore();
  try {
    window.__codexppSettingsSurfaceVisible = visible;
    document.documentElement.dataset.codexppSettingsSurface = visible ? "true" : "false";
    window.dispatchEvent(
      new CustomEvent("codexpp:settings-surface", {
        detail: { visible, reason }
      })
    );
  } catch {
  }
  plog("settings surface", { visible, reason, url: location.href });
}
function syncPagesGroup() {
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
  const desiredKey = pages.length === 0 ? "EMPTY" : pages.map((p) => `${p.id}|${p.page.title}|${p.page.iconSvg ?? ""}`).join("\n");
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
    group.appendChild(sidebarGroupHeader("\u63D2\u4EF6", "pt-3"));
    outer.appendChild(group);
    state.pagesGroup = group;
  } else {
    while (group.children.length > 1) group.removeChild(group.lastChild);
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
    ids: pages.map((p) => p.id)
  });
  setNavActive(state.activePage);
}
function makeSidebarItem(label, iconSvg) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.codexpp = `nav-${label.toLowerCase()}`;
  btn.setAttribute("aria-label", label);
  btn.className = "focus-visible:outline-token-border relative px-row-x py-row-y cursor-interaction shrink-0 items-center overflow-hidden rounded-lg text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 gap-2 flex w-full hover:bg-token-list-hover-background font-normal";
  const inner = document.createElement("div");
  inner.className = "flex min-w-0 items-center text-base gap-2 flex-1 text-token-foreground";
  inner.innerHTML = `${iconSvg}<span class="truncate">${label}</span>`;
  btn.appendChild(inner);
  return btn;
}
function appendSidebarStoreUpdateBadge(btn) {
  const inner = btn.firstElementChild;
  if (!inner) return;
  const badge = document.createElement("span");
  badge.dataset.codexppStoreUpdateBadge = "true";
  badge.hidden = true;
  badge.title = "\u5DF2\u5B89\u88C5\u63D2\u4EF6\u6709\u5BA1\u6838\u901A\u8FC7\u7684\u66F4\u65B0";
  badge.className = "inline-flex shrink-0 items-center justify-center";
  Object.assign(badge.style, {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: "1"
  });
  applyStoreUpdateBadgeStyle(badge, null);
  btn.appendChild(badge);
}
function setNavActive(active) {
  if (state.navButtons) {
    const builtin = active?.kind === "config" ? "config" : active?.kind === "tweaks" ? "tweaks" : active?.kind === "store" ? "store" : active?.kind === "agent-providers" ? "agent-providers" : null;
    for (const [key, btn] of Object.entries(state.navButtons)) {
      applyNavActive(btn, key === builtin);
    }
  }
  for (const p of state.pages.values()) {
    if (!p.navButton) continue;
    const isActive = active?.kind === "registered" && active.id === p.id;
    applyNavActive(p.navButton, isActive);
  }
  syncCodexNativeNavActive(active !== null);
}
function syncCodexNativeNavActive(mute) {
  if (!mute) return;
  const root = state.sidebarRoot;
  if (!root) return;
  const buttons = Array.from(root.querySelectorAll("button"));
  for (const btn of buttons) {
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
function applyNavActive(btn, active) {
  const inner = btn.firstElementChild;
  if (active) {
    btn.classList.remove("hover:bg-token-list-hover-background", "font-normal");
    btn.classList.add("bg-token-list-hover-background");
    btn.setAttribute("aria-current", "page");
    if (inner) {
      inner.classList.remove("text-token-foreground");
      inner.classList.add("text-token-list-active-selection-foreground");
      inner.querySelector("svg")?.classList.add("text-token-list-active-selection-icon-foreground");
    }
  } else {
    btn.classList.add("hover:bg-token-list-hover-background", "font-normal");
    btn.classList.remove("bg-token-list-hover-background");
    btn.removeAttribute("aria-current");
    if (inner) {
      inner.classList.add("text-token-foreground");
      inner.classList.remove("text-token-list-active-selection-foreground");
      inner.querySelector("svg")?.classList.remove("text-token-list-active-selection-icon-foreground");
    }
  }
}
function activatePage(page) {
  const content = findContentArea();
  if (!content) {
    plog("activate: content area not found");
    return;
  }
  state.activePage = page;
  plog("activate", { page });
  for (const child of Array.from(content.children)) {
    if (child.dataset.codexpp === "tweaks-panel") continue;
    if (child.dataset.codexppHidden === void 0) {
      child.dataset.codexppHidden = child.style.display || "";
    }
    child.style.display = "none";
  }
  let panel = content.querySelector('[data-codexpp="tweaks-panel"]');
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
  const sidebar = state.sidebarRoot;
  if (sidebar) {
    if (state.sidebarRestoreHandler) {
      sidebar.removeEventListener("click", state.sidebarRestoreHandler, true);
    }
    const handler = (e) => {
      const target = e.target;
      if (!target) return;
      if (state.navGroup?.contains(target)) return;
      if (state.pagesGroup?.contains(target)) return;
      if (target.closest("[data-codexpp-settings-search]")) return;
      restoreCodexView();
    };
    state.sidebarRestoreHandler = handler;
    sidebar.addEventListener("click", handler, true);
  }
}
function restoreCodexView() {
  plog("restore codex view");
  const content = findContentArea();
  if (!content) return;
  if (state.panelHost) state.panelHost.style.display = "none";
  for (const child of Array.from(content.children)) {
    if (child === state.panelHost) continue;
    if (child.dataset.codexppHidden !== void 0) {
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
      true
    );
    state.sidebarRestoreHandler = null;
  }
}
function rerender() {
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
    const root2 = panelShell(entry.page.title, entry.page.description);
    host.appendChild(root2.outer);
    try {
      try {
        entry.teardown?.();
      } catch {
      }
      entry.teardown = null;
      const ret = entry.page.render(root2.sectionsWrap);
      if (typeof ret === "function") entry.teardown = ret;
    } catch (e) {
      const err = document.createElement("div");
      err.className = "text-token-charts-red text-sm";
      err.textContent = `\u6E32\u67D3\u9875\u9762\u51FA\u9519\uFF1A${e.message}`;
      root2.sectionsWrap.appendChild(err);
    }
    return;
  }
  if (ap.kind === "agent-providers") {
    const root2 = panelShell("\u6A21\u578B\u63A5\u5165", "\u9ED8\u8BA4\u4F7F\u7528 Codex / OpenAI \u539F\u751F\u6A21\u578B\uFF0C\u4E5F\u53EF\u4EE5\u5207\u6362\u5230\u7B2C\u4E09\u65B9\u6A21\u578B\u670D\u52A1\u3002");
    host.appendChild(root2.outer);
    renderAgentProvidersPage(root2.sectionsWrap, root2.subtitle);
    return;
  }
  const title = ap.kind === "tweaks" ? "\u63D2\u4EF6" : ap.kind === "store" ? "\u63D2\u4EF6\u5546\u5E97" : "codex\u6C49\u5316\u589E\u5F3Aplus\u7248";
  const subtitle = ap.kind === "tweaks" ? "\u7BA1\u7406\u5DF2\u5B89\u88C5\u7684 codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u63D2\u4EF6\u3002" : ap.kind === "store" ? "\u5B89\u88C5\u5DF2\u5BA1\u6838\u3001\u5E76\u56FA\u5B9A\u5230\u6307\u5B9A GitHub commit \u7684\u63D2\u4EF6\u3002" : "\u6B63\u5728\u68C0\u67E5\u5DF2\u5B89\u88C5\u7684 codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u7248\u672C\u3002";
  const root = panelShell(title, subtitle);
  host.appendChild(root.outer);
  if (ap.kind === "tweaks") renderTweaksPage(root.sectionsWrap);
  else if (ap.kind === "store") renderTweakStorePage(root.sectionsWrap, root.headerActions);
  else renderConfigPage(root.sectionsWrap, root.subtitle);
}
function renderConfigPage(sectionsWrap, subtitle) {
  const section = document.createElement("section");
  section.className = "flex flex-col gap-2";
  section.appendChild(sectionTitle("codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u66F4\u65B0"));
  const card = roundedCard();
  card.dataset.codexppConfigCard = "true";
  const loading = rowSimple("\u6B63\u5728\u52A0\u8F7D\u66F4\u65B0\u8BBE\u7F6E", "\u6B63\u5728\u68C0\u67E5\u5F53\u524D codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u914D\u7F6E\u3002");
  card.appendChild(loading);
  section.appendChild(card);
  sectionsWrap.appendChild(section);
  void import_electron.ipcRenderer.invoke("codexpp:get-config").then((config) => {
    if (subtitle) {
      subtitle.textContent = `\u5DF2\u5B89\u88C5 codex\u6C49\u5316\u589E\u5F3Aplus\u7248 ${config.version}\u3002`;
    }
    card.textContent = "";
    renderCodexPlusPlusConfig(card, config);
  }).catch((e) => {
    if (subtitle) subtitle.textContent = "\u65E0\u6CD5\u52A0\u8F7D\u5DF2\u5B89\u88C5\u7684 codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u7248\u672C\u3002";
    card.textContent = "";
    card.appendChild(rowSimple("\u65E0\u6CD5\u52A0\u8F7D\u66F4\u65B0\u8BBE\u7F6E", String(e)));
  });
  const watcher = document.createElement("section");
  watcher.className = "flex flex-col gap-2";
  watcher.appendChild(sectionTitle("\u540E\u53F0\u4FEE\u590D\u670D\u52A1"));
  const watcherCard = roundedCard();
  watcherCard.appendChild(rowSimple("\u6B63\u5728\u68C0\u67E5\u540E\u53F0\u670D\u52A1", "\u6B63\u5728\u9A8C\u8BC1\u66F4\u65B0\u5668\u4FEE\u590D\u670D\u52A1\u3002"));
  watcher.appendChild(watcherCard);
  sectionsWrap.appendChild(watcher);
  renderWatcherHealthCard(watcherCard);
  const maintenance = document.createElement("section");
  maintenance.className = "flex flex-col gap-2";
  maintenance.appendChild(sectionTitle("\u7EF4\u62A4"));
  const maintenanceCard = roundedCard();
  maintenanceCard.appendChild(uninstallRow());
  maintenanceCard.appendChild(reportBugRow());
  maintenance.appendChild(maintenanceCard);
  sectionsWrap.appendChild(maintenance);
}
var AGENT_PROVIDER_SELECTION_KEY = "codexpp:agent-provider-selection";
function renderAgentProvidersPage(sectionsWrap, subtitle) {
  const pickerSection = document.createElement("section");
  pickerSection.className = "flex flex-col gap-2";
  pickerSection.appendChild(sectionTitle("\u63A5\u5165\u65B9\u5F0F"));
  const pickerCard = roundedCard();
  const picker = agentSelect("codex-native", [
    ["codex-native", "Codex / OpenAI \u539F\u751F\u6A21\u578B"],
    ...AGENT_PROVIDERS.map((provider) => [provider.id, provider.label])
  ]);
  picker.disabled = true;
  pickerCard.appendChild(
    agentControlRow(
      "\u5F53\u524D\u6A21\u578B\u6765\u6E90",
      "\u9ED8\u8BA4\u6CBF\u7528 Codex \u81EA\u5E26\u6A21\u578B\uFF1B\u9009\u62E9\u7B2C\u4E09\u65B9\u540E\u5728\u4E0B\u65B9\u914D\u7F6E API Key \u548C\u6A21\u578B\u3002",
      picker
    )
  );
  pickerSection.appendChild(pickerCard);
  sectionsWrap.appendChild(pickerSection);
  const providerContent = document.createElement("div");
  providerContent.className = "flex flex-col gap-[var(--padding-panel)]";
  sectionsWrap.appendChild(providerContent);
  providerContent.appendChild(rowSimple("\u6B63\u5728\u8BFB\u53D6\u5F53\u524D\u6A21\u578B\u6765\u6E90", "\u6B63\u5728\u4ECE\u4E3B\u8FDB\u7A0B\u8BFB\u53D6\u771F\u5B9E\u63A5\u7BA1\u72B6\u6001\u3002"));
  const renderSelected = (selection, options = {}) => {
    providerContent.textContent = "";
    writeAgentProviderSelection(selection);
    if (options.syncSelection) {
      void import_electron.ipcRenderer.invoke("codexpp:set-active-agent-provider", selection).then(() => refreshComposerModelSourceLabel()).catch(() => void 0);
    }
    if (selection === "codex-native") {
      if (subtitle) subtitle.textContent = "\u4F7F\u7528 Codex \u5F53\u524D\u7684 OpenAI \u539F\u751F\u6A21\u578B\u914D\u7F6E\uFF0C\u4E0D\u9700\u8981\u989D\u5916\u586B\u5199\u670D\u52A1\u5546\u4FE1\u606F\u3002";
      renderCodexNativeProvider(providerContent);
      return;
    }
    const meta = agentProviderMeta(selection);
    if (subtitle) subtitle.textContent = meta.description;
    renderAgentProviderPage(providerContent, selection, subtitle, {
      promptXiaobaiRegistration: options.promptXiaobaiRegistration === true
    });
  };
  picker.addEventListener("change", (event) => {
    if (!event.isTrusted) return;
    renderSelected(asAgentProviderSelection(picker.value), {
      syncSelection: true,
      promptXiaobaiRegistration: true
    });
  });
  void import_electron.ipcRenderer.invoke("codexpp:get-active-agent-provider").then((active) => {
    const next = asAgentProviderSelection(active);
    picker.value = next;
    renderSelected(next);
  }).catch((e) => {
    providerContent.textContent = "";
    providerContent.appendChild(rowSimple("\u65E0\u6CD5\u8BFB\u53D6\u5F53\u524D\u6A21\u578B\u6765\u6E90", formatAgentProviderCaughtError(e)));
  }).finally(() => {
    picker.disabled = false;
  });
}
function renderCodexNativeProvider(sectionsWrap) {
  const section = document.createElement("section");
  section.className = "flex flex-col gap-2";
  section.appendChild(sectionTitle("Codex \u539F\u751F\u6A21\u578B"));
  const card = roundedCard();
  card.appendChild(
    rowSimple(
      "\u4F7F\u7528 Codex / OpenAI \u539F\u751F\u6A21\u578B",
      "\u5F53\u524D\u4F1A\u7EE7\u7EED\u4F7F\u7528 Codex \u81EA\u8EAB\u7684\u6A21\u578B\u9009\u62E9\u548C\u9274\u6743\u914D\u7F6E\uFF1B\u7B2C\u4E09\u65B9\u63A5\u5165\u4E0D\u4F1A\u8986\u76D6\u5B83\u3002"
    )
  );
  section.appendChild(card);
  sectionsWrap.appendChild(section);
}
function writeAgentProviderSelection(selection) {
  localStorage.setItem(AGENT_PROVIDER_SELECTION_KEY, selection);
}
function asAgentProviderSelection(value) {
  if (value === "deepseek" || value === "zhipu" || value === "qwen") return value;
  return "codex-native";
}
function renderAgentProviderPage(sectionsWrap, providerId, subtitle, options = {}) {
  const meta = agentProviderMeta(providerId);
  const settings = document.createElement("section");
  settings.className = "flex flex-col gap-2";
  settings.appendChild(sectionTitle("\u8FDE\u63A5\u8BBE\u7F6E"));
  const settingsCard = roundedCard();
  settingsCard.appendChild(rowSimple("\u6B63\u5728\u52A0\u8F7D\u8FDE\u63A5\u8BBE\u7F6E", "\u6B63\u5728\u8BFB\u53D6\u672C\u673A\u4FDD\u5B58\u7684\u63A5\u5165\u914D\u7F6E\u3002"));
  settings.appendChild(settingsCard);
  sectionsWrap.appendChild(settings);
  void import_electron.ipcRenderer.invoke("codexpp:get-agent-provider-config", providerId).then((config) => {
    if (subtitle) subtitle.textContent = meta.description;
    settingsCard.textContent = "";
    const viewConfig = config;
    renderAgentProviderConfig(settingsCard, providerId, viewConfig);
    if (options.promptXiaobaiRegistration) {
      maybePromptXiaobaiRegistration(providerId, viewConfig);
    }
  }).catch((e) => {
    if (subtitle) subtitle.textContent = `\u65E0\u6CD5\u52A0\u8F7D ${meta.label} \u914D\u7F6E\u3002`;
    settingsCard.textContent = "";
    settingsCard.appendChild(rowSimple("\u65E0\u6CD5\u52A0\u8F7D\u8FDE\u63A5\u8BBE\u7F6E", String(e)));
  });
}
function renderAgentProviderConfig(settingsCard, providerId, config) {
  const meta = agentProviderMeta(providerId);
  let enabled = config.enabled;
  const apiKeyInput = agentTextInput(config.apiKey, "sk-...", "password");
  const apiKeyControl = apiKeyInputWithXiaobaiAssist(apiKeyInput, providerId);
  const baseUrlInput = agentTextInput(config.baseUrl, agentBaseUrlPlaceholder(providerId, config.mode));
  const modelSelect = agentModelSelect(config.model);
  const modelStatus = document.createElement("div");
  modelStatus.className = "min-h-5 text-xs text-token-text-secondary";
  const refreshModelsButton = compactButton("\u5237\u65B0\u6A21\u578B", () => {
    void refreshModels();
  });
  const appIdInput = agentTextInput(config.appId, "app-...");
  const sessionIdInput = agentTextInput(config.sessionId, "\u53EF\u9009\uFF0C\u7528\u4E8E\u8FDE\u7EED\u5BF9\u8BDD");
  const systemPromptInput = agentTextarea(config.systemPrompt, "\u53EF\u9009\uFF0C\u4F8B\u5982\uFF1A\u4F60\u662F\u4E00\u4E2A\u4E25\u8C28\u7684\u4EE3\u7801\u52A9\u624B\u3002", 3);
  const temperatureInput = agentNumberInput(config.temperature, "0.7", "0", "2", "0.1");
  const maxTokensInput = agentNumberInput(config.maxTokens, "2048", "1", "384000", "1");
  const modeSelect = agentSelect(config.mode, [
    ["app", "\u767E\u70BC\u667A\u80FD\u4F53\u5E94\u7528"],
    ["chat", "\u5343\u95EE\u6A21\u578B\uFF08OpenAI \u517C\u5BB9\uFF09"]
  ]);
  const accessModeSelect = agentSelect(config.accessMode ?? "bridge", [
    ["bridge", "\u6865\u63A5\u6A21\u5F0F\uFF08\u4FDD\u7559 Codex \u767B\u5F55\uFF09"],
    ["pure-api", "\u7EAF API \u6A21\u5F0F\uFF08\u4E0D\u4F9D\u8D56\u5B98\u65B9\u767B\u5F55\uFF09"]
  ]);
  let savedStatus = null;
  let saveTimer = null;
  let lastAutoTestFingerprint = "";
  let lastTrustedUserEditAt = 0;
  const markTrustedUserEdit = (event) => {
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
  const collect = () => ({
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
    maxTokens: Math.round(clampNumber(Number(maxTokensInput.value), 1, 384e3, config.maxTokens)),
    sessionId: sessionIdInput.value.trim()
  });
  const refreshModels = async (options = {}) => {
    if (!shouldUseModelSelect(providerId, modeSelect.value)) {
      setAgentModelOptions(modelSelect, [], "");
      modelSelect.disabled = true;
      modelStatus.className = "min-h-5 text-xs text-token-text-secondary";
      modelStatus.textContent = "\u767E\u70BC\u667A\u80FD\u4F53\u5E94\u7528\u6A21\u5F0F\u4E0D\u9700\u8981\u9009\u62E9\u6A21\u578B\u3002";
      if (options.autoTest) void maybeAutoTest();
      return;
    }
    if (!apiKeyInput.value.trim()) {
      setAgentModelOptions(modelSelect, [], "");
      modelSelect.disabled = true;
      modelStatus.className = "min-h-5 text-xs text-token-text-secondary";
      modelStatus.textContent = "\u586B\u5199 API Key \u540E\u4F1A\u81EA\u52A8\u8BFB\u53D6\u6A21\u578B\u5217\u8868\u3002";
      return;
    }
    refreshModelsButton.disabled = true;
    modelSelect.disabled = true;
    modelStatus.className = "min-h-5 text-xs text-token-text-secondary";
    modelStatus.textContent = "\u6B63\u5728\u8BF7\u6C42\u6A21\u578B\u5217\u8868\u3002";
    try {
      const result = await import_electron.ipcRenderer.invoke(
        "codexpp:list-agent-provider-models",
        providerId,
        collect()
      );
      if (result.disabledReason) {
        setAgentModelOptions(modelSelect, [], "");
        modelSelect.disabled = true;
        modelStatus.textContent = result.disabledReason;
        if (options.autoTest) void maybeAutoTest();
        return;
      }
      setAgentModelOptions(modelSelect, result.models, modelSelect.value || config.model);
      modelSelect.disabled = result.models.length === 0;
      modelStatus.className = result.models.length > 0 ? "min-h-5 text-xs text-token-charts-green" : "min-h-5 text-xs text-token-charts-red";
      modelStatus.textContent = result.models.length > 0 ? `\u5DF2\u52A0\u8F7D ${result.models.length} \u4E2A\u6A21\u578B\u3002` : "\u670D\u52A1\u5546\u6CA1\u6709\u8FD4\u56DE\u53EF\u9009\u6A21\u578B\u3002";
      if (options.autoTest) {
        if (result.models.length > 0) void maybeAutoTest();
        else showAgentProviderTestDialog("\u6D4B\u8BD5\u5931\u8D25", "\u670D\u52A1\u5546\u6CA1\u6709\u8FD4\u56DE\u53EF\u9009\u6A21\u578B\uFF0C\u6682\u65F6\u65E0\u6CD5\u53D1\u9001\u6D4B\u8BD5\u8BF7\u6C42\u3002\u8BF7\u786E\u8BA4 API Key \u6743\u9650\u3001\u8D26\u53F7\u5730\u57DF\u548C Base URL \u662F\u5426\u5339\u914D\u3002", "error");
      }
    } catch (e) {
      setAgentModelOptions(modelSelect, [], "");
      modelSelect.disabled = true;
      modelStatus.className = "min-h-5 text-xs text-token-charts-red";
      modelStatus.textContent = firstLine(formatAgentProviderCaughtError(e));
      if (options.autoTest && isCompleteAgentApiKey(apiKeyInput.value)) {
        showAgentProviderTestDialog("\u6D4B\u8BD5\u5931\u8D25", `\u65E0\u6CD5\u8BFB\u53D6\u6A21\u578B\u5217\u8868\u3002

${formatAgentProviderCaughtError(e)}`, "error");
      }
    } finally {
      refreshModelsButton.disabled = false;
    }
  };
  const syncModelSelectState = () => {
    refreshModelsButton.disabled = !shouldUseModelSelect(providerId, modeSelect.value);
    if (!shouldUseModelSelect(providerId, modeSelect.value)) {
      setAgentModelOptions(modelSelect, [], "");
      modelSelect.disabled = true;
      modelStatus.className = "min-h-5 text-xs text-token-text-secondary";
      modelStatus.textContent = "\u767E\u70BC\u667A\u80FD\u4F53\u5E94\u7528\u6A21\u5F0F\u4E0D\u9700\u8981\u9009\u62E9\u6A21\u578B\u3002";
    }
  };
  const saveConfig = async (options = {}) => {
    if (savedStatus && !options.quiet) {
      savedStatus.className = "min-h-5 text-sm text-token-text-secondary";
      savedStatus.textContent = options.status ?? "\u6B63\u5728\u81EA\u52A8\u4FDD\u5B58\u3002";
    }
    const saved = await import_electron.ipcRenderer.invoke(
      "codexpp:set-agent-provider-config",
      providerId,
      collect()
    );
    if (savedStatus && !options.quiet) {
      savedStatus.className = "min-h-5 text-sm text-token-charts-green";
      savedStatus.textContent = "\u5DF2\u81EA\u52A8\u4FDD\u5B58\u3002";
    }
    refreshComposerModelSourceLabel();
    return saved;
  };
  const maybeAutoTest = async () => {
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
      apiKey: `${apiKey.length}:${apiKey.slice(-8)}`
    });
    if (fingerprint === lastAutoTestFingerprint) return;
    lastAutoTestFingerprint = fingerprint;
    showAgentProviderTestDialog("\u6B63\u5728\u6D4B\u8BD5\u63A5\u5165", "\u5DF2\u68C0\u6D4B\u5230\u5B8C\u6574 API Key\uFF0C\u6B63\u5728\u5411\u670D\u52A1\u5546\u53D1\u9001\u4E00\u6B21\u6D4B\u8BD5\u8BF7\u6C42\u3002", "pending");
    try {
      await saveConfig({ quiet: true });
      const result = await import_electron.ipcRenderer.invoke(
        "codexpp:test-agent-provider",
        providerId,
        { prompt: DEFAULT_AGENT_TEST_PROMPT, config: current }
      );
      if (result.sessionId) sessionIdInput.value = result.sessionId;
      const shouldAutoActivate = Date.now() - lastTrustedUserEditAt < 12e4;
      const activation = shouldAutoActivate ? await import_electron.ipcRenderer.invoke(
        "codexpp:activate-agent-provider",
        providerId,
        current
      ) : null;
      if (activation) refreshComposerModelSourceLabel();
      showAgentProviderTestDialog(
        "\u6D4B\u8BD5\u6210\u529F",
        activation ? `${formatAgentProviderTestResult(result)}

\u4E3B\u754C\u9762\u63A5\u7BA1\uFF1A${activation.message}
\u6865\u63A5\u5730\u5740\uFF1A${activation.bridgeUrl ?? "Codex \u539F\u751F"}
\u914D\u7F6E\u6587\u4EF6\uFF1A${activation.configPath}` : `${formatAgentProviderTestResult(result)}

\u4E3B\u754C\u9762\u63A5\u7BA1\uFF1A\u672A\u81EA\u52A8\u5207\u6362\u3002\u8BE5\u6D4B\u8BD5\u4E0D\u662F\u672C\u6B21\u624B\u52A8\u8F93\u5165\u89E6\u53D1\uFF0C\u5DF2\u907F\u514D\u65E7\u9875\u9762\u72B6\u6001\u8986\u76D6\u5F53\u524D Codex \u539F\u751F\u6A21\u578B\u3002`,
        "success"
      );
    } catch (e) {
      showAgentProviderTestDialog("\u6D4B\u8BD5\u5931\u8D25", formatAgentProviderCaughtError(e), "error");
    }
  };
  const scheduleAutoSave = (options = {}) => {
    if (saveTimer) clearTimeout(saveTimer);
    if (savedStatus) {
      savedStatus.className = "min-h-5 text-sm text-token-text-secondary";
      savedStatus.textContent = "\u6B63\u5728\u7B49\u5F85\u8F93\u5165\u5B8C\u6210\u540E\u81EA\u52A8\u4FDD\u5B58\u3002";
    }
    saveTimer = setTimeout(() => {
      saveTimer = null;
      void saveConfig().then(() => {
        if (options.refreshModels) return refreshModels({ autoTest: options.autoTest });
        if (options.autoTest) return maybeAutoTest();
        return void 0;
      }).catch((e) => {
        if (!savedStatus) return;
        savedStatus.className = "min-h-5 text-sm text-token-charts-red";
        savedStatus.textContent = firstLine(formatAgentProviderCaughtError(e));
      });
    }, 700);
  };
  const bindAutoSave = (el, event, options) => {
    el.addEventListener(event, (domEvent) => {
      markTrustedUserEdit(domEvent);
      scheduleAutoSave(options);
    });
  };
  settingsCard.appendChild(
    agentControlRow(
      "\u542F\u7528\u5165\u53E3",
      "\u5173\u95ED\u540E\u4FDD\u7559\u914D\u7F6E\uFF0C\u4F46\u6D4B\u8BD5\u8BF7\u6C42\u4F1A\u88AB\u963B\u6B62\u3002",
      switchControl(enabled, async (next) => {
        enabled = next;
        await saveConfig({ quiet: true });
      })
    )
  );
  settingsCard.appendChild(
    agentControlRow(
      "\u8BA4\u8BC1\u6A21\u5F0F",
      "\u6865\u63A5\u6A21\u5F0F\u4FDD\u7559 Codex \u5B98\u65B9\u767B\u5F55\u6001\uFF1B\u7EAF API \u6A21\u5F0F\u628A API Key \u5199\u5165\u684C\u9762 Codex \u9694\u79BB auth.json\u3002",
      accessModeSelect
    )
  );
  settingsCard.appendChild(agentControlRow("API Key", "\u4FDD\u5B58\u5728\u672C\u673A codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u914D\u7F6E\u4E2D\u3002", apiKeyControl));
  if (providerId === "qwen") {
    settingsCard.appendChild(agentControlRow("\u8C03\u7528\u65B9\u5F0F", "\u667A\u80FD\u4F53\u5E94\u7528\u4F7F\u7528 APP_ID\uFF1B\u5343\u95EE\u6A21\u578B\u4F7F\u7528 OpenAI \u517C\u5BB9\u63A5\u53E3\u3002", modeSelect));
  }
  const modelControl = agentStackControl(
    modelSelect,
    agentInlineActions([refreshModelsButton, modelStatus])
  );
  if (providerId === "qwen") {
    settingsCard.appendChild(agentControlRow("\u5E94\u7528 ID", "\u767E\u70BC\u667A\u80FD\u4F53\u5E94\u7528\u6A21\u5F0F\u5FC5\u586B\u3002", appIdInput));
    settingsCard.appendChild(agentControlRow("\u4F1A\u8BDD ID", "\u53EF\u9009\uFF1B\u767E\u70BC\u5E94\u7528\u4F1A\u8FD4\u56DE session_id\uFF0C\u53EF\u7528\u4E8E\u4E0B\u4E00\u8F6E\u5BF9\u8BDD\u3002", sessionIdInput));
    settingsCard.appendChild(agentControlRow("\u6A21\u578B", "\u4ECE\u670D\u52A1\u5546\u63A5\u53E3\u8BFB\u53D6\uFF1B\u767E\u70BC\u667A\u80FD\u4F53\u5E94\u7528\u6A21\u5F0F\u4F1A\u5FFD\u7565\u3002", modelControl, "start"));
  } else {
    settingsCard.appendChild(agentControlRow("\u6A21\u578B", "\u901A\u8FC7\u670D\u52A1\u5546\u6A21\u578B\u5217\u8868\u63A5\u53E3\u8BFB\u53D6\uFF0C\u4E0D\u652F\u6301\u624B\u52A8\u586B\u5199\u3002", modelControl, "start"));
  }
  const advanced = agentDetails("\u9AD8\u7EA7\u914D\u7F6E", "Base URL\u3001\u7CFB\u7EDF\u63D0\u793A\u8BCD\u3001\u91C7\u6837\u548C\u8F93\u51FA\u957F\u5EA6\u9ED8\u8BA4\u6298\u53E0\u3002");
  advanced.body.appendChild(agentControlRow("Base URL", agentBaseUrlDescription(providerId), baseUrlInput));
  advanced.body.appendChild(agentControlRow("\u7CFB\u7EDF\u63D0\u793A\u8BCD", "\u53EF\u9009\uFF1B\u7528\u4E8E Chat Completions \u6A21\u5F0F\u3002", systemPromptInput, "start"));
  advanced.body.appendChild(
    agentControlRow(
      "\u91C7\u6837\u4E0E\u957F\u5EA6",
      "temperature \u63A7\u5236\u53D1\u6563\u7A0B\u5EA6\uFF1B\u6700\u5927\u8F93\u51FA\u9650\u5236\u672C\u6B21\u56DE\u7B54\u957F\u5EA6\u3002",
      agentInlineControls([
        ["temperature", temperatureInput],
        ["max tokens", maxTokensInput]
      ])
    )
  );
  const docsRow = actionRow("\u6587\u6863", "\u6253\u5F00\u670D\u52A1\u5546\u63A5\u53E3\u6587\u6863\u6216 API Key \u9875\u9762\u3002");
  const docsActions = docsRow.querySelector("[data-codexpp-row-actions]");
  docsActions?.appendChild(
    compactButton("\u6253\u5F00\u6587\u6863", () => {
      void import_electron.ipcRenderer.invoke("codexpp:open-external", meta.docsUrl);
    })
  );
  if (meta.keyUrl) {
    docsActions?.appendChild(
      compactButton("\u7533\u8BF7 API Key", () => {
        void import_electron.ipcRenderer.invoke("codexpp:open-external", meta.keyUrl);
      })
    );
  }
  advanced.body.appendChild(docsRow);
  settingsCard.appendChild(advanced.outer);
  const statusRow = document.createElement("div");
  statusRow.className = "p-3";
  savedStatus = document.createElement("div");
  savedStatus.className = "min-h-5 text-sm text-token-text-secondary";
  savedStatus.textContent = config.apiKey ? "\u5DF2\u52A0\u8F7D\u672C\u673A\u914D\u7F6E\uFF0C\u8F93\u5165\u540E\u4F1A\u81EA\u52A8\u4FDD\u5B58\u3002" : "\u5C1A\u672A\u586B\u5199 API Key\u3002";
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
function formatAgentProviderTestResult(result) {
  const lines = [result.text.trim() || "(\u7A7A\u54CD\u5E94)"];
  const meta = [];
  if (result.model) meta.push(`model: ${result.model}`);
  if (result.sessionId) meta.push(`session_id: ${result.sessionId}`);
  if (result.usage) meta.push(`usage: ${JSON.stringify(result.usage)}`);
  if (meta.length > 0) lines.push("", meta.join("\n"));
  return lines.join("\n");
}
function formatAgentProviderCaughtError(e) {
  const raw = String(e.message ?? e);
  return raw.replace(/^Error invoking remote method '[^']+':\s*/i, "").replace(/^Error:\s*/i, "").trim() || "\u670D\u52A1\u5546\u8FD4\u56DE\u4E86\u672A\u77E5\u9519\u8BEF\u3002";
}
function firstLine(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.find((line) => line.startsWith("\u539F\u56E0\uFF1A")) ?? lines[0] ?? text;
}
function isAgentProviderReadyForAutoTest(providerId, config) {
  if (!config.enabled) return false;
  if (!isCompleteAgentApiKey(config.apiKey ?? "")) return false;
  if (!config.baseUrl?.trim()) return false;
  if (providerId === "qwen" && config.mode === "app") return Boolean(config.appId?.trim());
  return Boolean(config.model?.trim());
}
function isCompleteAgentApiKey(value) {
  const key = value.trim();
  return key.length >= 24 && !/\s/.test(key);
}
function shouldPromptXiaobaiRegistration(providerId, config) {
  return providerId !== "zhipu" && !config.apiKey?.trim();
}
function maybePromptXiaobaiRegistration(providerId, config) {
  if (!shouldPromptXiaobaiRegistration(providerId, config)) return;
  const label = agentProviderMeta(providerId).label;
  const accepted = window.confirm(
    `${label} \u5C1A\u672A\u586B\u5199 API Key\u3002

\u662F\u5426\u542F\u7528\u5C0F\u767DAI\u8F85\u52A9\u81EA\u52A8\u6CE8\u518C API\uFF1F`
  );
  if (!accepted) return;
  void openXiaobaiAiToolboxForApiRegistration(providerId);
}
function apiKeyInputWithXiaobaiAssist(input, providerId) {
  const wrap = document.createElement("div");
  wrap.className = "flex w-full min-w-0 items-center gap-2";
  input.classList.add("min-w-0", "flex-1");
  const button2 = compactButton("\u5C0F\u767DAI\u8F85\u52A9\u7533\u8BF7", () => {
    void openXiaobaiAiToolboxForApiRegistration(providerId);
  });
  button2.classList.add("shrink-0");
  button2.title = "\u6253\u5F00\u5C0F\u767DAI\u5DE5\u5177\u7BB1\uFF0C\u8F85\u52A9\u7533\u8BF7\u5E76\u6CE8\u518C API Key";
  wrap.appendChild(input);
  wrap.appendChild(button2);
  return wrap;
}
async function openXiaobaiAiToolboxForApiRegistration(providerId) {
  try {
    await import_electron.ipcRenderer.invoke("codexpp:open-xiaobai-toolbox", {
      provider: providerId,
      purpose: "api-registration"
    });
  } catch (e) {
    showAgentProviderTestDialog(
      "\u65E0\u6CD5\u6253\u5F00\u5C0F\u767DAI\u5DE5\u5177\u7BB1",
      formatAgentProviderCaughtError(e),
      "error"
    );
  }
}
function showAgentProviderTestDialog(titleText, bodyText, tone) {
  const existing = document.querySelector("[data-codexpp-agent-test-dialog]");
  existing?.remove();
  const overlay = document.createElement("div");
  overlay.dataset.codexppAgentTestDialog = "true";
  overlay.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  const dialog = document.createElement("div");
  dialog.className = "flex w-full max-w-xl flex-col gap-4 rounded-lg border border-token-border bg-token-main-surface-primary p-4 shadow-xl";
  overlay.appendChild(dialog);
  const header = document.createElement("div");
  header.className = "flex items-start justify-between gap-3";
  const titleStack = document.createElement("div");
  titleStack.className = "flex min-w-0 flex-col gap-1";
  const title = document.createElement("div");
  title.className = "text-base font-medium text-token-text-primary";
  title.textContent = titleText;
  const status = document.createElement("div");
  status.className = tone === "success" ? "text-sm text-token-charts-green" : tone === "error" ? "text-sm text-token-charts-red" : "text-sm text-token-text-secondary";
  status.textContent = tone === "success" ? "\u63A5\u5165\u53EF\u7528" : tone === "error" ? "\u63A5\u5165\u4E0D\u53EF\u7528" : "\u6B63\u5728\u9A8C\u8BC1";
  titleStack.appendChild(title);
  titleStack.appendChild(status);
  header.appendChild(titleStack);
  const close = compactButton("\u5173\u95ED", () => overlay.remove());
  header.appendChild(close);
  dialog.appendChild(header);
  const body = document.createElement("pre");
  body.className = "max-h-80 whitespace-pre-wrap overflow-auto rounded-md border border-token-border bg-token-foreground/5 p-3 text-sm leading-5 text-token-text-primary";
  body.textContent = bodyText;
  dialog.appendChild(body);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
  close.focus();
}
function agentControlRow(titleText, description, control, align = "center") {
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
function agentDetails(title, description) {
  const outer = document.createElement("details");
  outer.className = "group";
  const summary = document.createElement("summary");
  summary.className = "flex cursor-pointer list-none items-center justify-between gap-4 p-3 text-sm text-token-text-primary";
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
  marker.textContent = "\u5C55\u5F00";
  summary.appendChild(left);
  summary.appendChild(marker);
  const body = document.createElement("div");
  body.className = "flex flex-col divide-y-[0.5px] divide-token-border border-t-[0.5px] border-token-border";
  outer.appendChild(summary);
  outer.appendChild(body);
  outer.addEventListener("toggle", () => {
    marker.textContent = outer.open ? "\u6536\u8D77" : "\u5C55\u5F00";
  });
  return { outer, body };
}
function agentTextInput(value, placeholder, type = "text") {
  const input = document.createElement("input");
  input.type = type;
  input.value = value;
  input.placeholder = placeholder;
  input.autocomplete = "off";
  input.spellcheck = false;
  input.className = "h-9 w-full rounded-lg border border-token-border bg-transparent px-3 text-sm text-token-text-primary focus:outline-none";
  return input;
}
function agentNumberInput(value, placeholder, min, max, step) {
  const input = agentTextInput(String(value), placeholder, "number");
  input.min = min;
  input.max = max;
  input.step = step;
  return input;
}
function agentTextarea(value, placeholder, rows) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.placeholder = placeholder;
  textarea.rows = rows;
  textarea.spellcheck = false;
  textarea.className = "w-full resize-y rounded-lg border border-token-border bg-transparent px-3 py-2 text-sm leading-5 text-token-text-primary focus:outline-none";
  return textarea;
}
function agentSelect(value, options) {
  const select = document.createElement("select");
  select.className = "h-9 w-full rounded-lg border border-token-border bg-transparent px-2 text-sm text-token-text-primary focus:outline-none";
  for (const [optionValue, label] of options) {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = label;
    option.selected = value === optionValue;
    select.appendChild(option);
  }
  return select;
}
function agentModelSelect(selected) {
  const select = agentSelect("", [["", "\u8BF7\u5237\u65B0\u6A21\u578B\u5217\u8868"]]);
  select.value = selected;
  select.disabled = true;
  return select;
}
function setAgentModelOptions(select, models, preferred) {
  const previous = select.value || preferred;
  select.textContent = "";
  if (models.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "\u65E0\u53EF\u9009\u6A21\u578B";
    select.appendChild(option);
    select.value = "";
    return;
  }
  for (const model of models) {
    const option = document.createElement("option");
    option.value = model.id;
    option.textContent = model.label && model.label !== model.id ? `${model.label} (${model.id})` : model.id;
    option.title = model.ownedBy ? `${model.id} \xB7 ${model.ownedBy}` : model.id;
    select.appendChild(option);
  }
  const ids = new Set(models.map((model) => model.id));
  select.value = ids.has(previous) ? previous : models[0].id;
}
function agentStackControl(primary, secondary) {
  const wrap = document.createElement("div");
  wrap.className = "flex w-full flex-col gap-2";
  wrap.appendChild(primary);
  wrap.appendChild(secondary);
  return wrap;
}
function agentInlineActions(items) {
  const wrap = document.createElement("div");
  wrap.className = "flex min-w-0 items-center gap-2";
  for (const item of items) wrap.appendChild(item);
  return wrap;
}
function shouldUseModelSelect(providerId, mode) {
  return providerId !== "qwen" || mode === "chat";
}
function agentInlineControls(items) {
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
function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
function agentBaseUrlPlaceholder(providerId, mode) {
  if (providerId === "deepseek") return "https://api.deepseek.com";
  if (providerId === "zhipu") return "https://open.bigmodel.cn/api/paas/v4";
  return mode === "chat" ? "https://dashscope.aliyuncs.com/compatible-mode/v1" : "https://dashscope.aliyuncs.com/api/v1";
}
function agentBaseUrlDescription(providerId) {
  if (providerId === "deepseek") return "\u9ED8\u8BA4\u8FFD\u52A0 /chat/completions\u3002";
  if (providerId === "zhipu") return "\u9ED8\u8BA4\u8FFD\u52A0 /chat/completions\uFF0C\u4F7F\u7528\u667A\u8C31 OpenAI \u517C\u5BB9\u63A5\u53E3\u3002";
  return "\u767E\u70BC\u5E94\u7528\u6A21\u5F0F\u8FFD\u52A0 /apps/APP_ID/completion\uFF1B\u5343\u95EE\u6A21\u578B\u6A21\u5F0F\u8FFD\u52A0 /chat/completions\u3002";
}
function renderCodexPlusPlusConfig(card, config) {
  setSidebarCodexPlusPlusUpdateButton(config.updateCheck);
  card.appendChild(pluginEnabledRow(config));
  card.appendChild(autoUpdateRow(config));
  card.appendChild(updateChannelRow(config));
  card.appendChild(installationSourceRow(config.installationSource));
  card.appendChild(selfUpdateStatusRow(config.selfUpdate));
  card.appendChild(checkForUpdatesRow(config));
  if (config.updateCheck) card.appendChild(releaseNotesRow(config.updateCheck));
}
function pluginEnabledRow(config) {
  const row = document.createElement("div");
  row.className = "flex items-center justify-between gap-4 p-3";
  const left = document.createElement("div");
  left.className = "flex min-w-0 flex-col gap-1";
  const title = document.createElement("div");
  title.className = "min-w-0 text-sm text-token-text-primary";
  title.textContent = "\u63D2\u4EF6\u603B\u5F00\u5173";
  const desc = document.createElement("div");
  desc.className = "text-token-text-secondary min-w-0 text-sm";
  desc.textContent = "\u5173\u95ED\u540E\u53EA\u4FDD\u7559\u8BBE\u7F6E\u9875\u548C\u5F00\u5173\u76D1\u542C\uFF0C\u7B2C\u4E09\u65B9\u6A21\u578B\u6865\u3001\u63D2\u4EF6\u529F\u80FD\u548C\u540E\u53F0\u81EA\u52A8\u4FEE\u590D\u90FD\u4F1A\u6682\u505C\u3002";
  left.appendChild(title);
  left.appendChild(desc);
  row.appendChild(left);
  row.appendChild(
    switchControl(config.enabled, async (next) => {
      await import_electron.ipcRenderer.invoke("codexpp:set-plugin-enabled", next);
      refreshConfigCard(row);
    })
  );
  return row;
}
function autoUpdateRow(config) {
  const row = document.createElement("div");
  row.className = "flex items-center justify-between gap-4 p-3";
  const left = document.createElement("div");
  left.className = "flex min-w-0 flex-col gap-1";
  const title = document.createElement("div");
  title.className = "min-w-0 text-sm text-token-text-primary";
  title.textContent = "\u81EA\u52A8\u5237\u65B0 codex\u6C49\u5316\u589E\u5F3Aplus\u7248";
  const desc = document.createElement("div");
  desc.className = "text-token-text-secondary min-w-0 text-sm";
  desc.textContent = `\u5DF2\u5B89\u88C5\u7248\u672C v${config.version}\u3002\u540E\u53F0\u670D\u52A1\u4F1A\u9759\u9ED8\u68C0\u67E5\u66F4\u65B0\uFF0C\u5E76\u5728 Codex \u66F4\u65B0\u540E\u81EA\u52A8\u6062\u590D codex\u6C49\u5316\u589E\u5F3Aplus\u7248 runtime\u3002`;
  left.appendChild(title);
  left.appendChild(desc);
  row.appendChild(left);
  row.appendChild(
    switchControl(config.autoUpdate, async (next) => {
      await import_electron.ipcRenderer.invoke("codexpp:set-auto-update", next);
    })
  );
  return row;
}
function updateChannelRow(config) {
  const row = actionRow("\u53D1\u5E03\u901A\u9053", updateChannelSummary(config));
  const action = row.querySelector("[data-codexpp-row-actions]");
  const select = document.createElement("select");
  select.className = "h-8 rounded-lg border border-token-border bg-transparent px-2 text-sm text-token-text-primary focus:outline-none";
  for (const [value, label] of [
    ["stable", "\u7A33\u5B9A\u7248"],
    ["prerelease", "\u9884\u53D1\u5E03\u7248"],
    ["custom", "\u81EA\u5B9A\u4E49"]
  ]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = config.updateChannel === value;
    select.appendChild(option);
  }
  select.addEventListener("change", () => {
    void import_electron.ipcRenderer.invoke("codexpp:set-update-config", { updateChannel: select.value }).then(() => refreshConfigCard(row)).catch((e) => plog("set update channel failed", String(e)));
  });
  action?.appendChild(select);
  if (config.updateChannel === "custom") {
    action?.appendChild(
      compactButton("\u7F16\u8F91", () => {
        const repo = window.prompt("GitHub \u4ED3\u5E93", config.updateRepo || "chengyou888/-");
        if (repo === null) return;
        const ref = window.prompt("Git \u5F15\u7528", config.updateRef || "main");
        if (ref === null) return;
        void import_electron.ipcRenderer.invoke("codexpp:set-update-config", {
          updateChannel: "custom",
          updateRepo: repo,
          updateRef: ref
        }).then(() => refreshConfigCard(row)).catch((e) => plog("set custom update source failed", String(e)));
      })
    );
  }
  return row;
}
function installationSourceRow(source) {
  return rowSimple("\u5B89\u88C5\u6765\u6E90", localizeInstallationSource(source));
}
function selfUpdateStatusRow(state2) {
  const row = rowSimple("\u4E0A\u6B21 codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u66F4\u65B0", selfUpdateSummary(state2));
  const left = row.firstElementChild;
  if (left && state2) left.prepend(statusBadge(selfUpdateStatusTone(state2.status), selfUpdateStatusLabel(state2.status)));
  return row;
}
function checkForUpdatesRow(config) {
  const check = config.updateCheck;
  const row = document.createElement("div");
  row.className = "flex items-center justify-between gap-4 p-3";
  const left = document.createElement("div");
  left.className = "flex min-w-0 flex-col gap-1";
  const title = document.createElement("div");
  title.className = "min-w-0 text-sm text-token-text-primary";
  title.textContent = check?.updateAvailable ? "codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u6709\u53EF\u7528\u66F4\u65B0" : "\u68C0\u67E5 codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u66F4\u65B0";
  const desc = document.createElement("div");
  desc.className = "text-token-text-secondary min-w-0 text-sm";
  desc.textContent = updateSummary(check);
  left.appendChild(title);
  left.appendChild(desc);
  row.appendChild(left);
  const actions = document.createElement("div");
  actions.className = "flex shrink-0 items-center gap-2";
  actions.appendChild(
    compactButton("\u7ACB\u5373\u68C0\u67E5", () => {
      row.style.opacity = "0.65";
      void import_electron.ipcRenderer.invoke("codexpp:check-codexpp-update", true).then((check2) => {
        setSidebarCodexPlusPlusUpdateButton(check2);
        refreshConfigCard(row);
      }).catch((e) => plog("codex\u6C49\u5316\u589E\u5F3Aplus\u7248 release check failed", String(e))).finally(() => {
        row.style.opacity = "";
      });
    })
  );
  actions.appendChild(
    compactButton("\u4E0B\u8F7D\u66F4\u65B0", () => {
      row.style.opacity = "0.65";
      const buttons = actions.querySelectorAll("button");
      buttons.forEach((button2) => button2.disabled = true);
      void import_electron.ipcRenderer.invoke("codexpp:run-codexpp-update").then(() => {
        refreshSidebarCodexPlusPlusUpdateButton(true);
        refreshConfigCard(row);
      }).catch((e) => {
        plog("codex\u6C49\u5316\u589E\u5F3Aplus\u7248 self-update failed", String(e));
        void refreshConfigCard(row);
      }).finally(() => {
        row.style.opacity = "";
        buttons.forEach((button2) => button2.disabled = false);
      });
    })
  );
  row.appendChild(actions);
  return row;
}
function releaseNotesRow(check) {
  const row = document.createElement("div");
  row.className = "flex flex-col gap-2 p-3";
  const title = document.createElement("div");
  title.className = "text-sm text-token-text-primary";
  title.textContent = "\u6700\u65B0\u53D1\u5E03\u8BF4\u660E";
  row.appendChild(title);
  const body = document.createElement("div");
  body.className = "max-h-60 overflow-auto rounded-md border border-token-border bg-token-foreground/5 p-3 text-sm text-token-text-secondary";
  body.appendChild(renderReleaseNotesMarkdown(localizeReleaseNotes(check.releaseNotes?.trim() || check.error || "")));
  row.appendChild(body);
  return row;
}
function renderReleaseNotesMarkdown(markdown) {
  const root = document.createElement("div");
  root.className = "flex flex-col gap-2";
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  let paragraph = [];
  let list = null;
  let codeLines = null;
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
    pre.className = "m-0 overflow-auto rounded-md border border-token-border bg-token-foreground/10 p-2 text-xs text-token-text-primary";
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
      if (!list || wantOrdered && list.tagName !== "OL" || !wantOrdered && list.tagName !== "UL") {
        flushList();
        list = document.createElement(wantOrdered ? "ol" : "ul");
        list.className = wantOrdered ? "m-0 list-decimal space-y-1 pl-5 leading-5" : "m-0 list-disc space-y-1 pl-5 leading-5";
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
function appendInlineMarkdown(parent, text) {
  const pattern = /(`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index === void 0) continue;
    appendText(parent, text.slice(lastIndex, match.index));
    if (match[2] !== void 0) {
      const code = document.createElement("code");
      code.className = "rounded border border-token-border bg-token-foreground/10 px-1 py-0.5 text-xs text-token-text-primary";
      code.textContent = match[2];
      parent.appendChild(code);
    } else if (match[3] !== void 0 && match[4] !== void 0) {
      const a = document.createElement("a");
      a.className = "text-token-text-primary underline underline-offset-2";
      a.href = match[4];
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = match[3];
      parent.appendChild(a);
    } else if (match[5] !== void 0) {
      const strong = document.createElement("strong");
      strong.className = "font-medium text-token-text-primary";
      strong.textContent = match[5];
      parent.appendChild(strong);
    } else if (match[6] !== void 0) {
      const em = document.createElement("em");
      em.textContent = match[6];
      parent.appendChild(em);
    }
    lastIndex = match.index + match[0].length;
  }
  appendText(parent, text.slice(lastIndex));
}
function appendText(parent, text) {
  if (text) parent.appendChild(document.createTextNode(text));
}
function renderWatcherHealthCard(card) {
  void import_electron.ipcRenderer.invoke("codexpp:get-watcher-health").then((health) => {
    card.textContent = "";
    renderWatcherHealth(card, health);
  }).catch((e) => {
    card.textContent = "";
    card.appendChild(rowSimple("\u65E0\u6CD5\u68C0\u67E5\u540E\u53F0\u670D\u52A1", String(e)));
  });
}
function renderWatcherHealth(card, health) {
  card.appendChild(watcherSummaryRow(health));
  for (const check of health.checks) {
    if (check.status === "ok") continue;
    card.appendChild(watcherCheckRow(check));
  }
}
function watcherSummaryRow(health) {
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
  desc.textContent = `${localizeWatcherText(health.summary)} \u68C0\u67E5\u65F6\u95F4\uFF1A${new Date(health.checkedAt).toLocaleString()}\u3002`;
  stack.appendChild(title);
  stack.appendChild(desc);
  left.appendChild(stack);
  row.appendChild(left);
  const action = document.createElement("div");
  action.className = "flex shrink-0 items-center gap-2";
  action.appendChild(
    compactButton("\u7ACB\u5373\u68C0\u67E5", () => {
      const card = row.parentElement;
      if (!card) return;
      card.textContent = "";
      card.appendChild(rowSimple("\u6B63\u5728\u68C0\u67E5\u540E\u53F0\u670D\u52A1", "\u6B63\u5728\u9A8C\u8BC1\u66F4\u65B0\u5668\u4FEE\u590D\u670D\u52A1\u3002"));
      renderWatcherHealthCard(card);
    })
  );
  row.appendChild(action);
  return row;
}
function watcherCheckRow(check) {
  const row = rowSimple(localizeWatcherText(check.name), localizeWatcherText(check.detail));
  const left = row.firstElementChild;
  if (left) left.prepend(statusBadge(check.status));
  return row;
}
function statusBadge(status, label) {
  const badge = document.createElement("span");
  const tone = status === "ok" ? "border-token-charts-green text-token-charts-green" : status === "warn" ? "border-token-charts-yellow text-token-charts-yellow" : "border-token-charts-red text-token-charts-red";
  badge.className = `inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`;
  badge.textContent = label ? localizeWatcherText(label) : status === "ok" ? "\u6B63\u5E38" : status === "warn" ? "\u9700\u68C0\u67E5" : "\u9519\u8BEF";
  return badge;
}
function localizeWatcherText(text) {
  return text.replace(/^scheduled-task$/i, "\u8BA1\u5212\u4EFB\u52A1").replace(/^windows-service$/i, "Windows \u670D\u52A1").replace(/^launchd$/i, "launchd").replace(/^Auto-repair watcher needs review$/i, "\u540E\u53F0\u4FEE\u590D\u670D\u52A1\u9700\u8981\u68C0\u67E5").replace(/^Auto-repair watcher is healthy$/i, "\u540E\u53F0\u4FEE\u590D\u670D\u52A1\u6B63\u5E38").replace(/^Auto-repair watcher failed$/i, "\u540E\u53F0\u4FEE\u590D\u670D\u52A1\u5931\u8D25").replace(/(\d+) failing check\(s\), (\d+) warning\(s\)\./i, "$1 \u9879\u68C0\u67E5\u5931\u8D25\uFF0C$2 \u9879\u8B66\u544A\u3002").replace(/^watcher task$/i, "\u540E\u53F0\u4EFB\u52A1").replace(/^watcher log$/i, "\u670D\u52A1\u65E5\u5FD7").replace(/^Plugin switch$/i, "\u63D2\u4EF6\u603B\u5F00\u5173").replace(/^Windows service$/i, "Windows \u670D\u52A1").replace(/^service state$/i, "\u670D\u52A1\u72B6\u6001").replace(/^legacy scheduled tasks$/i, "\u65E7\u8BA1\u5212\u4EFB\u52A1").replace(/^disabled in codex-plusplus config$/i, "\u5DF2\u5728 codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u914D\u7F6E\u4E2D\u5173\u95ED").replace(/^skipped because plugin switch is off$/i, "\u63D2\u4EF6\u603B\u5F00\u5173\u5DF2\u5173\u95ED\uFF0C\u5DF2\u8DF3\u8FC7").replace(/^installed but not running$/i, "\u5DF2\u5B89\u88C5\u4F46\u672A\u8FD0\u884C").replace(/^old watcher tasks still exist$/i, "\u4ECD\u6709\u65E7\u8BA1\u5212\u4EFB\u52A1\u6B8B\u7559").replace(/^removed$/i, "\u5DF2\u79FB\u9664").replace(/^install state$/i, "\u5B89\u88C5\u72B6\u6001").replace(/^runtime$/i, "runtime").replace(/^repair state$/i, "\u4FEE\u590D\u72B6\u6001");
}
function updateSummary(check) {
  if (!check) return "\u5C1A\u672A\u68C0\u67E5\u66F4\u65B0\u3002";
  const latest = check.latestVersion ? `\u6700\u65B0 v${check.latestVersion}\u3002` : "";
  const checked = `\u68C0\u67E5\u65F6\u95F4\uFF1A${new Date(check.checkedAt).toLocaleString()}\u3002`;
  if (check.error) return `${latest}${checked} ${check.error}`;
  return `${latest}${checked}`;
}
function updateChannelSummary(config) {
  if (config.updateChannel === "custom") {
    return `${config.updateRepo || "chengyou888/-"} ${config.updateRef || "\uFF08\u672A\u8BBE\u7F6E ref\uFF09"}`;
  }
  if (config.updateChannel === "prerelease") {
    return "\u4F7F\u7528\u6700\u65B0\u53D1\u5E03\u7684 GitHub release\uFF0C\u5305\u62EC\u9884\u53D1\u5E03\u7248\u672C\u3002";
  }
  return "\u4F7F\u7528\u6700\u65B0\u7A33\u5B9A\u7248 GitHub release\u3002";
}
function selfUpdateSummary(state2) {
  if (!state2) return "\u5C1A\u672A\u8FD0\u884C\u8FC7\u81EA\u52A8 codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u66F4\u65B0\u3002";
  const checked = new Date(state2.completedAt ?? state2.checkedAt).toLocaleString();
  const target = state2.latestVersion ? ` \u76EE\u6807 v${state2.latestVersion}\u3002` : state2.targetRef ? ` \u76EE\u6807 ${state2.targetRef}\u3002` : "";
  const source = state2.installationSource ? localizeInstallationSource(state2.installationSource) : "\u672A\u77E5\u6765\u6E90";
  if (state2.status === "failed") return `\u5931\u8D25\u4E8E ${checked}\u3002${target} ${state2.error ?? "\u672A\u77E5\u9519\u8BEF"}`;
  if (state2.status === "updated") return `\u5DF2\u66F4\u65B0\u4E8E ${checked}\u3002${target} \u6765\u6E90\uFF1A${source}\u3002`;
  if (state2.status === "up-to-date") return `\u5DF2\u662F\u6700\u65B0 ${checked}\u3002${target} \u6765\u6E90\uFF1A${source}\u3002`;
  if (state2.status === "disabled") return `\u5DF2\u8DF3\u8FC7 ${checked}\uFF1B\u81EA\u52A8\u5237\u65B0\u5DF2\u5173\u95ED\u3002`;
  return `\u6B63\u5728\u68C0\u67E5\u66F4\u65B0\u3002\u6765\u6E90\uFF1A${source}\u3002`;
}
function selfUpdateStatusTone(status) {
  if (status === "failed") return "error";
  if (status === "disabled" || status === "checking") return "warn";
  return "ok";
}
function selfUpdateStatusLabel(status) {
  if (status === "up-to-date") return "\u6700\u65B0";
  if (status === "updated") return "\u5DF2\u66F4\u65B0";
  if (status === "failed") return "\u5931\u8D25";
  if (status === "disabled") return "\u5DF2\u5173\u95ED";
  return "\u68C0\u67E5\u4E2D";
}
function refreshConfigCard(row) {
  const card = row.closest("[data-codexpp-config-card]");
  if (!card) return;
  card.textContent = "";
  card.appendChild(rowSimple("\u6B63\u5728\u5237\u65B0", "\u6B63\u5728\u52A0\u8F7D\u5F53\u524D codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u66F4\u65B0\u72B6\u6001\u3002"));
  void import_electron.ipcRenderer.invoke("codexpp:get-config").then((config) => {
    card.textContent = "";
    renderCodexPlusPlusConfig(card, config);
  }).catch((e) => {
    card.textContent = "";
    card.appendChild(rowSimple("\u65E0\u6CD5\u5237\u65B0\u66F4\u65B0\u8BBE\u7F6E", String(e)));
  });
}
function uninstallRow() {
  const row = actionRow(
    "\u5378\u8F7D codex\u6C49\u5316\u589E\u5F3Aplus\u7248",
    "\u590D\u5236\u5378\u8F7D\u547D\u4EE4\u3002\u5B8C\u5168\u9000\u51FA Codex \u540E\uFF0C\u5728\u7EC8\u7AEF\u4E2D\u8FD0\u884C\u5B83\u3002"
  );
  const action = row.querySelector("[data-codexpp-row-actions]");
  action?.appendChild(
    compactButton("\u590D\u5236\u547D\u4EE4", () => {
      void import_electron.ipcRenderer.invoke("codexpp:copy-text", "node ~/.codex-plusplus/source/packages/installer/dist/cli.js uninstall").catch((e) => plog("copy uninstall command failed", String(e)));
    })
  );
  return row;
}
function reportBugRow() {
  const row = actionRow(
    "Ai Open Tool",
    "\u6253\u5F00 Ai Open Tool \u83B7\u53D6\u53CD\u9988\u3001\u652F\u6301\u548C\u5DE5\u5177\u7BB1\u76F8\u5173\u4FE1\u606F\u3002"
  );
  const action = row.querySelector("[data-codexpp-row-actions]");
  action?.appendChild(
    compactButton("\u6253\u5F00 Ai Open Tool", () => {
      void import_electron.ipcRenderer.invoke("codexpp:open-external", AI_OPEN_TOOL_URL);
    })
  );
  return row;
}
function actionRow(titleText, description) {
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
function renderTweakStorePage(sectionsWrap, headerActions) {
  const section = document.createElement("section");
  section.className = "flex flex-col gap-4";
  const source = document.createElement("span");
  source.hidden = true;
  source.dataset.codexppStoreSource = "true";
  source.textContent = "\u6B63\u5728\u52A0\u8F7D\u5728\u7EBF\u63D2\u4EF6\u7D22\u5F15";
  const actions = document.createElement("div");
  actions.className = "flex shrink-0 items-center gap-2";
  const refreshBtn = storeIconButton(refreshIconSvg(), "\u5237\u65B0\u63D2\u4EF6\u5546\u5E97", () => {
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
function refreshTweakStoreGrid(grid, source, refreshBtn, force = false) {
  void getTweakStore(force).then((store) => {
    grid.dataset.codexppStore = JSON.stringify(store);
    renderTweakStoreGrid(grid, source);
  }).catch((e) => {
    grid.dataset.codexppStore = "";
    grid.removeAttribute("aria-busy");
    source.textContent = "\u5728\u7EBF\u63D2\u4EF6\u7D22\u5F15\u4E0D\u53EF\u7528";
    updateStoreUpdateBadge(null);
    grid.textContent = "";
    grid.appendChild(storeMessageCard("\u65E0\u6CD5\u52A0\u8F7D\u63D2\u4EF6\u5546\u5E97", String(e)));
  }).finally(() => {
    if (refreshBtn) refreshBtn.disabled = false;
  });
}
function warmTweakStore() {
  if (state.tweakStore || state.tweakStorePromise) return;
  void getTweakStore().then((store) => {
    updateStoreUpdateBadge(outdatedInstalledStoreCount(store.entries));
  });
}
function getTweakStore(force = false) {
  if (!force) {
    if (state.tweakStore) return Promise.resolve(state.tweakStore);
    if (state.tweakStorePromise) return state.tweakStorePromise;
  }
  state.tweakStoreError = null;
  const promise = import_electron.ipcRenderer.invoke("codexpp:get-tweak-store").then((store) => {
    state.tweakStore = store;
    return state.tweakStore;
  }).catch((e) => {
    state.tweakStoreError = e;
    throw e;
  }).finally(() => {
    if (state.tweakStorePromise === promise) state.tweakStorePromise = null;
  });
  state.tweakStorePromise = promise;
  return promise;
}
function renderTweakStoreGrid(grid, source) {
  const store = parseStoreDataset(grid);
  if (!store) return;
  const entries = store.entries;
  grid.removeAttribute("aria-busy");
  source.textContent = `\u5237\u65B0\u65F6\u95F4\uFF1A${new Date(store.fetchedAt).toLocaleString()}`;
  updateStoreUpdateBadge(outdatedInstalledStoreCount(entries));
  grid.textContent = "";
  if (store.entries.length === 0) {
    grid.appendChild(storeMessageCard("\u6682\u65E0\u63D2\u4EF6", "\u5F53\u524D\u6CA1\u6709\u53EF\u5B89\u88C5\u63D2\u4EF6\u3002"));
    return;
  }
  for (const entry of entries) grid.appendChild(tweakStoreCard(entry));
}
function parseStoreDataset(grid) {
  const raw = grid.dataset.codexppStore;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function tweakStoreCard(entry) {
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
      compactButton("\u7248\u672C", () => {
        void import_electron.ipcRenderer.invoke("codexpp:open-external", entry.releaseUrl);
      })
    );
  }
  const hasUpdate = !!entry.installed && entry.installed.version !== entry.manifest.version;
  if (entry.installed && !hasUpdate) {
    actions.appendChild(storeStatusPill("\u5DF2\u5B89\u88C5"));
  } else if (entry.platform && !entry.platform.compatible) {
    card.classList.add("opacity-70");
    actions.appendChild(storeStatusPill(platformLockedLabel(entry.platform)));
  } else if (entry.runtime && !entry.runtime.compatible) {
    card.classList.add("opacity-70");
    actions.appendChild(storeStatusPill(runtimeLockedLabel(entry.runtime)));
  } else {
    const installLabel = entry.installed ? "\u66F4\u65B0" : "\u5B89\u88C5";
    if (hasUpdate) actions.appendChild(storeStatusPill("\u6709\u53EF\u7528\u66F4\u65B0", "info"));
    const installButton = storeInstallButton(installLabel, (button2) => {
      const grid = card.closest("[data-codexpp-store-grid]");
      const source = grid?.parentElement?.querySelector("[data-codexpp-store-source]");
      showStoreButtonLoading(button2, entry.installed ? "\u66F4\u65B0\u4E2D" : "\u5B89\u88C5\u4E2D");
      actions.querySelectorAll("button").forEach((button3) => button3.disabled = true);
      void import_electron.ipcRenderer.invoke("codexpp:install-store-tweak", entry.id).then(() => {
        showStoreToast(`${storeEntryDisplayName(entry)} \u5DF2\u5B89\u88C5\u3002`);
        showStoreButtonInstalled(button2);
        versions.replaceChildren(tweakStoreVersionBadge(entry, entry.manifest.version));
        updateStoreUpdateBadge(Math.max(0, currentStoreUpdateBadgeCount() - 1));
        setTimeout(() => {
          actions.replaceChildren(storeStatusPill("\u5DF2\u5B89\u88C5"));
          if (grid && source) refreshTweakStoreGrid(grid, source, void 0, true);
        }, 900);
      }).catch((e) => {
        resetStoreInstallButton(button2, installLabel);
        actions.querySelectorAll("button").forEach((button3) => button3.disabled = false);
        showStoreCardMessage(card, String(e.message ?? e));
      });
    });
    actions.appendChild(installButton);
  }
  return card;
}
function platformLockedLabel(platform) {
  const supported = platform.supported ?? [];
  if (supported.includes("win32")) return "\u4EC5 Windows";
  if (supported.includes("darwin")) return "\u4EC5 macOS";
  if (supported.includes("linux")) return "\u4EC5 Linux";
  return "\u4E0D\u53EF\u7528";
}
function runtimeLockedLabel(runtime) {
  return runtime.required ? `\u9700\u8981 codex\u6C49\u5316\u589E\u5F3Aplus\u7248 ${runtime.required}` : "\u9700\u8981\u66F4\u65B0\u7248\u672C\u7684 codex\u6C49\u5316\u589E\u5F3Aplus\u7248";
}
function showStoreCardMessage(card, message) {
  card.querySelector("[data-codexpp-store-card-message]")?.remove();
  const notice = document.createElement("div");
  notice.dataset.codexppStoreCardMessage = "true";
  notice.className = "rounded-lg border border-token-border/50 bg-token-foreground/5 px-3 py-2 text-sm leading-5 text-token-description-foreground";
  notice.textContent = message;
  const actions = card.lastElementChild;
  if (actions) card.insertBefore(notice, actions);
  else card.appendChild(notice);
}
function tweakStoreCardShell() {
  const card = document.createElement("div");
  card.className = "border-token-border/40 flex min-h-[190px] flex-col justify-between gap-4 rounded-2xl border p-4 transition-colors hover:bg-token-foreground/5";
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
function tweakStoreTitleRow() {
  const titleRow = document.createElement("div");
  titleRow.className = "flex min-w-0 items-start justify-between gap-3";
  return titleRow;
}
function tweakStoreDescription() {
  const desc = document.createElement("div");
  desc.className = "line-clamp-3 min-w-0 text-sm leading-5 text-token-text-secondary";
  return desc;
}
function tweakStoreReadMoreButton(repo) {
  const readMore = document.createElement("button");
  readMore.type = "button";
  readMore.className = "inline-flex w-fit items-center gap-1 text-sm font-medium text-token-text-link-foreground hover:underline";
  readMore.innerHTML = `\u67E5\u770B\u8BE6\u60C5<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 3.5h6.5V10M12.25 3.75 4 12" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  readMore.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    void import_electron.ipcRenderer.invoke("codexpp:open-external", `https://github.com/${repo}`);
  });
  return readMore;
}
function renderTweakStoreGhostGrid(grid) {
  grid.setAttribute("aria-busy", "true");
  grid.textContent = "";
  grid.appendChild(tweakStoreGhostCard());
}
function tweakStoreGhostCard() {
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
function storeAvatarGhost() {
  const avatar = document.createElement("div");
  avatar.className = "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-token-border-default bg-transparent text-token-description-foreground";
  avatar.appendChild(ghostBlock("h-full w-full"));
  return avatar;
}
function verifiedSafeGhostBadge() {
  const badge = verifiedSafeBadge();
  badge.replaceChildren(ghostBlock("h-[13px] w-[13px] rounded-sm"), ghostBlock("h-3 w-20 rounded"));
  return badge;
}
function storeStatusGhostPill() {
  const pill = storeStatusPill("\u5DF2\u5B89\u88C5");
  pill.classList.add("animate-pulse");
  pill.style.color = "transparent";
  return pill;
}
function storeVersionGhostBadge() {
  const badge = storeVersionBadgeShell(false);
  badge.appendChild(ghostBlock("h-3 w-36 rounded"));
  return badge;
}
function ghostBlock(className) {
  const block = document.createElement("div");
  block.className = `animate-pulse bg-token-foreground/10 ${className}`;
  block.setAttribute("aria-hidden", "true");
  return block;
}
function storeAvatar(entry) {
  const avatar = document.createElement("div");
  avatar.className = "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-token-border-default bg-transparent text-token-description-foreground";
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
function storeEntryIconUrl(entry) {
  const iconUrl = entry.manifest.iconUrl?.trim();
  if (!iconUrl) return null;
  if (/^(https?:|data:)/i.test(iconUrl)) return iconUrl;
  const rel = iconUrl.replace(/^\.?\//, "");
  if (!rel || rel.startsWith("../")) return null;
  return `https://raw.githubusercontent.com/${entry.repo}/${entry.approvedCommitSha}/${rel}`;
}
function sidebarUpdatePillButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.codexppSidebarUpdate = "true";
  btn.className = "user-select-none no-drag cursor-interaction inline-flex shrink-0 items-center justify-center whitespace-nowrap";
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
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.18)"
  });
  btn.textContent = "\u66F4\u65B0";
  btn.title = "\u6253\u5F00 codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u66F4\u65B0";
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
function refreshSidebarCodexPlusPlusUpdateButton(force = false) {
  const btn = state.codexPlusPlusUpdateButton;
  if (!btn) return;
  void import_electron.ipcRenderer.invoke("codexpp:check-codexpp-update", force).then((check) => setSidebarCodexPlusPlusUpdateButton(check)).catch((e) => {
    plog("codex\u6C49\u5316\u589E\u5F3Aplus\u7248 sidebar release check failed", String(e));
    setSidebarCodexPlusPlusUpdateButton(null);
  });
}
function setSidebarCodexPlusPlusUpdateButton(check) {
  const btn = state.codexPlusPlusUpdateButton;
  if (!btn) return;
  const updateAvailable = check?.updateAvailable === true;
  btn.style.display = updateAvailable ? "inline-flex" : "none";
  btn.hidden = !updateAvailable;
  delete btn.dataset.codexppReleaseUrl;
  btn.title = updateAvailable && check?.latestVersion ? `\u67E5\u770B codex\u6C49\u5316\u589E\u5F3Aplus\u7248 ${check.latestVersion} \u66F4\u65B0\u8BBE\u7F6E` : "\u67E5\u770B codex\u6C49\u5316\u589E\u5F3Aplus\u7248 \u66F4\u65B0\u8BBE\u7F6E";
}
function updateStoreUpdateBadge(count) {
  const badge = document.querySelector("[data-codexpp-store-update-badge]");
  if (!badge) return;
  badge.dataset.codexppStoreUpdateCount = count === null ? "" : String(count);
  applyStoreUpdateBadgeStyle(badge, count);
  badge.hidden = count === null || count <= 0;
  badge.textContent = count && count > 0 ? String(count) : "";
  badge.title = count && count > 0 ? `${count} \u4E2A\u5DF2\u5B89\u88C5\u63D2\u4EF6\u53EF\u4EE5\u66F4\u65B0` : "\u5DF2\u5B89\u88C5\u63D2\u4EF6\u5747\u4E3A\u6700\u65B0";
}
function applyStoreUpdateBadgeStyle(badge, count) {
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
    boxShadow: hasUpdates ? "0 1px 2px rgba(0, 0, 0, 0.22)" : "none"
  });
}
function currentStoreUpdateBadgeCount() {
  const badge = document.querySelector("[data-codexpp-store-update-badge]");
  const raw = badge?.dataset.codexppStoreUpdateCount;
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}
function outdatedInstalledStoreCount(entries) {
  return entries.filter((entry) => !!entry.installed && entry.installed.version !== entry.manifest.version).length;
}
function storeIconButton(iconSvg, label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "border-token-border user-select-none no-drag cursor-interaction flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-token-foreground/5 p-0 text-token-foreground enabled:hover:bg-token-foreground/10 disabled:cursor-not-allowed disabled:opacity-40";
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
function refreshIconSvg() {
  return `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" class="icon-xs" aria-hidden="true"><path d="M4.4 9.35A5.65 5.65 0 0 1 14 5.3L15.75 7M15.75 3.75V7h-3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.6 10.65A5.65 5.65 0 0 1 6 14.7L4.25 13M4.25 16.25V13H7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function verifiedSafeBadge() {
  const badge = document.createElement("span");
  badge.className = "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md border border-token-border/30 bg-transparent px-2 text-xs font-medium text-token-description-foreground";
  badge.innerHTML = `<svg width="13" height="13" viewBox="0 0 14 14" fill="none" class="text-blue-500" aria-hidden="true"><path d="M7 1.75 11.25 3.4v3.2c0 2.6-1.65 4.25-4.25 5.4-2.6-1.15-4.25-2.8-4.25-5.4V3.4L7 1.75Z" stroke="currentColor" stroke-width="1.15" stroke-linejoin="round"/><path d="M4.85 7.05 6.3 8.45l2.85-3.05" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg><span>\u5DF2\u5B89\u5168\u5BA1\u6838</span>`;
  return badge;
}
function tweakStoreVersionBadge(entry, installedOverride) {
  const installed = installedOverride ?? entry.installed?.version ?? null;
  const latest = entry.manifest.version;
  const hasUpdate = !!installed && installed !== latest;
  const badge = storeVersionBadgeShell(hasUpdate);
  const label = document.createElement("span");
  label.className = "truncate";
  label.textContent = installed ? `\u5DF2\u5B89\u88C5 v${installed} \xB7 \u6700\u65B0 v${latest}` : `\u6700\u65B0 v${latest}`;
  badge.title = installed ? `\u5DF2\u5B89\u88C5\u7248\u672C ${installed}\u3002\u6700\u65B0\u5BA1\u6838\u7248\u672C ${latest}\u3002` : `\u6700\u65B0\u5BA1\u6838\u7248\u672C ${latest}\u3002`;
  badge.appendChild(label);
  return badge;
}
function storeVersionBadgeShell(hasUpdate) {
  const badge = document.createElement("span");
  badge.className = [
    "inline-flex h-8 min-w-0 max-w-full items-center rounded-lg border px-2.5 text-xs font-medium",
    hasUpdate ? "border-blue-500/30 bg-blue-500/10 text-token-foreground" : "border-token-border/40 bg-token-foreground/5 text-token-description-foreground"
  ].join(" ");
  return badge;
}
function storeStatusPill(label, tone = "neutral") {
  const pill = document.createElement("span");
  pill.className = [
    "inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-medium",
    tone === "info" ? "border border-blue-500/30 bg-blue-500/10 text-token-foreground" : "bg-token-foreground/5 text-token-description-foreground"
  ].join(" ");
  pill.textContent = label;
  return pill;
}
function storeInstallButton(label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = storeInstallButtonClass();
  btn.textContent = label;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(btn);
  });
  return btn;
}
function storeInstallButtonClass(extra = "") {
  return [
    "border-token-border user-select-none no-drag cursor-interaction flex h-8 min-w-[82px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-blue-500/40 bg-blue-500 px-3 py-0 text-sm font-medium text-token-foreground shadow-sm transition-colors enabled:hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-80",
    extra
  ].filter(Boolean).join(" ");
}
function showStoreButtonLoading(button2, label) {
  button2.className = storeInstallButtonClass();
  button2.disabled = true;
  button2.setAttribute("aria-busy", "true");
  button2.innerHTML = `<svg class="animate-spin" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="2" opacity=".25"/><path d="M13.5 8A5.5 5.5 0 0 0 8 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>${label}</span>`;
}
function showStoreButtonInstalled(button2) {
  button2.className = storeInstallButtonClass("border-blue-500 bg-blue-500");
  button2.disabled = true;
  button2.removeAttribute("aria-busy");
  button2.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.75 8.15 6.65 11 12.25 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>\u5DF2\u5B89\u88C5</span>`;
}
function resetStoreInstallButton(button2, label) {
  button2.className = storeInstallButtonClass();
  button2.disabled = false;
  button2.removeAttribute("aria-busy");
  button2.textContent = label;
}
function showStoreToast(message) {
  let host = document.querySelector("[data-codexpp-store-toast-host]");
  if (!host) {
    host = document.createElement("div");
    host.dataset.codexppStoreToastHost = "true";
    host.className = "pointer-events-none fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2";
    document.body.appendChild(host);
  }
  const toast = document.createElement("div");
  toast.className = "translate-y-2 rounded-xl border border-token-border/50 bg-token-main-surface-primary px-3 py-2 text-sm font-medium text-token-foreground opacity-0 shadow-lg transition-all duration-200";
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
function storeMessageCard(title, description) {
  const card = document.createElement("div");
  card.className = "border-token-border/40 flex min-h-[84px] flex-col justify-center gap-1 rounded-2xl border p-4 text-sm";
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
function renderTweaksPage(sectionsWrap) {
  const openBtn = openInPlaceButton("\u6253\u5F00\u63D2\u4EF6\u6587\u4EF6\u5939", () => {
    void import_electron.ipcRenderer.invoke("codexpp:reveal", tweaksPath());
  });
  const reloadBtn = openInPlaceButton("\u5F3A\u5236\u91CD\u8F7D", () => {
    void import_electron.ipcRenderer.invoke("codexpp:reload-tweaks").catch((e) => plog("force reload (main) failed", String(e))).finally(() => {
      location.reload();
    });
  });
  const reloadSvg = reloadBtn.querySelector("svg");
  if (reloadSvg) {
    reloadSvg.outerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-2xs" aria-hidden="true"><path d="M4 10a6 6 0 0 1 10.24-4.24L16 7.5M16 4v3.5h-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 10a6 6 0 0 1-10.24 4.24L4 12.5M4 16v-3.5h3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  const trailing = document.createElement("div");
  trailing.className = "flex items-center gap-2";
  trailing.appendChild(reloadBtn);
  trailing.appendChild(openBtn);
  if (state.listedTweaks.length === 0) {
    const section = document.createElement("section");
    section.className = "flex flex-col gap-2";
    section.appendChild(sectionTitle("\u5DF2\u5B89\u88C5\u63D2\u4EF6", trailing));
    const card2 = roundedCard();
    card2.appendChild(
      rowSimple(
        "\u5C1A\u672A\u5B89\u88C5\u63D2\u4EF6",
        `\u628A\u63D2\u4EF6\u6587\u4EF6\u5939\u653E\u5165 ${tweaksPath()}\uFF0C\u7136\u540E\u91CD\u8F7D\u3002`
      )
    );
    section.appendChild(card2);
    sectionsWrap.appendChild(section);
    return;
  }
  const sectionsByTweak = /* @__PURE__ */ new Map();
  for (const s of state.sections.values()) {
    const tweakId = s.id.split(":")[0];
    if (!sectionsByTweak.has(tweakId)) sectionsByTweak.set(tweakId, []);
    sectionsByTweak.get(tweakId).push(s);
  }
  const pagesByTweak = /* @__PURE__ */ new Map();
  for (const p of state.pages.values()) {
    if (!pagesByTweak.has(p.tweakId)) pagesByTweak.set(p.tweakId, []);
    pagesByTweak.get(p.tweakId).push(p);
  }
  const wrap = document.createElement("section");
  wrap.className = "flex flex-col gap-2";
  wrap.appendChild(sectionTitle("\u5DF2\u5B89\u88C5\u63D2\u4EF6", trailing));
  const card = roundedCard();
  for (const t of state.listedTweaks) {
    card.appendChild(
      tweakRow(
        t,
        sectionsByTweak.get(t.manifest.id) ?? [],
        pagesByTweak.get(t.manifest.id) ?? []
      )
    );
  }
  wrap.appendChild(card);
  sectionsWrap.appendChild(wrap);
}
function tweakRow(t, sections, pages) {
  const m = t.manifest;
  const cell = document.createElement("div");
  cell.className = "flex flex-col";
  if (!t.enabled) cell.style.opacity = "0.7";
  const header = document.createElement("div");
  header.className = "flex items-start justify-between gap-4 p-3";
  const left = document.createElement("div");
  left.className = "flex min-w-0 flex-1 items-start gap-3";
  const avatar = document.createElement("div");
  avatar.className = "flex shrink-0 items-center justify-center rounded-md border border-token-border overflow-hidden text-token-text-secondary";
  avatar.style.width = "56px";
  avatar.style.height = "56px";
  avatar.style.backgroundColor = "var(--color-token-bg-fog, transparent)";
  if (m.iconUrl) {
    const img = document.createElement("img");
    img.alt = "";
    img.className = "size-full object-contain";
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
    ver.className = "text-token-text-secondary text-xs font-normal tabular-nums";
    ver.textContent = `v${m.version}`;
    titleRow.appendChild(ver);
  }
  if (t.update?.updateAvailable) {
    const badge = document.createElement("span");
    badge.className = "rounded-full border border-token-border bg-token-foreground/5 px-2 py-0.5 text-[11px] font-medium text-token-text-primary";
    badge.textContent = "\u6709\u53EF\u7528\u66F4\u65B0";
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
      void import_electron.ipcRenderer.invoke("codexpp:open-external", `https://github.com/${m.githubRepo}`);
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
    link.textContent = "\u4E3B\u9875";
    meta.appendChild(link);
  }
  if (meta.children.length > 0) stack.appendChild(meta);
  if (m.tags && m.tags.length > 0) {
    const tagsRow = document.createElement("div");
    tagsRow.className = "flex flex-wrap items-center gap-1 pt-0.5";
    for (const tag of m.tags) {
      const pill = document.createElement("span");
      pill.className = "rounded-full border border-token-border bg-token-foreground/5 px-2 py-0.5 text-[11px] text-token-text-secondary";
      pill.textContent = tag;
      tagsRow.appendChild(pill);
    }
    stack.appendChild(tagsRow);
  }
  left.appendChild(stack);
  header.appendChild(left);
  const right = document.createElement("div");
  right.className = "flex shrink-0 items-center gap-2 pt-0.5";
  if (t.enabled && pages.length > 0) {
    const configureBtn = compactButton("\u914D\u7F6E", () => {
      activatePage({ kind: "registered", id: pages[0].id });
    });
    configureBtn.title = pages.length === 1 ? `\u6253\u5F00 ${pages[0].page.title}` : `\u6253\u5F00 ${pages.map((p) => p.page.title).join(", ")}`;
    right.appendChild(configureBtn);
  }
  if (t.update?.updateAvailable && t.update.releaseUrl) {
    right.appendChild(
      compactButton("\u67E5\u770B\u7248\u672C", () => {
        void import_electron.ipcRenderer.invoke("codexpp:open-external", t.update.releaseUrl);
      })
    );
  }
  right.appendChild(
    switchControl(t.enabled, async (next) => {
      await import_electron.ipcRenderer.invoke("codexpp:set-tweak-enabled", m.id, next);
    })
  );
  header.appendChild(right);
  cell.appendChild(header);
  if (t.enabled && sections.length > 0) {
    const nested = document.createElement("div");
    nested.className = "flex flex-col divide-y-[0.5px] divide-token-border border-t-[0.5px] border-token-border";
    for (const s of sections) {
      const body = document.createElement("div");
      body.className = "p-3";
      try {
        s.render(body);
      } catch (e) {
        body.textContent = `\u6E32\u67D3\u63D2\u4EF6\u8BBE\u7F6E\u533A\u57DF\u51FA\u9519\uFF1A${e.message}`;
      }
      nested.appendChild(body);
    }
    cell.appendChild(nested);
  }
  return cell;
}
function renderAuthor(author) {
  if (!author) return null;
  const wrap = document.createElement("span");
  wrap.className = "inline-flex items-center gap-1";
  if (typeof author === "string") {
    wrap.textContent = `\u4F5C\u8005\uFF1A${author}`;
    return wrap;
  }
  wrap.appendChild(document.createTextNode("\u4F5C\u8005\uFF1A"));
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
function panelShell(title, subtitle, options) {
  const outer = document.createElement("div");
  outer.className = "main-surface flex h-full min-h-0 flex-col";
  const toolbar = document.createElement("div");
  toolbar.className = "draggable flex items-center px-panel electron:h-toolbar extension:h-toolbar-sm";
  outer.appendChild(toolbar);
  const scroll = document.createElement("div");
  scroll.className = "flex-1 overflow-y-auto p-panel";
  outer.appendChild(scroll);
  const inner = document.createElement("div");
  inner.className = options?.wide ? "mx-auto flex w-full max-w-5xl flex-col electron:min-w-[calc(320px*var(--codex-window-zoom))]" : "mx-auto flex w-full flex-col max-w-2xl electron:min-w-[calc(320px*var(--codex-window-zoom))]";
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
  let subtitleElement;
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
function sectionTitle(text, trailing) {
  const titleRow = document.createElement("div");
  titleRow.className = "flex h-toolbar items-center justify-between gap-2 px-0 py-0";
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
function openInPlaceButton(label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "border-token-border user-select-none no-drag cursor-interaction flex items-center gap-1 border whitespace-nowrap focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 rounded-lg text-token-description-foreground enabled:hover:bg-token-list-hover-background data-[state=open]:bg-token-list-hover-background border-transparent h-token-button-composer px-2 py-0 text-base leading-[18px]";
  btn.innerHTML = `${label}<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-2xs" aria-hidden="true"><path d="M14.3349 13.3301V6.60645L5.47065 15.4707C5.21095 15.7304 4.78895 15.7304 4.52925 15.4707C4.26955 15.211 4.26955 14.789 4.52925 14.5293L13.3935 5.66504H6.66011C6.29284 5.66504 5.99507 5.36727 5.99507 5C5.99507 4.63273 6.29284 4.33496 6.66011 4.33496H14.9999L15.1337 4.34863C15.4369 4.41057 15.665 4.67857 15.665 5V13.3301C15.6649 13.6973 15.3672 13.9951 14.9999 13.9951C14.6327 13.9951 14.335 13.6973 14.3349 13.3301Z" fill="currentColor"></path></svg>`;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });
  return btn;
}
function compactButton(label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "border-token-border user-select-none no-drag cursor-interaction inline-flex h-8 items-center whitespace-nowrap rounded-lg border px-2 text-sm text-token-text-primary enabled:hover:bg-token-list-hover-background disabled:cursor-not-allowed disabled:opacity-40";
  btn.textContent = label;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });
  return btn;
}
function roundedCard() {
  const card = document.createElement("div");
  card.className = "border-token-border flex flex-col divide-y-[0.5px] divide-token-border rounded-lg border";
  card.setAttribute(
    "style",
    "background-color: var(--color-background-panel, var(--color-token-bg-fog));"
  );
  return card;
}
function rowSimple(title, description) {
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
function switchControl(initial, onChange) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("role", "switch");
  const pill = document.createElement("span");
  const knob = document.createElement("span");
  knob.className = "rounded-full border border-[color:var(--gray-0)] bg-[color:var(--gray-0)] shadow-sm transition-transform duration-200 ease-out h-4 w-4";
  pill.appendChild(knob);
  const apply = (on) => {
    btn.setAttribute("aria-checked", String(on));
    btn.dataset.state = on ? "checked" : "unchecked";
    btn.className = "inline-flex items-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-focus-border focus-visible:rounded-full cursor-interaction";
    pill.className = `relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ease-out h-5 w-8 ${on ? "bg-token-charts-blue" : "bg-token-foreground/20"}`;
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
function dot() {
  const s = document.createElement("span");
  s.className = "text-token-description-foreground";
  s.textContent = "\xB7";
  return s;
}
function configIconSvg() {
  return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm inline-block align-middle" aria-hidden="true"><path d="M3 5h9M15 5h2M3 10h2M8 10h9M3 15h11M17 15h0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="13" cy="5" r="1.6" fill="currentColor"/><circle cx="6" cy="10" r="1.6" fill="currentColor"/><circle cx="15" cy="15" r="1.6" fill="currentColor"/></svg>`;
}
function tweaksIconSvg() {
  return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm inline-block align-middle" aria-hidden="true"><path d="M10 2.5 L11.4 8.6 L17.5 10 L11.4 11.4 L10 17.5 L8.6 11.4 L2.5 10 L8.6 8.6 Z" fill="currentColor"/><path d="M15.5 3 L16 5 L18 5.5 L16 6 L15.5 8 L15 6 L13 5.5 L15 5 Z" fill="currentColor" opacity="0.7"/></svg>`;
}
function storeIconSvg() {
  return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm inline-block align-middle" aria-hidden="true"><path d="M4 8.2 5.1 4.5A1.5 1.5 0 0 1 6.55 3.4h6.9a1.5 1.5 0 0 1 1.45 1.1L16 8.2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M4.5 8h11v7.5A1.5 1.5 0 0 1 14 17H6a1.5 1.5 0 0 1-1.5-1.5V8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7.5 8v1a2.5 2.5 0 0 0 5 0V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
}
function agentProviderIconSvg() {
  return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm inline-block align-middle" aria-hidden="true"><path d="M10 3.25a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5Z" stroke="currentColor" stroke-width="1.45"/><path d="M6.6 10h6.8M10 6.6v6.8" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"/><path d="M4.6 7.75h10.8M4.6 12.25h10.8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" opacity="0.65"/></svg>`;
}
function defaultPageIconSvg() {
  return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm inline-block align-middle" aria-hidden="true"><path d="M5 3h7l3 3v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 3v3a1 1 0 0 0 1 1h2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7 11h6M7 14h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
}
async function resolveIconUrl(url, tweakDir) {
  if (/^(https?:|data:)/.test(url)) return url;
  const rel = url.startsWith("./") ? url.slice(2) : url;
  try {
    return await import_electron.ipcRenderer.invoke(
      "codexpp:read-tweak-asset",
      tweakDir,
      rel
    );
  } catch (e) {
    plog("icon load failed", { url, tweakDir, err: String(e) });
    return null;
  }
}
function findSidebarItemsGroup() {
  const candidates = Array.from(
    document.querySelectorAll("aside,nav,[role='navigation'],div")
  );
  let best = null;
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
    if (weighted > bestScore || weighted === bestScore && area < bestArea) {
      best = candidate;
      bestScore = weighted;
      bestArea = area;
    }
  }
  return best;
}
var FORBIDDEN_SETTINGS_SIDEBAR_SELECTOR = [
  "[data-composer-overlay-floating-ui='true']",
  "[data-codexpp-slash-menu='true']",
  "[data-codexpp-overlay-noise='true']",
  ".composer-home-top-menu",
  ".vertical-scroll-fade-mask",
  "[class*='[container-name:home-main-content]']"
].join(",");
function isForbiddenSettingsSidebarSurface(node) {
  if (!node) return false;
  const el = node instanceof HTMLElement ? node : node.parentElement;
  if (!el) return false;
  if (el.closest(FORBIDDEN_SETTINGS_SIDEBAR_SELECTOR)) return true;
  if (el.querySelector("[data-list-navigation-item='true'], [cmdk-item]")) return true;
  return false;
}
function isSettingsSidebarCandidate(el) {
  const rect = codexPpVisibleBox(el);
  if (!rect) return false;
  if (rect.width < 120 || rect.width > 620) return false;
  if (rect.height < 80) return false;
  if (rect.left > window.innerWidth * 0.65) return false;
  const labels = codexPpSettingsLabelsFrom(el);
  if (hasMainAppSidebarSignals(labels) && !hasCodexPpSettingsOnlySignal(labels)) {
    return false;
  }
  return isCodexPpSettingsLabelSet(labels);
}
function removeMisplacedSettingsGroups() {
  const groups = document.querySelectorAll(
    "[data-codexpp='nav-group'], [data-codexpp='pages-group'], [data-codexpp='native-nav-header']"
  );
  for (const group of Array.from(groups)) {
    if (isCodexPpInjectedSettingsGroupPlacementValid(group)) continue;
    resetCodexPpInjectedSettingsGroupState(group);
    group.remove();
  }
}
function isCodexPpInjectedSettingsGroupPlacementValid(group) {
  if (isForbiddenSettingsSidebarSurface(group)) return false;
  let node = group.parentElement;
  for (let depth = 0; node && depth < 4; depth++) {
    if (isForbiddenSettingsSidebarSurface(node)) return false;
    if (isSettingsSidebarCandidate(node)) return true;
    node = node.parentElement;
  }
  return false;
}
function resetCodexPpInjectedSettingsGroupState(group) {
  if (state.navGroup === group || state.navGroup && group.contains(state.navGroup)) {
    state.navGroup = null;
    state.navButtons = null;
    state.codexPlusPlusUpdateButton = null;
  }
  if (state.pagesGroup === group || state.pagesGroup && group.contains(state.pagesGroup)) {
    state.pagesGroup = null;
    state.pagesGroupKey = null;
    for (const p of state.pages.values()) p.navButton = null;
  }
  if (state.nativeNavHeader === group || state.nativeNavHeader && group.contains(state.nativeNavHeader)) {
    state.nativeNavHeader = null;
  }
  if (state.sidebarRoot && state.sidebarRoot.contains(group)) {
    state.sidebarRoot = null;
  }
}
function findContentArea() {
  const sidebar = findSidebarItemsGroup();
  if (!sidebar) return null;
  const sidebarRect = sidebar.getBoundingClientRect();
  const reusablePanel = document.querySelector('[data-codexpp="tweaks-panel"]');
  if (reusablePanel?.parentElement) return reusablePanel.parentElement;
  const candidates = [];
  let parent = sidebar.parentElement;
  let depth = 0;
  while (parent && depth < 8) {
    for (const child of Array.from(parent.children)) {
      if (child === sidebar || child.contains(sidebar)) continue;
      if (sidebar.contains(child)) continue;
      const r = codexPpVisibleBox(child);
      if (!r) continue;
      if (r.width < 300 || r.height < 200) continue;
      const rightOfSidebar = r.left >= sidebarRect.right - 8;
      const meaningfullyWiderThanSidebar = r.width >= Math.max(360, sidebarRect.width * 1.05);
      if (!rightOfSidebar && !meaningfullyWiderThanSidebar) continue;
      const text = compactSettingsText(child.textContent ?? "");
      const nativeSettingsSignal = /工作模式|权限|默认权限|常规|General|Permissions|Work mode/i.test(text) ? 5e3 : 0;
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
function maybeDumpDom() {
  try {
    const sidebar = findSidebarItemsGroup();
    if (sidebar && !state.sidebarDumped) {
      state.sidebarDumped = true;
      const sbRoot = sidebar.parentElement ?? sidebar;
      plog(`codex sidebar HTML`, sbRoot.outerHTML.slice(0, 32e3));
    }
    const content = findContentArea();
    if (!content) {
      if (state.fingerprint !== location.href) {
        state.fingerprint = location.href;
        plog("dom probe (no content)", {
          url: location.href,
          sidebar: sidebar ? describe(sidebar) : null
        });
      }
      return;
    }
    let panel = null;
    for (const child of Array.from(content.children)) {
      if (child.dataset.codexpp === "tweaks-panel") continue;
      if (child.style.display === "none") continue;
      panel = child;
      break;
    }
    const activeNav = sidebar ? Array.from(sidebar.querySelectorAll("button, a")).find(
      (b) => b.getAttribute("aria-current") === "page" || b.getAttribute("data-active") === "true" || b.getAttribute("aria-selected") === "true" || b.classList.contains("active")
    ) : null;
    const heading = panel?.querySelector(
      "h1, h2, h3, [class*='heading']"
    );
    const fingerprint = `${activeNav?.textContent ?? ""}|${heading?.textContent ?? ""}|${panel?.children.length ?? 0}`;
    if (state.fingerprint === fingerprint) return;
    state.fingerprint = fingerprint;
    plog("dom probe", {
      url: location.href,
      activeNav: activeNav?.textContent?.trim() ?? null,
      heading: heading?.textContent?.trim() ?? null,
      content: describe(content)
    });
    if (panel) {
      const html = panel.outerHTML;
      plog(
        `codex panel HTML (${activeNav?.textContent?.trim() ?? "?"})`,
        html.slice(0, 32e3)
      );
    }
  } catch (e) {
    plog("dom probe failed", String(e));
  }
}
function describe(el) {
  return {
    tag: el.tagName,
    cls: el.className.slice(0, 120),
    id: el.id || void 0,
    children: el.children.length,
    rect: (() => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    })()
  };
}
function tweaksPath() {
  return window.__codexpp_tweaks_dir__ ?? "<user dir>/tweaks";
}

// src/preload/tweak-host.ts
var import_electron2 = require("electron");
var loaded = /* @__PURE__ */ new Map();
var cachedPaths = null;
async function startTweakHost() {
  const tweaks = await import_electron2.ipcRenderer.invoke("codexpp:list-tweaks");
  const paths = await import_electron2.ipcRenderer.invoke("codexpp:user-paths");
  cachedPaths = paths;
  setListedTweaks(tweaks);
  window.__codexpp_tweaks_dir__ = paths.tweaksDir;
  for (const t of tweaks) {
    if (t.manifest.scope === "main") continue;
    if (!t.entryExists) continue;
    if (!t.enabled) continue;
    try {
      await loadTweak(t, paths);
    } catch (e) {
      console.error("[codex-plusplus] tweak load failed:", t.manifest.id, e);
      try {
        import_electron2.ipcRenderer.send(
          "codexpp:preload-log",
          "error",
          "tweak load failed: " + t.manifest.id + ": " + String(e?.stack ?? e)
        );
      } catch {
      }
    }
  }
  console.info(
    `[codex-plusplus] renderer host loaded ${loaded.size} tweak(s):`,
    [...loaded.keys()].join(", ") || "(none)"
  );
  import_electron2.ipcRenderer.send(
    "codexpp:preload-log",
    "info",
    `renderer host loaded ${loaded.size} tweak(s): ${[...loaded.keys()].join(", ") || "(none)"}`
  );
}
function teardownTweakHost() {
  for (const [id, t] of loaded) {
    try {
      t.stop?.();
    } catch (e) {
      console.warn("[codex-plusplus] tweak stop failed:", id, e);
    } finally {
      void import_electron2.ipcRenderer.invoke("codexpp:codex-view-dispose-tweak", id).catch(() => {
      });
      void import_electron2.ipcRenderer.invoke("codexpp:native-dispose-tweak", id).catch(() => {
      });
    }
  }
  loaded.clear();
  clearSections();
}
async function loadTweak(t, paths) {
  const source = await import_electron2.ipcRenderer.invoke(
    "codexpp:read-tweak-source",
    t.entry
  );
  const module2 = { exports: {} };
  const exports2 = module2.exports;
  const fn = new Function(
    "module",
    "exports",
    "console",
    `${source}
//# sourceURL=codexpp-tweak://${encodeURIComponent(t.manifest.id)}/${encodeURIComponent(t.entry)}`
  );
  fn(module2, exports2, console);
  const mod = module2.exports;
  const tweak = mod.default ?? mod;
  if (typeof tweak?.start !== "function") {
    throw new Error(`tweak ${t.manifest.id} has no start()`);
  }
  const api = makeRendererApi(t.manifest, paths);
  await tweak.start(api);
  loaded.set(t.manifest.id, { stop: tweak.stop?.bind(tweak) });
}
function makeRendererApi(manifest, paths) {
  const id = manifest.id;
  const log = (level, ...a) => {
    const consoleFn = level === "debug" ? console.debug : level === "warn" ? console.warn : level === "error" ? console.error : console.log;
    consoleFn(`[codex-plusplus][${id}]`, ...a);
    try {
      const parts = a.map((v) => {
        if (typeof v === "string") return v;
        if (v instanceof Error) return `${v.name}: ${v.message}`;
        try {
          return JSON.stringify(v);
        } catch {
          return String(v);
        }
      });
      import_electron2.ipcRenderer.send(
        "codexpp:preload-log",
        level,
        `[tweak ${id}] ${parts.join(" ")}`
      );
    } catch {
    }
  };
  return {
    manifest,
    process: "renderer",
    log: {
      debug: (...a) => log("debug", ...a),
      info: (...a) => log("info", ...a),
      warn: (...a) => log("warn", ...a),
      error: (...a) => log("error", ...a)
    },
    storage: rendererStorage(id),
    settings: {
      register: (s) => registerSection({ ...s, id: `${id}:${s.id}` }),
      registerPage: (p) => registerPage(id, manifest, { ...p, id: `${id}:${p.id}` })
    },
    react: {
      getFiber: (n) => fiberForNode(n),
      findOwnerByName: (n, name) => {
        let f = fiberForNode(n);
        while (f) {
          const t = f.type;
          if (t && (t.displayName === name || t.name === name)) return f;
          f = f.return;
        }
        return null;
      },
      waitForElement: (sel, timeoutMs = 5e3) => new Promise((resolve, reject) => {
        const existing = document.querySelector(sel);
        if (existing) return resolve(existing);
        const deadline = Date.now() + timeoutMs;
        const obs = new MutationObserver(() => {
          const el = document.querySelector(sel);
          if (el) {
            obs.disconnect();
            resolve(el);
          } else if (Date.now() > deadline) {
            obs.disconnect();
            reject(new Error(`timeout waiting for ${sel}`));
          }
        });
        obs.observe(document.documentElement, { childList: true, subtree: true });
      })
    },
    ipc: {
      on: (c, h) => {
        const wrapped = (_e, ...args) => h(...args);
        import_electron2.ipcRenderer.on(`codexpp:${id}:${c}`, wrapped);
        return () => import_electron2.ipcRenderer.removeListener(`codexpp:${id}:${c}`, wrapped);
      },
      send: (c, ...args) => import_electron2.ipcRenderer.send(`codexpp:${id}:${c}`, ...args),
      invoke: (c, ...args) => import_electron2.ipcRenderer.invoke(`codexpp:${id}:${c}`, ...args)
    },
    fs: rendererFs(id, paths),
    codex: rendererCodexApi(id)
  };
}
function rendererCodexApi(tweakId) {
  return {
    runtime: {
      getInfo: async () => {
        const info = await import_electron2.ipcRenderer.invoke("codexpp:codex-runtime-info");
        const bridge = rendererElectronBridge();
        return {
          ...info,
          buildFlavor: bridge?.getBuildFlavor?.() ?? info.buildFlavor,
          usesOwlAppShell: bridge?.usesOwlAppShell?.() ?? info.usesOwlAppShell
        };
      },
      getCapabilities: () => import_electron2.ipcRenderer.invoke("codexpp:codex-runtime-capabilities")
    },
    windows: {
      create: (options) => import_electron2.ipcRenderer.invoke("codexpp:codex-window-create", options),
      getPrimary: () => import_electron2.ipcRenderer.invoke("codexpp:codex-window-primary"),
      focus: (windowId) => import_electron2.ipcRenderer.invoke("codexpp:codex-window-focus", windowId),
      show: (windowId) => import_electron2.ipcRenderer.invoke("codexpp:codex-window-show", windowId)
    },
    views: {
      create: async (options) => {
        const ref = await import_electron2.ipcRenderer.invoke(
          "codexpp:codex-view-create",
          tweakId,
          options
        );
        return rendererCodexViewRef(tweakId, ref.id, ref.webContentsId, ref.parentWindowId);
      }
    },
    cdp: {
      getStatus: () => import_electron2.ipcRenderer.invoke("codexpp:codex-cdp-status"),
      listTargets: () => import_electron2.ipcRenderer.invoke("codexpp:codex-cdp-targets")
    },
    native: {
      loadModule: async (options) => {
        const ref = await import_electron2.ipcRenderer.invoke(
          "codexpp:native-load-module",
          tweakId,
          options
        );
        return rendererNativeModuleRef(tweakId, ref.id, ref.kind);
      },
      createPanel: async (options) => {
        const ref = await import_electron2.ipcRenderer.invoke(
          "codexpp:native-create-panel",
          tweakId,
          options
        );
        return rendererNativePanelRef(tweakId, ref.id, ref.windowId);
      },
      attachView: async (options) => {
        const ref = await import_electron2.ipcRenderer.invoke(
          "codexpp:native-attach-view",
          tweakId,
          options
        );
        return rendererNativeViewRef(tweakId, ref.id);
      },
      launchHelper: async (options) => {
        const ref = await import_electron2.ipcRenderer.invoke(
          "codexpp:native-launch-helper",
          tweakId,
          options
        );
        return rendererNativeHelperRef(tweakId, ref.id, ref.pid);
      }
    },
    createBrowserView: (_options) => {
      throw new Error("api.codex.createBrowserView is main-only; use a main-scoped tweak");
    },
    createWindow: (options) => import_electron2.ipcRenderer.invoke("codexpp:codex-window-create", options)
  };
}
function rendererCodexViewRef(tweakId, id, webContentsId, parentWindowId) {
  return {
    id,
    webContentsId,
    parentWindowId,
    setBounds: (bounds) => import_electron2.ipcRenderer.invoke("codexpp:codex-view-call", tweakId, id, "setBounds", bounds),
    setVisible: (visible) => import_electron2.ipcRenderer.invoke("codexpp:codex-view-call", tweakId, id, "setVisible", visible),
    bringToFront: () => import_electron2.ipcRenderer.invoke("codexpp:codex-view-call", tweakId, id, "bringToFront"),
    loadRoute: (route, hostId) => import_electron2.ipcRenderer.invoke("codexpp:codex-view-call", tweakId, id, "loadRoute", route, hostId),
    loadUrl: (url) => import_electron2.ipcRenderer.invoke("codexpp:codex-view-call", tweakId, id, "loadUrl", url),
    dispose: () => import_electron2.ipcRenderer.invoke("codexpp:codex-view-call", tweakId, id, "dispose")
  };
}
function rendererNativeModuleRef(tweakId, id, kind) {
  return {
    id,
    kind,
    request: (method, payload, timeoutMs) => import_electron2.ipcRenderer.invoke(
      "codexpp:native-module-request",
      tweakId,
      id,
      method,
      payload,
      timeoutMs
    ),
    dispose: () => import_electron2.ipcRenderer.invoke("codexpp:native-module-dispose", tweakId, id)
  };
}
function rendererNativePanelRef(tweakId, id, windowId) {
  return {
    id,
    windowId,
    setBounds: (bounds) => import_electron2.ipcRenderer.invoke("codexpp:native-instance-call", tweakId, "panel", id, "setBounds", bounds),
    show: () => import_electron2.ipcRenderer.invoke("codexpp:native-instance-call", tweakId, "panel", id, "show"),
    hide: () => import_electron2.ipcRenderer.invoke("codexpp:native-instance-call", tweakId, "panel", id, "hide"),
    dispose: () => import_electron2.ipcRenderer.invoke("codexpp:native-instance-call", tweakId, "panel", id, "dispose")
  };
}
function rendererNativeViewRef(tweakId, id) {
  return {
    id,
    setBounds: (bounds) => import_electron2.ipcRenderer.invoke("codexpp:native-instance-call", tweakId, "view", id, "setBounds", bounds),
    setVisible: (visible) => import_electron2.ipcRenderer.invoke("codexpp:native-instance-call", tweakId, "view", id, "setVisible", visible),
    dispose: () => import_electron2.ipcRenderer.invoke("codexpp:native-instance-call", tweakId, "view", id, "dispose")
  };
}
function rendererNativeHelperRef(tweakId, id, pid) {
  return {
    id,
    pid,
    send: (message) => import_electron2.ipcRenderer.invoke("codexpp:native-helper-call", tweakId, id, "send", message),
    request: (message, timeoutMs) => import_electron2.ipcRenderer.invoke(
      "codexpp:native-helper-call",
      tweakId,
      id,
      "request",
      message,
      timeoutMs
    ),
    stop: () => import_electron2.ipcRenderer.invoke("codexpp:native-helper-call", tweakId, id, "stop")
  };
}
function rendererElectronBridge() {
  const value = window.electronBridge;
  return value && typeof value === "object" ? value : null;
}
function rendererStorage(id) {
  const key = `codexpp:storage:${id}`;
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "{}");
    } catch {
      return {};
    }
  };
  const write = (v) => localStorage.setItem(key, JSON.stringify(v));
  return {
    get: (k, d) => k in read() ? read()[k] : d,
    set: (k, v) => {
      const o = read();
      o[k] = v;
      write(o);
    },
    delete: (k) => {
      const o = read();
      delete o[k];
      write(o);
    },
    all: () => read()
  };
}
function rendererFs(id, _paths) {
  return {
    dataDir: `<remote>/tweak-data/${id}`,
    read: (p) => import_electron2.ipcRenderer.invoke("codexpp:tweak-fs", "read", id, p),
    write: (p, c) => import_electron2.ipcRenderer.invoke("codexpp:tweak-fs", "write", id, p, c),
    exists: (p) => import_electron2.ipcRenderer.invoke("codexpp:tweak-fs", "exists", id, p)
  };
}

// src/preload/manager.ts
var import_electron3 = require("electron");
async function mountManager() {
  const tweaks = await import_electron3.ipcRenderer.invoke("codexpp:list-tweaks");
  const paths = await import_electron3.ipcRenderer.invoke("codexpp:user-paths");
  registerSection({
    id: "codex-plusplus:manager",
    title: "Tweak Manager",
    description: `${tweaks.length} tweak(s) installed. User dir: ${paths.userRoot}`,
    render(root) {
      root.style.cssText = "display:flex;flex-direction:column;gap:8px;";
      const actions = document.createElement("div");
      actions.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;";
      actions.appendChild(
        button(
          "Open tweaks folder",
          () => import_electron3.ipcRenderer.invoke("codexpp:reveal", paths.tweaksDir).catch(() => {
          })
        )
      );
      actions.appendChild(
        button(
          "Open logs",
          () => import_electron3.ipcRenderer.invoke("codexpp:reveal", paths.logDir).catch(() => {
          })
        )
      );
      actions.appendChild(
        button("Reload window", () => location.reload())
      );
      root.appendChild(actions);
      if (tweaks.length === 0) {
        const empty = document.createElement("p");
        empty.style.cssText = "color:#888;font:13px system-ui;margin:8px 0;";
        empty.textContent = "No user tweaks yet. Drop a folder with manifest.json + index.js into the tweaks dir, then reload.";
        root.appendChild(empty);
        return;
      }
      const list = document.createElement("ul");
      list.style.cssText = "list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;";
      for (const t of tweaks) {
        const li = document.createElement("li");
        li.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border:1px solid var(--border,#2a2a2a);border-radius:6px;";
        const left = document.createElement("div");
        left.innerHTML = `
          <div style="font:600 13px system-ui;">${escape(t.manifest.name)} <span style="color:#888;font-weight:400;">v${escape(t.manifest.version)}</span></div>
          <div style="color:#888;font:12px system-ui;">${escape(t.manifest.description ?? t.manifest.id)}</div>
        `;
        const right = document.createElement("div");
        right.style.cssText = "color:#888;font:12px system-ui;";
        right.textContent = t.entryExists ? "loaded" : "missing entry";
        li.append(left, right);
        list.append(li);
      }
      root.append(list);
    }
  });
}
function button(label, onclick) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.style.cssText = "padding:6px 10px;border:1px solid var(--border,#333);border-radius:6px;background:transparent;color:inherit;font:12px system-ui;cursor:pointer;";
  b.addEventListener("click", onclick);
  return b;
}
function escape(s) {
  return s.replace(
    /[&<>"']/g,
    (c) => c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;"
  );
}

// src/preload/index.ts
var BROWSER_UI_CONNECT_PORT = "codexpp:browser-ui-connect-app-host";
var BROWSER_UI_BRIDGE_REQUEST = "codexpp:browser-ui-bridge-request";
var BROWSER_UI_BRIDGE_RESPONSE = "codexpp:browser-ui-bridge-response";
var BROWSER_UI_MESSAGE_FOR_VIEW = "codexpp:browser-ui-message-for-view";
var BROWSER_UI_WORKER_MESSAGE = "codexpp:browser-ui-worker-message";
var BROWSER_UI_SYSTEM_THEME = "codexpp:browser-ui-system-theme";
var DESKTOP_MESSAGE_FROM_VIEW = "codex_desktop:message-from-view";
var DESKTOP_MESSAGE_FOR_VIEW = "codex_desktop:message-for-view";
var DESKTOP_SHOW_CONTEXT_MENU = "codex_desktop:show-context-menu";
var DESKTOP_SHOW_APPLICATION_MENU = "codex_desktop:show-application-menu";
var DESKTOP_GET_SENTRY_INIT_OPTIONS = "codex_desktop:get-sentry-init-options";
var DESKTOP_GET_BUILD_FLAVOR = "codex_desktop:get-build-flavor";
var DESKTOP_GET_USES_OWL_APP_SHELL = "codex_desktop:get-uses-owl-app-shell";
var DESKTOP_GET_SYSTEM_THEME_VARIANT = "codex_desktop:get-system-theme-variant";
var DESKTOP_GET_SHARED_OBJECT_SNAPSHOT = "codex_desktop:get-shared-object-snapshot";
var DESKTOP_GET_FAST_MODE_ROLLOUT_METRICS = "codex_desktop:get-fast-mode-rollout-metrics";
var DESKTOP_SYSTEM_THEME_UPDATED = "codex_desktop:system-theme-variant-updated";
var DESKTOP_TRIGGER_SENTRY_TEST = "codex_desktop:trigger-sentry-test";
function desktopWorkerFromViewChannel(workerId) {
  return `codex_desktop:worker:${workerId}:from-view`;
}
function desktopWorkerForViewChannel(workerId) {
  return `codex_desktop:worker:${workerId}:for-view`;
}
function fileLog(stage, extra) {
  const msg = `[codex-plusplus preload] ${stage}${extra === void 0 ? "" : " " + safeStringify2(extra)}`;
  try {
    console.error(msg);
  } catch {
  }
  try {
    import_electron4.ipcRenderer.send("codexpp:preload-log", "info", msg);
  } catch {
  }
}
function safeStringify2(v) {
  try {
    return typeof v === "string" ? v : JSON.stringify(v);
  } catch {
    return String(v);
  }
}
fileLog("preload entry", { url: location.href });
try {
  installBrowserUiHostBridge();
  fileLog("browser UI host bridge installed");
} catch (e) {
  fileLog("browser UI host bridge FAILED", String(e));
}
try {
  installReactHook();
  fileLog("react hook installed");
} catch (e) {
  fileLog("react hook FAILED", String(e));
}
queueMicrotask(() => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
});
var featureRuntimeStarted = false;
var reloadSubscribed = false;
async function boot() {
  fileLog("boot start", { readyState: document.readyState });
  try {
    startSettingsInjector();
    fileLog("settings injector started");
    subscribePluginEnabledChanges();
    if (await isPluginEnabled()) {
      await startFeatureRuntime();
    } else {
      fileLog("plugin switch disabled; feature runtime skipped");
    }
    fileLog("boot complete");
  } catch (e) {
    fileLog("boot FAILED", String(e?.stack ?? e));
    console.error("[codex-plusplus] preload boot failed:", e);
  }
}
async function isPluginEnabled() {
  try {
    const config = await import_electron4.ipcRenderer.invoke("codexpp:get-config");
    return config.enabled !== false;
  } catch {
    return true;
  }
}
async function startFeatureRuntime() {
  if (featureRuntimeStarted) return;
  await startTweakHost();
  fileLog("tweak host started");
  await mountManager();
  fileLog("manager mounted");
  subscribeReload();
  featureRuntimeStarted = true;
}
function stopFeatureRuntime() {
  teardownTweakHost();
  featureRuntimeStarted = false;
  fileLog("feature runtime stopped");
}
function subscribePluginEnabledChanges() {
  import_electron4.ipcRenderer.on("codexpp:plugin-enabled-changed", (_event, payload) => {
    const enabled = payload && typeof payload === "object" && payload.enabled !== false;
    if (enabled) {
      void startFeatureRuntime().catch((e) => {
        fileLog("feature runtime restart FAILED", String(e?.stack ?? e));
      });
      return;
    }
    stopFeatureRuntime();
  });
}
var reloading = null;
function subscribeReload() {
  if (reloadSubscribed) return;
  reloadSubscribed = true;
  import_electron4.ipcRenderer.on("codexpp:tweaks-changed", () => {
    if (reloading) return;
    reloading = (async () => {
      try {
        console.info("[codex-plusplus] hot-reloading tweaks");
        teardownTweakHost();
        await startTweakHost();
        await mountManager();
      } catch (e) {
        console.error("[codex-plusplus] hot reload failed:", e);
      } finally {
        reloading = null;
      }
    })();
  });
}
function installBrowserUiHostBridge() {
  const workerListeners = /* @__PURE__ */ new Map();
  import_electron4.ipcRenderer.on(BROWSER_UI_CONNECT_PORT, (event) => {
    const [port] = event.ports;
    if (!port) return;
    window.postMessage({ type: "connect-app-host", port }, "*", [port]);
  });
  import_electron4.ipcRenderer.on(BROWSER_UI_BRIDGE_REQUEST, async (_event, payload) => {
    const request = payload && typeof payload === "object" ? payload : {};
    const id = typeof request.id === "string" ? request.id : "";
    const method = typeof request.method === "string" ? request.method : "";
    const args = Array.isArray(request.args) ? request.args : [];
    try {
      const value = await runBrowserUiBridgeMethod(method, args, workerListeners);
      import_electron4.ipcRenderer.send(BROWSER_UI_BRIDGE_RESPONSE, { id, ok: true, value });
    } catch (e) {
      import_electron4.ipcRenderer.send(BROWSER_UI_BRIDGE_RESPONSE, {
        id,
        ok: false,
        error: e instanceof Error ? e.message : String(e)
      });
    }
  });
  import_electron4.ipcRenderer.on(DESKTOP_MESSAGE_FOR_VIEW, (_event, message) => {
    import_electron4.ipcRenderer.send(BROWSER_UI_MESSAGE_FOR_VIEW, message);
  });
  import_electron4.ipcRenderer.on(DESKTOP_SYSTEM_THEME_UPDATED, (_event, value) => {
    import_electron4.ipcRenderer.send(BROWSER_UI_SYSTEM_THEME, value);
  });
}
async function runBrowserUiBridgeMethod(method, args, workerListeners) {
  switch (method) {
    case "snapshot":
      return import_electron4.ipcRenderer.sendSync(DESKTOP_GET_SHARED_OBJECT_SNAPSHOT) ?? {};
    case "systemTheme":
      return import_electron4.ipcRenderer.sendSync(DESKTOP_GET_SYSTEM_THEME_VARIANT);
    case "sentryOptions":
      return import_electron4.ipcRenderer.sendSync(DESKTOP_GET_SENTRY_INIT_OPTIONS);
    case "buildFlavor":
      return import_electron4.ipcRenderer.sendSync(DESKTOP_GET_BUILD_FLAVOR);
    case "usesOwlAppShell":
      return import_electron4.ipcRenderer.sendSync(DESKTOP_GET_USES_OWL_APP_SHELL) === true;
    case "sendMessageFromView":
      return import_electron4.ipcRenderer.invoke(DESKTOP_MESSAGE_FROM_VIEW, args[0]);
    case "sendWorkerMessageFromView":
      return import_electron4.ipcRenderer.invoke(desktopWorkerFromViewChannel(String(args[0])), args[1]);
    case "subscribeWorkerMessages":
      return subscribeBrowserUiWorkerMessages(String(args[0]), workerListeners);
    case "unsubscribeWorkerMessages":
      return unsubscribeBrowserUiWorkerMessages(String(args[0]), workerListeners);
    case "showContextMenu":
      return import_electron4.ipcRenderer.invoke(DESKTOP_SHOW_CONTEXT_MENU, args[0]);
    case "showApplicationMenu":
      return import_electron4.ipcRenderer.invoke(DESKTOP_SHOW_APPLICATION_MENU, {
        menuId: args[0],
        x: args[1],
        y: args[2]
      });
    case "getFastModeRolloutMetrics":
      return import_electron4.ipcRenderer.invoke(DESKTOP_GET_FAST_MODE_ROLLOUT_METRICS, args[0]);
    case "triggerSentryTestError":
      return import_electron4.ipcRenderer.invoke(DESKTOP_TRIGGER_SENTRY_TEST);
    default:
      throw new Error(`Unknown codex\u6C49\u5316\u589E\u5F3Aplus\u7248 browser UI bridge method: ${method}`);
  }
}
function subscribeBrowserUiWorkerMessages(workerId, workerListeners) {
  if (!/^[a-zA-Z0-9._:-]+$/.test(workerId)) throw new Error("invalid worker id");
  if (workerListeners.has(workerId)) return true;
  const listener = (_event, message) => {
    import_electron4.ipcRenderer.send(BROWSER_UI_WORKER_MESSAGE, workerId, message);
  };
  workerListeners.set(workerId, listener);
  import_electron4.ipcRenderer.on(desktopWorkerForViewChannel(workerId), listener);
  return true;
}
function unsubscribeBrowserUiWorkerMessages(workerId, workerListeners) {
  const listener = workerListeners.get(workerId);
  if (!listener) return true;
  workerListeners.delete(workerId);
  import_electron4.ipcRenderer.removeListener(desktopWorkerForViewChannel(workerId), listener);
  return true;
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3ByZWxvYWQvaW5kZXgudHMiLCAiLi4vc3JjL3ByZWxvYWQvcmVhY3QtaG9vay50cyIsICIuLi9zcmMvcHJlbG9hZC9zZXR0aW5ncy1pbmplY3Rvci50cyIsICIuLi9zcmMvcHJlbG9hZC90d2Vhay1ob3N0LnRzIiwgIi4uL3NyYy9wcmVsb2FkL21hbmFnZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxyXG4gKiBSZW5kZXJlciBwcmVsb2FkIGVudHJ5LiBSdW5zIGluIGFuIGlzb2xhdGVkIHdvcmxkIGJlZm9yZSBDb2RleCdzIHBhZ2UgSlMuXHJcbiAqIFJlc3BvbnNpYmlsaXRpZXM6XHJcbiAqICAgMS4gSW5zdGFsbCBhIFJlYWN0IERldlRvb2xzLXNoYXBlZCBnbG9iYWwgaG9vayB0byBjYXB0dXJlIHRoZSByZW5kZXJlclxyXG4gKiAgICAgIHJlZmVyZW5jZSB3aGVuIFJlYWN0IG1vdW50cy4gV2UgdXNlIHRoaXMgZm9yIGZpYmVyIHdhbGtpbmcuXHJcbiAqICAgMi4gQWZ0ZXIgRE9NQ29udGVudExvYWRlZCwga2ljayBvZmYgc2V0dGluZ3MtaW5qZWN0aW9uIGxvZ2ljLlxyXG4gKiAgIDMuIERpc2NvdmVyIHJlbmRlcmVyLXNjb3BlZCB0d2Vha3MgKHZpYSBJUEMgdG8gbWFpbikgYW5kIHN0YXJ0IHRoZW0uXHJcbiAqICAgNC4gTGlzdGVuIGZvciBgY29kZXhwcDp0d2Vha3MtY2hhbmdlZGAgZnJvbSBtYWluIChmaWxlc3lzdGVtIHdhdGNoZXIpIGFuZFxyXG4gKiAgICAgIGhvdC1yZWxvYWQgdHdlYWtzIHdpdGhvdXQgZHJvcHBpbmcgdGhlIHBhZ2UuXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgaXBjUmVuZGVyZXIgfSBmcm9tIFwiZWxlY3Ryb25cIjtcclxuaW1wb3J0IHsgaW5zdGFsbFJlYWN0SG9vayB9IGZyb20gXCIuL3JlYWN0LWhvb2tcIjtcclxuaW1wb3J0IHsgc3RhcnRTZXR0aW5nc0luamVjdG9yIH0gZnJvbSBcIi4vc2V0dGluZ3MtaW5qZWN0b3JcIjtcclxuaW1wb3J0IHsgc3RhcnRUd2Vha0hvc3QsIHRlYXJkb3duVHdlYWtIb3N0IH0gZnJvbSBcIi4vdHdlYWstaG9zdFwiO1xyXG5pbXBvcnQgeyBtb3VudE1hbmFnZXIgfSBmcm9tIFwiLi9tYW5hZ2VyXCI7XHJcblxyXG5jb25zdCBCUk9XU0VSX1VJX0NPTk5FQ1RfUE9SVCA9IFwiY29kZXhwcDpicm93c2VyLXVpLWNvbm5lY3QtYXBwLWhvc3RcIjtcclxuY29uc3QgQlJPV1NFUl9VSV9CUklER0VfUkVRVUVTVCA9IFwiY29kZXhwcDpicm93c2VyLXVpLWJyaWRnZS1yZXF1ZXN0XCI7XHJcbmNvbnN0IEJST1dTRVJfVUlfQlJJREdFX1JFU1BPTlNFID0gXCJjb2RleHBwOmJyb3dzZXItdWktYnJpZGdlLXJlc3BvbnNlXCI7XHJcbmNvbnN0IEJST1dTRVJfVUlfTUVTU0FHRV9GT1JfVklFVyA9IFwiY29kZXhwcDpicm93c2VyLXVpLW1lc3NhZ2UtZm9yLXZpZXdcIjtcclxuY29uc3QgQlJPV1NFUl9VSV9XT1JLRVJfTUVTU0FHRSA9IFwiY29kZXhwcDpicm93c2VyLXVpLXdvcmtlci1tZXNzYWdlXCI7XHJcbmNvbnN0IEJST1dTRVJfVUlfU1lTVEVNX1RIRU1FID0gXCJjb2RleHBwOmJyb3dzZXItdWktc3lzdGVtLXRoZW1lXCI7XHJcblxyXG5jb25zdCBERVNLVE9QX01FU1NBR0VfRlJPTV9WSUVXID0gXCJjb2RleF9kZXNrdG9wOm1lc3NhZ2UtZnJvbS12aWV3XCI7XHJcbmNvbnN0IERFU0tUT1BfTUVTU0FHRV9GT1JfVklFVyA9IFwiY29kZXhfZGVza3RvcDptZXNzYWdlLWZvci12aWV3XCI7XHJcbmNvbnN0IERFU0tUT1BfU0hPV19DT05URVhUX01FTlUgPSBcImNvZGV4X2Rlc2t0b3A6c2hvdy1jb250ZXh0LW1lbnVcIjtcclxuY29uc3QgREVTS1RPUF9TSE9XX0FQUExJQ0FUSU9OX01FTlUgPSBcImNvZGV4X2Rlc2t0b3A6c2hvdy1hcHBsaWNhdGlvbi1tZW51XCI7XHJcbmNvbnN0IERFU0tUT1BfR0VUX1NFTlRSWV9JTklUX09QVElPTlMgPSBcImNvZGV4X2Rlc2t0b3A6Z2V0LXNlbnRyeS1pbml0LW9wdGlvbnNcIjtcclxuY29uc3QgREVTS1RPUF9HRVRfQlVJTERfRkxBVk9SID0gXCJjb2RleF9kZXNrdG9wOmdldC1idWlsZC1mbGF2b3JcIjtcclxuY29uc3QgREVTS1RPUF9HRVRfVVNFU19PV0xfQVBQX1NIRUxMID0gXCJjb2RleF9kZXNrdG9wOmdldC11c2VzLW93bC1hcHAtc2hlbGxcIjtcclxuY29uc3QgREVTS1RPUF9HRVRfU1lTVEVNX1RIRU1FX1ZBUklBTlQgPSBcImNvZGV4X2Rlc2t0b3A6Z2V0LXN5c3RlbS10aGVtZS12YXJpYW50XCI7XHJcbmNvbnN0IERFU0tUT1BfR0VUX1NIQVJFRF9PQkpFQ1RfU05BUFNIT1QgPSBcImNvZGV4X2Rlc2t0b3A6Z2V0LXNoYXJlZC1vYmplY3Qtc25hcHNob3RcIjtcclxuY29uc3QgREVTS1RPUF9HRVRfRkFTVF9NT0RFX1JPTExPVVRfTUVUUklDUyA9IFwiY29kZXhfZGVza3RvcDpnZXQtZmFzdC1tb2RlLXJvbGxvdXQtbWV0cmljc1wiO1xyXG5jb25zdCBERVNLVE9QX1NZU1RFTV9USEVNRV9VUERBVEVEID0gXCJjb2RleF9kZXNrdG9wOnN5c3RlbS10aGVtZS12YXJpYW50LXVwZGF0ZWRcIjtcclxuY29uc3QgREVTS1RPUF9UUklHR0VSX1NFTlRSWV9URVNUID0gXCJjb2RleF9kZXNrdG9wOnRyaWdnZXItc2VudHJ5LXRlc3RcIjtcclxuXHJcbmZ1bmN0aW9uIGRlc2t0b3BXb3JrZXJGcm9tVmlld0NoYW5uZWwod29ya2VySWQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIGBjb2RleF9kZXNrdG9wOndvcmtlcjoke3dvcmtlcklkfTpmcm9tLXZpZXdgO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkZXNrdG9wV29ya2VyRm9yVmlld0NoYW5uZWwod29ya2VySWQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIGBjb2RleF9kZXNrdG9wOndvcmtlcjoke3dvcmtlcklkfTpmb3Itdmlld2A7XHJcbn1cclxuXHJcbi8vIEZpbGUtbG9nIHByZWxvYWQgcHJvZ3Jlc3Mgc28gd2UgY2FuIGRpYWdub3NlIHdpdGhvdXQgRGV2VG9vbHMuIEJlc3QtZWZmb3J0OlxyXG4vLyBmYWlsdXJlcyBoZXJlIG11c3QgbmV2ZXIgdGhyb3cgYmVjYXVzZSB3ZSdkIHRha2UgdGhlIHBhZ2UgZG93biB3aXRoIHVzLlxyXG4vL1xyXG4vLyBDb2RleCdzIHJlbmRlcmVyIGlzIHNhbmRib3hlZCAoc2FuZGJveDogdHJ1ZSksIHNvIGByZXF1aXJlKFwibm9kZTpmc1wiKWAgaXNcclxuLy8gdW5hdmFpbGFibGUuIFdlIGZvcndhcmQgbG9nIGxpbmVzIHRvIG1haW4gdmlhIElQQzsgbWFpbiB3cml0ZXMgdGhlIGZpbGUuXHJcbmZ1bmN0aW9uIGZpbGVMb2coc3RhZ2U6IHN0cmluZywgZXh0cmE/OiB1bmtub3duKTogdm9pZCB7XHJcbiAgY29uc3QgbXNnID0gYFtjb2RleC1wbHVzcGx1cyBwcmVsb2FkXSAke3N0YWdlfSR7XHJcbiAgICBleHRyYSA9PT0gdW5kZWZpbmVkID8gXCJcIiA6IFwiIFwiICsgc2FmZVN0cmluZ2lmeShleHRyYSlcclxuICB9YDtcclxuICB0cnkge1xyXG4gICAgY29uc29sZS5lcnJvcihtc2cpO1xyXG4gIH0gY2F0Y2gge31cclxuICB0cnkge1xyXG4gICAgaXBjUmVuZGVyZXIuc2VuZChcImNvZGV4cHA6cHJlbG9hZC1sb2dcIiwgXCJpbmZvXCIsIG1zZyk7XHJcbiAgfSBjYXRjaCB7fVxyXG59XHJcbmZ1bmN0aW9uIHNhZmVTdHJpbmdpZnkodjogdW5rbm93bik6IHN0cmluZyB7XHJcbiAgdHJ5IHtcclxuICAgIHJldHVybiB0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIiA/IHYgOiBKU09OLnN0cmluZ2lmeSh2KTtcclxuICB9IGNhdGNoIHtcclxuICAgIHJldHVybiBTdHJpbmcodik7XHJcbiAgfVxyXG59XHJcblxyXG5maWxlTG9nKFwicHJlbG9hZCBlbnRyeVwiLCB7IHVybDogbG9jYXRpb24uaHJlZiB9KTtcblxyXG50cnkge1xyXG4gIGluc3RhbGxCcm93c2VyVWlIb3N0QnJpZGdlKCk7XHJcbiAgZmlsZUxvZyhcImJyb3dzZXIgVUkgaG9zdCBicmlkZ2UgaW5zdGFsbGVkXCIpO1xyXG59IGNhdGNoIChlKSB7XHJcbiAgZmlsZUxvZyhcImJyb3dzZXIgVUkgaG9zdCBicmlkZ2UgRkFJTEVEXCIsIFN0cmluZyhlKSk7XHJcbn1cclxuXHJcbi8vIFJlYWN0IGhvb2sgbXVzdCBiZSBpbnN0YWxsZWQgKmJlZm9yZSogQ29kZXgncyBidW5kbGUgcnVucy5cclxudHJ5IHtcclxuICBpbnN0YWxsUmVhY3RIb29rKCk7XHJcbiAgZmlsZUxvZyhcInJlYWN0IGhvb2sgaW5zdGFsbGVkXCIpO1xyXG59IGNhdGNoIChlKSB7XHJcbiAgZmlsZUxvZyhcInJlYWN0IGhvb2sgRkFJTEVEXCIsIFN0cmluZyhlKSk7XHJcbn1cclxuXHJcbnF1ZXVlTWljcm90YXNrKCgpID0+IHtcclxuICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJsb2FkaW5nXCIpIHtcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGJvb3QsIHsgb25jZTogdHJ1ZSB9KTtcclxuICB9IGVsc2Uge1xyXG4gICAgYm9vdCgpO1xyXG4gIH1cclxufSk7XHJcblxyXG5sZXQgZmVhdHVyZVJ1bnRpbWVTdGFydGVkID0gZmFsc2U7XG5sZXQgcmVsb2FkU3Vic2NyaWJlZCA9IGZhbHNlO1xuXG5hc3luYyBmdW5jdGlvbiBib290KCkge1xuICBmaWxlTG9nKFwiYm9vdCBzdGFydFwiLCB7IHJlYWR5U3RhdGU6IGRvY3VtZW50LnJlYWR5U3RhdGUgfSk7XG4gIHRyeSB7XG4gICAgc3RhcnRTZXR0aW5nc0luamVjdG9yKCk7XG4gICAgZmlsZUxvZyhcInNldHRpbmdzIGluamVjdG9yIHN0YXJ0ZWRcIik7XG4gICAgc3Vic2NyaWJlUGx1Z2luRW5hYmxlZENoYW5nZXMoKTtcbiAgICBpZiAoYXdhaXQgaXNQbHVnaW5FbmFibGVkKCkpIHtcbiAgICAgIGF3YWl0IHN0YXJ0RmVhdHVyZVJ1bnRpbWUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmlsZUxvZyhcInBsdWdpbiBzd2l0Y2ggZGlzYWJsZWQ7IGZlYXR1cmUgcnVudGltZSBza2lwcGVkXCIpO1xuICAgIH1cbiAgICBmaWxlTG9nKFwiYm9vdCBjb21wbGV0ZVwiKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGZpbGVMb2coXCJib290IEZBSUxFRFwiLCBTdHJpbmcoKGUgYXMgRXJyb3IpPy5zdGFjayA/PyBlKSk7XG4gICAgY29uc29sZS5lcnJvcihcIltjb2RleC1wbHVzcGx1c10gcHJlbG9hZCBib290IGZhaWxlZDpcIiwgZSk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gaXNQbHVnaW5FbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICB0cnkge1xuICAgIGNvbnN0IGNvbmZpZyA9IGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Z2V0LWNvbmZpZ1wiKSBhcyB7IGVuYWJsZWQ/OiBib29sZWFuIH07XG4gICAgcmV0dXJuIGNvbmZpZy5lbmFibGVkICE9PSBmYWxzZTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gc3RhcnRGZWF0dXJlUnVudGltZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKGZlYXR1cmVSdW50aW1lU3RhcnRlZCkgcmV0dXJuO1xuICBhd2FpdCBzdGFydFR3ZWFrSG9zdCgpO1xuICBmaWxlTG9nKFwidHdlYWsgaG9zdCBzdGFydGVkXCIpO1xuICBhd2FpdCBtb3VudE1hbmFnZXIoKTtcbiAgZmlsZUxvZyhcIm1hbmFnZXIgbW91bnRlZFwiKTtcbiAgc3Vic2NyaWJlUmVsb2FkKCk7XG4gIGZlYXR1cmVSdW50aW1lU3RhcnRlZCA9IHRydWU7XG59XG5cbmZ1bmN0aW9uIHN0b3BGZWF0dXJlUnVudGltZSgpOiB2b2lkIHtcbiAgdGVhcmRvd25Ud2Vha0hvc3QoKTtcbiAgZmVhdHVyZVJ1bnRpbWVTdGFydGVkID0gZmFsc2U7XG4gIGZpbGVMb2coXCJmZWF0dXJlIHJ1bnRpbWUgc3RvcHBlZFwiKTtcbn1cblxuZnVuY3Rpb24gc3Vic2NyaWJlUGx1Z2luRW5hYmxlZENoYW5nZXMoKTogdm9pZCB7XG4gIGlwY1JlbmRlcmVyLm9uKFwiY29kZXhwcDpwbHVnaW4tZW5hYmxlZC1jaGFuZ2VkXCIsIChfZXZlbnQsIHBheWxvYWQpID0+IHtcbiAgICBjb25zdCBlbmFibGVkID0gcGF5bG9hZCAmJiB0eXBlb2YgcGF5bG9hZCA9PT0gXCJvYmplY3RcIiAmJiAocGF5bG9hZCBhcyB7IGVuYWJsZWQ/OiB1bmtub3duIH0pLmVuYWJsZWQgIT09IGZhbHNlO1xuICAgIGlmIChlbmFibGVkKSB7XG4gICAgICB2b2lkIHN0YXJ0RmVhdHVyZVJ1bnRpbWUoKS5jYXRjaCgoZSkgPT4ge1xuICAgICAgICBmaWxlTG9nKFwiZmVhdHVyZSBydW50aW1lIHJlc3RhcnQgRkFJTEVEXCIsIFN0cmluZygoZSBhcyBFcnJvcik/LnN0YWNrID8/IGUpKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzdG9wRmVhdHVyZVJ1bnRpbWUoKTtcbiAgfSk7XG59XG5cclxuLy8gSG90IHJlbG9hZDogZ2F0ZWQgYmVoaW5kIGEgc21hbGwgaW4tZmxpZ2h0IGxvY2sgc28gYSBmbHVycnkgb2YgZnMgZXZlbnRzXHJcbi8vIGRvZXNuJ3QgcmVlbnRyYW50bHkgdGVhciBkb3duIHRoZSBob3N0IG1pZC1sb2FkLlxyXG5sZXQgcmVsb2FkaW5nOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCA9IG51bGw7XHJcbmZ1bmN0aW9uIHN1YnNjcmliZVJlbG9hZCgpOiB2b2lkIHtcbiAgaWYgKHJlbG9hZFN1YnNjcmliZWQpIHJldHVybjtcbiAgcmVsb2FkU3Vic2NyaWJlZCA9IHRydWU7XG4gIGlwY1JlbmRlcmVyLm9uKFwiY29kZXhwcDp0d2Vha3MtY2hhbmdlZFwiLCAoKSA9PiB7XG4gICAgaWYgKHJlbG9hZGluZykgcmV0dXJuO1xyXG4gICAgcmVsb2FkaW5nID0gKGFzeW5jICgpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zb2xlLmluZm8oXCJbY29kZXgtcGx1c3BsdXNdIGhvdC1yZWxvYWRpbmcgdHdlYWtzXCIpO1xyXG4gICAgICAgIHRlYXJkb3duVHdlYWtIb3N0KCk7XHJcbiAgICAgICAgYXdhaXQgc3RhcnRUd2Vha0hvc3QoKTtcclxuICAgICAgICBhd2FpdCBtb3VudE1hbmFnZXIoKTtcclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbY29kZXgtcGx1c3BsdXNdIGhvdCByZWxvYWQgZmFpbGVkOlwiLCBlKTtcclxuICAgICAgfSBmaW5hbGx5IHtcclxuICAgICAgICByZWxvYWRpbmcgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICB9KSgpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsQnJvd3NlclVpSG9zdEJyaWRnZSgpOiB2b2lkIHtcclxuICBjb25zdCB3b3JrZXJMaXN0ZW5lcnMgPSBuZXcgTWFwPHN0cmluZywgKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZD4oKTtcclxuXHJcbiAgaXBjUmVuZGVyZXIub24oQlJPV1NFUl9VSV9DT05ORUNUX1BPUlQsIChldmVudCkgPT4ge1xyXG4gICAgY29uc3QgW3BvcnRdID0gZXZlbnQucG9ydHM7XHJcbiAgICBpZiAoIXBvcnQpIHJldHVybjtcclxuICAgIHdpbmRvdy5wb3N0TWVzc2FnZSh7IHR5cGU6IFwiY29ubmVjdC1hcHAtaG9zdFwiLCBwb3J0IH0sIFwiKlwiLCBbcG9ydF0pO1xyXG4gIH0pO1xyXG5cclxuICBpcGNSZW5kZXJlci5vbihCUk9XU0VSX1VJX0JSSURHRV9SRVFVRVNULCBhc3luYyAoX2V2ZW50LCBwYXlsb2FkKSA9PiB7XHJcbiAgICBjb25zdCByZXF1ZXN0ID0gcGF5bG9hZCAmJiB0eXBlb2YgcGF5bG9hZCA9PT0gXCJvYmplY3RcIlxyXG4gICAgICA/IHBheWxvYWQgYXMgeyBpZD86IHVua25vd247IG1ldGhvZD86IHVua25vd247IGFyZ3M/OiB1bmtub3duIH1cclxuICAgICAgOiB7fTtcclxuICAgIGNvbnN0IGlkID0gdHlwZW9mIHJlcXVlc3QuaWQgPT09IFwic3RyaW5nXCIgPyByZXF1ZXN0LmlkIDogXCJcIjtcclxuICAgIGNvbnN0IG1ldGhvZCA9IHR5cGVvZiByZXF1ZXN0Lm1ldGhvZCA9PT0gXCJzdHJpbmdcIiA/IHJlcXVlc3QubWV0aG9kIDogXCJcIjtcclxuICAgIGNvbnN0IGFyZ3MgPSBBcnJheS5pc0FycmF5KHJlcXVlc3QuYXJncykgPyByZXF1ZXN0LmFyZ3MgOiBbXTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgcnVuQnJvd3NlclVpQnJpZGdlTWV0aG9kKG1ldGhvZCwgYXJncywgd29ya2VyTGlzdGVuZXJzKTtcclxuICAgICAgaXBjUmVuZGVyZXIuc2VuZChCUk9XU0VSX1VJX0JSSURHRV9SRVNQT05TRSwgeyBpZCwgb2s6IHRydWUsIHZhbHVlIH0pO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICBpcGNSZW5kZXJlci5zZW5kKEJST1dTRVJfVUlfQlJJREdFX1JFU1BPTlNFLCB7XHJcbiAgICAgICAgaWQsXHJcbiAgICAgICAgb2s6IGZhbHNlLFxyXG4gICAgICAgIGVycm9yOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSksXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICBpcGNSZW5kZXJlci5vbihERVNLVE9QX01FU1NBR0VfRk9SX1ZJRVcsIChfZXZlbnQsIG1lc3NhZ2UpID0+IHtcclxuICAgIGlwY1JlbmRlcmVyLnNlbmQoQlJPV1NFUl9VSV9NRVNTQUdFX0ZPUl9WSUVXLCBtZXNzYWdlKTtcclxuICB9KTtcclxuXHJcbiAgaXBjUmVuZGVyZXIub24oREVTS1RPUF9TWVNURU1fVEhFTUVfVVBEQVRFRCwgKF9ldmVudCwgdmFsdWUpID0+IHtcclxuICAgIGlwY1JlbmRlcmVyLnNlbmQoQlJPV1NFUl9VSV9TWVNURU1fVEhFTUUsIHZhbHVlKTtcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcnVuQnJvd3NlclVpQnJpZGdlTWV0aG9kKFxyXG4gIG1ldGhvZDogc3RyaW5nLFxyXG4gIGFyZ3M6IHVua25vd25bXSxcclxuICB3b3JrZXJMaXN0ZW5lcnM6IE1hcDxzdHJpbmcsICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQ+LFxyXG4pOiBQcm9taXNlPHVua25vd24+IHtcclxuICBzd2l0Y2ggKG1ldGhvZCkge1xyXG4gICAgY2FzZSBcInNuYXBzaG90XCI6XHJcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYyhERVNLVE9QX0dFVF9TSEFSRURfT0JKRUNUX1NOQVBTSE9UKSA/PyB7fTtcclxuICAgIGNhc2UgXCJzeXN0ZW1UaGVtZVwiOlxyXG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuc2VuZFN5bmMoREVTS1RPUF9HRVRfU1lTVEVNX1RIRU1FX1ZBUklBTlQpO1xyXG4gICAgY2FzZSBcInNlbnRyeU9wdGlvbnNcIjpcclxuICAgICAgcmV0dXJuIGlwY1JlbmRlcmVyLnNlbmRTeW5jKERFU0tUT1BfR0VUX1NFTlRSWV9JTklUX09QVElPTlMpO1xyXG4gICAgY2FzZSBcImJ1aWxkRmxhdm9yXCI6XHJcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYyhERVNLVE9QX0dFVF9CVUlMRF9GTEFWT1IpO1xyXG4gICAgY2FzZSBcInVzZXNPd2xBcHBTaGVsbFwiOlxyXG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuc2VuZFN5bmMoREVTS1RPUF9HRVRfVVNFU19PV0xfQVBQX1NIRUxMKSA9PT0gdHJ1ZTtcclxuICAgIGNhc2UgXCJzZW5kTWVzc2FnZUZyb21WaWV3XCI6XHJcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5pbnZva2UoREVTS1RPUF9NRVNTQUdFX0ZST01fVklFVywgYXJnc1swXSk7XHJcbiAgICBjYXNlIFwic2VuZFdvcmtlck1lc3NhZ2VGcm9tVmlld1wiOlxyXG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKGRlc2t0b3BXb3JrZXJGcm9tVmlld0NoYW5uZWwoU3RyaW5nKGFyZ3NbMF0pKSwgYXJnc1sxXSk7XHJcbiAgICBjYXNlIFwic3Vic2NyaWJlV29ya2VyTWVzc2FnZXNcIjpcclxuICAgICAgcmV0dXJuIHN1YnNjcmliZUJyb3dzZXJVaVdvcmtlck1lc3NhZ2VzKFN0cmluZyhhcmdzWzBdKSwgd29ya2VyTGlzdGVuZXJzKTtcclxuICAgIGNhc2UgXCJ1bnN1YnNjcmliZVdvcmtlck1lc3NhZ2VzXCI6XHJcbiAgICAgIHJldHVybiB1bnN1YnNjcmliZUJyb3dzZXJVaVdvcmtlck1lc3NhZ2VzKFN0cmluZyhhcmdzWzBdKSwgd29ya2VyTGlzdGVuZXJzKTtcclxuICAgIGNhc2UgXCJzaG93Q29udGV4dE1lbnVcIjpcclxuICAgICAgcmV0dXJuIGlwY1JlbmRlcmVyLmludm9rZShERVNLVE9QX1NIT1dfQ09OVEVYVF9NRU5VLCBhcmdzWzBdKTtcclxuICAgIGNhc2UgXCJzaG93QXBwbGljYXRpb25NZW51XCI6XHJcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5pbnZva2UoREVTS1RPUF9TSE9XX0FQUExJQ0FUSU9OX01FTlUsIHtcclxuICAgICAgICBtZW51SWQ6IGFyZ3NbMF0sXHJcbiAgICAgICAgeDogYXJnc1sxXSxcclxuICAgICAgICB5OiBhcmdzWzJdLFxyXG4gICAgICB9KTtcclxuICAgIGNhc2UgXCJnZXRGYXN0TW9kZVJvbGxvdXRNZXRyaWNzXCI6XHJcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5pbnZva2UoREVTS1RPUF9HRVRfRkFTVF9NT0RFX1JPTExPVVRfTUVUUklDUywgYXJnc1swXSk7XHJcbiAgICBjYXNlIFwidHJpZ2dlclNlbnRyeVRlc3RFcnJvclwiOlxyXG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKERFU0tUT1BfVFJJR0dFUl9TRU5UUllfVEVTVCk7XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gY29kZXhcdTZDNDlcdTUzMTZcdTU4OUVcdTVGM0FwbHVzXHU3MjQ4IGJyb3dzZXIgVUkgYnJpZGdlIG1ldGhvZDogJHttZXRob2R9YCk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzdWJzY3JpYmVCcm93c2VyVWlXb3JrZXJNZXNzYWdlcyhcclxuICB3b3JrZXJJZDogc3RyaW5nLFxyXG4gIHdvcmtlckxpc3RlbmVyczogTWFwPHN0cmluZywgKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZD4sXHJcbik6IGJvb2xlYW4ge1xyXG4gIGlmICghL15bYS16QS1aMC05Ll86LV0rJC8udGVzdCh3b3JrZXJJZCkpIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgd29ya2VyIGlkXCIpO1xyXG4gIGlmICh3b3JrZXJMaXN0ZW5lcnMuaGFzKHdvcmtlcklkKSkgcmV0dXJuIHRydWU7XHJcbiAgY29uc3QgbGlzdGVuZXIgPSAoX2V2ZW50OiB1bmtub3duLCBtZXNzYWdlOiB1bmtub3duKSA9PiB7XHJcbiAgICBpcGNSZW5kZXJlci5zZW5kKEJST1dTRVJfVUlfV09SS0VSX01FU1NBR0UsIHdvcmtlcklkLCBtZXNzYWdlKTtcclxuICB9O1xyXG4gIHdvcmtlckxpc3RlbmVycy5zZXQod29ya2VySWQsIGxpc3RlbmVyKTtcclxuICBpcGNSZW5kZXJlci5vbihkZXNrdG9wV29ya2VyRm9yVmlld0NoYW5uZWwod29ya2VySWQpLCBsaXN0ZW5lcik7XHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVuc3Vic2NyaWJlQnJvd3NlclVpV29ya2VyTWVzc2FnZXMoXHJcbiAgd29ya2VySWQ6IHN0cmluZyxcclxuICB3b3JrZXJMaXN0ZW5lcnM6IE1hcDxzdHJpbmcsICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQ+LFxyXG4pOiBib29sZWFuIHtcclxuICBjb25zdCBsaXN0ZW5lciA9IHdvcmtlckxpc3RlbmVycy5nZXQod29ya2VySWQpO1xyXG4gIGlmICghbGlzdGVuZXIpIHJldHVybiB0cnVlO1xyXG4gIHdvcmtlckxpc3RlbmVycy5kZWxldGUod29ya2VySWQpO1xyXG4gIGlwY1JlbmRlcmVyLnJlbW92ZUxpc3RlbmVyKGRlc2t0b3BXb3JrZXJGb3JWaWV3Q2hhbm5lbCh3b3JrZXJJZCksIGxpc3RlbmVyKTtcclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG4iLCAiLyoqXHJcbiAqIEluc3RhbGwgYSBtaW5pbWFsIF9fUkVBQ1RfREVWVE9PTFNfR0xPQkFMX0hPT0tfXy4gUmVhY3QgY2FsbHNcclxuICogYGhvb2suaW5qZWN0KHJlbmRlcmVySW50ZXJuYWxzKWAgZHVyaW5nIGBjcmVhdGVSb290YC9gaHlkcmF0ZVJvb3RgLiBUaGVcclxuICogXCJpbnRlcm5hbHNcIiBvYmplY3QgZXhwb3NlcyBmaW5kRmliZXJCeUhvc3RJbnN0YW5jZSwgd2hpY2ggbGV0cyB1cyB0dXJuIGFcclxuICogRE9NIG5vZGUgaW50byBhIFJlYWN0IGZpYmVyIFx1MjAxNCBuZWNlc3NhcnkgZm9yIG91ciBTZXR0aW5ncyBpbmplY3Rvci5cclxuICpcclxuICogV2UgZG9uJ3Qgd2FudCB0byBicmVhayByZWFsIFJlYWN0IERldlRvb2xzIGlmIHRoZSB1c2VyIG9wZW5zIGl0OyB3ZSBpbnN0YWxsXHJcbiAqIG9ubHkgaWYgbm8gaG9vayBleGlzdHMgeWV0LCBhbmQgd2UgZm9yd2FyZCBjYWxscyB0byBhIGRvd25zdHJlYW0gaG9vayBpZlxyXG4gKiBvbmUgaXMgbGF0ZXIgYXNzaWduZWQuXHJcbiAqL1xyXG5kZWNsYXJlIGdsb2JhbCB7XHJcbiAgaW50ZXJmYWNlIFdpbmRvdyB7XHJcbiAgICBfX1JFQUNUX0RFVlRPT0xTX0dMT0JBTF9IT09LX18/OiBSZWFjdERldnRvb2xzSG9vaztcclxuICAgIF9fY29kZXhwcF9fPzoge1xyXG4gICAgICBob29rOiBSZWFjdERldnRvb2xzSG9vaztcclxuICAgICAgcmVuZGVyZXJzOiBNYXA8bnVtYmVyLCBSZW5kZXJlckludGVybmFscz47XHJcbiAgICB9O1xyXG4gIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFJlbmRlcmVySW50ZXJuYWxzIHtcclxuICBmaW5kRmliZXJCeUhvc3RJbnN0YW5jZT86IChuOiBOb2RlKSA9PiB1bmtub3duO1xyXG4gIHZlcnNpb24/OiBzdHJpbmc7XHJcbiAgYnVuZGxlVHlwZT86IG51bWJlcjtcclxuICByZW5kZXJlclBhY2thZ2VOYW1lPzogc3RyaW5nO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgUmVhY3REZXZ0b29sc0hvb2sge1xyXG4gIHN1cHBvcnRzRmliZXI6IHRydWU7XHJcbiAgcmVuZGVyZXJzOiBNYXA8bnVtYmVyLCBSZW5kZXJlckludGVybmFscz47XHJcbiAgb24oZXZlbnQ6IHN0cmluZywgZm46ICguLi5hOiB1bmtub3duW10pID0+IHZvaWQpOiB2b2lkO1xyXG4gIG9mZihldmVudDogc3RyaW5nLCBmbjogKC4uLmE6IHVua25vd25bXSkgPT4gdm9pZCk6IHZvaWQ7XHJcbiAgZW1pdChldmVudDogc3RyaW5nLCAuLi5hOiB1bmtub3duW10pOiB2b2lkO1xyXG4gIGluamVjdChyZW5kZXJlcjogUmVuZGVyZXJJbnRlcm5hbHMpOiBudW1iZXI7XHJcbiAgb25TY2hlZHVsZUZpYmVyUm9vdD8oKTogdm9pZDtcclxuICBvbkNvbW1pdEZpYmVyUm9vdD8oKTogdm9pZDtcclxuICBvbkNvbW1pdEZpYmVyVW5tb3VudD8oKTogdm9pZDtcclxuICBjaGVja0RDRT8oKTogdm9pZDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbGxSZWFjdEhvb2soKTogdm9pZCB7XHJcbiAgaWYgKHdpbmRvdy5fX1JFQUNUX0RFVlRPT0xTX0dMT0JBTF9IT09LX18pIHJldHVybjtcclxuICBjb25zdCByZW5kZXJlcnMgPSBuZXcgTWFwPG51bWJlciwgUmVuZGVyZXJJbnRlcm5hbHM+KCk7XHJcbiAgbGV0IG5leHRJZCA9IDE7XHJcbiAgY29uc3QgbGlzdGVuZXJzID0gbmV3IE1hcDxzdHJpbmcsIFNldDwoLi4uYTogdW5rbm93bltdKSA9PiB2b2lkPj4oKTtcclxuXHJcbiAgY29uc3QgaG9vazogUmVhY3REZXZ0b29sc0hvb2sgPSB7XHJcbiAgICBzdXBwb3J0c0ZpYmVyOiB0cnVlLFxyXG4gICAgcmVuZGVyZXJzLFxyXG4gICAgaW5qZWN0KHJlbmRlcmVyKSB7XHJcbiAgICAgIGNvbnN0IGlkID0gbmV4dElkKys7XHJcbiAgICAgIHJlbmRlcmVycy5zZXQoaWQsIHJlbmRlcmVyKTtcclxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcclxuICAgICAgY29uc29sZS5kZWJ1ZyhcclxuICAgICAgICBcIltjb2RleC1wbHVzcGx1c10gUmVhY3QgcmVuZGVyZXIgYXR0YWNoZWQ6XCIsXHJcbiAgICAgICAgcmVuZGVyZXIucmVuZGVyZXJQYWNrYWdlTmFtZSxcclxuICAgICAgICByZW5kZXJlci52ZXJzaW9uLFxyXG4gICAgICApO1xyXG4gICAgICByZXR1cm4gaWQ7XHJcbiAgICB9LFxyXG4gICAgb24oZXZlbnQsIGZuKSB7XHJcbiAgICAgIGxldCBzID0gbGlzdGVuZXJzLmdldChldmVudCk7XHJcbiAgICAgIGlmICghcykgbGlzdGVuZXJzLnNldChldmVudCwgKHMgPSBuZXcgU2V0KCkpKTtcclxuICAgICAgcy5hZGQoZm4pO1xyXG4gICAgfSxcclxuICAgIG9mZihldmVudCwgZm4pIHtcclxuICAgICAgbGlzdGVuZXJzLmdldChldmVudCk/LmRlbGV0ZShmbik7XHJcbiAgICB9LFxyXG4gICAgZW1pdChldmVudCwgLi4uYXJncykge1xyXG4gICAgICBsaXN0ZW5lcnMuZ2V0KGV2ZW50KT8uZm9yRWFjaCgoZm4pID0+IGZuKC4uLmFyZ3MpKTtcclxuICAgIH0sXHJcbiAgICBvbkNvbW1pdEZpYmVyUm9vdCgpIHt9LFxyXG4gICAgb25Db21taXRGaWJlclVubW91bnQoKSB7fSxcclxuICAgIG9uU2NoZWR1bGVGaWJlclJvb3QoKSB7fSxcclxuICAgIGNoZWNrRENFKCkge30sXHJcbiAgfTtcclxuXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHdpbmRvdywgXCJfX1JFQUNUX0RFVlRPT0xTX0dMT0JBTF9IT09LX19cIiwge1xyXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxyXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXHJcbiAgICB3cml0YWJsZTogdHJ1ZSwgLy8gYWxsb3cgcmVhbCBEZXZUb29scyB0byBvdmVyd3JpdGUgaWYgdXNlciBpbnN0YWxscyBpdFxyXG4gICAgdmFsdWU6IGhvb2ssXHJcbiAgfSk7XHJcblxyXG4gIHdpbmRvdy5fX2NvZGV4cHBfXyA9IHsgaG9vaywgcmVuZGVyZXJzIH07XHJcbn1cclxuXHJcbi8qKiBSZXNvbHZlIHRoZSBSZWFjdCBmaWJlciBmb3IgYSBET00gbm9kZSwgaWYgYW55IHJlbmRlcmVyIGhhcyBvbmUuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmaWJlckZvck5vZGUobm9kZTogTm9kZSk6IHVua25vd24gfCBudWxsIHtcclxuICBjb25zdCByZW5kZXJlcnMgPSB3aW5kb3cuX19jb2RleHBwX18/LnJlbmRlcmVycztcclxuICBpZiAocmVuZGVyZXJzKSB7XHJcbiAgICBmb3IgKGNvbnN0IHIgb2YgcmVuZGVyZXJzLnZhbHVlcygpKSB7XHJcbiAgICAgIGNvbnN0IGYgPSByLmZpbmRGaWJlckJ5SG9zdEluc3RhbmNlPy4obm9kZSk7XHJcbiAgICAgIGlmIChmKSByZXR1cm4gZjtcclxuICAgIH1cclxuICB9XHJcbiAgLy8gRmFsbGJhY2s6IHJlYWQgdGhlIFJlYWN0IGludGVybmFsIHByb3BlcnR5IGRpcmVjdGx5IGZyb20gdGhlIERPTSBub2RlLlxyXG4gIC8vIFJlYWN0IHN0b3JlcyBmaWJlcnMgYXMgYSBwcm9wZXJ0eSB3aG9zZSBrZXkgc3RhcnRzIHdpdGggXCJfX3JlYWN0RmliZXJcIi5cclxuICBmb3IgKGNvbnN0IGsgb2YgT2JqZWN0LmtleXMobm9kZSkpIHtcclxuICAgIGlmIChrLnN0YXJ0c1dpdGgoXCJfX3JlYWN0RmliZXJcIikpIHJldHVybiAobm9kZSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtrXTtcclxuICB9XHJcbiAgcmV0dXJuIG51bGw7XHJcbn1cclxuIiwgIi8qKlxyXG4gKiBTZXR0aW5ncyBpbmplY3RvciBmb3IgQ29kZXgncyBTZXR0aW5ncyBwYWdlLlxyXG4gKlxyXG4gKiBDb2RleCdzIHNldHRpbmdzIGlzIGEgcm91dGVkIHBhZ2UgKFVSTCBzdGF5cyBhdCBgL2luZGV4Lmh0bWw/aG9zdElkPWxvY2FsYClcclxuICogTk9UIGEgbW9kYWwgZGlhbG9nLiBUaGUgc2lkZWJhciBsaXZlcyBpbnNpZGUgYSBgPGRpdiBjbGFzcz1cImZsZXggZmxleC1jb2xcclxuICogZ2FwLTEgZ2FwLTBcIj5gIHdyYXBwZXIgdGhhdCBob2xkcyBvbmUgb3IgbW9yZSBgPGRpdiBjbGFzcz1cImZsZXggZmxleC1jb2xcclxuICogZ2FwLXB4XCI+YCBncm91cHMgb2YgYnV0dG9ucy4gVGhlcmUgYXJlIG5vIHN0YWJsZSBgcm9sZWAgLyBgYXJpYS1sYWJlbGAgL1xyXG4gKiBgZGF0YS10ZXN0aWRgIGhvb2tzIG9uIHRoZSBzaGVsbCBzbyB3ZSBpZGVudGlmeSB0aGUgc2lkZWJhciBieSB0ZXh0LWNvbnRlbnRcclxuICogbWF0Y2ggYWdhaW5zdCBrbm93biBpdGVtIGxhYmVscyAoR2VuZXJhbCwgQXBwZWFyYW5jZSwgQ29uZmlndXJhdGlvbiwgXHUyMDI2KS5cclxuICpcclxuICogTGF5b3V0IHdlIGluamVjdDpcclxuICpcclxuICogICBHRU5FUkFMICAgICAgICAgICAgICAgICAgICAgICAodXBwZXJjYXNlIGdyb3VwIGxhYmVsKVxyXG4gKiAgIFtDb2RleCdzIGV4aXN0aW5nIGl0ZW1zIGdyb3VwXVxyXG4gKiAgIGNvZGV4XHU2QzQ5XHU1MzE2XHU1ODlFXHU1RjNBcGx1c1x1NzI0OCAgICAgICAgICAgICAodXBwZXJjYXNlIGdyb3VwIGxhYmVsKVxuICogICBcdTI0RDggQ29uZmlnXHJcbiAqICAgXHUyNjMwIFR3ZWFrc1xyXG4gKiAgIFx1MjVDNyBUd2VhayBTdG9yZVxyXG4gKlxyXG4gKiBDbGlja2luZyBDb25maWcgLyBUd2Vha3MgLyBUd2VhayBTdG9yZSBoaWRlcyBDb2RleCdzIGNvbnRlbnQgcGFuZWwgY2hpbGRyZW4gYW5kIHJlbmRlcnNcclxuICogb3VyIG93biBgbWFpbi1zdXJmYWNlYCBwYW5lbCBpbiB0aGVpciBwbGFjZS4gQ2xpY2tpbmcgYW55IG9mIENvZGV4J3NcclxuICogc2lkZWJhciBpdGVtcyByZXN0b3JlcyB0aGUgb3JpZ2luYWwgdmlldy5cclxuICovXHJcblxyXG5pbXBvcnQgeyBpcGNSZW5kZXJlciB9IGZyb20gXCJlbGVjdHJvblwiO1xyXG5pbXBvcnQgdHlwZSB7XHJcbiAgU2V0dGluZ3NTZWN0aW9uLFxyXG4gIFNldHRpbmdzUGFnZSxcclxuICBTZXR0aW5nc0hhbmRsZSxcclxuICBUd2Vha01hbmlmZXN0LFxyXG59IGZyb20gXCJAY29kZXgtcGx1c3BsdXMvc2RrXCI7XHJcbmltcG9ydCB0eXBlIHsgVHdlYWtTdG9yZUVudHJ5IH0gZnJvbSBcIi4uL3R3ZWFrLXN0b3JlXCI7XG5cclxuY29uc3QgQUlfT1BFTl9UT09MX1VSTCA9IFwiaHR0cHM6Ly9haW9wZW50b29sLmNvbS9cIjtcblxuaW50ZXJmYWNlIFR3ZWFrRGlzcGxheVRleHQge1xuICBuYW1lOiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xufVxuXG5jb25zdCBTVE9SRV9UV0VBS19aSDogUmVjb3JkPHN0cmluZywgVHdlYWtEaXNwbGF5VGV4dD4gPSB7XG4gIFwiY28uc2FrdXNoaS5hZGQtcHJvamVjdC1ieS1wYXRoXCI6IHtcbiAgICBuYW1lOiBcIlx1NjMwOVx1OERFRlx1NUY4NFx1NkRGQlx1NTJBMFx1OTg3OVx1NzZFRVwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1NTcyOFx1OTg3OVx1NzZFRVx1ODNEQ1x1NTM1NVx1NEUyRFx1NkRGQlx1NTJBMFx1NEUwMFx1NEUyQVx1NTM5Rlx1NzUxRlx1OThDRVx1NjgzQ1x1NTE2NVx1NTNFM1x1RkYwQ1x1NTNFRlx1OTAxQVx1OEZDN1x1OEY5M1x1NTE2NVx1OERFRlx1NUY4NFx1NkRGQlx1NTJBMFx1NURFNVx1NEY1Q1x1NTMzQVx1MzAwMlwiLFxuICB9LFxuICBcImNvLmJlbm5ldHQudWktaW1wcm92ZW1lbnRzXCI6IHtcbiAgICBuYW1lOiBcIkJlbm5ldHQgXHU3Njg0XHU3NTRDXHU5NzYyXHU2NTM5XHU4RkRCXCIsXG4gICAgZGVzY3JpcHRpb246IFwiQ29kZXggXHU2NjEzXHU3NTI4XHU2MDI3XHU3NTRDXHU5NzYyXHU0RjE4XHU1MzE2XHVGRjFBXHU5NjkwXHU4NUNGXHU1MzQ3XHU3RUE3XHU2M0QwXHU3OTNBXHVGRjBDXHU1RTc2XHU2NjNFXHU3OTNBXHU3NTI4XHU5MUNGXHU1NDhDXHU2RDg4XHU2MDZGXHU2MzA3XHU2ODA3XHUzMDAyXCIsXG4gIH0sXG4gIFwiY28uYmVubmV0dC5iZXR0ZXItYnJvd3NlclwiOiB7XG4gICAgbmFtZTogXCJcdTU4OUVcdTVGM0FcdTZENEZcdTg5QzhcdTU2NjhcIixcbiAgICBkZXNjcmlwdGlvbjogXCJcdTU4OUVcdTVGM0EgQ29kZXggXHU2RDRGXHU4OUM4XHU1NjY4XHU0RkE3XHU4RkI5XHU2ODBGXHVGRjBDXHU2NTJGXHU2MzAxXHU2NkY0XHU1OTFBXHU2ODA3XHU3QjdFXHUzMDAxXHU1MTg1XHU4MDU0XHU1RjAwXHU1M0QxXHU4MDA1XHU1REU1XHU1MTc3XHU1NDhDXHU2RDRGXHU4OUM4XHU1NjY4XHU1QkZDXHU4MjJBXHU1RkVCXHU2Mzc3XHU5NTJFXHUzMDAyXCIsXG4gIH0sXG4gIFwiY28uYmVubmV0dC5iZXR0ZXItdGVybWluYWxcIjoge1xuICAgIG5hbWU6IFwiXHU1ODlFXHU1RjNBXHU3RUM4XHU3QUVGXCIsXG4gICAgZGVzY3JpcHRpb246IFwiXHU1MzQ3XHU3RUE3IENvZGV4IFx1N0VDOFx1N0FFRlx1RkYwQ1x1NTJBMFx1NTE2NVx1NTIwNlx1NUM0Rlx1MzAwMVx1NTM5Rlx1NzUxRlx1NUYzOVx1NTFGQVx1N0E5N1x1NTNFM1x1MzAwMVx1NjgwN1x1N0I3RVx1NjNBN1x1NTIzNlx1MzAwMVx1NUZFQlx1NjM3N1x1OTUyRVx1NTQ4Q1x1NTE4NVx1NUI1OFx1NzZEMVx1NjNBN1x1MzAwMlwiLFxuICB9LFxuICBcImNvLmJlbm5ldHQuY29kZXgtaG9yaXpvbnRhbC10YWJzXCI6IHtcbiAgICBuYW1lOiBcIkNvZGV4IFx1NkEyQVx1NTQxMVx1NjgwN1x1N0I3RVx1NjgwRlwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1NEUzQVx1NURGMlx1NjI1M1x1NUYwMFx1NzY4NCBDb2RleCBcdTVCRjlcdThCRERcdTZERkJcdTUyQTBcdTdDN0JcdTRGM0MgQ2hyb21lIFx1NzY4NFx1OTg3Nlx1OTBFOFx1NjgwN1x1N0I3RVx1NjgwRlx1MzAwMlwiLFxuICB9LFxuICBcImNvLmJlbm5ldHQuY29kZXgtdGFiLXN3aXRjaGVyXCI6IHtcbiAgICBuYW1lOiBcIkNvZGV4IFx1NjgwN1x1N0I3RVx1NTIwN1x1NjM2Mlx1NTY2OFwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1NEY3Rlx1NzUyOCBDdHJsLVRhYiBcdTZENkVcdTVDNDJcdTU0OENcdTVDMEZcdTk4ODRcdTg5QzhcdTU3MjhcdTY3MDBcdThGRDFcdTc2ODQgQ29kZXggXHU1QkY5XHU4QkREXHU0RTRCXHU5NUY0XHU1MjA3XHU2MzYyXHUzMDAyXCIsXG4gIH0sXG4gIFwiY29tLmp1bWFuZy5jb21wbGV0aW9uLXNvdW5kXCI6IHtcbiAgICBuYW1lOiBcIlx1NUI4Q1x1NjIxMFx1NjNEMFx1NzkzQVx1OTdGM1wiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1NjRBRFx1NjUzRSBDb2RleCBcdTZEM0JcdTUyQThcdTYzRDBcdTc5M0FcdTk3RjNcdUZGMENcdTVFNzZcdTUyQTBcdTVCQkRcdTgwNEFcdTU5MjlcdTUyMTdcdTMwMDJcIixcbiAgfSxcbiAgXCJjby5BcmNvbnRlMTEyLmZvbGxvd3VwXCI6IHtcbiAgICBuYW1lOiBcIlx1NEUwQVx1NEUwQlx1NjU4N1x1OEZGRFx1OTVFRVwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1NTcyOFx1NTJBOVx1NjI0Qlx1NkQ4OFx1NjA2Rlx1NEUwQlx1NjVCOVx1NkRGQlx1NTJBMFx1NTNFRlx1NzBCOVx1NTFGQlx1NzY4NFx1NEUwQVx1NEUwQlx1NjU4N1x1NEUwQlx1NEUwMFx1NkI2NVx1NjNEMFx1NzkzQVx1RkYwQ1x1NUU3Nlx1NTNFRlx1NTQwQ1x1NkI2NVx1NjI1OFx1N0JBMVx1NzY4NCBBR0VOVFMubWQgXHU2MzA3XHU0RUU0XHUzMDAyXCIsXG4gIH0sXG4gIFwiY28uYmVubmV0dC5jdXN0b20ta2V5Ym9hcmQtc2hvcnRjdXRzXCI6IHtcbiAgICBuYW1lOiBcIlx1ODFFQVx1NUI5QVx1NEU0OVx1OTUyRVx1NzZEOFx1NUZFQlx1NjM3N1x1OTUyRVwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1NTNEMVx1NzNCMFx1MzAwMVx1OTFDRFx1NjYyMFx1NUMwNFx1NjIxNlx1Nzk4MVx1NzUyOCBDb2RleCBcdTc2ODRcdTk1MkVcdTc2RDhcdTVGRUJcdTYzNzdcdTk1MkVcdTMwMDJcIixcbiAgfSxcbiAgXCJjby5xb2xpLmRpc2FibGUtZXNjYXBlXCI6IHtcbiAgICBuYW1lOiBcIlx1Nzk4MVx1NzUyOCBFc2NhcGVcIixcbiAgICBkZXNjcmlwdGlvbjogXCJcdTYyRTZcdTYyMkEgQ29kZXggXHU2RTMyXHU2N0QzXHU3QTk3XHU1M0UzXHU0RTJEXHU3Njg0IEVzY2FwZSBcdTk1MkVcdUZGMENcdTkwN0ZcdTUxNERcdTRFMkRcdTY1ODdcdTdCNDlcdThGOTNcdTUxNjVcdTZDRDVcdTdFQzRcdTU0MDhcdThGOTNcdTUxNjVcdTYyNTNcdTY1QURcdTZCNjNcdTU3MjhcdThGRDBcdTg4NENcdTc2ODRcdTU2REVcdTU5MERcdTMwMDJcIixcbiAgfSxcbiAgXCJtZS5lcmtpbi5jb2RleC1wbHVzcGx1cy1hY2NvdW50LXN3aXRjaGVyXCI6IHtcbiAgICBuYW1lOiBcIlx1OEQyNlx1NTNGN1x1NUZFQlx1OTAxRlx1NTIwN1x1NjM2MlwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1NEVDRVx1OEQyNlx1NTNGN1x1ODNEQ1x1NTM1NVx1NEZERFx1NUI1OFx1MzAwMVx1NTIwN1x1NjM2Mlx1NTQ4Q1x1N0JBMVx1NzQwNlx1NjcyQ1x1NTczMCBDb2RleCBcdTc2N0JcdTVGNTVcdTRGMUFcdThCRERcdUZGMENcdTVFNzZcdTU3MjhcdThCQkVcdTdGNkVcdTRFMkRcdTdGMTNcdTVCNThcdTc1MjhcdTkxQ0ZcdTcyQjZcdTYwMDFcdTMwMDJcIixcbiAgfSxcbiAgXCJjby5iZW5uZXR0LmZpbGUtZWRpdG9yXCI6IHtcbiAgICBuYW1lOiBcIlx1NjU4N1x1NEVGNlx1N0YxNlx1OEY5MVx1NTY2OFwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1OEJBOSBDb2RleCBcdTUzRjNcdTRGQTdcdTk3NjJcdTY3N0ZcdTc2ODRcdTY1ODdcdTRFRjZcdTY4MDdcdTdCN0VcdTUzRUZcdTc2RjRcdTYzQTVcdTdGMTZcdThGOTFcdUZGMENcdTVFNzZcdTY1MkZcdTYzMDFcdTk2MzJcdTYyOTZcdTgxRUFcdTUyQThcdTRGRERcdTVCNThcdTMwMDJcIixcbiAgfSxcbiAgXCJjby5iZW5uZXR0LmdvYWxcIjoge1xuICAgIG5hbWU6IFwiXHU3NkVFXHU2ODA3XCIsXG4gICAgZGVzY3JpcHRpb246IFwiXHU2MjhBIENvZGV4IFx1NzY4NCAvZ29hbCBcdTU0N0RcdTRFRTRcdTU0OENcdTZEM0JcdTUyQThcdTc2RUVcdTY4MDdcdTc1NENcdTk3NjJcdTUyQTBcdTUxNjVcdTY4NENcdTk3NjIgQXBwXHUzMDAyXCIsXG4gIH0sXG4gIFwiY28uYmVubmV0dC5pb3Mtc2ltdWxhdG9yXCI6IHtcbiAgICBuYW1lOiBcImlPUyBcdTZBMjFcdTYyREZcdTU2NjhcIixcbiAgICBkZXNjcmlwdGlvbjogXCJcdTU3MjggQ29kZXggXHU1M0YzXHU0RkE3XHU5NzYyXHU2NzdGXHU2REZCXHU1MkEwIGlPUyBcdTZBMjFcdTYyREZcdTU2NjhcdTY4MDdcdTdCN0VcdUZGMENcdTVFNzZcdTY1MkZcdTYzMDFcdTk1NUNcdTUwQ0ZcdTU0OENcdTcwQjlcdTUxRkIvXHU2RUQxXHU1MkE4XHU4RjZDXHU1M0QxXHUzMDAyXCIsXG4gIH0sXG4gIFwiY28uYmVubmV0dC5jb21wdXRlci11c2VcIjoge1xuICAgIG5hbWU6IFwiT3BlbkFJIFx1NzUzNVx1ODExMVx1NjRDRFx1NjNBN1wiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1NTcyOCBjb2RleFx1NkM0OVx1NTMxNlx1NTg5RVx1NUYzQXBsdXNcdTcyNDggXHU0RTJEXHU1NDJGXHU3NTI4IE9wZW5BSSBDb21wdXRlciBVc2VcdUZGMENcdTUzMDVcdTU0MkJcdTUzOUZcdTc1MUZcdTk4Q0VcdTY4M0NcdThCQkVcdTdGNkVcdTMwMDFcdTU0MkZcdTUyQThcdTgxRUFcdTRGRUVcdTU5MERcdTU0OENcdTUyOUZcdTgwRkRcdTZDRThcdTUxOENcdTMwMDJcIixcbiAgfSxcbiAgXCJtZS54dGF3ZmlrLmNvZGV4LXBsdXNwbHVzLXBhY2thZ2UtcnVuXCI6IHtcbiAgICBuYW1lOiBcIlBhY2thZ2UgXHU4MTFBXHU2NzJDXHU4RkQwXHU4ODRDXCIsXG4gICAgZGVzY3JpcHRpb246IFwiXHU1NzI4IENvZGV4IFx1NTM5Rlx1NzUxRlx1NjU4N1x1NEVGNlx1NjdFNVx1NzcwQlx1NTY2OFx1NEUyRFx1NjYzRVx1NzkzQSBwYWNrYWdlLmpzb24gXHU4MTFBXHU2NzJDXHVGRjBDXHU1RTc2XHU2MjhBXHU5MDA5XHU0RTJEXHU3Njg0XHU1NDdEXHU0RUU0XHU1M0QxXHU5MDAxXHU1MjMwXHU3RUM4XHU3QUVGXHUzMDAyXCIsXG4gIH0sXG4gIFwiY28uYmVubmV0dC5wcm9qZWN0LWhvbWVcIjoge1xuICAgIG5hbWU6IFwiXHU5ODc5XHU3NkVFXHU0RTNCXHU5ODc1XCIsXG4gICAgZGVzY3JpcHRpb246IFwiXHU2REZCXHU1MkEwXHU0RTAwXHU0RTJBIFByb2plY3QgSG9tZSBcdTc3MEJcdTY3N0ZcdUZGMENcdTc1MjggTGluZWFyIFx1OThDRVx1NjgzQ1x1N0JBMVx1NzQwNlx1NkJDRlx1NEUyQVx1OTg3OVx1NzZFRVx1NzY4NFx1OTVFRVx1OTg5OFx1MzAwMlwiLFxuICB9LFxuICBcImNvbS5pbXNha3VzaGkucXVpY2stYWN0aW9uc1wiOiB7XG4gICAgbmFtZTogXCJcdTVGRUJcdTYzNzdcdTY0Q0RcdTRGNUNcIixcbiAgICBkZXNjcmlwdGlvbjogXCJcdTRFM0EgQ29kZXggXHU3Njg0IEdpdCBcdTk3NjJcdTY3N0ZcdTZERkJcdTUyQTBcdTgxRUFcdTVCOUFcdTRFNDlcdTVERTVcdTRGNUNcdTZENDFcdTY0Q0RcdTRGNUNcdTMwMDJcIixcbiAgfSxcbiAgXCJjby5zaGl2YW05NC5yZWFzb25pbmctZml4ZXNcIjoge1xuICAgIG5hbWU6IFwiXHU2M0E4XHU3NDA2XHU0RTBFXHU2M0EyXHU3RDIyXHU2NjNFXHU3OTNBXHU0RkVFXHU1OTBEXCIsXG4gICAgZGVzY3JpcHRpb246IFwiXHU0RkREXHU2MzAxXHU2M0EyXHU3RDIyXHU5NzYyXHU2NzdGXHU2MjUzXHU1RjAwXHUzMDAxXHU2M0E4XHU3NDA2XHU4RkM3XHU3QTBCXHU1M0VGXHU4OUMxXHVGRjBDXHU1RTc2XHU1QzU1XHU1RjAwXHU1REU1XHU1MTc3XHU4RjkzXHU1MUZBXHVGRjBDXHU1MzA1XHU1NDJCXHU2RTkwXHU3ODAxXHU4ODY1XHU0RTAxXHU1NDhDXHU4RkQwXHU4ODRDXHU2NUY2XHU1ODlFXHU1RjNBXHUzMDAyXCIsXG4gIH0sXG4gIFwiY28uYmVubmV0dC53aW5kb3dzLWNvbXB1dGVyLXVzZVwiOiB7XG4gICAgbmFtZTogXCJXaW5kb3dzIFx1NzUzNVx1ODExMVx1NjRDRFx1NjNBN1wiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1NEUzQSBjb2RleFx1NkM0OVx1NTMxNlx1NTg5RVx1NUYzQXBsdXNcdTcyNDggXHU2M0QwXHU0RjlCIFdpbmRvd3MgQ29tcHV0ZXIgVXNlIFx1NzY4NCBNQ1AgXHU3NTRDXHU5NzYyXHUzMDAyXCIsXG4gIH0sXG59O1xuXHJcbi8vIE1pcnJvcnMgdGhlIHJ1bnRpbWUncyBtYWluLXNpZGUgTGlzdGVkVHdlYWsgc2hhcGUgKGtlcHQgaW4gc3luYyBtYW51YWxseSkuXHJcbmludGVyZmFjZSBMaXN0ZWRUd2VhayB7XHJcbiAgbWFuaWZlc3Q6IFR3ZWFrTWFuaWZlc3Q7XHJcbiAgZW50cnk6IHN0cmluZztcclxuICBkaXI6IHN0cmluZztcclxuICBlbnRyeUV4aXN0czogYm9vbGVhbjtcclxuICBlbmFibGVkOiBib29sZWFuO1xyXG4gIHVwZGF0ZTogVHdlYWtVcGRhdGVDaGVjayB8IG51bGw7XHJcbn1cclxuXHJcbmludGVyZmFjZSBUd2Vha1VwZGF0ZUNoZWNrIHtcclxuICBjaGVja2VkQXQ6IHN0cmluZztcclxuICByZXBvOiBzdHJpbmc7XHJcbiAgY3VycmVudFZlcnNpb246IHN0cmluZztcclxuICBsYXRlc3RWZXJzaW9uOiBzdHJpbmcgfCBudWxsO1xyXG4gIGxhdGVzdFRhZzogc3RyaW5nIHwgbnVsbDtcclxuICByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsO1xyXG4gIHVwZGF0ZUF2YWlsYWJsZTogYm9vbGVhbjtcclxuICBlcnJvcj86IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIENvZGV4UGx1c1BsdXNDb25maWcge1xuICB2ZXJzaW9uOiBzdHJpbmc7XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIGF1dG9VcGRhdGU6IGJvb2xlYW47XG4gIHVwZGF0ZUNoYW5uZWw6IFNlbGZVcGRhdGVDaGFubmVsO1xyXG4gIHVwZGF0ZVJlcG86IHN0cmluZztcclxuICB1cGRhdGVSZWY6IHN0cmluZztcclxuICB1cGRhdGVDaGVjazogQ29kZXhQbHVzUGx1c1VwZGF0ZUNoZWNrIHwgbnVsbDtcclxuICBzZWxmVXBkYXRlOiBTZWxmVXBkYXRlU3RhdGUgfCBudWxsO1xyXG4gIGluc3RhbGxhdGlvblNvdXJjZTogSW5zdGFsbGF0aW9uU291cmNlO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgQ29kZXhQbHVzUGx1c1VwZGF0ZUNoZWNrIHtcclxuICBjaGVja2VkQXQ6IHN0cmluZztcclxuICBjdXJyZW50VmVyc2lvbjogc3RyaW5nO1xyXG4gIGxhdGVzdFZlcnNpb246IHN0cmluZyB8IG51bGw7XHJcbiAgcmVsZWFzZVVybDogc3RyaW5nIHwgbnVsbDtcclxuICByZWxlYXNlTm90ZXM6IHN0cmluZyB8IG51bGw7XHJcbiAgdXBkYXRlQXZhaWxhYmxlOiBib29sZWFuO1xyXG4gIGVycm9yPzogc3RyaW5nO1xyXG59XHJcblxyXG50eXBlIFNlbGZVcGRhdGVDaGFubmVsID0gXCJzdGFibGVcIiB8IFwicHJlcmVsZWFzZVwiIHwgXCJjdXN0b21cIjtcclxudHlwZSBTZWxmVXBkYXRlU3RhdHVzID0gXCJjaGVja2luZ1wiIHwgXCJ1cC10by1kYXRlXCIgfCBcInVwZGF0ZWRcIiB8IFwiZmFpbGVkXCIgfCBcImRpc2FibGVkXCI7XHJcblxyXG5pbnRlcmZhY2UgU2VsZlVwZGF0ZVN0YXRlIHtcclxuICBjaGVja2VkQXQ6IHN0cmluZztcclxuICBjb21wbGV0ZWRBdD86IHN0cmluZztcclxuICBzdGF0dXM6IFNlbGZVcGRhdGVTdGF0dXM7XHJcbiAgY3VycmVudFZlcnNpb246IHN0cmluZztcclxuICBsYXRlc3RWZXJzaW9uOiBzdHJpbmcgfCBudWxsO1xyXG4gIHRhcmdldFJlZjogc3RyaW5nIHwgbnVsbDtcclxuICByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsO1xyXG4gIHJlcG86IHN0cmluZztcclxuICBjaGFubmVsOiBTZWxmVXBkYXRlQ2hhbm5lbDtcclxuICBzb3VyY2VSb290OiBzdHJpbmc7XHJcbiAgaW5zdGFsbGF0aW9uU291cmNlPzogSW5zdGFsbGF0aW9uU291cmNlO1xyXG4gIGVycm9yPzogc3RyaW5nO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSW5zdGFsbGF0aW9uU291cmNlIHtcbiAga2luZDogXCJnaXRodWItc291cmNlXCIgfCBcImhvbWVicmV3XCIgfCBcImxvY2FsLWRldlwiIHwgXCJzb3VyY2UtYXJjaGl2ZVwiIHwgXCJ1bmtub3duXCI7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIGRldGFpbDogc3RyaW5nO1xufVxuXG50eXBlIEFnZW50UHJvdmlkZXJJZCA9IFwiZGVlcHNlZWtcIiB8IFwiemhpcHVcIiB8IFwicXdlblwiO1xudHlwZSBBZ2VudFByb3ZpZGVyU2VsZWN0aW9uID0gXCJjb2RleC1uYXRpdmVcIiB8IEFnZW50UHJvdmlkZXJJZDtcbnR5cGUgQWdlbnRQcm92aWRlck1vZGUgPSBcImNoYXRcIiB8IFwiYXBwXCI7XG50eXBlIEFnZW50UHJvdmlkZXJBY2Nlc3NNb2RlID0gXCJicmlkZ2VcIiB8IFwicHVyZS1hcGlcIjtcbnR5cGUgQnVpbHRpblBhZ2UgPSBcImNvbmZpZ1wiIHwgXCJhZ2VudC1wcm92aWRlcnNcIiB8IFwidHdlYWtzXCIgfCBcInN0b3JlXCI7XG5cbmludGVyZmFjZSBBZ2VudFByb3ZpZGVyTWV0YSB7XG4gIGlkOiBBZ2VudFByb3ZpZGVySWQ7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIGRvY3NVcmw6IHN0cmluZztcbiAga2V5VXJsPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgQWdlbnRQcm92aWRlckNvbmZpZ1ZpZXcge1xuICBwcm92aWRlcjogQWdlbnRQcm92aWRlcklkO1xuICBlbmFibGVkOiBib29sZWFuO1xuICBhcGlLZXk6IHN0cmluZztcbiAgYmFzZVVybDogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xuICBhcHBJZDogc3RyaW5nO1xuICBtb2RlOiBBZ2VudFByb3ZpZGVyTW9kZTtcbiAgYWNjZXNzTW9kZTogQWdlbnRQcm92aWRlckFjY2Vzc01vZGU7XG4gIHN5c3RlbVByb21wdDogc3RyaW5nO1xuICB0ZW1wZXJhdHVyZTogbnVtYmVyO1xuICBtYXhUb2tlbnM6IG51bWJlcjtcbiAgc2Vzc2lvbklkOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBBZ2VudFByb3ZpZGVyVGVzdFJlc3VsdCB7XG4gIHByb3ZpZGVyOiBBZ2VudFByb3ZpZGVySWQ7XG4gIHRleHQ6IHN0cmluZztcbiAgbW9kZWw/OiBzdHJpbmc7XG4gIHNlc3Npb25JZD86IHN0cmluZztcbiAgdXNhZ2U/OiB1bmtub3duO1xuICByYXc/OiB1bmtub3duO1xufVxuXG5pbnRlcmZhY2UgQWdlbnRQcm92aWRlck1vZGVsVmlldyB7XG4gIGlkOiBzdHJpbmc7XG4gIGxhYmVsPzogc3RyaW5nO1xuICBvd25lZEJ5Pzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgQWdlbnRQcm92aWRlck1vZGVsc1ZpZXcge1xuICBwcm92aWRlcjogQWdlbnRQcm92aWRlcklkO1xuICBtb2RlbHM6IEFnZW50UHJvdmlkZXJNb2RlbFZpZXdbXTtcbiAgc291cmNlVXJsPzogc3RyaW5nO1xuICBkaXNhYmxlZFJlYXNvbj86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEFnZW50UHJvdmlkZXJBY3RpdmF0aW9uVmlldyB7XG4gIGFjdGl2ZVByb3ZpZGVyOiBBZ2VudFByb3ZpZGVyU2VsZWN0aW9uO1xuICBicmlkZ2VVcmw6IHN0cmluZyB8IG51bGw7XG4gIGNvbmZpZ1BhdGg6IHN0cmluZztcbiAgcmVzdGFydFJlcXVpcmVkOiBib29sZWFuO1xuICBtZXNzYWdlOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBXYXRjaGVySGVhbHRoIHtcbiAgY2hlY2tlZEF0OiBzdHJpbmc7XG4gIHN0YXR1czogXCJva1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCI7XG4gIHRpdGxlOiBzdHJpbmc7XHJcbiAgc3VtbWFyeTogc3RyaW5nO1xyXG4gIHdhdGNoZXI6IHN0cmluZztcclxuICBjaGVja3M6IFdhdGNoZXJIZWFsdGhDaGVja1tdO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgV2F0Y2hlckhlYWx0aENoZWNrIHtcclxuICBuYW1lOiBzdHJpbmc7XHJcbiAgc3RhdHVzOiBcIm9rXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIjtcclxuICBkZXRhaWw6IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIFR3ZWFrU3RvcmVSZWdpc3RyeVZpZXcge1xyXG4gIHNjaGVtYVZlcnNpb246IDE7XHJcbiAgZ2VuZXJhdGVkQXQ/OiBzdHJpbmc7XHJcbiAgc291cmNlVXJsOiBzdHJpbmc7XHJcbiAgZmV0Y2hlZEF0OiBzdHJpbmc7XHJcbiAgZW50cmllczogVHdlYWtTdG9yZUVudHJ5Vmlld1tdO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgVHdlYWtTdG9yZUVudHJ5VmlldyBleHRlbmRzIFR3ZWFrU3RvcmVFbnRyeSB7XHJcbiAgaW5zdGFsbGVkOiB7XHJcbiAgICB2ZXJzaW9uOiBzdHJpbmc7XHJcbiAgICBlbmFibGVkOiBib29sZWFuO1xyXG4gIH0gfCBudWxsO1xyXG4gIHBsYXRmb3JtPzoge1xyXG4gICAgY3VycmVudDogc3RyaW5nO1xyXG4gICAgc3VwcG9ydGVkOiBzdHJpbmdbXSB8IG51bGw7XHJcbiAgICBjb21wYXRpYmxlOiBib29sZWFuO1xyXG4gICAgcmVhc29uOiBzdHJpbmcgfCBudWxsO1xyXG4gIH07XHJcbiAgcnVudGltZT86IHtcclxuICAgIGN1cnJlbnQ6IHN0cmluZztcclxuICAgIHJlcXVpcmVkOiBzdHJpbmcgfCBudWxsO1xyXG4gICAgY29tcGF0aWJsZTogYm9vbGVhbjtcclxuICAgIHJlYXNvbjogc3RyaW5nIHwgbnVsbDtcclxuICB9O1xyXG59XHJcblxyXG4vKipcclxuICogQSB0d2Vhay1yZWdpc3RlcmVkIHBhZ2UuIFdlIGNhcnJ5IHRoZSBvd25pbmcgdHdlYWsncyBtYW5pZmVzdCBzbyB3ZSBjYW5cclxuICogcmVzb2x2ZSByZWxhdGl2ZSBpY29uVXJscyBhbmQgc2hvdyBhdXRob3JzaGlwIGluIHRoZSBwYWdlIGhlYWRlci5cclxuICovXHJcbmludGVyZmFjZSBSZWdpc3RlcmVkUGFnZSB7XHJcbiAgLyoqIEZ1bGx5LXF1YWxpZmllZCBpZDogYDx0d2Vha0lkPjo8cGFnZUlkPmAuICovXHJcbiAgaWQ6IHN0cmluZztcclxuICB0d2Vha0lkOiBzdHJpbmc7XHJcbiAgbWFuaWZlc3Q6IFR3ZWFrTWFuaWZlc3Q7XHJcbiAgcGFnZTogU2V0dGluZ3NQYWdlO1xyXG4gIC8qKiBQZXItcGFnZSBET00gdGVhcmRvd24gcmV0dXJuZWQgYnkgYHBhZ2UucmVuZGVyYCwgaWYgYW55LiAqL1xyXG4gIHRlYXJkb3duPzogKCgpID0+IHZvaWQpIHwgbnVsbDtcclxuICAvKiogVGhlIGluamVjdGVkIHNpZGViYXIgYnV0dG9uIChzbyB3ZSBjYW4gdXBkYXRlIGl0cyBhY3RpdmUgc3RhdGUpLiAqL1xyXG4gIG5hdkJ1dHRvbj86IEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcclxufVxyXG5cclxuLyoqIFdoYXQgcGFnZSBpcyBjdXJyZW50bHkgc2VsZWN0ZWQgaW4gb3VyIGluamVjdGVkIG5hdi4gKi9cclxudHlwZSBBY3RpdmVQYWdlID1cbiAgfCB7IGtpbmQ6IFwiY29uZmlnXCIgfVxuICB8IHsga2luZDogXCJzdG9yZVwiIH1cbiAgfCB7IGtpbmQ6IFwidHdlYWtzXCIgfVxuICB8IHsga2luZDogXCJhZ2VudC1wcm92aWRlcnNcIiB9XG4gIHwgeyBraW5kOiBcInJlZ2lzdGVyZWRcIjsgaWQ6IHN0cmluZyB9O1xuXHJcbmludGVyZmFjZSBJbmplY3RvclN0YXRlIHtcclxuICBzZWN0aW9uczogTWFwPHN0cmluZywgU2V0dGluZ3NTZWN0aW9uPjtcclxuICBwYWdlczogTWFwPHN0cmluZywgUmVnaXN0ZXJlZFBhZ2U+O1xyXG4gIGxpc3RlZFR3ZWFrczogTGlzdGVkVHdlYWtbXTtcclxuICAvKiogT3V0ZXIgd3JhcHBlciB0aGF0IGhvbGRzIENvZGV4J3MgaXRlbXMgZ3JvdXAgKyBvdXIgaW5qZWN0ZWQgZ3JvdXBzLiAqL1xyXG4gIG91dGVyV3JhcHBlcjogSFRNTEVsZW1lbnQgfCBudWxsO1xyXG4gIC8qKiBPdXIgXCJHZW5lcmFsXCIgbGFiZWwgZm9yIENvZGV4J3MgbmF0aXZlIHNldHRpbmdzIGdyb3VwLiAqL1xyXG4gIG5hdGl2ZU5hdkhlYWRlcjogSFRNTEVsZW1lbnQgfCBudWxsO1xuICAvKiogT3VyIFwiY29kZXhcdTZDNDlcdTUzMTZcdTU4OUVcdTVGM0FwbHVzXHU3MjQ4XCIgbmF2IGdyb3VwIChDb25maWcvVHdlYWtzKS4gKi9cbiAgbmF2R3JvdXA6IEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgbmF2QnV0dG9uczogUmVjb3JkPEJ1aWx0aW5QYWdlLCBIVE1MQnV0dG9uRWxlbWVudD4gfCBudWxsO1xuICAvKiogU2lkZWJhciB1cGRhdGUgcGlsbCBzaG93biBvbmx5IHdoZW4gR2l0SHViIGhhcyBhIG5ld2VyIGNvZGV4XHU2QzQ5XHU1MzE2XHU1ODlFXHU1RjNBcGx1c1x1NzI0OCByZWxlYXNlLiAqL1xyXG4gIGNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b246IEhUTUxCdXR0b25FbGVtZW50IHwgbnVsbDtcclxuICAvKiogT3VyIFwiVHdlYWtzXCIgbmF2IGdyb3VwIChwZXItdHdlYWsgcGFnZXMpLiBDcmVhdGVkIGxhemlseS4gKi9cclxuICBwYWdlc0dyb3VwOiBIVE1MRWxlbWVudCB8IG51bGw7XHJcbiAgcGFnZXNHcm91cEtleTogc3RyaW5nIHwgbnVsbDtcclxuICBwYW5lbEhvc3Q6IEhUTUxFbGVtZW50IHwgbnVsbDtcclxuICBvYnNlcnZlcjogTXV0YXRpb25PYnNlcnZlciB8IG51bGw7XHJcbiAgZmluZ2VycHJpbnQ6IHN0cmluZyB8IG51bGw7XHJcbiAgc2lkZWJhckR1bXBlZDogYm9vbGVhbjtcclxuICBhY3RpdmVQYWdlOiBBY3RpdmVQYWdlIHwgbnVsbDtcclxuICBzaWRlYmFyUm9vdDogSFRNTEVsZW1lbnQgfCBudWxsO1xyXG4gIHNpZGViYXJSZXN0b3JlSGFuZGxlcjogKChlOiBFdmVudCkgPT4gdm9pZCkgfCBudWxsO1xyXG4gIHNldHRpbmdzU3VyZmFjZVZpc2libGU6IGJvb2xlYW47XHJcbiAgc2V0dGluZ3NTdXJmYWNlSGlkZVRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGw7XHJcbiAgdHdlYWtTdG9yZTogVHdlYWtTdG9yZVJlZ2lzdHJ5VmlldyB8IG51bGw7XG4gIHR3ZWFrU3RvcmVQcm9taXNlOiBQcm9taXNlPFR3ZWFrU3RvcmVSZWdpc3RyeVZpZXc+IHwgbnVsbDtcbiAgdHdlYWtTdG9yZUVycm9yOiB1bmtub3duO1xuICBtb2RlbFNvdXJjZUxhYmVsOiBzdHJpbmcgfCBudWxsO1xuICBtb2RlbFNvdXJjZVRpdGxlOiBzdHJpbmcgfCBudWxsO1xuICBtb2RlbFNvdXJjZUxvYWRpbmc6IGJvb2xlYW47XG59XG5cclxuY29uc3Qgc3RhdGU6IEluamVjdG9yU3RhdGUgPSB7XG4gIHNlY3Rpb25zOiBuZXcgTWFwKCksXG4gIHBhZ2VzOiBuZXcgTWFwKCksXG4gIGxpc3RlZFR3ZWFrczogW10sXG4gIG91dGVyV3JhcHBlcjogbnVsbCxcclxuICBuYXRpdmVOYXZIZWFkZXI6IG51bGwsXHJcbiAgbmF2R3JvdXA6IG51bGwsXHJcbiAgbmF2QnV0dG9uczogbnVsbCxcclxuICBjb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uOiBudWxsLFxyXG4gIHBhZ2VzR3JvdXA6IG51bGwsXHJcbiAgcGFnZXNHcm91cEtleTogbnVsbCxcclxuICBwYW5lbEhvc3Q6IG51bGwsXHJcbiAgb2JzZXJ2ZXI6IG51bGwsXHJcbiAgZmluZ2VycHJpbnQ6IG51bGwsXHJcbiAgc2lkZWJhckR1bXBlZDogZmFsc2UsXHJcbiAgYWN0aXZlUGFnZTogbnVsbCxcclxuICBzaWRlYmFyUm9vdDogbnVsbCxcclxuICBzaWRlYmFyUmVzdG9yZUhhbmRsZXI6IG51bGwsXHJcbiAgc2V0dGluZ3NTdXJmYWNlVmlzaWJsZTogZmFsc2UsXHJcbiAgc2V0dGluZ3NTdXJmYWNlSGlkZVRpbWVyOiBudWxsLFxyXG4gIHR3ZWFrU3RvcmU6IG51bGwsXG4gIHR3ZWFrU3RvcmVQcm9taXNlOiBudWxsLFxuICB0d2Vha1N0b3JlRXJyb3I6IG51bGwsXG4gIG1vZGVsU291cmNlTGFiZWw6IG51bGwsXG4gIG1vZGVsU291cmNlVGl0bGU6IG51bGwsXG4gIG1vZGVsU291cmNlTG9hZGluZzogZmFsc2UsXG59O1xuXG5jb25zdCBBR0VOVF9QUk9WSURFUlM6IEFnZW50UHJvdmlkZXJNZXRhW10gPSBbXG4gIHtcbiAgICBpZDogXCJkZWVwc2Vla1wiLFxuICAgIGxhYmVsOiBcIkRlZXBTZWVrXCIsXG4gICAgdGl0bGU6IFwiRGVlcFNlZWtcIixcbiAgICBkZXNjcmlwdGlvbjogXCJcdTkxNERcdTdGNkUgRGVlcFNlZWsgQ2hhdCBDb21wbGV0aW9ucyBcdTYzQTVcdTUxNjVcdUZGMENcdTVFNzZcdTUzRDFcdTkwMDFcdTZENEJcdThCRDVcdThCRjdcdTZDNDJcdTMwMDJcIixcbiAgICBkb2NzVXJsOiBcImh0dHBzOi8vYXBpLWRvY3MuZGVlcHNlZWsuY29tL2FwaS9jcmVhdGUtY2hhdC1jb21wbGV0aW9uXCIsXG4gIH0sXG4gIHtcbiAgICBpZDogXCJxd2VuXCIsXG4gICAgbGFiZWw6IFwiXHU5NjNGXHU5MUNDXHU1MzQzXHU5NUVFXCIsXG4gICAgdGl0bGU6IFwiXHU5NjNGXHU5MUNDXHU1MzQzXHU5NUVFXCIsXG4gICAgZGVzY3JpcHRpb246IFwiXHU5MTREXHU3RjZFXHU5NjNGXHU5MUNDXHU0RTkxXHU3NjdFXHU3MEJDXHU1MzQzXHU5NUVFXHU2QTIxXHU1NzhCXHU2M0E1XHU1MTY1XHVGRjBDXHU5RUQ4XHU4QkE0XHU0RjdGXHU3NTI4IE9wZW5BSSBcdTUxN0NcdTVCQjlcdTZBMjFcdTVGMEZcdTYzQTVcdTdCQTFcdTRFM0JcdTgwNEFcdTU5MjlcdTMwMDJcIixcbiAgICBkb2NzVXJsOiBcImh0dHBzOi8vaGVscC5hbGl5dW4uY29tL3poL21vZGVsLXN0dWRpby9jb21wYXRpYmlsaXR5LW9mLW9wZW5haS13aXRoLWRhc2hzY29wZVwiLFxuICB9LFxuICB7XG4gICAgaWQ6IFwiemhpcHVcIixcbiAgICBsYWJlbDogXCJcdTY2N0FcdThDMzEgR0xNXCIsXG4gICAgdGl0bGU6IFwiXHU2NjdBXHU4QzMxIEdMTVwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlx1OTE0RFx1N0Y2RVx1NjY3QVx1OEMzMVx1NUYwMFx1NjUzRVx1NUU3M1x1NTNGMCBHTE0gXHU3Njg0IE9wZW5BSSBcdTUxN0NcdTVCQjlcdTYzQTVcdTUzRTNcdUZGMENcdTVFNzZcdTUzRDFcdTkwMDFcdTZENEJcdThCRDVcdThCRjdcdTZDNDJcdTMwMDJcIixcbiAgICBkb2NzVXJsOiBcImh0dHBzOi8vZG9jcy5iaWdtb2RlbC5jbi9jbi9ndWlkZS9kZXZlbG9wL29wZW5haS9pbnRyb2R1Y3Rpb25cIixcbiAgICBrZXlVcmw6IFwiaHR0cHM6Ly9vcGVuLmJpZ21vZGVsLmNuL3VzZXJjZW50ZXIvYXBpa2V5c1wiLFxuICB9LFxuXTtcbmNvbnN0IERFRkFVTFRfQUdFTlRfVEVTVF9QUk9NUFQgPSBcIlx1NzUyOFx1NEUwMFx1NTNFNVx1OEJERFx1NEVDQlx1N0VDRFx1NEY2MFx1NjYyRlx1OEMwMVx1RkYwQ1x1NUU3Nlx1OEJGNFx1NjYwRVx1NUY1M1x1NTI0RFx1NjNBNVx1NTE2NVx1NjYyRlx1NTQyNlx1NTNFRlx1NzUyOFx1MzAwMlwiO1xuXG5mdW5jdGlvbiBhZ2VudFByb3ZpZGVyTWV0YShpZDogQWdlbnRQcm92aWRlcklkKTogQWdlbnRQcm92aWRlck1ldGEge1xuICByZXR1cm4gQUdFTlRfUFJPVklERVJTLmZpbmQoKHByb3ZpZGVyKSA9PiBwcm92aWRlci5pZCA9PT0gaWQpID8/IEFHRU5UX1BST1ZJREVSU1swXSE7XG59XG5cbmZ1bmN0aW9uIHBsb2cobXNnOiBzdHJpbmcsIGV4dHJhPzogdW5rbm93bik6IHZvaWQge1xuICBpcGNSZW5kZXJlci5zZW5kKFxuICAgIFwiY29kZXhwcDpwcmVsb2FkLWxvZ1wiLFxyXG4gICAgXCJpbmZvXCIsXHJcbiAgICBgW3NldHRpbmdzLWluamVjdG9yXSAke21zZ30ke2V4dHJhID09PSB1bmRlZmluZWQgPyBcIlwiIDogXCIgXCIgKyBzYWZlU3RyaW5naWZ5KGV4dHJhKX1gLFxyXG4gICk7XHJcbn1cclxuZnVuY3Rpb24gc2FmZVN0cmluZ2lmeSh2OiB1bmtub3duKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gdHlwZW9mIHYgPT09IFwic3RyaW5nXCIgPyB2IDogSlNPTi5zdHJpbmdpZnkodik7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBTdHJpbmcodik7XG4gIH1cbn1cblxuZnVuY3Rpb24gbG9jYWxpemVCYWNrVG9BcHBMYWJlbCh2YWx1ZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IHRleHQgPSBjb21wYWN0U2V0dGluZ3NUZXh0KHZhbHVlKTtcbiAgcmV0dXJuIHRleHQgPT09IFwiQmFjayB0byBhcHBcIiB8fCB0ZXh0ID09PSBcIlx1OEZENFx1NTZERVx1NUU5NFx1NzUyOFwiO1xufVxuXG5mdW5jdGlvbiBzdG9yZVR3ZWFrVGV4dChlbnRyeTogVHdlYWtTdG9yZUVudHJ5Vmlldyk6IFR3ZWFrRGlzcGxheVRleHQgfCBudWxsIHtcbiAgcmV0dXJuIFNUT1JFX1RXRUFLX1pIW2VudHJ5LmlkXSA/PyBudWxsO1xufVxuXG5mdW5jdGlvbiBtYW5pZmVzdFR3ZWFrVGV4dChtYW5pZmVzdDogVHdlYWtNYW5pZmVzdCk6IFR3ZWFrRGlzcGxheVRleHQgfCBudWxsIHtcbiAgaWYgKFNUT1JFX1RXRUFLX1pIW21hbmlmZXN0LmlkXSkgcmV0dXJuIFNUT1JFX1RXRUFLX1pIW21hbmlmZXN0LmlkXTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHR3ZWFrRGlzcGxheU5hbWUobWFuaWZlc3Q6IFR3ZWFrTWFuaWZlc3QpOiBzdHJpbmcge1xuICByZXR1cm4gbWFuaWZlc3RUd2Vha1RleHQobWFuaWZlc3QpPy5uYW1lID8/IG1hbmlmZXN0Lm5hbWU7XG59XG5cbmZ1bmN0aW9uIHR3ZWFrRGlzcGxheURlc2NyaXB0aW9uKG1hbmlmZXN0OiBUd2Vha01hbmlmZXN0KTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIG1hbmlmZXN0VHdlYWtUZXh0KG1hbmlmZXN0KT8uZGVzY3JpcHRpb24gPz8gbWFuaWZlc3QuZGVzY3JpcHRpb247XG59XG5cbmZ1bmN0aW9uIHN0b3JlRW50cnlEaXNwbGF5TmFtZShlbnRyeTogVHdlYWtTdG9yZUVudHJ5Vmlldyk6IHN0cmluZyB7XG4gIHJldHVybiBzdG9yZVR3ZWFrVGV4dChlbnRyeSk/Lm5hbWUgPz8gZW50cnkubWFuaWZlc3QubmFtZTtcbn1cblxuZnVuY3Rpb24gc3RvcmVFbnRyeURpc3BsYXlEZXNjcmlwdGlvbihlbnRyeTogVHdlYWtTdG9yZUVudHJ5Vmlldyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiBzdG9yZVR3ZWFrVGV4dChlbnRyeSk/LmRlc2NyaXB0aW9uID8/IGVudHJ5Lm1hbmlmZXN0LmRlc2NyaXB0aW9uO1xufVxuXG5mdW5jdGlvbiBsb2NhbGl6ZUluc3RhbGxhdGlvblNvdXJjZShzb3VyY2U6IEluc3RhbGxhdGlvblNvdXJjZSk6IHN0cmluZyB7XG4gIGNvbnN0IGxhYmVsID1cbiAgICBzb3VyY2Uua2luZCA9PT0gXCJnaXRodWItc291cmNlXCIgPyBcIkdpdEh1YiBcdTZFOTBcdTc4MDFcdTVCODlcdTg4QzVcIiA6XG4gICAgc291cmNlLmtpbmQgPT09IFwiaG9tZWJyZXdcIiA/IFwiSG9tZWJyZXcgXHU1Qjg5XHU4OEM1XCIgOlxuICAgIHNvdXJjZS5raW5kID09PSBcImxvY2FsLWRldlwiID8gXCJcdTY3MkNcdTU3MzBcdTVGMDBcdTUzRDFcdTZFOTBcdTc4MDFcIiA6XG4gICAgc291cmNlLmtpbmQgPT09IFwic291cmNlLWFyY2hpdmVcIiA/IFwiXHU2RTkwXHU3ODAxXHU1RjUyXHU2ODYzXHU1Qjg5XHU4OEM1XCIgOlxuICAgIFwiXHU2NzJBXHU3N0U1XHU2NzY1XHU2RTkwXCI7XG4gIHJldHVybiBgJHtsYWJlbH06ICR7c291cmNlLmRldGFpbH1gO1xufVxuXG5mdW5jdGlvbiBsb2NhbGl6ZVJlbGVhc2VOb3RlcyhtYXJrZG93bjogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdGV4dCA9IG1hcmtkb3duLnRyaW0oKTtcbiAgaWYgKCF0ZXh0KSByZXR1cm4gXCJcdTY2ODJcdTY1RTBcdTUzRDFcdTVFMDNcdThCRjRcdTY2MEVcdTMwMDJcIjtcbiAgaWYgKFxuICAgICF0ZXh0LmluY2x1ZGVzKFtcIkNvZGV4XCIsIFwiKysgMS4wLjAgaXMgdGhlIGZpcnN0IHN0YWJsZSByZWxlYXNlXCJdLmpvaW4oXCJcIikpICYmXG4gICAgIXRleHQuaW5jbHVkZXMoXCJjb2RleFx1NkM0OVx1NTMxNlx1NTg5RVx1NUYzQXBsdXNcdTcyNDggMS4wLjAgaXMgdGhlIGZpcnN0IHN0YWJsZSByZWxlYXNlXCIpXG4gICkgcmV0dXJuIHRleHQ7XG4gIHJldHVybiBbXG4gICAgXCJjb2RleFx1NkM0OVx1NTMxNlx1NTg5RVx1NUYzQXBsdXNcdTcyNDggMS4wLjAgXHU2NjJGXHU2NzJDXHU1NzMwIHR3ZWFrL3J1bnRpbWUgXHU1QzQyXHU3Njg0XHU3QjJDXHU0RTAwXHU0RTJBXHU3QTMzXHU1QjlBXHU3MjQ4XHUzMDAyXCIsXG4gICAgXCJcIixcbiAgICBcIlx1NEVBRVx1NzBCOVx1RkYxQVwiLFxuICAgIFwiXCIsXG4gICAgXCItIFx1NEUzQVx1NzNCMFx1NEVFMyBDb2RleCBBcHAgXHU2NkY0XHU2NUIwXHU2M0QwXHU0RjlCXHU2NkY0XHU1RTcyXHU1MUMwXHU3Njg0IHBhdGNoIFx1NTQ4Q1x1OTFDRFx1NjVCMCBwYXRjaCBcdTZENDFcdTdBMEJcdUZGMENcdTUzMDVcdTYyRUNcdTkxQ0RcdTU0MkYvXHU5MUNEXHU2NUIwXHU2MjUzXHU1RjAwXHU1OTA0XHU3NDA2XHVGRjBDXHU0RUU1XHU1M0NBXHU1MjM3XHU2NUIwXHU2NzJBIHBhdGNoIFx1NzY4NFx1NTkwN1x1NEVGRFx1MzAwMlwiLFxuICAgIFwiLSBcdTY1QjBcdTU4OUVcdThDMDNcdThCRDVcdTU0N0RcdTRFRTRcdUZGMUFgY29kZXhwbHVzcGx1cyBkZWJ1Z2BcdUZGMENcdTUzRUZcdTY2M0VcdTc5M0EgQ29kZXggXHU1Qjg5XHU4OEM1XHU4REVGXHU1Rjg0XHUzMDAxcnVudGltZSBcdTdDN0JcdTU3OEJcdTMwMDFcdTY1NzBcdTYzNkVcdThERUZcdTVGODRcdTMwMDFcdTYyNTNcdTVGMDBcdTcyQjZcdTYwMDFcdTU0OEMgYnJpZGdlIFx1NzJCNlx1NjAwMVx1MzAwMlwiLFxuICAgIFwiLSBcdTU4OUVcdTUyQTAgT3dsIHJ1bnRpbWUgXHU2OEMwXHU2RDRCXHVGRjBDXHU1RTc2XHU0RTNBIE9TIFx1N0VBNyB0d2VhayBcdTgwRkRcdTUyOUJcdTUyQTBcdTUxNjVcdTUzOUZcdTc1MUYgbWFjT1MgYnJpZGdlIFx1NTdGQVx1Nzg0MFx1MzAwMlwiLFxuICAgIFwiLSBcdTU5MUFcdTY1ODdcdTRFRjYgdHdlYWsgXHU3RjE2XHU1MTk5XHU2NTg3XHU2ODYzXHU4OTg2XHU3NkQ2IFNES1x1MzAwMW1hbmlmZXN0XHUzMDAxXHU3NTFGXHU1NDdEXHU1NDY4XHU2NzFGXHUzMDAxVUkvRE9NXHUzMDAxbmF0aXZlIGJyaWRnZSBcdTU0OENcdTUyMDZcdTUzRDFcdTMwMDJcIixcbiAgICBcIi0gXHU3OUZCXHU5NjY0XHU5RUQ4XHU4QkE0IHR3ZWFrIFx1NUI4OVx1ODhDNVx1OTAzQlx1OEY5MVx1RkYwQzEuMC4wIFx1NEYxQVx1NEZERFx1NjMwMVx1NUU3Mlx1NTFDMFx1NTQyRlx1NTJBOFx1MzAwMlwiLFxuICAgIFwiLSBcdTRGRUVcdTU5MEQgU2V0dGluZ3MgXHU0RkE3XHU4RkI5XHU2ODBGXHU2Q0U4XHU1MTY1XHU5NUVFXHU5ODk4XHVGRjBDXHU5MDdGXHU1MTREIGNvZGV4XHU2QzQ5XHU1MzE2XHU1ODlFXHU1RjNBcGx1c1x1NzI0OCBcdTVCRkNcdTgyMkFcdTUzNjFcdTU3MjggQ29kZXggXHU0RTNCXHU0RkE3XHU4RkI5XHU2ODBGXHU5MUNDXHUzMDAyXCIsXG4gICAgXCItIFx1NTJBMFx1NUYzQSBXaW5kb3dzIFx1NTM3OFx1OEY3RFx1NkUwNVx1NzQwNlx1RkYwQ1x1ODk4Nlx1NzZENiB3YXRjaGVyIFx1NEVGQlx1NTJBMVx1MzAwMXdhdGNoZXIgXHU4MTFBXHU2NzJDXHU1NDhDXHU2QjhCXHU3NTU5IHdhdGNoZXIgXHU4RkRCXHU3QTBCXHUzMDAyXCIsXG4gICAgXCItIFx1NjVCMFx1NTg5RSBgY29kZXhwbHVzcGx1cyB1bmluc3RhbGwgLS1wdXJnZWBcdUZGMENcdTc1MjhcdTRFOEVcdTVCOENcdTY1NzRcdTkxQ0RcdTdGNkUgY29kZXhcdTZDNDlcdTUzMTZcdTU4OUVcdTVGM0FwbHVzXHU3MjQ4IFx1NTQ4Q1x1NzUyOFx1NjIzN1x1NjU3MFx1NjM2RVx1MzAwMlwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cclxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwIHB1YmxpYyBBUEkgXHUyNTAwXHUyNTAwXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3RhcnRTZXR0aW5nc0luamVjdG9yKCk6IHZvaWQge1xyXG4gIGlmIChzdGF0ZS5vYnNlcnZlcikgcmV0dXJuO1xyXG5cclxuICBjb25zdCBvYnMgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoKSA9PiB7XG4gICAgdHJ5SW5qZWN0KCk7XG4gICAgc3luY0NvbXBvc2VyTW9kZWxTb3VyY2VMYWJlbCgpO1xuICAgIG1heWJlRHVtcERvbSgpO1xuICB9KTtcbiAgb2JzLm9ic2VydmUoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCB7IGNoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZSB9KTtcclxuICBzdGF0ZS5vYnNlcnZlciA9IG9icztcclxuXHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJwb3BzdGF0ZVwiLCBvbk5hdik7XHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJoYXNoY2hhbmdlXCIsIG9uTmF2KTtcclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25Eb2N1bWVudENsaWNrLCB0cnVlKTtcclxuICBmb3IgKGNvbnN0IG0gb2YgW1wicHVzaFN0YXRlXCIsIFwicmVwbGFjZVN0YXRlXCJdIGFzIGNvbnN0KSB7XHJcbiAgICBjb25zdCBvcmlnID0gaGlzdG9yeVttXTtcclxuICAgIGhpc3RvcnlbbV0gPSBmdW5jdGlvbiAodGhpczogSGlzdG9yeSwgLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2Ygb3JpZz4pIHtcclxuICAgICAgY29uc3QgciA9IG9yaWcuYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChgY29kZXhwcC0ke219YCkpO1xyXG4gICAgICByZXR1cm4gcjtcclxuICAgIH0gYXMgdHlwZW9mIG9yaWc7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihgY29kZXhwcC0ke219YCwgb25OYXYpO1xyXG4gIH1cclxuXG4gIHRyeUluamVjdCgpO1xuICByZWZyZXNoQ29tcG9zZXJNb2RlbFNvdXJjZUxhYmVsKCk7XG4gIHN5bmNDb21wb3Nlck1vZGVsU291cmNlTGFiZWwoKTtcbiAgbWF5YmVEdW1wRG9tKCk7XG4gIGxldCB0aWNrcyA9IDA7XG4gIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgIHRpY2tzKys7XG4gICAgdHJ5SW5qZWN0KCk7XG4gICAgc3luY0NvbXBvc2VyTW9kZWxTb3VyY2VMYWJlbCgpO1xuICAgIG1heWJlRHVtcERvbSgpO1xuICAgIGlmICh0aWNrcyA+IDYwKSBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgfSwgNTAwKTtcbn1cblxyXG5mdW5jdGlvbiBvbk5hdigpOiB2b2lkIHtcbiAgc3RhdGUuZmluZ2VycHJpbnQgPSBudWxsO1xuICB0cnlJbmplY3QoKTtcbiAgc3luY0NvbXBvc2VyTW9kZWxTb3VyY2VMYWJlbCgpO1xuICBtYXliZUR1bXBEb20oKTtcbn1cblxuZnVuY3Rpb24gcmVmcmVzaENvbXBvc2VyTW9kZWxTb3VyY2VMYWJlbCgpOiB2b2lkIHtcbiAgaWYgKHN0YXRlLm1vZGVsU291cmNlTG9hZGluZykgcmV0dXJuO1xuICBzdGF0ZS5tb2RlbFNvdXJjZUxvYWRpbmcgPSB0cnVlO1xuICB2b2lkIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Z2V0LWFjdGl2ZS1hZ2VudC1wcm92aWRlclwiKVxuICAgIC50aGVuKGFzeW5jIChhY3RpdmUpID0+IHtcbiAgICAgIGNvbnN0IHByb3ZpZGVyID0gYXNBZ2VudFByb3ZpZGVyU2VsZWN0aW9uKGFjdGl2ZSk7XG4gICAgICBpZiAocHJvdmlkZXIgPT09IFwiY29kZXgtbmF0aXZlXCIpIHtcbiAgICAgICAgc3RhdGUubW9kZWxTb3VyY2VMYWJlbCA9IG51bGw7XG4gICAgICAgIHN0YXRlLm1vZGVsU291cmNlVGl0bGUgPSBudWxsO1xuICAgICAgICBzeW5jQ29tcG9zZXJNb2RlbFNvdXJjZUxhYmVsKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNvbmZpZyA9IGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Z2V0LWFnZW50LXByb3ZpZGVyLWNvbmZpZ1wiLCBwcm92aWRlcikgYXMgQWdlbnRQcm92aWRlckNvbmZpZ1ZpZXc7XG4gICAgICBjb25zdCBtZXRhID0gYWdlbnRQcm92aWRlck1ldGEocHJvdmlkZXIpO1xuICAgICAgc3RhdGUubW9kZWxTb3VyY2VMYWJlbCA9IG1ldGEubGFiZWw7XG4gICAgICBzdGF0ZS5tb2RlbFNvdXJjZVRpdGxlID0gY29uZmlnLm1vZGVsPy50cmltKClcbiAgICAgICAgPyBgJHttZXRhLmxhYmVsfSBcdTAwQjcgJHtjb25maWcubW9kZWwudHJpbSgpfWBcbiAgICAgICAgOiBtZXRhLmxhYmVsO1xuICAgICAgc3luY0NvbXBvc2VyTW9kZWxTb3VyY2VMYWJlbCgpO1xuICAgIH0pXG4gICAgLmNhdGNoKCgpID0+IHtcbiAgICAgIHN0YXRlLm1vZGVsU291cmNlTGFiZWwgPSBudWxsO1xuICAgICAgc3RhdGUubW9kZWxTb3VyY2VUaXRsZSA9IG51bGw7XG4gICAgfSlcbiAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICBzdGF0ZS5tb2RlbFNvdXJjZUxvYWRpbmcgPSBmYWxzZTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc3luY0NvbXBvc2VyTW9kZWxTb3VyY2VMYWJlbCgpOiB2b2lkIHtcbiAgY29uc3QgbGFiZWwgPSBzdGF0ZS5tb2RlbFNvdXJjZUxhYmVsO1xuICBjb25zdCB0aXRsZSA9IHN0YXRlLm1vZGVsU291cmNlVGl0bGUgPz8gbGFiZWw7XG4gIGlmICghbGFiZWwgfHwgIXRpdGxlKSByZXR1cm47XG4gIGNvbnN0IGJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+KCdidXR0b25bZGF0YS1jb2RleC1pbnRlbGxpZ2VuY2UtdHJpZ2dlcj1cInRydWVcIl0nKTtcbiAgaWYgKCFidXR0b24pIHJldHVybjtcbiAgYnV0dG9uLmRhdGFzZXQuY29kZXhwcEFnZW50UHJvdmlkZXJMYWJlbCA9IGxhYmVsO1xuICBidXR0b24udGl0bGUgPSB0aXRsZTtcbiAgYnV0dG9uLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgYFx1NUY1M1x1NTI0RFx1NkEyMVx1NTc4Qlx1RkYxQSR7dGl0bGV9YCk7XG5cbiAgY29uc3QgbGFiZWxTcGFuID0gZmluZENvbXBvc2VyTW9kZWxOYW1lU3BhbihidXR0b24pO1xuICBpZiAobGFiZWxTcGFuICYmIGxhYmVsU3Bhbi50ZXh0Q29udGVudCAhPT0gbGFiZWwpIHtcbiAgICBsYWJlbFNwYW4udGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kQ29tcG9zZXJNb2RlbE5hbWVTcGFuKGJ1dHRvbjogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICBjb25zdCBsZWFmU3BhbnMgPSBBcnJheS5mcm9tKGJ1dHRvbi5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcInNwYW5cIikpXG4gICAgLmZpbHRlcigoc3BhbikgPT4gc3Bhbi5jaGlsZHJlbi5sZW5ndGggPT09IDAgJiYgISFzcGFuLnRleHRDb250ZW50Py50cmltKCkpO1xuICByZXR1cm4gKFxuICAgIGxlYWZTcGFucy5maW5kKChzcGFuKSA9PiBzcGFuLmNsYXNzTmFtZS5pbmNsdWRlcyhcInRleHQtdG9rZW4tZm9yZWdyb3VuZFwiKSkgPz9cbiAgICBsZWFmU3BhbnMuZmluZCgoc3BhbikgPT4gIXNwYW4uY2xhc3NOYW1lLmluY2x1ZGVzKFwiZGVzY3JpcHRpb25cIikpID8/XG4gICAgbnVsbFxuICApO1xufVxuXG5mdW5jdGlvbiBvbkRvY3VtZW50Q2xpY2soZTogTW91c2VFdmVudCk6IHZvaWQge1xuICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldCBpbnN0YW5jZW9mIEVsZW1lbnQgPyBlLnRhcmdldCA6IG51bGw7XG4gIGNvbnN0IGNvbnRyb2wgPSB0YXJnZXQ/LmNsb3Nlc3QoXCJbcm9sZT0nbGluayddLGJ1dHRvbixhXCIpO1xuICBpZiAoIShjb250cm9sIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSByZXR1cm47XG4gIGlmICghbG9jYWxpemVCYWNrVG9BcHBMYWJlbChjb250cm9sLnRleHRDb250ZW50IHx8IFwiXCIpKSByZXR1cm47XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgc2V0U2V0dGluZ3NTdXJmYWNlVmlzaWJsZShmYWxzZSwgXCJiYWNrLXRvLWFwcFwiKTtcclxuICB9LCAwKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyU2VjdGlvbihzZWN0aW9uOiBTZXR0aW5nc1NlY3Rpb24pOiBTZXR0aW5nc0hhbmRsZSB7XHJcbiAgc3RhdGUuc2VjdGlvbnMuc2V0KHNlY3Rpb24uaWQsIHNlY3Rpb24pO1xyXG4gIGlmIChzdGF0ZS5hY3RpdmVQYWdlPy5raW5kID09PSBcInR3ZWFrc1wiKSByZXJlbmRlcigpO1xyXG4gIHJldHVybiB7XHJcbiAgICB1bnJlZ2lzdGVyOiAoKSA9PiB7XHJcbiAgICAgIHN0YXRlLnNlY3Rpb25zLmRlbGV0ZShzZWN0aW9uLmlkKTtcclxuICAgICAgaWYgKHN0YXRlLmFjdGl2ZVBhZ2U/LmtpbmQgPT09IFwidHdlYWtzXCIpIHJlcmVuZGVyKCk7XHJcbiAgICB9LFxyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjbGVhclNlY3Rpb25zKCk6IHZvaWQge1xyXG4gIHN0YXRlLnNlY3Rpb25zLmNsZWFyKCk7XHJcbiAgLy8gRHJvcCByZWdpc3RlcmVkIHBhZ2VzIHRvbyBcdTIwMTQgdGhleSdyZSBvd25lZCBieSB0d2Vha3MgdGhhdCBqdXN0IGdvdFxyXG4gIC8vIHRvcm4gZG93biBieSB0aGUgaG9zdC4gUnVuIGFueSB0ZWFyZG93bnMgYmVmb3JlIGZvcmdldHRpbmcgdGhlbS5cclxuICBmb3IgKGNvbnN0IHAgb2Ygc3RhdGUucGFnZXMudmFsdWVzKCkpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHAudGVhcmRvd24/LigpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICBwbG9nKFwicGFnZSB0ZWFyZG93biBmYWlsZWRcIiwgeyBpZDogcC5pZCwgZXJyOiBTdHJpbmcoZSkgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHN0YXRlLnBhZ2VzLmNsZWFyKCk7XHJcbiAgc3luY1BhZ2VzR3JvdXAoKTtcclxuICAvLyBJZiB3ZSB3ZXJlIG9uIGEgcmVnaXN0ZXJlZCBwYWdlIHRoYXQgbm8gbG9uZ2VyIGV4aXN0cywgZmFsbCBiYWNrIHRvXHJcbiAgLy8gcmVzdG9yaW5nIENvZGV4J3Mgdmlldy5cclxuICBpZiAoXHJcbiAgICBzdGF0ZS5hY3RpdmVQYWdlPy5raW5kID09PSBcInJlZ2lzdGVyZWRcIiAmJlxyXG4gICAgIXN0YXRlLnBhZ2VzLmhhcyhzdGF0ZS5hY3RpdmVQYWdlLmlkKVxyXG4gICkge1xyXG4gICAgcmVzdG9yZUNvZGV4VmlldygpO1xyXG4gIH0gZWxzZSBpZiAoc3RhdGUuYWN0aXZlUGFnZT8ua2luZCA9PT0gXCJ0d2Vha3NcIikge1xyXG4gICAgcmVyZW5kZXIoKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZWdpc3RlciBhIHR3ZWFrLW93bmVkIHNldHRpbmdzIHBhZ2UuIFRoZSBydW50aW1lIGluamVjdHMgYSBzaWRlYmFyIGVudHJ5XHJcbiAqIHVuZGVyIGEgXCJUV0VBS1NcIiBncm91cCBoZWFkZXIgKHdoaWNoIGFwcGVhcnMgb25seSB3aGVuIGF0IGxlYXN0IG9uZSBwYWdlXHJcbiAqIGlzIHJlZ2lzdGVyZWQpIGFuZCByb3V0ZXMgY2xpY2tzIHRvIHRoZSBwYWdlJ3MgYHJlbmRlcihyb290KWAuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJQYWdlKFxyXG4gIHR3ZWFrSWQ6IHN0cmluZyxcclxuICBtYW5pZmVzdDogVHdlYWtNYW5pZmVzdCxcclxuICBwYWdlOiBTZXR0aW5nc1BhZ2UsXHJcbik6IFNldHRpbmdzSGFuZGxlIHtcclxuICBjb25zdCBpZCA9IHBhZ2UuaWQ7IC8vIGFscmVhZHkgbmFtZXNwYWNlZCBieSB0d2Vhay1ob3N0IGFzIGAke3R3ZWFrSWR9OiR7cGFnZS5pZH1gXHJcbiAgY29uc3QgZW50cnk6IFJlZ2lzdGVyZWRQYWdlID0geyBpZCwgdHdlYWtJZCwgbWFuaWZlc3QsIHBhZ2UgfTtcclxuICBzdGF0ZS5wYWdlcy5zZXQoaWQsIGVudHJ5KTtcclxuICBwbG9nKFwicmVnaXN0ZXJQYWdlXCIsIHsgaWQsIHRpdGxlOiBwYWdlLnRpdGxlLCB0d2Vha0lkIH0pO1xyXG4gIHN5bmNQYWdlc0dyb3VwKCk7XHJcbiAgLy8gSWYgdGhlIHVzZXIgd2FzIGFscmVhZHkgb24gdGhpcyBwYWdlIChob3QgcmVsb2FkKSwgcmUtbW91bnQgaXRzIGJvZHkuXHJcbiAgaWYgKHN0YXRlLmFjdGl2ZVBhZ2U/LmtpbmQgPT09IFwicmVnaXN0ZXJlZFwiICYmIHN0YXRlLmFjdGl2ZVBhZ2UuaWQgPT09IGlkKSB7XHJcbiAgICByZXJlbmRlcigpO1xyXG4gIH1cclxuICByZXR1cm4ge1xyXG4gICAgdW5yZWdpc3RlcjogKCkgPT4ge1xyXG4gICAgICBjb25zdCBlID0gc3RhdGUucGFnZXMuZ2V0KGlkKTtcclxuICAgICAgaWYgKCFlKSByZXR1cm47XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgZS50ZWFyZG93bj8uKCk7XHJcbiAgICAgIH0gY2F0Y2gge31cclxuICAgICAgc3RhdGUucGFnZXMuZGVsZXRlKGlkKTtcclxuICAgICAgc3luY1BhZ2VzR3JvdXAoKTtcclxuICAgICAgaWYgKHN0YXRlLmFjdGl2ZVBhZ2U/LmtpbmQgPT09IFwicmVnaXN0ZXJlZFwiICYmIHN0YXRlLmFjdGl2ZVBhZ2UuaWQgPT09IGlkKSB7XHJcbiAgICAgICAgcmVzdG9yZUNvZGV4VmlldygpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gIH07XHJcbn1cclxuXHJcbi8qKiBDYWxsZWQgYnkgdGhlIHR3ZWFrIGhvc3QgYWZ0ZXIgZmV0Y2hpbmcgdGhlIHR3ZWFrIGxpc3QgZnJvbSBtYWluLiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc2V0TGlzdGVkVHdlYWtzKGxpc3Q6IExpc3RlZFR3ZWFrW10pOiB2b2lkIHtcclxuICBzdGF0ZS5saXN0ZWRUd2Vha3MgPSBsaXN0O1xyXG4gIGlmIChzdGF0ZS5hY3RpdmVQYWdlPy5raW5kID09PSBcInR3ZWFrc1wiKSByZXJlbmRlcigpO1xyXG59XHJcblxyXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgaW5qZWN0aW9uIFx1MjUwMFx1MjUwMFxyXG5cclxuZnVuY3Rpb24gdHJ5SW5qZWN0KCk6IHZvaWQge1xyXG4gIHJlbW92ZU1pc3BsYWNlZFNldHRpbmdzR3JvdXBzKCk7XHJcblxyXG4gIGNvbnN0IGl0ZW1zR3JvdXAgPSBmaW5kU2lkZWJhckl0ZW1zR3JvdXAoKTtcclxuICBpZiAoIWl0ZW1zR3JvdXApIHtcclxuICAgIHNjaGVkdWxlU2V0dGluZ3NTdXJmYWNlSGlkZGVuKCk7XHJcbiAgICBwbG9nKFwic2lkZWJhciBub3QgZm91bmRcIik7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGlmIChzdGF0ZS5zZXR0aW5nc1N1cmZhY2VIaWRlVGltZXIpIHtcclxuICAgIGNsZWFyVGltZW91dChzdGF0ZS5zZXR0aW5nc1N1cmZhY2VIaWRlVGltZXIpO1xyXG4gICAgc3RhdGUuc2V0dGluZ3NTdXJmYWNlSGlkZVRpbWVyID0gbnVsbDtcclxuICB9XHJcbiAgc2V0U2V0dGluZ3NTdXJmYWNlVmlzaWJsZSh0cnVlLCBcInNpZGViYXItZm91bmRcIik7XHJcbiAgLy8gQ29kZXgncyBpdGVtcyBncm91cCBsaXZlcyBpbnNpZGUgYW4gb3V0ZXIgd3JhcHBlciB0aGF0J3MgYWxyZWFkeSBzdHlsZWRcclxuICAvLyB0byBob2xkIG11bHRpcGxlIGdyb3VwcyAoYGZsZXggZmxleC1jb2wgZ2FwLTEgZ2FwLTBgKS4gV2UgaW5qZWN0IG91clxyXG4gIC8vIGdyb3VwIGFzIGEgc2libGluZyBzbyB0aGUgbmF0dXJhbCBnYXAtMSBhY3RzIGFzIG91ciB2aXN1YWwgc2VwYXJhdG9yLlxyXG4gIGNvbnN0IG91dGVyID0gaXRlbXNHcm91cC5wYXJlbnRFbGVtZW50ID8/IGl0ZW1zR3JvdXA7XHJcbiAgaWYgKCFpc1NldHRpbmdzU2lkZWJhckNhbmRpZGF0ZShpdGVtc0dyb3VwKSB8fCAhaXNTZXR0aW5nc1NpZGViYXJDYW5kaWRhdGUob3V0ZXIpKSB7XHJcbiAgICBzY2hlZHVsZVNldHRpbmdzU3VyZmFjZUhpZGRlbigpO1xyXG4gICAgcGxvZyhcInJlamVjdGVkIG5vbi1zZXR0aW5ncyBzaWRlYmFyIGNhbmRpZGF0ZVwiLCB7XHJcbiAgICAgIGl0ZW1zR3JvdXA6IGRlc2NyaWJlKGl0ZW1zR3JvdXApLFxyXG4gICAgICBvdXRlcjogZGVzY3JpYmUob3V0ZXIpLFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIHN0YXRlLnNpZGViYXJSb290ID0gb3V0ZXI7XHJcbiAgc3luY05hdGl2ZVNldHRpbmdzSGVhZGVyKGl0ZW1zR3JvdXAsIG91dGVyKTtcclxuXHJcbiAgaWYgKHN0YXRlLm5hdkdyb3VwICYmIG91dGVyLmNvbnRhaW5zKHN0YXRlLm5hdkdyb3VwKSkge1xyXG4gICAgc3luY1BhZ2VzR3JvdXAoKTtcclxuICAgIC8vIENvZGV4IHJlLXJlbmRlcnMgaXRzIG5hdGl2ZSBzaWRlYmFyIGJ1dHRvbnMgb24gaXRzIG93biBzdGF0ZSBjaGFuZ2VzLlxyXG4gICAgLy8gSWYgb25lIG9mIG91ciBwYWdlcyBpcyBhY3RpdmUsIHJlLXN0cmlwIENvZGV4J3MgYWN0aXZlIHN0eWxpbmcgc29cclxuICAgIC8vIEdlbmVyYWwgZG9lc24ndCByZWFwcGVhciBhcyBzZWxlY3RlZC5cclxuICAgIGlmIChzdGF0ZS5hY3RpdmVQYWdlICE9PSBudWxsKSBzeW5jQ29kZXhOYXRpdmVOYXZBY3RpdmUodHJ1ZSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICAvLyBTaWRlYmFyIHdhcyBlaXRoZXIgZnJlc2hseSBtb3VudGVkIChTZXR0aW5ncyBqdXN0IG9wZW5lZCkgb3IgcmUtbW91bnRlZFxyXG4gIC8vIChjbG9zZWQgYW5kIHJlLW9wZW5lZCwgb3IgbmF2aWdhdGVkIGF3YXkgYW5kIGJhY2spLiBJbiBhbGwgb2YgdGhvc2VcclxuICAvLyBjYXNlcyBDb2RleCByZXNldHMgdG8gaXRzIGRlZmF1bHQgcGFnZSAoR2VuZXJhbCksIGJ1dCBvdXIgaW4tbWVtb3J5XHJcbiAgLy8gYGFjdGl2ZVBhZ2VgIG1heSBzdGlsbCByZWZlcmVuY2UgdGhlIGxhc3QgdHdlYWsvcGFnZSB0aGUgdXNlciBoYWQgb3BlblxyXG4gIC8vIFx1MjAxNCB3aGljaCB3b3VsZCBjYXVzZSB0aGF0IG5hdiBidXR0b24gdG8gcmVuZGVyIHdpdGggdGhlIGFjdGl2ZSBzdHlsaW5nXHJcbiAgLy8gZXZlbiB0aG91Z2ggQ29kZXggaXMgc2hvd2luZyBHZW5lcmFsLiBDbGVhciBpdCBzbyBgc3luY1BhZ2VzR3JvdXBgIC9cclxuICAvLyBgc2V0TmF2QWN0aXZlYCBzdGFydCBmcm9tIGEgbmV1dHJhbCBzdGF0ZS4gVGhlIHBhbmVsSG9zdCByZWZlcmVuY2UgaXNcclxuICAvLyBhbHNvIHN0YWxlIChpdHMgRE9NIHdhcyBkaXNjYXJkZWQgd2l0aCB0aGUgcHJldmlvdXMgY29udGVudCBhcmVhKS5cclxuICBpZiAoc3RhdGUuYWN0aXZlUGFnZSAhPT0gbnVsbCB8fCBzdGF0ZS5wYW5lbEhvc3QgIT09IG51bGwpIHtcclxuICAgIHBsb2coXCJzaWRlYmFyIHJlLW1vdW50IGRldGVjdGVkOyBjbGVhcmluZyBzdGFsZSBhY3RpdmUgc3RhdGVcIiwge1xyXG4gICAgICBwcmV2QWN0aXZlOiBzdGF0ZS5hY3RpdmVQYWdlLFxyXG4gICAgfSk7XHJcbiAgICBzdGF0ZS5hY3RpdmVQYWdlID0gbnVsbDtcclxuICAgIHN0YXRlLnBhbmVsSG9zdCA9IG51bGw7XHJcbiAgfVxyXG5cclxuICBjb25zdCBleGlzdGluZ0NvZGV4UHBOYXZHcm91cCA9XHJcbiAgICBvdXRlci5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PignOnNjb3BlID4gW2RhdGEtY29kZXhwcD1cIm5hdi1ncm91cFwiXScpID8/XHJcbiAgICBvdXRlci5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PignW2RhdGEtY29kZXhwcD1cIm5hdi1ncm91cFwiXScpO1xyXG5cclxuICBpZiAoZXhpc3RpbmdDb2RleFBwTmF2R3JvdXApIHtcclxuICAgIHN0YXRlLm5hdkdyb3VwID0gZXhpc3RpbmdDb2RleFBwTmF2R3JvdXA7XHJcbiAgICBzdGF0ZS5jb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uID0gZXhpc3RpbmdDb2RleFBwTmF2R3JvdXAucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudD4oXHJcbiAgICAgIFwiW2RhdGEtY29kZXhwcC1zaWRlYmFyLXVwZGF0ZV1cIixcclxuICAgICk7XHJcbiAgICBzdGF0ZS5zaWRlYmFyUm9vdCA9IG91dGVyO1xyXG4gICAgc3luY1BhZ2VzR3JvdXAoKTtcclxuICAgIHJlZnJlc2hTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbigpO1xyXG4gICAgaWYgKHN0YXRlLmFjdGl2ZVBhZ2UgIT09IG51bGwpIHN5bmNDb2RleE5hdGl2ZU5hdkFjdGl2ZSh0cnVlKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIC8vIFx1MjUwMFx1MjUwMCBHcm91cCBjb250YWluZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcbiAgY29uc3QgZ3JvdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGdyb3VwLmRhdGFzZXQuY29kZXhwcCA9IFwibmF2LWdyb3VwXCI7XHJcbiAgZ3JvdXAuY2xhc3NOYW1lID0gXCJmbGV4IGZsZXgtY29sIGdhcC1weFwiO1xyXG5cclxuICBjb25zdCB1cGRhdGVCdXR0b24gPSBzaWRlYmFyVXBkYXRlUGlsbEJ1dHRvbigpO1xyXG4gIHN0YXRlLmNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b24gPSB1cGRhdGVCdXR0b247XHJcbiAgZ3JvdXAuYXBwZW5kQ2hpbGQoc2lkZWJhckdyb3VwSGVhZGVyKFwiY29kZXhcdTZDNDlcdTUzMTZcdTU4OUVcdTVGM0FwbHVzXHU3MjQ4XCIsIFwicHQtM1wiLCB1cGRhdGVCdXR0b24pKTtcclxuICByZWZyZXNoU2lkZWJhckNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b24oKTtcclxuXHJcbiAgLy8gXHUyNTAwXHUyNTAwIFNpZGViYXIgaXRlbXMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IGNvbmZpZ0J0biA9IG1ha2VTaWRlYmFySXRlbShcIlx1OTE0RFx1N0Y2RVwiLCBjb25maWdJY29uU3ZnKCkpO1xuICBjb25zdCBhZ2VudFByb3ZpZGVyc0J0biA9IG1ha2VTaWRlYmFySXRlbShcIlx1NkEyMVx1NTc4Qlx1NjNBNVx1NTE2NVwiLCBhZ2VudFByb3ZpZGVySWNvblN2ZygpKTtcbiAgY29uc3QgdHdlYWtzQnRuID0gbWFrZVNpZGViYXJJdGVtKFwiXHU2M0QyXHU0RUY2XCIsIHR3ZWFrc0ljb25TdmcoKSk7XG4gIGNvbnN0IHN0b3JlQnRuID0gbWFrZVNpZGViYXJJdGVtKFwiXHU2M0QyXHU0RUY2XHU1NTQ2XHU1RTk3XCIsIHN0b3JlSWNvblN2ZygpKTtcbiAgYXBwZW5kU2lkZWJhclN0b3JlVXBkYXRlQmFkZ2Uoc3RvcmVCdG4pO1xuXHJcbiAgY29uZmlnQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBhY3RpdmF0ZVBhZ2UoeyBraW5kOiBcImNvbmZpZ1wiIH0pO1xuICB9KTtcbiAgYWdlbnRQcm92aWRlcnNCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgYWN0aXZhdGVQYWdlKHsga2luZDogXCJhZ2VudC1wcm92aWRlcnNcIiB9KTtcbiAgfSk7XG4gIHR3ZWFrc0J0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBhY3RpdmF0ZVBhZ2UoeyBraW5kOiBcInR3ZWFrc1wiIH0pO1xuICB9KTtcclxuICBzdG9yZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICBhY3RpdmF0ZVBhZ2UoeyBraW5kOiBcInN0b3JlXCIgfSk7XHJcbiAgfSk7XHJcblxuICBncm91cC5hcHBlbmRDaGlsZChjb25maWdCdG4pO1xuICBncm91cC5hcHBlbmRDaGlsZChhZ2VudFByb3ZpZGVyc0J0bik7XG4gIGdyb3VwLmFwcGVuZENoaWxkKHR3ZWFrc0J0bik7XG4gIGdyb3VwLmFwcGVuZENoaWxkKHN0b3JlQnRuKTtcbiAgb3V0ZXIuYXBwZW5kQ2hpbGQoZ3JvdXApO1xuXG4gIHN0YXRlLm5hdkdyb3VwID0gZ3JvdXA7XG4gIHN0YXRlLm5hdkJ1dHRvbnMgPSB7IGNvbmZpZzogY29uZmlnQnRuLCBcImFnZW50LXByb3ZpZGVyc1wiOiBhZ2VudFByb3ZpZGVyc0J0biwgdHdlYWtzOiB0d2Vha3NCdG4sIHN0b3JlOiBzdG9yZUJ0biB9O1xuICBwbG9nKFwibmF2IGdyb3VwIGluamVjdGVkXCIsIHsgb3V0ZXJUYWc6IG91dGVyLnRhZ05hbWUgfSk7XHJcbiAgc3luY1BhZ2VzR3JvdXAoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc3luY05hdGl2ZVNldHRpbmdzSGVhZGVyKGl0ZW1zR3JvdXA6IEhUTUxFbGVtZW50LCBvdXRlcjogSFRNTEVsZW1lbnQpOiB2b2lkIHtcclxuICBpZiAoc3RhdGUubmF0aXZlTmF2SGVhZGVyICYmIG91dGVyLmNvbnRhaW5zKHN0YXRlLm5hdGl2ZU5hdkhlYWRlcikpIHJldHVybjtcclxuICBpZiAob3V0ZXIgPT09IGl0ZW1zR3JvdXApIHJldHVybjtcclxuXHJcbiAgY29uc3QgaGVhZGVyID0gc2lkZWJhckdyb3VwSGVhZGVyKFwiXHU1RTM4XHU4OUM0XCIpO1xuICBoZWFkZXIuZGF0YXNldC5jb2RleHBwID0gXCJuYXRpdmUtbmF2LWhlYWRlclwiO1xyXG4gIG91dGVyLmluc2VydEJlZm9yZShoZWFkZXIsIGl0ZW1zR3JvdXApO1xyXG4gIHN0YXRlLm5hdGl2ZU5hdkhlYWRlciA9IGhlYWRlcjtcclxufVxyXG5cclxuZnVuY3Rpb24gc2lkZWJhckdyb3VwSGVhZGVyKHRleHQ6IHN0cmluZywgdG9wUGFkZGluZyA9IFwicHQtMlwiLCB0cmFpbGluZz86IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQge1xyXG4gIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgaGVhZGVyLmNsYXNzTmFtZSA9XHJcbiAgICBgcHgtcm93LXggJHt0b3BQYWRkaW5nfSBwYi0xIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiB0ZXh0LVsxMXB4XSBmb250LW1lZGl1bSB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXIgdGV4dC10b2tlbi1kZXNjcmlwdGlvbi1mb3JlZ3JvdW5kIHNlbGVjdC1ub25lYDtcclxuICBjb25zdCBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gIGxhYmVsLmNsYXNzTmFtZSA9IFwidHJ1bmNhdGVcIjtcclxuICBsYWJlbC50ZXh0Q29udGVudCA9IHRleHQ7XHJcbiAgaGVhZGVyLmFwcGVuZENoaWxkKGxhYmVsKTtcclxuICBpZiAodHJhaWxpbmcpIGhlYWRlci5hcHBlbmRDaGlsZCh0cmFpbGluZyk7XHJcbiAgcmV0dXJuIGhlYWRlcjtcclxufVxyXG5cclxuZnVuY3Rpb24gc2NoZWR1bGVTZXR0aW5nc1N1cmZhY2VIaWRkZW4oKTogdm9pZCB7XHJcbiAgaWYgKCFzdGF0ZS5zZXR0aW5nc1N1cmZhY2VWaXNpYmxlIHx8IHN0YXRlLnNldHRpbmdzU3VyZmFjZUhpZGVUaW1lcikgcmV0dXJuO1xyXG4gIHN0YXRlLnNldHRpbmdzU3VyZmFjZUhpZGVUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgc3RhdGUuc2V0dGluZ3NTdXJmYWNlSGlkZVRpbWVyID0gbnVsbDtcclxuICAgIGNvbnN0IHNpZGViYXIgPSBmaW5kU2lkZWJhckl0ZW1zR3JvdXAoKTtcclxuICAgIGlmIChzaWRlYmFyICYmIGlzU2V0dGluZ3NTaWRlYmFyQ2FuZGlkYXRlKHNpZGViYXIpKSByZXR1cm47XHJcbiAgICBpZiAoaXNTZXR0aW5nc1RleHRWaXNpYmxlKCkpIHJldHVybjtcclxuICAgIHNldFNldHRpbmdzU3VyZmFjZVZpc2libGUoZmFsc2UsIFwic2lkZWJhci1ub3QtZm91bmRcIik7XHJcbiAgfSwgMTUwMCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzU2V0dGluZ3NUZXh0VmlzaWJsZSgpOiBib29sZWFuIHtcclxuICByZXR1cm4gaXNDb2RleFBwU2V0dGluZ3NMYWJlbFNldChjb2RleFBwU2V0dGluZ3NMYWJlbHNGcm9tKGRvY3VtZW50KSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbXBhY3RTZXR0aW5nc1RleHQodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSB8fCBcIlwiKS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XHJcbn1cclxuXHJcbmNvbnN0IENPREVYUFBfQ09SRV9TRVRUSU5HU19MQUJFTFMgPSBbXHJcbiAgXCJHZW5lcmFsXCIsXHJcbiAgXCJcdTVFMzhcdTg5QzRcIixcclxuICBcIlx1OTAxQVx1NzUyOFwiLFxyXG4gIFwiQXBwZWFyYW5jZVwiLFxyXG4gIFwiXHU1OTE2XHU4OUMyXCIsXHJcbiAgXCJDb25maWd1cmF0aW9uXCIsXHJcbiAgXCJcdTkxNERcdTdGNkVcIixcclxuICBcIlx1OUVEOFx1OEJBNFx1Njc0M1x1OTY1MFwiLFxyXG4gIFwiUGVyc29uYWxpemF0aW9uXCIsXG4gIFwiXHU0RTJBXHU2MDI3XHU1MzE2XCIsXG4gIFwiUHJvZmlsZVwiLFxuICBcIlx1NEUyQVx1NEVCQVx1OEQ0NFx1NjU5OVwiLFxuXS5tYXAobm9ybWFsaXplQ29kZXhQcFNldHRpbmdzTGFiZWwpO1xuXHJcbmNvbnN0IENPREVYUFBfRVhURU5ERURfU0VUVElOR1NfTEFCRUxTID0gW1xyXG4gIFwiQWNjb3VudFwiLFxuICBcIlx1OEQyNlx1NjIzN1wiLFxuICBcIlx1OEQyNlx1NTNGN1wiLFxuICBcIlBlcnNvbmFsXCIsXG4gIFwiXHU0RTJBXHU0RUJBXCIsXG4gIFwiUHJvZmlsZVwiLFxuICBcIlx1NEUyQVx1NEVCQVx1OEQ0NFx1NjU5OVwiLFxuICBcIkdlbmVyYWxcIixcclxuICBcIlx1NUUzOFx1ODlDNFwiLFxyXG4gIFwiXHU5MDFBXHU3NTI4XCIsXHJcbiAgXCJBcHBlYXJhbmNlXCIsXHJcbiAgXCJcdTU5MTZcdTg5QzJcIixcclxuICBcIkNvbmZpZ3VyYXRpb25cIixcclxuICBcIlx1OTE0RFx1N0Y2RVwiLFxyXG4gIFwiXHU5RUQ4XHU4QkE0XHU2NzQzXHU5NjUwXCIsXHJcbiAgXCJQZXJzb25hbGl6YXRpb25cIixcclxuICBcIlx1NEUyQVx1NjAyN1x1NTMxNlwiLFxyXG4gIFwiS2V5Ym9hcmQgc2hvcnRjdXRzXCIsXG4gIFwiXHU5NTJFXHU3NkQ4XHU1RkVCXHU2Mzc3XHU5NTJFXCIsXG4gIFwiQXJjaGl2ZWQgY2hhdHNcIixcbiAgXCJcdTVERjJcdTVGNTJcdTY4NjNcdTVCRjlcdThCRERcIixcbiAgXCJVc2FnZVwiLFxuICBcIlVzYWdlIGFuZCBiaWxsaW5nXCIsXG4gIFwiXHU0RjdGXHU3NTI4XHU2MEM1XHU1MUI1XHU1NDhDXHU4QkExXHU4RDM5XCIsXG4gIFwiQ29tcHV0ZXIgdXNlXCIsXG4gIFwiXHU3NTM1XHU4MTExXHU2NENEXHU2M0E3XCIsXG4gIFwiQnJvd3NlciB1c2VcIixcbiAgXCJCcm93c2VyXCIsXG4gIFwiXHU2RDRGXHU4OUM4XHU1NjY4XCIsXG4gIFwiTUNQIHNlcnZlcnNcIixcbiAgXCJNQ1AgU2VydmVyc1wiLFxuICBcIk1DUCBcdTY3MERcdTUyQTFcdTU2NjhcIixcbiAgXCJIb29rc1wiLFxuICBcIlx1OTRBOVx1NUI1MFwiLFxuICBcIkdpdFwiLFxuICBcIkVudmlyb25tZW50c1wiLFxuICBcIlx1NzNBRlx1NTg4M1wiLFxuICBcIkNsb3VkIEVudmlyb25tZW50c1wiLFxuICBcIldvcmt0cmVlc1wiLFxuICBcIlx1NURFNVx1NEY1Q1x1NjgxMVwiLFxuICBcIkNvbm5lY3Rpb25zXCIsXG4gIFwiXHU4RkRFXHU2M0E1XCIsXG4gIFwiUGx1Z2luc1wiLFxuICBcIlNraWxsc1wiLFxuXS5tYXAobm9ybWFsaXplQ29kZXhQcFNldHRpbmdzTGFiZWwpO1xuXHJcbmNvbnN0IENPREVYUFBfU0VUVElOR1NfT05MWV9MQUJFTFMgPSBbXHJcbiAgXCJHZW5lcmFsXCIsXHJcbiAgXCJcdTVFMzhcdTg5QzRcIixcclxuICBcIlx1OTAxQVx1NzUyOFwiLFxyXG4gIFwiQXBwZWFyYW5jZVwiLFxyXG4gIFwiXHU1OTE2XHU4OUMyXCIsXHJcbiAgXCJDb25maWd1cmF0aW9uXCIsXHJcbiAgXCJcdTkxNERcdTdGNkVcIixcclxuICBcIlx1OUVEOFx1OEJBNFx1Njc0M1x1OTY1MFwiLFxyXG4gIFwiUGVyc29uYWxpemF0aW9uXCIsXG4gIFwiXHU0RTJBXHU2MDI3XHU1MzE2XCIsXG4gIFwiUHJvZmlsZVwiLFxuICBcIlx1NEUyQVx1NEVCQVx1OEQ0NFx1NjU5OVwiLFxuICBcIktleWJvYXJkIHNob3J0Y3V0c1wiLFxuICBcIlx1OTUyRVx1NzZEOFx1NUZFQlx1NjM3N1x1OTUyRVwiLFxuICBcIkFyY2hpdmVkIGNoYXRzXCIsXG4gIFwiXHU1REYyXHU1RjUyXHU2ODYzXHU1QkY5XHU4QkREXCIsXG4gIFwiVXNhZ2VcIixcbiAgXCJVc2FnZSBhbmQgYmlsbGluZ1wiLFxuICBcIlx1NEY3Rlx1NzUyOFx1NjBDNVx1NTFCNVx1NTQ4Q1x1OEJBMVx1OEQzOVwiLFxuICBcIkNvbXB1dGVyIHVzZVwiLFxuICBcIlx1NzUzNVx1ODExMVx1NjRDRFx1NjNBN1wiLFxuICBcIkJyb3dzZXIgdXNlXCIsXG4gIFwiQnJvd3NlclwiLFxuICBcIlx1NkQ0Rlx1ODlDOFx1NTY2OFwiLFxuICBcIk1DUCBzZXJ2ZXJzXCIsXG4gIFwiTUNQIFNlcnZlcnNcIixcbiAgXCJNQ1AgXHU2NzBEXHU1MkExXHU1NjY4XCIsXG4gIFwiSG9va3NcIixcbiAgXCJcdTk0QTlcdTVCNTBcIixcbiAgXCJHaXRcIixcbiAgXCJFbnZpcm9ubWVudHNcIixcbiAgXCJcdTczQUZcdTU4ODNcIixcbiAgXCJDbG91ZCBFbnZpcm9ubWVudHNcIixcbiAgXCJXb3JrdHJlZXNcIixcbiAgXCJcdTVERTVcdTRGNUNcdTY4MTFcIixcbiAgXCJDb25uZWN0aW9uc1wiLFxuICBcIlx1OEZERVx1NjNBNVwiLFxuXS5tYXAobm9ybWFsaXplQ29kZXhQcFNldHRpbmdzTGFiZWwpO1xuXHJcbmNvbnN0IENPREVYUFBfTUFJTl9BUFBfTkFWX0xBQkVMUyA9IFtcclxuICBcIk5ldyBjaGF0XCIsXHJcbiAgXCJRdWljayBjaGF0XCIsXHJcbiAgXCJcdTVGRUJcdTkwMUZcdTVCRjlcdThCRERcIixcclxuICBcIlNlYXJjaFwiLFxyXG4gIFwiXHU2NDFDXHU3RDIyXCIsXHJcbiAgXCJQbHVnaW5zXCIsXHJcbiAgXCJcdTYzRDJcdTRFRjZcIixcclxuICBcIkF1dG9tYXRpb25zXCIsXHJcbiAgXCJBdXRvbWF0aW9uXCIsXHJcbiAgXCJcdTgxRUFcdTUyQThcdTUzMTZcIixcclxuICBcIkNoYXRzXCIsXHJcbiAgXCJDaGF0XCIsXHJcbiAgXCJcdTVCRjlcdThCRERcIixcclxuICBcIlByb2plY3RzXCIsXHJcbiAgXCJcdTk4NzlcdTc2RUVcIixcclxuICBcIlBpbm5lZFwiLFxyXG4gIFwiU2V0dGluZ3NcIixcclxuICBcIlx1OEJCRVx1N0Y2RVwiLFxyXG4gIFwiV29yayBsb2NhbGx5XCIsXHJcbl0ubWFwKG5vcm1hbGl6ZUNvZGV4UHBTZXR0aW5nc0xhYmVsKTtcclxuXHJcbmZ1bmN0aW9uIG5vcm1hbGl6ZUNvZGV4UHBTZXR0aW5nc0xhYmVsKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gIHJldHVybiBjb21wYWN0U2V0dGluZ3NUZXh0KHZhbHVlKVxyXG4gICAgLnRvTG9jYWxlTG93ZXJDYXNlKClcclxuICAgIC5ub3JtYWxpemUoXCJORkRcIilcclxuICAgIC5yZXBsYWNlKC9bXFx1MDMwMC1cXHUwMzZmXS9nLCBcIlwiKVxyXG4gICAgLnJlcGxhY2UoL1tcdTIwMTlcdTIwMThgXHUwMEI0XS9nLCBcIidcIilcclxuICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxyXG4gICAgLnRyaW0oKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY29kZXhQcENvbnRyb2xMYWJlbChlbDogSFRNTEVsZW1lbnQpOiBzdHJpbmcge1xyXG4gIHJldHVybiBub3JtYWxpemVDb2RleFBwU2V0dGluZ3NMYWJlbChcclxuICAgIGVsLmdldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIikgfHxcclxuICAgICAgZWwuZ2V0QXR0cmlidXRlKFwidGl0bGVcIikgfHxcclxuICAgICAgZWwudGV4dENvbnRlbnQgfHxcclxuICAgICAgXCJcIixcclxuICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb2RleFBwU2V0dGluZ3NMYWJlbHNGcm9tKHJvb3Q6IFBhcmVudE5vZGUpOiBzdHJpbmdbXSB7XHJcbiAgY29uc3QgY29udHJvbHMgPSBBcnJheS5mcm9tKFxyXG4gICAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcImJ1dHRvbixhLFtyb2xlPSdidXR0b24nXSxbcm9sZT0nbGluayddXCIpLFxyXG4gICk7XHJcblxyXG4gIHJldHVybiBbXHJcbiAgICAuLi5uZXcgU2V0KFxyXG4gICAgICBjb250cm9sc1xyXG4gICAgICAgIC5tYXAoY29kZXhQcENvbnRyb2xMYWJlbClcclxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pLFxyXG4gICAgKSxcclxuICBdO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb2RleFBwU2V0dGluZ3NMYWJlbFNjb3JlKGxhYmVsczogc3RyaW5nW10pOiB7IGNvcmU6IG51bWJlcjsgdG90YWw6IG51bWJlciB9IHtcclxuICBjb25zdCBjb3JlID0gbmV3IFNldDxzdHJpbmc+KCk7XHJcbiAgY29uc3QgdG90YWwgPSBuZXcgU2V0PHN0cmluZz4oKTtcclxuXHJcbiAgZm9yIChjb25zdCBsYWJlbCBvZiBsYWJlbHMpIHtcclxuICAgIGZvciAoY29uc3QgbWFya2VyIG9mIENPREVYUFBfQ09SRV9TRVRUSU5HU19MQUJFTFMpIHtcclxuICAgICAgaWYgKGNvZGV4UHBMYWJlbE1hdGNoZXNNYXJrZXIobGFiZWwsIG1hcmtlcikpIGNvcmUuYWRkKG1hcmtlcik7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChjb25zdCBtYXJrZXIgb2YgQ09ERVhQUF9FWFRFTkRFRF9TRVRUSU5HU19MQUJFTFMpIHtcclxuICAgICAgaWYgKGNvZGV4UHBMYWJlbE1hdGNoZXNNYXJrZXIobGFiZWwsIG1hcmtlcikpIHRvdGFsLmFkZChtYXJrZXIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHsgY29yZTogY29yZS5zaXplLCB0b3RhbDogdG90YWwuc2l6ZSB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb2RleFBwTGFiZWxNYXRjaGVzTWFya2VyKGxhYmVsOiBzdHJpbmcsIG1hcmtlcjogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGxhYmVsID09PSBtYXJrZXIgfHwgbGFiZWwuaW5jbHVkZXMobWFya2VyKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY29kZXhQcE1hcmtlckNvdW50KGxhYmVsczogc3RyaW5nW10sIG1hcmtlcnM6IHN0cmluZ1tdKTogbnVtYmVyIHtcclxuICBjb25zdCBtYXRjaGVkID0gbmV3IFNldDxzdHJpbmc+KCk7XHJcbiAgZm9yIChjb25zdCBsYWJlbCBvZiBsYWJlbHMpIHtcclxuICAgIGZvciAoY29uc3QgbWFya2VyIG9mIG1hcmtlcnMpIHtcclxuICAgICAgaWYgKGNvZGV4UHBMYWJlbE1hdGNoZXNNYXJrZXIobGFiZWwsIG1hcmtlcikpIG1hdGNoZWQuYWRkKG1hcmtlcik7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBtYXRjaGVkLnNpemU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhc0NvZGV4UHBTZXR0aW5nc09ubHlTaWduYWwobGFiZWxzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBjb2RleFBwTWFya2VyQ291bnQobGFiZWxzLCBDT0RFWFBQX1NFVFRJTkdTX09OTFlfTEFCRUxTKSA+IDA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhc01haW5BcHBTaWRlYmFyU2lnbmFscyhsYWJlbHM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGNvZGV4UHBNYXJrZXJDb3VudChsYWJlbHMsIENPREVYUFBfTUFJTl9BUFBfTkFWX0xBQkVMUykgPj0gMjtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNDb2RleFBwU2V0dGluZ3NMYWJlbFNldChsYWJlbHM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XHJcbiAgY29uc3Qgc2NvcmUgPSBjb2RleFBwU2V0dGluZ3NMYWJlbFNjb3JlKGxhYmVscyk7XHJcbiAgcmV0dXJuIHNjb3JlLmNvcmUgPj0gMiAmJiBzY29yZS50b3RhbCA+PSAzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb2RleFBwVmlzaWJsZUJveChlbDogSFRNTEVsZW1lbnQpOiBET01SZWN0IHwgbnVsbCB7XHJcbiAgaWYgKCFlbC5pc0Nvbm5lY3RlZCkgcmV0dXJuIG51bGw7XHJcbiAgY29uc3Qgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsKTtcclxuICBpZiAoc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIgfHwgc3R5bGUudmlzaWJpbGl0eSA9PT0gXCJoaWRkZW5cIikgcmV0dXJuIG51bGw7XHJcblxyXG4gIGNvbnN0IHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICBpZiAocmVjdC53aWR0aCA8PSAwIHx8IHJlY3QuaGVpZ2h0IDw9IDApIHJldHVybiBudWxsO1xyXG4gIHJldHVybiByZWN0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRTZXR0aW5nc1N1cmZhY2VWaXNpYmxlKHZpc2libGU6IGJvb2xlYW4sIHJlYXNvbjogc3RyaW5nKTogdm9pZCB7XHJcbiAgaWYgKHN0YXRlLnNldHRpbmdzU3VyZmFjZVZpc2libGUgPT09IHZpc2libGUpIHJldHVybjtcclxuICBzdGF0ZS5zZXR0aW5nc1N1cmZhY2VWaXNpYmxlID0gdmlzaWJsZTtcclxuICBpZiAodmlzaWJsZSkgd2FybVR3ZWFrU3RvcmUoKTtcclxuICB0cnkge1xyXG4gICAgKHdpbmRvdyBhcyBXaW5kb3cgJiB7IF9fY29kZXhwcFNldHRpbmdzU3VyZmFjZVZpc2libGU/OiBib29sZWFuIH0pLl9fY29kZXhwcFNldHRpbmdzU3VyZmFjZVZpc2libGUgPSB2aXNpYmxlO1xyXG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRhdGFzZXQuY29kZXhwcFNldHRpbmdzU3VyZmFjZSA9IHZpc2libGUgPyBcInRydWVcIiA6IFwiZmFsc2VcIjtcclxuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KFxyXG4gICAgICBuZXcgQ3VzdG9tRXZlbnQoXCJjb2RleHBwOnNldHRpbmdzLXN1cmZhY2VcIiwge1xyXG4gICAgICAgIGRldGFpbDogeyB2aXNpYmxlLCByZWFzb24gfSxcclxuICAgICAgfSksXHJcbiAgICApO1xyXG4gIH0gY2F0Y2gge31cclxuICBwbG9nKFwic2V0dGluZ3Mgc3VyZmFjZVwiLCB7IHZpc2libGUsIHJlYXNvbiwgdXJsOiBsb2NhdGlvbi5ocmVmIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogUmVuZGVyIChvciByZS1yZW5kZXIpIHRoZSBzZWNvbmQgc2lkZWJhciBncm91cCBvZiBwZXItdHdlYWsgcGFnZXMuIFRoZVxyXG4gKiBncm91cCBpcyBjcmVhdGVkIGxhemlseSBhbmQgcmVtb3ZlZCB3aGVuIHRoZSBsYXN0IHBhZ2UgdW5yZWdpc3RlcnMsIHNvXHJcbiAqIHVzZXJzIHdpdGggbm8gcGFnZS1yZWdpc3RlcmluZyB0d2Vha3MgbmV2ZXIgc2VlIGFuIGVtcHR5IFwiVHdlYWtzXCIgaGVhZGVyLlxyXG4gKi9cclxuZnVuY3Rpb24gc3luY1BhZ2VzR3JvdXAoKTogdm9pZCB7XHJcbiAgY29uc3Qgb3V0ZXIgPSBzdGF0ZS5zaWRlYmFyUm9vdDtcclxuICBpZiAoIW91dGVyKSByZXR1cm47XHJcbiAgaWYgKCFpc1NldHRpbmdzU2lkZWJhckNhbmRpZGF0ZShvdXRlcikpIHtcclxuICAgIHN0YXRlLnNpZGViYXJSb290ID0gbnVsbDtcclxuICAgIHN0YXRlLnBhZ2VzR3JvdXAgPSBudWxsO1xyXG4gICAgc3RhdGUucGFnZXNHcm91cEtleSA9IG51bGw7XHJcbiAgICBmb3IgKGNvbnN0IHAgb2Ygc3RhdGUucGFnZXMudmFsdWVzKCkpIHAubmF2QnV0dG9uID0gbnVsbDtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgcGFnZXMgPSBbLi4uc3RhdGUucGFnZXMudmFsdWVzKCldO1xyXG5cclxuICAvLyBCdWlsZCBhIGRldGVybWluaXN0aWMgZmluZ2VycHJpbnQgb2YgdGhlIGRlc2lyZWQgZ3JvdXAgc3RhdGUuIElmIHRoZVxyXG4gIC8vIGN1cnJlbnQgRE9NIGdyb3VwIGFscmVhZHkgbWF0Y2hlcywgdGhpcyBpcyBhIG5vLW9wIFx1MjAxNCBjcml0aWNhbCwgYmVjYXVzZVxyXG4gIC8vIHN5bmNQYWdlc0dyb3VwIGlzIGNhbGxlZCBvbiBldmVyeSBNdXRhdGlvbk9ic2VydmVyIHRpY2sgYW5kIGFueSBET01cclxuICAvLyB3cml0ZSB3b3VsZCByZS10cmlnZ2VyIHRoYXQgb2JzZXJ2ZXIgKGluZmluaXRlIGxvb3AsIGFwcCBmcmVlemUpLlxyXG4gIGNvbnN0IGRlc2lyZWRLZXkgPSBwYWdlcy5sZW5ndGggPT09IDBcclxuICAgID8gXCJFTVBUWVwiXHJcbiAgICA6IHBhZ2VzLm1hcCgocCkgPT4gYCR7cC5pZH18JHtwLnBhZ2UudGl0bGV9fCR7cC5wYWdlLmljb25TdmcgPz8gXCJcIn1gKS5qb2luKFwiXFxuXCIpO1xyXG4gIGNvbnN0IGdyb3VwQXR0YWNoZWQgPSAhIXN0YXRlLnBhZ2VzR3JvdXAgJiYgb3V0ZXIuY29udGFpbnMoc3RhdGUucGFnZXNHcm91cCk7XHJcbiAgaWYgKHN0YXRlLnBhZ2VzR3JvdXBLZXkgPT09IGRlc2lyZWRLZXkgJiYgKHBhZ2VzLmxlbmd0aCA9PT0gMCA/ICFncm91cEF0dGFjaGVkIDogZ3JvdXBBdHRhY2hlZCkpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGlmIChwYWdlcy5sZW5ndGggPT09IDApIHtcclxuICAgIGlmIChzdGF0ZS5wYWdlc0dyb3VwKSB7XHJcbiAgICAgIHN0YXRlLnBhZ2VzR3JvdXAucmVtb3ZlKCk7XHJcbiAgICAgIHN0YXRlLnBhZ2VzR3JvdXAgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgZm9yIChjb25zdCBwIG9mIHN0YXRlLnBhZ2VzLnZhbHVlcygpKSBwLm5hdkJ1dHRvbiA9IG51bGw7XHJcbiAgICBzdGF0ZS5wYWdlc0dyb3VwS2V5ID0gZGVzaXJlZEtleTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGxldCBncm91cCA9IHN0YXRlLnBhZ2VzR3JvdXA7XHJcbiAgaWYgKCFncm91cCB8fCAhb3V0ZXIuY29udGFpbnMoZ3JvdXApKSB7XHJcbiAgICBncm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICBncm91cC5kYXRhc2V0LmNvZGV4cHAgPSBcInBhZ2VzLWdyb3VwXCI7XHJcbiAgICBncm91cC5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLXB4XCI7XHJcbiAgICBncm91cC5hcHBlbmRDaGlsZChzaWRlYmFyR3JvdXBIZWFkZXIoXCJcdTYzRDJcdTRFRjZcIiwgXCJwdC0zXCIpKTtcbiAgICBvdXRlci5hcHBlbmRDaGlsZChncm91cCk7XHJcbiAgICBzdGF0ZS5wYWdlc0dyb3VwID0gZ3JvdXA7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIFN0cmlwIHByaW9yIGJ1dHRvbnMgKGtlZXAgdGhlIGhlYWRlciBhdCBpbmRleCAwKS5cclxuICAgIHdoaWxlIChncm91cC5jaGlsZHJlbi5sZW5ndGggPiAxKSBncm91cC5yZW1vdmVDaGlsZChncm91cC5sYXN0Q2hpbGQhKTtcclxuICB9XHJcblxyXG4gIGZvciAoY29uc3QgcCBvZiBwYWdlcykge1xyXG4gICAgY29uc3QgaWNvbiA9IHAucGFnZS5pY29uU3ZnID8/IGRlZmF1bHRQYWdlSWNvblN2ZygpO1xyXG4gICAgY29uc3QgYnRuID0gbWFrZVNpZGViYXJJdGVtKHAucGFnZS50aXRsZSwgaWNvbik7XHJcbiAgICBidG4uZGF0YXNldC5jb2RleHBwID0gYG5hdi1wYWdlLSR7cC5pZH1gO1xyXG4gICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgIGFjdGl2YXRlUGFnZSh7IGtpbmQ6IFwicmVnaXN0ZXJlZFwiLCBpZDogcC5pZCB9KTtcclxuICAgIH0pO1xyXG4gICAgcC5uYXZCdXR0b24gPSBidG47XHJcbiAgICBncm91cC5hcHBlbmRDaGlsZChidG4pO1xyXG4gIH1cclxuICBzdGF0ZS5wYWdlc0dyb3VwS2V5ID0gZGVzaXJlZEtleTtcclxuICBwbG9nKFwicGFnZXMgZ3JvdXAgc3luY2VkXCIsIHtcclxuICAgIGNvdW50OiBwYWdlcy5sZW5ndGgsXHJcbiAgICBpZHM6IHBhZ2VzLm1hcCgocCkgPT4gcC5pZCksXHJcbiAgfSk7XHJcbiAgLy8gUmVmbGVjdCBjdXJyZW50IGFjdGl2ZSBzdGF0ZSBhY3Jvc3MgdGhlIHJlYnVpbHQgYnV0dG9ucy5cclxuICBzZXROYXZBY3RpdmUoc3RhdGUuYWN0aXZlUGFnZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1ha2VTaWRlYmFySXRlbShsYWJlbDogc3RyaW5nLCBpY29uU3ZnOiBzdHJpbmcpOiBIVE1MQnV0dG9uRWxlbWVudCB7XHJcbiAgLy8gQ2xhc3Mgc3RyaW5nIGNvcGllZCB2ZXJiYXRpbSBmcm9tIENvZGV4J3Mgc2lkZWJhciBidXR0b25zIChHZW5lcmFsIGV0YykuXHJcbiAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcclxuICBidG4udHlwZSA9IFwiYnV0dG9uXCI7XHJcbiAgYnRuLmRhdGFzZXQuY29kZXhwcCA9IGBuYXYtJHtsYWJlbC50b0xvd2VyQ2FzZSgpfWA7XHJcbiAgYnRuLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgbGFiZWwpO1xyXG4gIGJ0bi5jbGFzc05hbWUgPVxyXG4gICAgXCJmb2N1cy12aXNpYmxlOm91dGxpbmUtdG9rZW4tYm9yZGVyIHJlbGF0aXZlIHB4LXJvdy14IHB5LXJvdy15IGN1cnNvci1pbnRlcmFjdGlvbiBzaHJpbmstMCBpdGVtcy1jZW50ZXIgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQtbGcgdGV4dC1sZWZ0IHRleHQtc20gZm9jdXMtdmlzaWJsZTpvdXRsaW5lIGZvY3VzLXZpc2libGU6b3V0bGluZS0yIGZvY3VzLXZpc2libGU6b3V0bGluZS1vZmZzZXQtMiBkaXNhYmxlZDpjdXJzb3Itbm90LWFsbG93ZWQgZGlzYWJsZWQ6b3BhY2l0eS01MCBnYXAtMiBmbGV4IHctZnVsbCBob3ZlcjpiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmQgZm9udC1ub3JtYWxcIjtcclxuXHJcbiAgY29uc3QgaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGlubmVyLmNsYXNzTmFtZSA9XHJcbiAgICBcImZsZXggbWluLXctMCBpdGVtcy1jZW50ZXIgdGV4dC1iYXNlIGdhcC0yIGZsZXgtMSB0ZXh0LXRva2VuLWZvcmVncm91bmRcIjtcclxuICBpbm5lci5pbm5lckhUTUwgPSBgJHtpY29uU3ZnfTxzcGFuIGNsYXNzPVwidHJ1bmNhdGVcIj4ke2xhYmVsfTwvc3Bhbj5gO1xyXG4gIGJ0bi5hcHBlbmRDaGlsZChpbm5lcik7XHJcbiAgcmV0dXJuIGJ0bjtcclxufVxyXG5cclxuZnVuY3Rpb24gYXBwZW5kU2lkZWJhclN0b3JlVXBkYXRlQmFkZ2UoYnRuOiBIVE1MQnV0dG9uRWxlbWVudCk6IHZvaWQge1xyXG4gIGNvbnN0IGlubmVyID0gYnRuLmZpcnN0RWxlbWVudENoaWxkIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcclxuICBpZiAoIWlubmVyKSByZXR1cm47XHJcbiAgY29uc3QgYmFkZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICBiYWRnZS5kYXRhc2V0LmNvZGV4cHBTdG9yZVVwZGF0ZUJhZGdlID0gXCJ0cnVlXCI7XHJcbiAgYmFkZ2UuaGlkZGVuID0gdHJ1ZTtcclxuICBiYWRnZS50aXRsZSA9IFwiXHU1REYyXHU1Qjg5XHU4OEM1XHU2M0QyXHU0RUY2XHU2NzA5XHU1QkExXHU2ODM4XHU5MDFBXHU4RkM3XHU3Njg0XHU2NkY0XHU2NUIwXCI7XG4gIGJhZGdlLmNsYXNzTmFtZSA9IFwiaW5saW5lLWZsZXggc2hyaW5rLTAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyXCI7XHJcbiAgT2JqZWN0LmFzc2lnbihiYWRnZS5zdHlsZSwge1xyXG4gICAgcG9zaXRpb246IFwiYWJzb2x1dGVcIixcclxuICAgIHJpZ2h0OiBcIjEycHhcIixcclxuICAgIHRvcDogXCI1MCVcIixcclxuICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGVZKC01MCUpXCIsXHJcbiAgICB6SW5kZXg6IFwiMVwiLFxyXG4gIH0pO1xyXG4gIGFwcGx5U3RvcmVVcGRhdGVCYWRnZVN0eWxlKGJhZGdlLCBudWxsKTtcclxuICBidG4uYXBwZW5kQ2hpbGQoYmFkZ2UpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXROYXZBY3RpdmUoYWN0aXZlOiBBY3RpdmVQYWdlIHwgbnVsbCk6IHZvaWQge1xuICAvLyBCdWlsdC1pbiAoQ29uZmlnL1R3ZWFrcykgYnV0dG9ucy5cbiAgaWYgKHN0YXRlLm5hdkJ1dHRvbnMpIHtcbiAgICBjb25zdCBidWlsdGluOiBCdWlsdGluUGFnZSB8IG51bGwgPVxuICAgICAgYWN0aXZlPy5raW5kID09PSBcImNvbmZpZ1wiID8gXCJjb25maWdcIiA6XG4gICAgICBhY3RpdmU/LmtpbmQgPT09IFwidHdlYWtzXCIgPyBcInR3ZWFrc1wiIDpcbiAgICAgIGFjdGl2ZT8ua2luZCA9PT0gXCJzdG9yZVwiID8gXCJzdG9yZVwiIDpcbiAgICAgIGFjdGl2ZT8ua2luZCA9PT0gXCJhZ2VudC1wcm92aWRlcnNcIiA/IFwiYWdlbnQtcHJvdmlkZXJzXCIgOiBudWxsO1xuICAgIGZvciAoY29uc3QgW2tleSwgYnRuXSBvZiBPYmplY3QuZW50cmllcyhzdGF0ZS5uYXZCdXR0b25zKSBhcyBbQnVpbHRpblBhZ2UsIEhUTUxCdXR0b25FbGVtZW50XVtdKSB7XG4gICAgICBhcHBseU5hdkFjdGl2ZShidG4sIGtleSA9PT0gYnVpbHRpbik7XG4gICAgfVxuICB9XHJcbiAgLy8gUGVyLXBhZ2UgcmVnaXN0ZXJlZCBidXR0b25zLlxyXG4gIGZvciAoY29uc3QgcCBvZiBzdGF0ZS5wYWdlcy52YWx1ZXMoKSkge1xyXG4gICAgaWYgKCFwLm5hdkJ1dHRvbikgY29udGludWU7XHJcbiAgICBjb25zdCBpc0FjdGl2ZSA9IGFjdGl2ZT8ua2luZCA9PT0gXCJyZWdpc3RlcmVkXCIgJiYgYWN0aXZlLmlkID09PSBwLmlkO1xyXG4gICAgYXBwbHlOYXZBY3RpdmUocC5uYXZCdXR0b24sIGlzQWN0aXZlKTtcclxuICB9XHJcbiAgLy8gQ29kZXgncyBvd24gc2lkZWJhciBidXR0b25zIChHZW5lcmFsLCBBcHBlYXJhbmNlLCBldGMpLiBXaGVuIG9uZSBvZlxyXG4gIC8vIG91ciBwYWdlcyBpcyBhY3RpdmUsIENvZGV4IHN0aWxsIGhhcyBhcmlhLWN1cnJlbnQ9XCJwYWdlXCIgYW5kIHRoZVxyXG4gIC8vIGFjdGl2ZS1iZyBjbGFzcyBvbiB3aGljaGV2ZXIgaXRlbSBpdCBjb25zaWRlcmVkIHRoZSByb3V0ZSBcdTIwMTQgdHlwaWNhbGx5XHJcbiAgLy8gR2VuZXJhbC4gVGhhdCBtYWtlcyBib3RoIGJ1dHRvbnMgbG9vayBzZWxlY3RlZC4gU3RyaXAgQ29kZXgncyBhY3RpdmVcclxuICAvLyBzdHlsaW5nIHdoaWxlIG9uZSBvZiBvdXJzIGlzIGFjdGl2ZTsgcmVzdG9yZSBpdCB3aGVuIG5vbmUgaXMuXHJcbiAgc3luY0NvZGV4TmF0aXZlTmF2QWN0aXZlKGFjdGl2ZSAhPT0gbnVsbCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNdXRlIENvZGV4J3Mgb3duIGFjdGl2ZS1zdGF0ZSBzdHlsaW5nIG9uIGl0cyBzaWRlYmFyIGJ1dHRvbnMuIFdlIGRvbid0XHJcbiAqIHRvdWNoIENvZGV4J3MgUmVhY3Qgc3RhdGUgXHUyMDE0IHdoZW4gdGhlIHVzZXIgY2xpY2tzIGEgbmF0aXZlIGl0ZW0sIENvZGV4XHJcbiAqIHJlLXJlbmRlcnMgdGhlIGJ1dHRvbnMgYW5kIHJlLWFwcGxpZXMgaXRzIG93biBjb3JyZWN0IHN0YXRlLCB0aGVuIG91clxyXG4gKiBzaWRlYmFyLWNsaWNrIGxpc3RlbmVyIGZpcmVzIGByZXN0b3JlQ29kZXhWaWV3YCAod2hpY2ggY2FsbHMgYmFjayBpbnRvXHJcbiAqIGBzZXROYXZBY3RpdmUobnVsbClgIGFuZCBsZXRzIENvZGV4J3Mgc3R5bGluZyBzdGFuZCkuXHJcbiAqXHJcbiAqIGBtdXRlPXRydWVgICBcdTIxOTIgc3RyaXAgYXJpYS1jdXJyZW50IGFuZCBzd2FwIGFjdGl2ZSBiZyBcdTIxOTIgaG92ZXIgYmdcclxuICogYG11dGU9ZmFsc2VgIFx1MjE5MiBuby1vcCAoQ29kZXgncyBvd24gcmUtcmVuZGVyIGFscmVhZHkgcmVzdG9yZWQgdGhpbmdzKVxyXG4gKi9cclxuZnVuY3Rpb24gc3luY0NvZGV4TmF0aXZlTmF2QWN0aXZlKG11dGU6IGJvb2xlYW4pOiB2b2lkIHtcclxuICBpZiAoIW11dGUpIHJldHVybjtcclxuICBjb25zdCByb290ID0gc3RhdGUuc2lkZWJhclJvb3Q7XHJcbiAgaWYgKCFyb290KSByZXR1cm47XHJcbiAgY29uc3QgYnV0dG9ucyA9IEFycmF5LmZyb20ocm9vdC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxCdXR0b25FbGVtZW50PihcImJ1dHRvblwiKSk7XHJcbiAgZm9yIChjb25zdCBidG4gb2YgYnV0dG9ucykge1xyXG4gICAgLy8gU2tpcCBvdXIgb3duIGJ1dHRvbnMuXHJcbiAgICBpZiAoYnRuLmRhdGFzZXQuY29kZXhwcCkgY29udGludWU7XHJcbiAgICBpZiAoYnRuLmdldEF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiKSA9PT0gXCJwYWdlXCIpIHtcclxuICAgICAgYnRuLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiKTtcclxuICAgIH1cclxuICAgIGlmIChidG4uY2xhc3NMaXN0LmNvbnRhaW5zKFwiYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpKSB7XHJcbiAgICAgIGJ0bi5jbGFzc0xpc3QucmVtb3ZlKFwiYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpO1xyXG4gICAgICBidG4uY2xhc3NMaXN0LmFkZChcImhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZFwiKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFwcGx5TmF2QWN0aXZlKGJ0bjogSFRNTEJ1dHRvbkVsZW1lbnQsIGFjdGl2ZTogYm9vbGVhbik6IHZvaWQge1xyXG4gIGNvbnN0IGlubmVyID0gYnRuLmZpcnN0RWxlbWVudENoaWxkIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcclxuICBpZiAoYWN0aXZlKSB7XHJcbiAgICAgIGJ0bi5jbGFzc0xpc3QucmVtb3ZlKFwiaG92ZXI6YmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIsIFwiZm9udC1ub3JtYWxcIik7XHJcbiAgICAgIGJ0bi5jbGFzc0xpc3QuYWRkKFwiYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpO1xyXG4gICAgICBidG4uc2V0QXR0cmlidXRlKFwiYXJpYS1jdXJyZW50XCIsIFwicGFnZVwiKTtcclxuICAgICAgaWYgKGlubmVyKSB7XHJcbiAgICAgICAgaW5uZXIuY2xhc3NMaXN0LnJlbW92ZShcInRleHQtdG9rZW4tZm9yZWdyb3VuZFwiKTtcclxuICAgICAgICBpbm5lci5jbGFzc0xpc3QuYWRkKFwidGV4dC10b2tlbi1saXN0LWFjdGl2ZS1zZWxlY3Rpb24tZm9yZWdyb3VuZFwiKTtcclxuICAgICAgICBpbm5lclxyXG4gICAgICAgICAgLnF1ZXJ5U2VsZWN0b3IoXCJzdmdcIilcclxuICAgICAgICAgID8uY2xhc3NMaXN0LmFkZChcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWljb24tZm9yZWdyb3VuZFwiKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYnRuLmNsYXNzTGlzdC5hZGQoXCJob3ZlcjpiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmRcIiwgXCJmb250LW5vcm1hbFwiKTtcclxuICAgICAgYnRuLmNsYXNzTGlzdC5yZW1vdmUoXCJiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmRcIik7XHJcbiAgICAgIGJ0bi5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWN1cnJlbnRcIik7XHJcbiAgICAgIGlmIChpbm5lcikge1xyXG4gICAgICAgIGlubmVyLmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LXRva2VuLWZvcmVncm91bmRcIik7XHJcbiAgICAgICAgaW5uZXIuY2xhc3NMaXN0LnJlbW92ZShcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWZvcmVncm91bmRcIik7XHJcbiAgICAgICAgaW5uZXJcclxuICAgICAgICAgIC5xdWVyeVNlbGVjdG9yKFwic3ZnXCIpXHJcbiAgICAgICAgICA/LmNsYXNzTGlzdC5yZW1vdmUoXCJ0ZXh0LXRva2VuLWxpc3QtYWN0aXZlLXNlbGVjdGlvbi1pY29uLWZvcmVncm91bmRcIik7XHJcbiAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwIGFjdGl2YXRpb24gXHUyNTAwXHUyNTAwXHJcblxyXG5mdW5jdGlvbiBhY3RpdmF0ZVBhZ2UocGFnZTogQWN0aXZlUGFnZSk6IHZvaWQge1xyXG4gIGNvbnN0IGNvbnRlbnQgPSBmaW5kQ29udGVudEFyZWEoKTtcclxuICBpZiAoIWNvbnRlbnQpIHtcclxuICAgIHBsb2coXCJhY3RpdmF0ZTogY29udGVudCBhcmVhIG5vdCBmb3VuZFwiKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgc3RhdGUuYWN0aXZlUGFnZSA9IHBhZ2U7XHJcbiAgcGxvZyhcImFjdGl2YXRlXCIsIHsgcGFnZSB9KTtcclxuXHJcbiAgLy8gSGlkZSBDb2RleCdzIGNvbnRlbnQgY2hpbGRyZW4sIHNob3cgb3Vycy5cclxuICBmb3IgKGNvbnN0IGNoaWxkIG9mIEFycmF5LmZyb20oY29udGVudC5jaGlsZHJlbikgYXMgSFRNTEVsZW1lbnRbXSkge1xyXG4gICAgaWYgKGNoaWxkLmRhdGFzZXQuY29kZXhwcCA9PT0gXCJ0d2Vha3MtcGFuZWxcIikgY29udGludWU7XHJcbiAgICBpZiAoY2hpbGQuZGF0YXNldC5jb2RleHBwSGlkZGVuID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgY2hpbGQuZGF0YXNldC5jb2RleHBwSGlkZGVuID0gY2hpbGQuc3R5bGUuZGlzcGxheSB8fCBcIlwiO1xyXG4gICAgfVxyXG4gICAgY2hpbGQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gIH1cclxuICBsZXQgcGFuZWwgPSBjb250ZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KCdbZGF0YS1jb2RleHBwPVwidHdlYWtzLXBhbmVsXCJdJyk7XHJcbiAgaWYgKCFwYW5lbCkge1xyXG4gICAgcGFuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgcGFuZWwuZGF0YXNldC5jb2RleHBwID0gXCJ0d2Vha3MtcGFuZWxcIjtcclxuICAgIHBhbmVsLnN0eWxlLmNzc1RleHQgPSBcIndpZHRoOjEwMCU7aGVpZ2h0OjEwMCU7b3ZlcmZsb3c6YXV0bztcIjtcclxuICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQocGFuZWwpO1xyXG4gIH1cclxuICBwYW5lbC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xyXG4gIHN0YXRlLnBhbmVsSG9zdCA9IHBhbmVsO1xyXG4gIHJlcmVuZGVyKCk7XHJcbiAgc2V0TmF2QWN0aXZlKHBhZ2UpO1xyXG4gIC8vIHJlc3RvcmUgQ29kZXgncyB2aWV3LiBSZS1yZWdpc3RlciBpZiBuZWVkZWQuXHJcbiAgY29uc3Qgc2lkZWJhciA9IHN0YXRlLnNpZGViYXJSb290O1xyXG4gIGlmIChzaWRlYmFyKSB7XHJcbiAgICBpZiAoc3RhdGUuc2lkZWJhclJlc3RvcmVIYW5kbGVyKSB7XHJcbiAgICAgIHNpZGViYXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHN0YXRlLnNpZGViYXJSZXN0b3JlSGFuZGxlciwgdHJ1ZSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBoYW5kbGVyID0gKGU6IEV2ZW50KSA9PiB7XHJcbiAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcclxuICAgICAgaWYgKCF0YXJnZXQpIHJldHVybjtcclxuICAgICAgaWYgKHN0YXRlLm5hdkdyb3VwPy5jb250YWlucyh0YXJnZXQpKSByZXR1cm47IC8vIG91ciBidXR0b25zXHJcbiAgICAgIGlmIChzdGF0ZS5wYWdlc0dyb3VwPy5jb250YWlucyh0YXJnZXQpKSByZXR1cm47IC8vIG91ciBwYWdlIGJ1dHRvbnNcclxuICAgICAgaWYgKHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtY29kZXhwcC1zZXR0aW5ncy1zZWFyY2hdXCIpKSByZXR1cm47XHJcbiAgICAgIHJlc3RvcmVDb2RleFZpZXcoKTtcclxuICAgIH07XHJcbiAgICBzdGF0ZS5zaWRlYmFyUmVzdG9yZUhhbmRsZXIgPSBoYW5kbGVyO1xyXG4gICAgc2lkZWJhci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaGFuZGxlciwgdHJ1ZSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiByZXN0b3JlQ29kZXhWaWV3KCk6IHZvaWQge1xyXG4gIHBsb2coXCJyZXN0b3JlIGNvZGV4IHZpZXdcIik7XHJcbiAgY29uc3QgY29udGVudCA9IGZpbmRDb250ZW50QXJlYSgpO1xyXG4gIGlmICghY29udGVudCkgcmV0dXJuO1xyXG4gIGlmIChzdGF0ZS5wYW5lbEhvc3QpIHN0YXRlLnBhbmVsSG9zdC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgZm9yIChjb25zdCBjaGlsZCBvZiBBcnJheS5mcm9tKGNvbnRlbnQuY2hpbGRyZW4pIGFzIEhUTUxFbGVtZW50W10pIHtcclxuICAgIGlmIChjaGlsZCA9PT0gc3RhdGUucGFuZWxIb3N0KSBjb250aW51ZTtcclxuICAgIGlmIChjaGlsZC5kYXRhc2V0LmNvZGV4cHBIaWRkZW4gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjaGlsZC5zdHlsZS5kaXNwbGF5ID0gY2hpbGQuZGF0YXNldC5jb2RleHBwSGlkZGVuO1xyXG4gICAgICBkZWxldGUgY2hpbGQuZGF0YXNldC5jb2RleHBwSGlkZGVuO1xyXG4gICAgfVxyXG4gIH1cclxuICBzdGF0ZS5hY3RpdmVQYWdlID0gbnVsbDtcclxuICBzZXROYXZBY3RpdmUobnVsbCk7XHJcbiAgaWYgKHN0YXRlLnNpZGViYXJSb290ICYmIHN0YXRlLnNpZGViYXJSZXN0b3JlSGFuZGxlcikge1xyXG4gICAgc3RhdGUuc2lkZWJhclJvb3QucmVtb3ZlRXZlbnRMaXN0ZW5lcihcclxuICAgICAgXCJjbGlja1wiLFxyXG4gICAgICBzdGF0ZS5zaWRlYmFyUmVzdG9yZUhhbmRsZXIsXHJcbiAgICAgIHRydWUsXHJcbiAgICApO1xyXG4gICAgc3RhdGUuc2lkZWJhclJlc3RvcmVIYW5kbGVyID0gbnVsbDtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlcmVuZGVyKCk6IHZvaWQge1xyXG4gIGlmICghc3RhdGUuYWN0aXZlUGFnZSkgcmV0dXJuO1xyXG4gIGNvbnN0IGhvc3QgPSBzdGF0ZS5wYW5lbEhvc3Q7XHJcbiAgaWYgKCFob3N0KSByZXR1cm47XHJcbiAgaG9zdC5pbm5lckhUTUwgPSBcIlwiO1xyXG5cclxuICBjb25zdCBhcCA9IHN0YXRlLmFjdGl2ZVBhZ2U7XHJcbiAgaWYgKGFwLmtpbmQgPT09IFwicmVnaXN0ZXJlZFwiKSB7XHJcbiAgICBjb25zdCBlbnRyeSA9IHN0YXRlLnBhZ2VzLmdldChhcC5pZCk7XHJcbiAgICBpZiAoIWVudHJ5KSB7XHJcbiAgICAgIHJlc3RvcmVDb2RleFZpZXcoKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgcm9vdCA9IHBhbmVsU2hlbGwoZW50cnkucGFnZS50aXRsZSwgZW50cnkucGFnZS5kZXNjcmlwdGlvbik7XHJcbiAgICBob3N0LmFwcGVuZENoaWxkKHJvb3Qub3V0ZXIpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gVGVhciBkb3duIGFueSBwcmlvciByZW5kZXIgYmVmb3JlIHJlLXJlbmRlcmluZyAoaG90IHJlbG9hZCkuXHJcbiAgICAgIHRyeSB7IGVudHJ5LnRlYXJkb3duPy4oKTsgfSBjYXRjaCB7fVxyXG4gICAgICBlbnRyeS50ZWFyZG93biA9IG51bGw7XHJcbiAgICAgIGNvbnN0IHJldCA9IGVudHJ5LnBhZ2UucmVuZGVyKHJvb3Quc2VjdGlvbnNXcmFwKTtcclxuICAgICAgaWYgKHR5cGVvZiByZXQgPT09IFwiZnVuY3Rpb25cIikgZW50cnkudGVhcmRvd24gPSByZXQ7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgZXJyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIGVyci5jbGFzc05hbWUgPSBcInRleHQtdG9rZW4tY2hhcnRzLXJlZCB0ZXh0LXNtXCI7XG4gICAgICBlcnIudGV4dENvbnRlbnQgPSBgXHU2RTMyXHU2N0QzXHU5ODc1XHU5NzYyXHU1MUZBXHU5NTE5XHVGRjFBJHsoZSBhcyBFcnJvcikubWVzc2FnZX1gO1xuICAgICAgcm9vdC5zZWN0aW9uc1dyYXAuYXBwZW5kQ2hpbGQoZXJyKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGFwLmtpbmQgPT09IFwiYWdlbnQtcHJvdmlkZXJzXCIpIHtcbiAgICBjb25zdCByb290ID0gcGFuZWxTaGVsbChcIlx1NkEyMVx1NTc4Qlx1NjNBNVx1NTE2NVwiLCBcIlx1OUVEOFx1OEJBNFx1NEY3Rlx1NzUyOCBDb2RleCAvIE9wZW5BSSBcdTUzOUZcdTc1MUZcdTZBMjFcdTU3OEJcdUZGMENcdTRFNUZcdTUzRUZcdTRFRTVcdTUyMDdcdTYzNjJcdTUyMzBcdTdCMkNcdTRFMDlcdTY1QjlcdTZBMjFcdTU3OEJcdTY3MERcdTUyQTFcdTMwMDJcIik7XG4gICAgaG9zdC5hcHBlbmRDaGlsZChyb290Lm91dGVyKTtcbiAgICByZW5kZXJBZ2VudFByb3ZpZGVyc1BhZ2Uocm9vdC5zZWN0aW9uc1dyYXAsIHJvb3Quc3VidGl0bGUpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHRpdGxlID1cbiAgICBhcC5raW5kID09PSBcInR3ZWFrc1wiID8gXCJcdTYzRDJcdTRFRjZcIiA6XG4gICAgYXAua2luZCA9PT0gXCJzdG9yZVwiID8gXCJcdTYzRDJcdTRFRjZcdTU1NDZcdTVFOTdcIiA6IFwiY29kZXhcdTZDNDlcdTUzMTZcdTU4OUVcdTVGM0FwbHVzXHU3MjQ4XCI7XG4gIGNvbnN0IHN1YnRpdGxlID1cbiAgICBhcC5raW5kID09PSBcInR3ZWFrc1wiXG4gICAgICA/IFwiXHU3QkExXHU3NDA2XHU1REYyXHU1Qjg5XHU4OEM1XHU3Njg0IGNvZGV4XHU2QzQ5XHU1MzE2XHU1ODlFXHU1RjNBcGx1c1x1NzI0OCBcdTYzRDJcdTRFRjZcdTMwMDJcIlxuICAgICAgOiBhcC5raW5kID09PSBcInN0b3JlXCJcbiAgICAgICAgPyBcIlx1NUI4OVx1ODhDNVx1NURGMlx1NUJBMVx1NjgzOFx1MzAwMVx1NUU3Nlx1NTZGQVx1NUI5QVx1NTIzMFx1NjMwN1x1NUI5QSBHaXRIdWIgY29tbWl0IFx1NzY4NFx1NjNEMlx1NEVGNlx1MzAwMlwiXG4gICAgICAgIDogXCJcdTZCNjNcdTU3MjhcdTY4QzBcdTY3RTVcdTVERjJcdTVCODlcdTg4QzVcdTc2ODQgY29kZXhcdTZDNDlcdTUzMTZcdTU4OUVcdTVGM0FwbHVzXHU3MjQ4IFx1NzI0OFx1NjcyQ1x1MzAwMlwiO1xuICBjb25zdCByb290ID0gcGFuZWxTaGVsbCh0aXRsZSwgc3VidGl0bGUpO1xyXG4gIGhvc3QuYXBwZW5kQ2hpbGQocm9vdC5vdXRlcik7XHJcbiAgaWYgKGFwLmtpbmQgPT09IFwidHdlYWtzXCIpIHJlbmRlclR3ZWFrc1BhZ2Uocm9vdC5zZWN0aW9uc1dyYXApO1xyXG4gIGVsc2UgaWYgKGFwLmtpbmQgPT09IFwic3RvcmVcIikgcmVuZGVyVHdlYWtTdG9yZVBhZ2Uocm9vdC5zZWN0aW9uc1dyYXAsIHJvb3QuaGVhZGVyQWN0aW9ucyk7XHJcbiAgZWxzZSByZW5kZXJDb25maWdQYWdlKHJvb3Quc2VjdGlvbnNXcmFwLCByb290LnN1YnRpdGxlKTtcclxufVxyXG5cclxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwIHBhZ2VzIFx1MjUwMFx1MjUwMFxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQ29uZmlnUGFnZShcclxuICBzZWN0aW9uc1dyYXA6IEhUTUxFbGVtZW50LFxyXG4gIHN1YnRpdGxlPzogSFRNTEVsZW1lbnQsXHJcbik6IHZvaWQge1xyXG4gIGNvbnN0IHNlY3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VjdGlvblwiKTtcclxuICBzZWN0aW9uLmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LWNvbCBnYXAtMlwiO1xyXG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQoc2VjdGlvblRpdGxlKFwiY29kZXhcdTZDNDlcdTUzMTZcdTU4OUVcdTVGM0FwbHVzXHU3MjQ4IFx1NjZGNFx1NjVCMFwiKSk7XG4gIGNvbnN0IGNhcmQgPSByb3VuZGVkQ2FyZCgpO1xuICBjYXJkLmRhdGFzZXQuY29kZXhwcENvbmZpZ0NhcmQgPSBcInRydWVcIjtcbiAgY29uc3QgbG9hZGluZyA9IHJvd1NpbXBsZShcIlx1NkI2M1x1NTcyOFx1NTJBMFx1OEY3RFx1NjZGNFx1NjVCMFx1OEJCRVx1N0Y2RVwiLCBcIlx1NkI2M1x1NTcyOFx1NjhDMFx1NjdFNVx1NUY1M1x1NTI0RCBjb2RleFx1NkM0OVx1NTMxNlx1NTg5RVx1NUYzQXBsdXNcdTcyNDggXHU5MTREXHU3RjZFXHUzMDAyXCIpO1xuICBjYXJkLmFwcGVuZENoaWxkKGxvYWRpbmcpO1xyXG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQoY2FyZCk7XHJcbiAgc2VjdGlvbnNXcmFwLmFwcGVuZENoaWxkKHNlY3Rpb24pO1xyXG5cclxuICB2b2lkIGlwY1JlbmRlcmVyXHJcbiAgICAuaW52b2tlKFwiY29kZXhwcDpnZXQtY29uZmlnXCIpXHJcbiAgICAudGhlbigoY29uZmlnKSA9PiB7XHJcbiAgICAgIGlmIChzdWJ0aXRsZSkge1xyXG4gICAgICAgIHN1YnRpdGxlLnRleHRDb250ZW50ID0gYFx1NURGMlx1NUI4OVx1ODhDNSBjb2RleFx1NkM0OVx1NTMxNlx1NTg5RVx1NUYzQXBsdXNcdTcyNDggJHsoY29uZmlnIGFzIENvZGV4UGx1c1BsdXNDb25maWcpLnZlcnNpb259XHUzMDAyYDtcbiAgICAgIH1cclxuICAgICAgY2FyZC50ZXh0Q29udGVudCA9IFwiXCI7XHJcbiAgICAgIHJlbmRlckNvZGV4UGx1c1BsdXNDb25maWcoY2FyZCwgY29uZmlnIGFzIENvZGV4UGx1c1BsdXNDb25maWcpO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaCgoZSkgPT4ge1xyXG4gICAgICBpZiAoc3VidGl0bGUpIHN1YnRpdGxlLnRleHRDb250ZW50ID0gXCJcdTY1RTBcdTZDRDVcdTUyQTBcdThGN0RcdTVERjJcdTVCODlcdTg4QzVcdTc2ODQgY29kZXhcdTZDNDlcdTUzMTZcdTU4OUVcdTVGM0FwbHVzXHU3MjQ4IFx1NzI0OFx1NjcyQ1x1MzAwMlwiO1xuICAgICAgY2FyZC50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICBjYXJkLmFwcGVuZENoaWxkKHJvd1NpbXBsZShcIlx1NjVFMFx1NkNENVx1NTJBMFx1OEY3RFx1NjZGNFx1NjVCMFx1OEJCRVx1N0Y2RVwiLCBTdHJpbmcoZSkpKTtcbiAgICB9KTtcclxuXHJcbiAgY29uc3Qgd2F0Y2hlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWN0aW9uXCIpO1xyXG4gIHdhdGNoZXIuY2xhc3NOYW1lID0gXCJmbGV4IGZsZXgtY29sIGdhcC0yXCI7XHJcbiAgd2F0Y2hlci5hcHBlbmRDaGlsZChzZWN0aW9uVGl0bGUoXCJcdTU0MEVcdTUzRjBcdTRGRUVcdTU5MERcdTY3MERcdTUyQTFcIikpO1xuICBjb25zdCB3YXRjaGVyQ2FyZCA9IHJvdW5kZWRDYXJkKCk7XG4gIHdhdGNoZXJDYXJkLmFwcGVuZENoaWxkKHJvd1NpbXBsZShcIlx1NkI2M1x1NTcyOFx1NjhDMFx1NjdFNVx1NTQwRVx1NTNGMFx1NjcwRFx1NTJBMVwiLCBcIlx1NkI2M1x1NTcyOFx1OUE4Q1x1OEJDMVx1NjZGNFx1NjVCMFx1NTY2OFx1NEZFRVx1NTkwRFx1NjcwRFx1NTJBMVx1MzAwMlwiKSk7XG4gIHdhdGNoZXIuYXBwZW5kQ2hpbGQod2F0Y2hlckNhcmQpO1xyXG4gIHNlY3Rpb25zV3JhcC5hcHBlbmRDaGlsZCh3YXRjaGVyKTtcclxuICByZW5kZXJXYXRjaGVySGVhbHRoQ2FyZCh3YXRjaGVyQ2FyZCk7XHJcblxyXG4gIGNvbnN0IG1haW50ZW5hbmNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlY3Rpb25cIik7XHJcbiAgbWFpbnRlbmFuY2UuY2xhc3NOYW1lID0gXCJmbGV4IGZsZXgtY29sIGdhcC0yXCI7XHJcbiAgbWFpbnRlbmFuY2UuYXBwZW5kQ2hpbGQoc2VjdGlvblRpdGxlKFwiXHU3RUY0XHU2MkE0XCIpKTtcbiAgY29uc3QgbWFpbnRlbmFuY2VDYXJkID0gcm91bmRlZENhcmQoKTtcclxuICBtYWludGVuYW5jZUNhcmQuYXBwZW5kQ2hpbGQodW5pbnN0YWxsUm93KCkpO1xyXG4gIG1haW50ZW5hbmNlQ2FyZC5hcHBlbmRDaGlsZChyZXBvcnRCdWdSb3coKSk7XG4gIG1haW50ZW5hbmNlLmFwcGVuZENoaWxkKG1haW50ZW5hbmNlQ2FyZCk7XG4gIHNlY3Rpb25zV3JhcC5hcHBlbmRDaGlsZChtYWludGVuYW5jZSk7XG59XG5cbmNvbnN0IEFHRU5UX1BST1ZJREVSX1NFTEVDVElPTl9LRVkgPSBcImNvZGV4cHA6YWdlbnQtcHJvdmlkZXItc2VsZWN0aW9uXCI7XG5cbmZ1bmN0aW9uIHJlbmRlckFnZW50UHJvdmlkZXJzUGFnZShcbiAgc2VjdGlvbnNXcmFwOiBIVE1MRWxlbWVudCxcbiAgc3VidGl0bGU/OiBIVE1MRWxlbWVudCxcbik6IHZvaWQge1xuICBjb25zdCBwaWNrZXJTZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlY3Rpb25cIik7XG4gIHBpY2tlclNlY3Rpb24uY2xhc3NOYW1lID0gXCJmbGV4IGZsZXgtY29sIGdhcC0yXCI7XG4gIHBpY2tlclNlY3Rpb24uYXBwZW5kQ2hpbGQoc2VjdGlvblRpdGxlKFwiXHU2M0E1XHU1MTY1XHU2NUI5XHU1RjBGXCIpKTtcbiAgY29uc3QgcGlja2VyQ2FyZCA9IHJvdW5kZWRDYXJkKCk7XG4gIGNvbnN0IHBpY2tlciA9IGFnZW50U2VsZWN0KFwiY29kZXgtbmF0aXZlXCIsIFtcbiAgICBbXCJjb2RleC1uYXRpdmVcIiwgXCJDb2RleCAvIE9wZW5BSSBcdTUzOUZcdTc1MUZcdTZBMjFcdTU3OEJcIl0sXG4gICAgLi4uQUdFTlRfUFJPVklERVJTLm1hcCgocHJvdmlkZXIpID0+IFtwcm92aWRlci5pZCwgcHJvdmlkZXIubGFiZWxdIGFzIFtzdHJpbmcsIHN0cmluZ10pLFxuICBdKTtcbiAgcGlja2VyLmRpc2FibGVkID0gdHJ1ZTtcbiAgcGlja2VyQ2FyZC5hcHBlbmRDaGlsZChcbiAgICBhZ2VudENvbnRyb2xSb3coXG4gICAgICBcIlx1NUY1M1x1NTI0RFx1NkEyMVx1NTc4Qlx1Njc2NVx1NkU5MFwiLFxuICAgICAgXCJcdTlFRDhcdThCQTRcdTZDQkZcdTc1MjggQ29kZXggXHU4MUVBXHU1RTI2XHU2QTIxXHU1NzhCXHVGRjFCXHU5MDA5XHU2MkU5XHU3QjJDXHU0RTA5XHU2NUI5XHU1NDBFXHU1NzI4XHU0RTBCXHU2NUI5XHU5MTREXHU3RjZFIEFQSSBLZXkgXHU1NDhDXHU2QTIxXHU1NzhCXHUzMDAyXCIsXG4gICAgICBwaWNrZXIsXG4gICAgKSxcbiAgKTtcbiAgcGlja2VyU2VjdGlvbi5hcHBlbmRDaGlsZChwaWNrZXJDYXJkKTtcbiAgc2VjdGlvbnNXcmFwLmFwcGVuZENoaWxkKHBpY2tlclNlY3Rpb24pO1xuXG4gIGNvbnN0IHByb3ZpZGVyQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHByb3ZpZGVyQ29udGVudC5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLVt2YXIoLS1wYWRkaW5nLXBhbmVsKV1cIjtcbiAgc2VjdGlvbnNXcmFwLmFwcGVuZENoaWxkKHByb3ZpZGVyQ29udGVudCk7XG4gIHByb3ZpZGVyQ29udGVudC5hcHBlbmRDaGlsZChyb3dTaW1wbGUoXCJcdTZCNjNcdTU3MjhcdThCRkJcdTUzRDZcdTVGNTNcdTUyNERcdTZBMjFcdTU3OEJcdTY3NjVcdTZFOTBcIiwgXCJcdTZCNjNcdTU3MjhcdTRFQ0VcdTRFM0JcdThGREJcdTdBMEJcdThCRkJcdTUzRDZcdTc3MUZcdTVCOUVcdTYzQTVcdTdCQTFcdTcyQjZcdTYwMDFcdTMwMDJcIikpO1xuXG4gIGNvbnN0IHJlbmRlclNlbGVjdGVkID0gKFxuICAgIHNlbGVjdGlvbjogQWdlbnRQcm92aWRlclNlbGVjdGlvbixcbiAgICBvcHRpb25zOiB7IHN5bmNTZWxlY3Rpb24/OiBib29sZWFuOyBwcm9tcHRYaWFvYmFpUmVnaXN0cmF0aW9uPzogYm9vbGVhbiB9ID0ge30sXG4gICk6IHZvaWQgPT4ge1xuICAgIHByb3ZpZGVyQ29udGVudC50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgd3JpdGVBZ2VudFByb3ZpZGVyU2VsZWN0aW9uKHNlbGVjdGlvbik7XG4gICAgaWYgKG9wdGlvbnMuc3luY1NlbGVjdGlvbikge1xuICAgICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOnNldC1hY3RpdmUtYWdlbnQtcHJvdmlkZXJcIiwgc2VsZWN0aW9uKVxuICAgICAgICAudGhlbigoKSA9PiByZWZyZXNoQ29tcG9zZXJNb2RlbFNvdXJjZUxhYmVsKCkpXG4gICAgICAgIC5jYXRjaCgoKSA9PiB1bmRlZmluZWQpO1xuICAgIH1cbiAgICBpZiAoc2VsZWN0aW9uID09PSBcImNvZGV4LW5hdGl2ZVwiKSB7XG4gICAgICBpZiAoc3VidGl0bGUpIHN1YnRpdGxlLnRleHRDb250ZW50ID0gXCJcdTRGN0ZcdTc1MjggQ29kZXggXHU1RjUzXHU1MjREXHU3Njg0IE9wZW5BSSBcdTUzOUZcdTc1MUZcdTZBMjFcdTU3OEJcdTkxNERcdTdGNkVcdUZGMENcdTRFMERcdTk3MDBcdTg5ODFcdTk4OURcdTU5MTZcdTU4NkJcdTUxOTlcdTY3MERcdTUyQTFcdTU1NDZcdTRGRTFcdTYwNkZcdTMwMDJcIjtcbiAgICAgIHJlbmRlckNvZGV4TmF0aXZlUHJvdmlkZXIocHJvdmlkZXJDb250ZW50KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbWV0YSA9IGFnZW50UHJvdmlkZXJNZXRhKHNlbGVjdGlvbik7XG4gICAgaWYgKHN1YnRpdGxlKSBzdWJ0aXRsZS50ZXh0Q29udGVudCA9IG1ldGEuZGVzY3JpcHRpb247XG4gICAgcmVuZGVyQWdlbnRQcm92aWRlclBhZ2UocHJvdmlkZXJDb250ZW50LCBzZWxlY3Rpb24sIHN1YnRpdGxlLCB7XG4gICAgICBwcm9tcHRYaWFvYmFpUmVnaXN0cmF0aW9uOiBvcHRpb25zLnByb21wdFhpYW9iYWlSZWdpc3RyYXRpb24gPT09IHRydWUsXG4gICAgfSk7XG4gIH07XG5cbiAgcGlja2VyLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgaWYgKCFldmVudC5pc1RydXN0ZWQpIHJldHVybjtcbiAgICByZW5kZXJTZWxlY3RlZChhc0FnZW50UHJvdmlkZXJTZWxlY3Rpb24ocGlja2VyLnZhbHVlKSwge1xuICAgICAgc3luY1NlbGVjdGlvbjogdHJ1ZSxcbiAgICAgIHByb21wdFhpYW9iYWlSZWdpc3RyYXRpb246IHRydWUsXG4gICAgfSk7XG4gIH0pO1xuICB2b2lkIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Z2V0LWFjdGl2ZS1hZ2VudC1wcm92aWRlclwiKVxuICAgIC50aGVuKChhY3RpdmUpID0+IHtcbiAgICAgIGNvbnN0IG5leHQgPSBhc0FnZW50UHJvdmlkZXJTZWxlY3Rpb24oYWN0aXZlKTtcbiAgICAgIHBpY2tlci52YWx1ZSA9IG5leHQ7XG4gICAgICByZW5kZXJTZWxlY3RlZChuZXh0KTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgcHJvdmlkZXJDb250ZW50LnRleHRDb250ZW50ID0gXCJcIjtcbiAgICAgIHByb3ZpZGVyQ29udGVudC5hcHBlbmRDaGlsZChyb3dTaW1wbGUoXCJcdTY1RTBcdTZDRDVcdThCRkJcdTUzRDZcdTVGNTNcdTUyNERcdTZBMjFcdTU3OEJcdTY3NjVcdTZFOTBcIiwgZm9ybWF0QWdlbnRQcm92aWRlckNhdWdodEVycm9yKGUpKSk7XG4gICAgfSlcbiAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICBwaWNrZXIuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyQ29kZXhOYXRpdmVQcm92aWRlcihzZWN0aW9uc1dyYXA6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGNvbnN0IHNlY3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VjdGlvblwiKTtcbiAgc2VjdGlvbi5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLTJcIjtcbiAgc2VjdGlvbi5hcHBlbmRDaGlsZChzZWN0aW9uVGl0bGUoXCJDb2RleCBcdTUzOUZcdTc1MUZcdTZBMjFcdTU3OEJcIikpO1xuICBjb25zdCBjYXJkID0gcm91bmRlZENhcmQoKTtcbiAgY2FyZC5hcHBlbmRDaGlsZChcbiAgICByb3dTaW1wbGUoXG4gICAgICBcIlx1NEY3Rlx1NzUyOCBDb2RleCAvIE9wZW5BSSBcdTUzOUZcdTc1MUZcdTZBMjFcdTU3OEJcIixcbiAgICAgIFwiXHU1RjUzXHU1MjREXHU0RjFBXHU3RUU3XHU3RUVEXHU0RjdGXHU3NTI4IENvZGV4IFx1ODFFQVx1OEVBQlx1NzY4NFx1NkEyMVx1NTc4Qlx1OTAwOVx1NjJFOVx1NTQ4Q1x1OTI3NFx1Njc0M1x1OTE0RFx1N0Y2RVx1RkYxQlx1N0IyQ1x1NEUwOVx1NjVCOVx1NjNBNVx1NTE2NVx1NEUwRFx1NEYxQVx1ODk4Nlx1NzZENlx1NUI4M1x1MzAwMlwiLFxuICAgICksXG4gICk7XG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQoY2FyZCk7XG4gIHNlY3Rpb25zV3JhcC5hcHBlbmRDaGlsZChzZWN0aW9uKTtcbn1cblxuZnVuY3Rpb24gcmVhZEFnZW50UHJvdmlkZXJTZWxlY3Rpb24oKTogQWdlbnRQcm92aWRlclNlbGVjdGlvbiB7XG4gIHJldHVybiBhc0FnZW50UHJvdmlkZXJTZWxlY3Rpb24obG9jYWxTdG9yYWdlLmdldEl0ZW0oQUdFTlRfUFJPVklERVJfU0VMRUNUSU9OX0tFWSkpO1xufVxuXG5mdW5jdGlvbiB3cml0ZUFnZW50UHJvdmlkZXJTZWxlY3Rpb24oc2VsZWN0aW9uOiBBZ2VudFByb3ZpZGVyU2VsZWN0aW9uKTogdm9pZCB7XG4gIGxvY2FsU3RvcmFnZS5zZXRJdGVtKEFHRU5UX1BST1ZJREVSX1NFTEVDVElPTl9LRVksIHNlbGVjdGlvbik7XG59XG5cbmZ1bmN0aW9uIGFzQWdlbnRQcm92aWRlclNlbGVjdGlvbih2YWx1ZTogdW5rbm93bik6IEFnZW50UHJvdmlkZXJTZWxlY3Rpb24ge1xuICBpZiAodmFsdWUgPT09IFwiZGVlcHNlZWtcIiB8fCB2YWx1ZSA9PT0gXCJ6aGlwdVwiIHx8IHZhbHVlID09PSBcInF3ZW5cIikgcmV0dXJuIHZhbHVlO1xuICByZXR1cm4gXCJjb2RleC1uYXRpdmVcIjtcbn1cblxuZnVuY3Rpb24gcmVuZGVyQWdlbnRQcm92aWRlclBhZ2UoXG4gIHNlY3Rpb25zV3JhcDogSFRNTEVsZW1lbnQsXG4gIHByb3ZpZGVySWQ6IEFnZW50UHJvdmlkZXJJZCxcbiAgc3VidGl0bGU/OiBIVE1MRWxlbWVudCxcbiAgb3B0aW9uczogeyBwcm9tcHRYaWFvYmFpUmVnaXN0cmF0aW9uPzogYm9vbGVhbiB9ID0ge30sXG4pOiB2b2lkIHtcbiAgY29uc3QgbWV0YSA9IGFnZW50UHJvdmlkZXJNZXRhKHByb3ZpZGVySWQpO1xuXG4gIGNvbnN0IHNldHRpbmdzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlY3Rpb25cIik7XG4gIHNldHRpbmdzLmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LWNvbCBnYXAtMlwiO1xuICBzZXR0aW5ncy5hcHBlbmRDaGlsZChzZWN0aW9uVGl0bGUoXCJcdThGREVcdTYzQTVcdThCQkVcdTdGNkVcIikpO1xuICBjb25zdCBzZXR0aW5nc0NhcmQgPSByb3VuZGVkQ2FyZCgpO1xuICBzZXR0aW5nc0NhcmQuYXBwZW5kQ2hpbGQocm93U2ltcGxlKFwiXHU2QjYzXHU1NzI4XHU1MkEwXHU4RjdEXHU4RkRFXHU2M0E1XHU4QkJFXHU3RjZFXCIsIFwiXHU2QjYzXHU1NzI4XHU4QkZCXHU1M0Q2XHU2NzJDXHU2NzNBXHU0RkREXHU1QjU4XHU3Njg0XHU2M0E1XHU1MTY1XHU5MTREXHU3RjZFXHUzMDAyXCIpKTtcbiAgc2V0dGluZ3MuYXBwZW5kQ2hpbGQoc2V0dGluZ3NDYXJkKTtcbiAgc2VjdGlvbnNXcmFwLmFwcGVuZENoaWxkKHNldHRpbmdzKTtcblxuICB2b2lkIGlwY1JlbmRlcmVyXG4gICAgLmludm9rZShcImNvZGV4cHA6Z2V0LWFnZW50LXByb3ZpZGVyLWNvbmZpZ1wiLCBwcm92aWRlcklkKVxuICAgIC50aGVuKChjb25maWcpID0+IHtcbiAgICAgIGlmIChzdWJ0aXRsZSkgc3VidGl0bGUudGV4dENvbnRlbnQgPSBtZXRhLmRlc2NyaXB0aW9uO1xuICAgICAgc2V0dGluZ3NDYXJkLnRleHRDb250ZW50ID0gXCJcIjtcbiAgICAgIGNvbnN0IHZpZXdDb25maWcgPSBjb25maWcgYXMgQWdlbnRQcm92aWRlckNvbmZpZ1ZpZXc7XG4gICAgICByZW5kZXJBZ2VudFByb3ZpZGVyQ29uZmlnKHNldHRpbmdzQ2FyZCwgcHJvdmlkZXJJZCwgdmlld0NvbmZpZyk7XG4gICAgICBpZiAob3B0aW9ucy5wcm9tcHRYaWFvYmFpUmVnaXN0cmF0aW9uKSB7XG4gICAgICAgIG1heWJlUHJvbXB0WGlhb2JhaVJlZ2lzdHJhdGlvbihwcm92aWRlcklkLCB2aWV3Q29uZmlnKTtcbiAgICAgIH1cbiAgICB9KVxuICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgaWYgKHN1YnRpdGxlKSBzdWJ0aXRsZS50ZXh0Q29udGVudCA9IGBcdTY1RTBcdTZDRDVcdTUyQTBcdThGN0QgJHttZXRhLmxhYmVsfSBcdTkxNERcdTdGNkVcdTMwMDJgO1xuICAgICAgc2V0dGluZ3NDYXJkLnRleHRDb250ZW50ID0gXCJcIjtcbiAgICAgIHNldHRpbmdzQ2FyZC5hcHBlbmRDaGlsZChyb3dTaW1wbGUoXCJcdTY1RTBcdTZDRDVcdTUyQTBcdThGN0RcdThGREVcdTYzQTVcdThCQkVcdTdGNkVcIiwgU3RyaW5nKGUpKSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckFnZW50UHJvdmlkZXJDb25maWcoXG4gIHNldHRpbmdzQ2FyZDogSFRNTEVsZW1lbnQsXG4gIHByb3ZpZGVySWQ6IEFnZW50UHJvdmlkZXJJZCxcbiAgY29uZmlnOiBBZ2VudFByb3ZpZGVyQ29uZmlnVmlldyxcbik6IHZvaWQge1xuICBjb25zdCBtZXRhID0gYWdlbnRQcm92aWRlck1ldGEocHJvdmlkZXJJZCk7XG4gIGxldCBlbmFibGVkID0gY29uZmlnLmVuYWJsZWQ7XG4gIGNvbnN0IGFwaUtleUlucHV0ID0gYWdlbnRUZXh0SW5wdXQoY29uZmlnLmFwaUtleSwgXCJzay0uLi5cIiwgXCJwYXNzd29yZFwiKTtcbiAgY29uc3QgYXBpS2V5Q29udHJvbCA9IGFwaUtleUlucHV0V2l0aFhpYW9iYWlBc3Npc3QoYXBpS2V5SW5wdXQsIHByb3ZpZGVySWQpO1xuICBjb25zdCBiYXNlVXJsSW5wdXQgPSBhZ2VudFRleHRJbnB1dChjb25maWcuYmFzZVVybCwgYWdlbnRCYXNlVXJsUGxhY2Vob2xkZXIocHJvdmlkZXJJZCwgY29uZmlnLm1vZGUpKTtcbiAgY29uc3QgbW9kZWxTZWxlY3QgPSBhZ2VudE1vZGVsU2VsZWN0KGNvbmZpZy5tb2RlbCk7XG4gIGNvbnN0IG1vZGVsU3RhdHVzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgbW9kZWxTdGF0dXMuY2xhc3NOYW1lID0gXCJtaW4taC01IHRleHQteHMgdGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xuICBjb25zdCByZWZyZXNoTW9kZWxzQnV0dG9uID0gY29tcGFjdEJ1dHRvbihcIlx1NTIzN1x1NjVCMFx1NkEyMVx1NTc4QlwiLCAoKSA9PiB7XG4gICAgdm9pZCByZWZyZXNoTW9kZWxzKCk7XG4gIH0pO1xuICBjb25zdCBhcHBJZElucHV0ID0gYWdlbnRUZXh0SW5wdXQoY29uZmlnLmFwcElkLCBcImFwcC0uLi5cIik7XG4gIGNvbnN0IHNlc3Npb25JZElucHV0ID0gYWdlbnRUZXh0SW5wdXQoY29uZmlnLnNlc3Npb25JZCwgXCJcdTUzRUZcdTkwMDlcdUZGMENcdTc1MjhcdTRFOEVcdThGREVcdTdFRURcdTVCRjlcdThCRERcIik7XG4gIGNvbnN0IHN5c3RlbVByb21wdElucHV0ID0gYWdlbnRUZXh0YXJlYShjb25maWcuc3lzdGVtUHJvbXB0LCBcIlx1NTNFRlx1OTAwOVx1RkYwQ1x1NEY4Qlx1NTk4Mlx1RkYxQVx1NEY2MFx1NjYyRlx1NEUwMFx1NEUyQVx1NEUyNVx1OEMyOFx1NzY4NFx1NEVFM1x1NzgwMVx1NTJBOVx1NjI0Qlx1MzAwMlwiLCAzKTtcbiAgY29uc3QgdGVtcGVyYXR1cmVJbnB1dCA9IGFnZW50TnVtYmVySW5wdXQoY29uZmlnLnRlbXBlcmF0dXJlLCBcIjAuN1wiLCBcIjBcIiwgXCIyXCIsIFwiMC4xXCIpO1xuICBjb25zdCBtYXhUb2tlbnNJbnB1dCA9IGFnZW50TnVtYmVySW5wdXQoY29uZmlnLm1heFRva2VucywgXCIyMDQ4XCIsIFwiMVwiLCBcIjM4NDAwMFwiLCBcIjFcIik7XG4gIGNvbnN0IG1vZGVTZWxlY3QgPSBhZ2VudFNlbGVjdChjb25maWcubW9kZSwgW1xuICAgIFtcImFwcFwiLCBcIlx1NzY3RVx1NzBCQ1x1NjY3QVx1ODBGRFx1NEY1M1x1NUU5NFx1NzUyOFwiXSxcbiAgICBbXCJjaGF0XCIsIFwiXHU1MzQzXHU5NUVFXHU2QTIxXHU1NzhCXHVGRjA4T3BlbkFJIFx1NTE3Q1x1NUJCOVx1RkYwOVwiXSxcbiAgXSk7XG4gIGNvbnN0IGFjY2Vzc01vZGVTZWxlY3QgPSBhZ2VudFNlbGVjdChjb25maWcuYWNjZXNzTW9kZSA/PyBcImJyaWRnZVwiLCBbXG4gICAgW1wiYnJpZGdlXCIsIFwiXHU2ODY1XHU2M0E1XHU2QTIxXHU1RjBGXHVGRjA4XHU0RkREXHU3NTU5IENvZGV4IFx1NzY3Qlx1NUY1NVx1RkYwOVwiXSxcbiAgICBbXCJwdXJlLWFwaVwiLCBcIlx1N0VBRiBBUEkgXHU2QTIxXHU1RjBGXHVGRjA4XHU0RTBEXHU0RjlEXHU4RDU2XHU1Qjk4XHU2NUI5XHU3NjdCXHU1RjU1XHVGRjA5XCJdLFxuICBdKTtcbiAgbGV0IHNhdmVkU3RhdHVzOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBsZXQgc2F2ZVRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGwgPSBudWxsO1xuICBsZXQgbGFzdEF1dG9UZXN0RmluZ2VycHJpbnQgPSBcIlwiO1xuICBsZXQgbGFzdFRydXN0ZWRVc2VyRWRpdEF0ID0gMDtcblxuICBjb25zdCBtYXJrVHJ1c3RlZFVzZXJFZGl0ID0gKGV2ZW50PzogRXZlbnQpOiB2b2lkID0+IHtcbiAgICBpZiAoZXZlbnQgJiYgIWV2ZW50LmlzVHJ1c3RlZCkgcmV0dXJuO1xuICAgIGxhc3RUcnVzdGVkVXNlckVkaXRBdCA9IERhdGUubm93KCk7XG4gIH07XG5cbiAgbW9kZVNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIChldmVudCkgPT4ge1xuICAgIG1hcmtUcnVzdGVkVXNlckVkaXQoZXZlbnQpO1xuICAgIGlmIChwcm92aWRlcklkICE9PSBcInF3ZW5cIikgcmV0dXJuO1xuICAgIGNvbnN0IGFwcEJhc2UgPSBhZ2VudEJhc2VVcmxQbGFjZWhvbGRlcihcInF3ZW5cIiwgXCJhcHBcIik7XG4gICAgY29uc3QgY2hhdEJhc2UgPSBhZ2VudEJhc2VVcmxQbGFjZWhvbGRlcihcInF3ZW5cIiwgXCJjaGF0XCIpO1xuICAgIGNvbnN0IGN1cnJlbnQgPSBiYXNlVXJsSW5wdXQudmFsdWUudHJpbSgpO1xuICAgIGlmICghY3VycmVudCB8fCBjdXJyZW50ID09PSBhcHBCYXNlIHx8IGN1cnJlbnQgPT09IGNoYXRCYXNlKSB7XG4gICAgICBiYXNlVXJsSW5wdXQudmFsdWUgPSBtb2RlU2VsZWN0LnZhbHVlID09PSBcImNoYXRcIiA/IGNoYXRCYXNlIDogYXBwQmFzZTtcbiAgICB9XG4gICAgc3luY01vZGVsU2VsZWN0U3RhdGUoKTtcbiAgICBzY2hlZHVsZUF1dG9TYXZlKHsgcmVmcmVzaE1vZGVsczogdHJ1ZSwgYXV0b1Rlc3Q6IHRydWUgfSk7XG4gIH0pO1xuXG4gIGNvbnN0IGNvbGxlY3QgPSAoKTogUGFydGlhbDxBZ2VudFByb3ZpZGVyQ29uZmlnVmlldz4gPT4gKHtcbiAgICBwcm92aWRlcjogcHJvdmlkZXJJZCxcbiAgICBlbmFibGVkLFxuICAgIGFwaUtleTogYXBpS2V5SW5wdXQudmFsdWUudHJpbSgpLFxuICAgIGJhc2VVcmw6IGJhc2VVcmxJbnB1dC52YWx1ZS50cmltKCksXG4gICAgbW9kZWw6IG1vZGVsU2VsZWN0LnZhbHVlLFxuICAgIGFwcElkOiBhcHBJZElucHV0LnZhbHVlLnRyaW0oKSxcbiAgICBtb2RlOiBtb2RlU2VsZWN0LnZhbHVlID09PSBcImNoYXRcIiA/IFwiY2hhdFwiIDogXCJhcHBcIixcbiAgICBhY2Nlc3NNb2RlOiBhY2Nlc3NNb2RlU2VsZWN0LnZhbHVlID09PSBcInB1cmUtYXBpXCIgPyBcInB1cmUtYXBpXCIgOiBcImJyaWRnZVwiLFxuICAgIHN5c3RlbVByb21wdDogc3lzdGVtUHJvbXB0SW5wdXQudmFsdWUudHJpbSgpLFxuICAgIHRlbXBlcmF0dXJlOiBjbGFtcE51bWJlcihOdW1iZXIodGVtcGVyYXR1cmVJbnB1dC52YWx1ZSksIDAsIDIsIGNvbmZpZy50ZW1wZXJhdHVyZSksXG4gICAgbWF4VG9rZW5zOiBNYXRoLnJvdW5kKGNsYW1wTnVtYmVyKE51bWJlcihtYXhUb2tlbnNJbnB1dC52YWx1ZSksIDEsIDM4NDAwMCwgY29uZmlnLm1heFRva2VucykpLFxuICAgIHNlc3Npb25JZDogc2Vzc2lvbklkSW5wdXQudmFsdWUudHJpbSgpLFxuICB9KTtcblxuICBjb25zdCByZWZyZXNoTW9kZWxzID0gYXN5bmMgKG9wdGlvbnM6IHsgYXV0b1Rlc3Q/OiBib29sZWFuIH0gPSB7fSk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIGlmICghc2hvdWxkVXNlTW9kZWxTZWxlY3QocHJvdmlkZXJJZCwgbW9kZVNlbGVjdC52YWx1ZSkpIHtcbiAgICAgIHNldEFnZW50TW9kZWxPcHRpb25zKG1vZGVsU2VsZWN0LCBbXSwgXCJcIik7XG4gICAgICBtb2RlbFNlbGVjdC5kaXNhYmxlZCA9IHRydWU7XG4gICAgICBtb2RlbFN0YXR1cy5jbGFzc05hbWUgPSBcIm1pbi1oLTUgdGV4dC14cyB0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5XCI7XG4gICAgICBtb2RlbFN0YXR1cy50ZXh0Q29udGVudCA9IFwiXHU3NjdFXHU3MEJDXHU2NjdBXHU4MEZEXHU0RjUzXHU1RTk0XHU3NTI4XHU2QTIxXHU1RjBGXHU0RTBEXHU5NzAwXHU4OTgxXHU5MDA5XHU2MkU5XHU2QTIxXHU1NzhCXHUzMDAyXCI7XG4gICAgICBpZiAob3B0aW9ucy5hdXRvVGVzdCkgdm9pZCBtYXliZUF1dG9UZXN0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghYXBpS2V5SW5wdXQudmFsdWUudHJpbSgpKSB7XG4gICAgICBzZXRBZ2VudE1vZGVsT3B0aW9ucyhtb2RlbFNlbGVjdCwgW10sIFwiXCIpO1xuICAgICAgbW9kZWxTZWxlY3QuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgbW9kZWxTdGF0dXMuY2xhc3NOYW1lID0gXCJtaW4taC01IHRleHQteHMgdGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xuICAgICAgbW9kZWxTdGF0dXMudGV4dENvbnRlbnQgPSBcIlx1NTg2Qlx1NTE5OSBBUEkgS2V5IFx1NTQwRVx1NEYxQVx1ODFFQVx1NTJBOFx1OEJGQlx1NTNENlx1NkEyMVx1NTc4Qlx1NTIxN1x1ODg2OFx1MzAwMlwiO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZWZyZXNoTW9kZWxzQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcbiAgICBtb2RlbFNlbGVjdC5kaXNhYmxlZCA9IHRydWU7XG4gICAgbW9kZWxTdGF0dXMuY2xhc3NOYW1lID0gXCJtaW4taC01IHRleHQteHMgdGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xuICAgIG1vZGVsU3RhdHVzLnRleHRDb250ZW50ID0gXCJcdTZCNjNcdTU3MjhcdThCRjdcdTZDNDJcdTZBMjFcdTU3OEJcdTUyMTdcdTg4NjhcdTMwMDJcIjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFxuICAgICAgICBcImNvZGV4cHA6bGlzdC1hZ2VudC1wcm92aWRlci1tb2RlbHNcIixcbiAgICAgICAgcHJvdmlkZXJJZCxcbiAgICAgICAgY29sbGVjdCgpLFxuICAgICAgKSBhcyBBZ2VudFByb3ZpZGVyTW9kZWxzVmlldztcbiAgICAgIGlmIChyZXN1bHQuZGlzYWJsZWRSZWFzb24pIHtcbiAgICAgICAgc2V0QWdlbnRNb2RlbE9wdGlvbnMobW9kZWxTZWxlY3QsIFtdLCBcIlwiKTtcbiAgICAgICAgbW9kZWxTZWxlY3QuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICBtb2RlbFN0YXR1cy50ZXh0Q29udGVudCA9IHJlc3VsdC5kaXNhYmxlZFJlYXNvbjtcbiAgICAgICAgaWYgKG9wdGlvbnMuYXV0b1Rlc3QpIHZvaWQgbWF5YmVBdXRvVGVzdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzZXRBZ2VudE1vZGVsT3B0aW9ucyhtb2RlbFNlbGVjdCwgcmVzdWx0Lm1vZGVscywgbW9kZWxTZWxlY3QudmFsdWUgfHwgY29uZmlnLm1vZGVsKTtcbiAgICAgIG1vZGVsU2VsZWN0LmRpc2FibGVkID0gcmVzdWx0Lm1vZGVscy5sZW5ndGggPT09IDA7XG4gICAgICBtb2RlbFN0YXR1cy5jbGFzc05hbWUgPSByZXN1bHQubW9kZWxzLmxlbmd0aCA+IDBcbiAgICAgICAgPyBcIm1pbi1oLTUgdGV4dC14cyB0ZXh0LXRva2VuLWNoYXJ0cy1ncmVlblwiXG4gICAgICAgIDogXCJtaW4taC01IHRleHQteHMgdGV4dC10b2tlbi1jaGFydHMtcmVkXCI7XG4gICAgICBtb2RlbFN0YXR1cy50ZXh0Q29udGVudCA9IHJlc3VsdC5tb2RlbHMubGVuZ3RoID4gMFxuICAgICAgICA/IGBcdTVERjJcdTUyQTBcdThGN0QgJHtyZXN1bHQubW9kZWxzLmxlbmd0aH0gXHU0RTJBXHU2QTIxXHU1NzhCXHUzMDAyYFxuICAgICAgICA6IFwiXHU2NzBEXHU1MkExXHU1NTQ2XHU2Q0ExXHU2NzA5XHU4RkQ0XHU1NkRFXHU1M0VGXHU5MDA5XHU2QTIxXHU1NzhCXHUzMDAyXCI7XG4gICAgICBpZiAob3B0aW9ucy5hdXRvVGVzdCkge1xuICAgICAgICBpZiAocmVzdWx0Lm1vZGVscy5sZW5ndGggPiAwKSB2b2lkIG1heWJlQXV0b1Rlc3QoKTtcbiAgICAgICAgZWxzZSBzaG93QWdlbnRQcm92aWRlclRlc3REaWFsb2coXCJcdTZENEJcdThCRDVcdTU5MzFcdThEMjVcIiwgXCJcdTY3MERcdTUyQTFcdTU1NDZcdTZDQTFcdTY3MDlcdThGRDRcdTU2REVcdTUzRUZcdTkwMDlcdTZBMjFcdTU3OEJcdUZGMENcdTY2ODJcdTY1RjZcdTY1RTBcdTZDRDVcdTUzRDFcdTkwMDFcdTZENEJcdThCRDVcdThCRjdcdTZDNDJcdTMwMDJcdThCRjdcdTc4NkVcdThCQTQgQVBJIEtleSBcdTY3NDNcdTk2NTBcdTMwMDFcdThEMjZcdTUzRjdcdTU3MzBcdTU3REZcdTU0OEMgQmFzZSBVUkwgXHU2NjJGXHU1NDI2XHU1MzM5XHU5MTREXHUzMDAyXCIsIFwiZXJyb3JcIik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgc2V0QWdlbnRNb2RlbE9wdGlvbnMobW9kZWxTZWxlY3QsIFtdLCBcIlwiKTtcbiAgICAgIG1vZGVsU2VsZWN0LmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgIG1vZGVsU3RhdHVzLmNsYXNzTmFtZSA9IFwibWluLWgtNSB0ZXh0LXhzIHRleHQtdG9rZW4tY2hhcnRzLXJlZFwiO1xuICAgICAgbW9kZWxTdGF0dXMudGV4dENvbnRlbnQgPSBmaXJzdExpbmUoZm9ybWF0QWdlbnRQcm92aWRlckNhdWdodEVycm9yKGUpKTtcbiAgICAgIGlmIChvcHRpb25zLmF1dG9UZXN0ICYmIGlzQ29tcGxldGVBZ2VudEFwaUtleShhcGlLZXlJbnB1dC52YWx1ZSkpIHtcbiAgICAgICAgc2hvd0FnZW50UHJvdmlkZXJUZXN0RGlhbG9nKFwiXHU2RDRCXHU4QkQ1XHU1OTMxXHU4RDI1XCIsIGBcdTY1RTBcdTZDRDVcdThCRkJcdTUzRDZcdTZBMjFcdTU3OEJcdTUyMTdcdTg4NjhcdTMwMDJcXG5cXG4ke2Zvcm1hdEFnZW50UHJvdmlkZXJDYXVnaHRFcnJvcihlKX1gLCBcImVycm9yXCIpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICByZWZyZXNoTW9kZWxzQnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHN5bmNNb2RlbFNlbGVjdFN0YXRlID0gKCk6IHZvaWQgPT4ge1xuICAgIHJlZnJlc2hNb2RlbHNCdXR0b24uZGlzYWJsZWQgPSAhc2hvdWxkVXNlTW9kZWxTZWxlY3QocHJvdmlkZXJJZCwgbW9kZVNlbGVjdC52YWx1ZSk7XG4gICAgaWYgKCFzaG91bGRVc2VNb2RlbFNlbGVjdChwcm92aWRlcklkLCBtb2RlU2VsZWN0LnZhbHVlKSkge1xuICAgICAgc2V0QWdlbnRNb2RlbE9wdGlvbnMobW9kZWxTZWxlY3QsIFtdLCBcIlwiKTtcbiAgICAgIG1vZGVsU2VsZWN0LmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgIG1vZGVsU3RhdHVzLmNsYXNzTmFtZSA9IFwibWluLWgtNSB0ZXh0LXhzIHRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnlcIjtcbiAgICAgIG1vZGVsU3RhdHVzLnRleHRDb250ZW50ID0gXCJcdTc2N0VcdTcwQkNcdTY2N0FcdTgwRkRcdTRGNTNcdTVFOTRcdTc1MjhcdTZBMjFcdTVGMEZcdTRFMERcdTk3MDBcdTg5ODFcdTkwMDlcdTYyRTlcdTZBMjFcdTU3OEJcdTMwMDJcIjtcbiAgICB9XG4gIH07XG5cbiAgY29uc3Qgc2F2ZUNvbmZpZyA9IGFzeW5jIChvcHRpb25zOiB7IHF1aWV0PzogYm9vbGVhbjsgc3RhdHVzPzogc3RyaW5nIH0gPSB7fSk6IFByb21pc2U8QWdlbnRQcm92aWRlckNvbmZpZ1ZpZXc+ID0+IHtcbiAgICBpZiAoc2F2ZWRTdGF0dXMgJiYgIW9wdGlvbnMucXVpZXQpIHtcbiAgICAgIHNhdmVkU3RhdHVzLmNsYXNzTmFtZSA9IFwibWluLWgtNSB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnlcIjtcbiAgICAgIHNhdmVkU3RhdHVzLnRleHRDb250ZW50ID0gb3B0aW9ucy5zdGF0dXMgPz8gXCJcdTZCNjNcdTU3MjhcdTgxRUFcdTUyQThcdTRGRERcdTVCNThcdTMwMDJcIjtcbiAgICB9XG4gICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXG4gICAgICBcImNvZGV4cHA6c2V0LWFnZW50LXByb3ZpZGVyLWNvbmZpZ1wiLFxuICAgICAgcHJvdmlkZXJJZCxcbiAgICAgIGNvbGxlY3QoKSxcbiAgICApIGFzIEFnZW50UHJvdmlkZXJDb25maWdWaWV3O1xuICAgIGlmIChzYXZlZFN0YXR1cyAmJiAhb3B0aW9ucy5xdWlldCkge1xuICAgICAgc2F2ZWRTdGF0dXMuY2xhc3NOYW1lID0gXCJtaW4taC01IHRleHQtc20gdGV4dC10b2tlbi1jaGFydHMtZ3JlZW5cIjtcbiAgICAgIHNhdmVkU3RhdHVzLnRleHRDb250ZW50ID0gXCJcdTVERjJcdTgxRUFcdTUyQThcdTRGRERcdTVCNThcdTMwMDJcIjtcbiAgICB9XG4gICAgcmVmcmVzaENvbXBvc2VyTW9kZWxTb3VyY2VMYWJlbCgpO1xuICAgIHJldHVybiBzYXZlZDtcbiAgfTtcblxuICBjb25zdCBtYXliZUF1dG9UZXN0ID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBjb2xsZWN0KCk7XG4gICAgaWYgKCFpc0FnZW50UHJvdmlkZXJSZWFkeUZvckF1dG9UZXN0KHByb3ZpZGVySWQsIGN1cnJlbnQpKSByZXR1cm47XG4gICAgY29uc3QgYXBpS2V5ID0gY3VycmVudC5hcGlLZXkgPz8gXCJcIjtcbiAgICBjb25zdCBmaW5nZXJwcmludCA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHByb3ZpZGVySWQsXG4gICAgICBlbmFibGVkOiBjdXJyZW50LmVuYWJsZWQsXG4gICAgICBtb2RlOiBjdXJyZW50Lm1vZGUsXG4gICAgICBhY2Nlc3NNb2RlOiBjdXJyZW50LmFjY2Vzc01vZGUsXG4gICAgICBiYXNlVXJsOiBjdXJyZW50LmJhc2VVcmwsXG4gICAgICBtb2RlbDogY3VycmVudC5tb2RlbCxcbiAgICAgIGFwcElkOiBjdXJyZW50LmFwcElkLFxuICAgICAgYXBpS2V5OiBgJHthcGlLZXkubGVuZ3RofToke2FwaUtleS5zbGljZSgtOCl9YCxcbiAgICB9KTtcbiAgICBpZiAoZmluZ2VycHJpbnQgPT09IGxhc3RBdXRvVGVzdEZpbmdlcnByaW50KSByZXR1cm47XG4gICAgbGFzdEF1dG9UZXN0RmluZ2VycHJpbnQgPSBmaW5nZXJwcmludDtcblxuICAgIHNob3dBZ2VudFByb3ZpZGVyVGVzdERpYWxvZyhcIlx1NkI2M1x1NTcyOFx1NkQ0Qlx1OEJENVx1NjNBNVx1NTE2NVwiLCBcIlx1NURGMlx1NjhDMFx1NkQ0Qlx1NTIzMFx1NUI4Q1x1NjU3NCBBUEkgS2V5XHVGRjBDXHU2QjYzXHU1NzI4XHU1NDExXHU2NzBEXHU1MkExXHU1NTQ2XHU1M0QxXHU5MDAxXHU0RTAwXHU2QjIxXHU2RDRCXHU4QkQ1XHU4QkY3XHU2QzQyXHUzMDAyXCIsIFwicGVuZGluZ1wiKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgc2F2ZUNvbmZpZyh7IHF1aWV0OiB0cnVlIH0pO1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFxuICAgICAgICBcImNvZGV4cHA6dGVzdC1hZ2VudC1wcm92aWRlclwiLFxuICAgICAgICBwcm92aWRlcklkLFxuICAgICAgICB7IHByb21wdDogREVGQVVMVF9BR0VOVF9URVNUX1BST01QVCwgY29uZmlnOiBjdXJyZW50IH0sXG4gICAgICApIGFzIEFnZW50UHJvdmlkZXJUZXN0UmVzdWx0O1xuICAgICAgaWYgKHJlc3VsdC5zZXNzaW9uSWQpIHNlc3Npb25JZElucHV0LnZhbHVlID0gcmVzdWx0LnNlc3Npb25JZDtcbiAgICAgIGNvbnN0IHNob3VsZEF1dG9BY3RpdmF0ZSA9IERhdGUubm93KCkgLSBsYXN0VHJ1c3RlZFVzZXJFZGl0QXQgPCAxMjBfMDAwO1xuICAgICAgY29uc3QgYWN0aXZhdGlvbiA9IHNob3VsZEF1dG9BY3RpdmF0ZVxuICAgICAgICA/IGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcbiAgICAgICAgICAgIFwiY29kZXhwcDphY3RpdmF0ZS1hZ2VudC1wcm92aWRlclwiLFxuICAgICAgICAgICAgcHJvdmlkZXJJZCxcbiAgICAgICAgICAgIGN1cnJlbnQsXG4gICAgICAgICAgKSBhcyBBZ2VudFByb3ZpZGVyQWN0aXZhdGlvblZpZXdcbiAgICAgICAgOiBudWxsO1xuICAgICAgaWYgKGFjdGl2YXRpb24pIHJlZnJlc2hDb21wb3Nlck1vZGVsU291cmNlTGFiZWwoKTtcbiAgICAgIHNob3dBZ2VudFByb3ZpZGVyVGVzdERpYWxvZyhcbiAgICAgICAgXCJcdTZENEJcdThCRDVcdTYyMTBcdTUyOUZcIixcbiAgICAgICAgYWN0aXZhdGlvblxuICAgICAgICAgID8gYCR7Zm9ybWF0QWdlbnRQcm92aWRlclRlc3RSZXN1bHQocmVzdWx0KX1cXG5cXG5cdTRFM0JcdTc1NENcdTk3NjJcdTYzQTVcdTdCQTFcdUZGMUEke2FjdGl2YXRpb24ubWVzc2FnZX1cXG5cdTY4NjVcdTYzQTVcdTU3MzBcdTU3NDBcdUZGMUEke2FjdGl2YXRpb24uYnJpZGdlVXJsID8/IFwiQ29kZXggXHU1MzlGXHU3NTFGXCJ9XFxuXHU5MTREXHU3RjZFXHU2NTg3XHU0RUY2XHVGRjFBJHthY3RpdmF0aW9uLmNvbmZpZ1BhdGh9YFxuICAgICAgICAgIDogYCR7Zm9ybWF0QWdlbnRQcm92aWRlclRlc3RSZXN1bHQocmVzdWx0KX1cXG5cXG5cdTRFM0JcdTc1NENcdTk3NjJcdTYzQTVcdTdCQTFcdUZGMUFcdTY3MkFcdTgxRUFcdTUyQThcdTUyMDdcdTYzNjJcdTMwMDJcdThCRTVcdTZENEJcdThCRDVcdTRFMERcdTY2MkZcdTY3MkNcdTZCMjFcdTYyNEJcdTUyQThcdThGOTNcdTUxNjVcdTg5RTZcdTUzRDFcdUZGMENcdTVERjJcdTkwN0ZcdTUxNERcdTY1RTdcdTk4NzVcdTk3NjJcdTcyQjZcdTYwMDFcdTg5ODZcdTc2RDZcdTVGNTNcdTUyNEQgQ29kZXggXHU1MzlGXHU3NTFGXHU2QTIxXHU1NzhCXHUzMDAyYCxcbiAgICAgICAgXCJzdWNjZXNzXCIsXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHNob3dBZ2VudFByb3ZpZGVyVGVzdERpYWxvZyhcIlx1NkQ0Qlx1OEJENVx1NTkzMVx1OEQyNVwiLCBmb3JtYXRBZ2VudFByb3ZpZGVyQ2F1Z2h0RXJyb3IoZSksIFwiZXJyb3JcIik7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHNjaGVkdWxlQXV0b1NhdmUgPSAob3B0aW9uczogeyByZWZyZXNoTW9kZWxzPzogYm9vbGVhbjsgYXV0b1Rlc3Q/OiBib29sZWFuIH0gPSB7fSk6IHZvaWQgPT4ge1xuICAgIGlmIChzYXZlVGltZXIpIGNsZWFyVGltZW91dChzYXZlVGltZXIpO1xuICAgIGlmIChzYXZlZFN0YXR1cykge1xuICAgICAgc2F2ZWRTdGF0dXMuY2xhc3NOYW1lID0gXCJtaW4taC01IHRleHQtc20gdGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xuICAgICAgc2F2ZWRTdGF0dXMudGV4dENvbnRlbnQgPSBcIlx1NkI2M1x1NTcyOFx1N0I0OVx1NUY4NVx1OEY5M1x1NTE2NVx1NUI4Q1x1NjIxMFx1NTQwRVx1ODFFQVx1NTJBOFx1NEZERFx1NUI1OFx1MzAwMlwiO1xuICAgIH1cbiAgICBzYXZlVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHNhdmVUaW1lciA9IG51bGw7XG4gICAgICB2b2lkIHNhdmVDb25maWcoKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMucmVmcmVzaE1vZGVscykgcmV0dXJuIHJlZnJlc2hNb2RlbHMoeyBhdXRvVGVzdDogb3B0aW9ucy5hdXRvVGVzdCB9KTtcbiAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvVGVzdCkgcmV0dXJuIG1heWJlQXV0b1Rlc3QoKTtcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICBpZiAoIXNhdmVkU3RhdHVzKSByZXR1cm47XG4gICAgICAgICAgc2F2ZWRTdGF0dXMuY2xhc3NOYW1lID0gXCJtaW4taC01IHRleHQtc20gdGV4dC10b2tlbi1jaGFydHMtcmVkXCI7XG4gICAgICAgICAgc2F2ZWRTdGF0dXMudGV4dENvbnRlbnQgPSBmaXJzdExpbmUoZm9ybWF0QWdlbnRQcm92aWRlckNhdWdodEVycm9yKGUpKTtcbiAgICAgICAgfSk7XG4gICAgfSwgNzAwKTtcbiAgfTtcblxuICBjb25zdCBiaW5kQXV0b1NhdmUgPSAoXG4gICAgZWw6IEhUTUxFbGVtZW50LFxuICAgIGV2ZW50OiBcImlucHV0XCIgfCBcImNoYW5nZVwiLFxuICAgIG9wdGlvbnM/OiB7IHJlZnJlc2hNb2RlbHM/OiBib29sZWFuOyBhdXRvVGVzdD86IGJvb2xlYW4gfSxcbiAgKTogdm9pZCA9PiB7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgKGRvbUV2ZW50KSA9PiB7XG4gICAgICBtYXJrVHJ1c3RlZFVzZXJFZGl0KGRvbUV2ZW50KTtcbiAgICAgIHNjaGVkdWxlQXV0b1NhdmUob3B0aW9ucyk7XG4gICAgfSk7XG4gIH07XG5cbiAgc2V0dGluZ3NDYXJkLmFwcGVuZENoaWxkKFxuICAgIGFnZW50Q29udHJvbFJvdyhcbiAgICAgIFwiXHU1NDJGXHU3NTI4XHU1MTY1XHU1M0UzXCIsXG4gICAgICBcIlx1NTE3M1x1OTVFRFx1NTQwRVx1NEZERFx1NzU1OVx1OTE0RFx1N0Y2RVx1RkYwQ1x1NEY0Nlx1NkQ0Qlx1OEJENVx1OEJGN1x1NkM0Mlx1NEYxQVx1ODhBQlx1OTYzQlx1NkI2Mlx1MzAwMlwiLFxuICAgICAgc3dpdGNoQ29udHJvbChlbmFibGVkLCBhc3luYyAobmV4dCkgPT4ge1xuICAgICAgICBlbmFibGVkID0gbmV4dDtcbiAgICAgICAgYXdhaXQgc2F2ZUNvbmZpZyh7IHF1aWV0OiB0cnVlIH0pO1xuICAgICAgfSksXG4gICAgKSxcbiAgKTtcbiAgc2V0dGluZ3NDYXJkLmFwcGVuZENoaWxkKFxuICAgIGFnZW50Q29udHJvbFJvdyhcbiAgICAgIFwiXHU4QkE0XHU4QkMxXHU2QTIxXHU1RjBGXCIsXG4gICAgICBcIlx1Njg2NVx1NjNBNVx1NkEyMVx1NUYwRlx1NEZERFx1NzU1OSBDb2RleCBcdTVCOThcdTY1QjlcdTc2N0JcdTVGNTVcdTYwMDFcdUZGMUJcdTdFQUYgQVBJIFx1NkEyMVx1NUYwRlx1NjI4QSBBUEkgS2V5IFx1NTE5OVx1NTE2NVx1Njg0Q1x1OTc2MiBDb2RleCBcdTk2OTRcdTc5QkIgYXV0aC5qc29uXHUzMDAyXCIsXG4gICAgICBhY2Nlc3NNb2RlU2VsZWN0LFxuICAgICksXG4gICk7XG4gIHNldHRpbmdzQ2FyZC5hcHBlbmRDaGlsZChhZ2VudENvbnRyb2xSb3coXCJBUEkgS2V5XCIsIFwiXHU0RkREXHU1QjU4XHU1NzI4XHU2NzJDXHU2NzNBIGNvZGV4XHU2QzQ5XHU1MzE2XHU1ODlFXHU1RjNBcGx1c1x1NzI0OCBcdTkxNERcdTdGNkVcdTRFMkRcdTMwMDJcIiwgYXBpS2V5Q29udHJvbCkpO1xuICBpZiAocHJvdmlkZXJJZCA9PT0gXCJxd2VuXCIpIHtcbiAgICBzZXR0aW5nc0NhcmQuYXBwZW5kQ2hpbGQoYWdlbnRDb250cm9sUm93KFwiXHU4QzAzXHU3NTI4XHU2NUI5XHU1RjBGXCIsIFwiXHU2NjdBXHU4MEZEXHU0RjUzXHU1RTk0XHU3NTI4XHU0RjdGXHU3NTI4IEFQUF9JRFx1RkYxQlx1NTM0M1x1OTVFRVx1NkEyMVx1NTc4Qlx1NEY3Rlx1NzUyOCBPcGVuQUkgXHU1MTdDXHU1QkI5XHU2M0E1XHU1M0UzXHUzMDAyXCIsIG1vZGVTZWxlY3QpKTtcbiAgfVxuICBjb25zdCBtb2RlbENvbnRyb2wgPSBhZ2VudFN0YWNrQ29udHJvbChcbiAgICBtb2RlbFNlbGVjdCxcbiAgICBhZ2VudElubGluZUFjdGlvbnMoW3JlZnJlc2hNb2RlbHNCdXR0b24sIG1vZGVsU3RhdHVzXSksXG4gICk7XG4gIGlmIChwcm92aWRlcklkID09PSBcInF3ZW5cIikge1xuICAgIHNldHRpbmdzQ2FyZC5hcHBlbmRDaGlsZChhZ2VudENvbnRyb2xSb3coXCJcdTVFOTRcdTc1MjggSURcIiwgXCJcdTc2N0VcdTcwQkNcdTY2N0FcdTgwRkRcdTRGNTNcdTVFOTRcdTc1MjhcdTZBMjFcdTVGMEZcdTVGQzVcdTU4NkJcdTMwMDJcIiwgYXBwSWRJbnB1dCkpO1xuICAgIHNldHRpbmdzQ2FyZC5hcHBlbmRDaGlsZChhZ2VudENvbnRyb2xSb3coXCJcdTRGMUFcdThCREQgSURcIiwgXCJcdTUzRUZcdTkwMDlcdUZGMUJcdTc2N0VcdTcwQkNcdTVFOTRcdTc1MjhcdTRGMUFcdThGRDRcdTU2REUgc2Vzc2lvbl9pZFx1RkYwQ1x1NTNFRlx1NzUyOFx1NEU4RVx1NEUwQlx1NEUwMFx1OEY2RVx1NUJGOVx1OEJERFx1MzAwMlwiLCBzZXNzaW9uSWRJbnB1dCkpO1xuICAgIHNldHRpbmdzQ2FyZC5hcHBlbmRDaGlsZChhZ2VudENvbnRyb2xSb3coXCJcdTZBMjFcdTU3OEJcIiwgXCJcdTRFQ0VcdTY3MERcdTUyQTFcdTU1NDZcdTYzQTVcdTUzRTNcdThCRkJcdTUzRDZcdUZGMUJcdTc2N0VcdTcwQkNcdTY2N0FcdTgwRkRcdTRGNTNcdTVFOTRcdTc1MjhcdTZBMjFcdTVGMEZcdTRGMUFcdTVGRkRcdTc1NjVcdTMwMDJcIiwgbW9kZWxDb250cm9sLCBcInN0YXJ0XCIpKTtcbiAgfSBlbHNlIHtcbiAgICBzZXR0aW5nc0NhcmQuYXBwZW5kQ2hpbGQoYWdlbnRDb250cm9sUm93KFwiXHU2QTIxXHU1NzhCXCIsIFwiXHU5MDFBXHU4RkM3XHU2NzBEXHU1MkExXHU1NTQ2XHU2QTIxXHU1NzhCXHU1MjE3XHU4ODY4XHU2M0E1XHU1M0UzXHU4QkZCXHU1M0Q2XHVGRjBDXHU0RTBEXHU2NTJGXHU2MzAxXHU2MjRCXHU1MkE4XHU1ODZCXHU1MTk5XHUzMDAyXCIsIG1vZGVsQ29udHJvbCwgXCJzdGFydFwiKSk7XG4gIH1cblxuICBjb25zdCBhZHZhbmNlZCA9IGFnZW50RGV0YWlscyhcIlx1OUFEOFx1N0VBN1x1OTE0RFx1N0Y2RVwiLCBcIkJhc2UgVVJMXHUzMDAxXHU3Q0ZCXHU3RURGXHU2M0QwXHU3OTNBXHU4QkNEXHUzMDAxXHU5MUM3XHU2ODM3XHU1NDhDXHU4RjkzXHU1MUZBXHU5NTdGXHU1RUE2XHU5RUQ4XHU4QkE0XHU2Mjk4XHU1M0UwXHUzMDAyXCIpO1xuICBhZHZhbmNlZC5ib2R5LmFwcGVuZENoaWxkKGFnZW50Q29udHJvbFJvdyhcIkJhc2UgVVJMXCIsIGFnZW50QmFzZVVybERlc2NyaXB0aW9uKHByb3ZpZGVySWQpLCBiYXNlVXJsSW5wdXQpKTtcbiAgYWR2YW5jZWQuYm9keS5hcHBlbmRDaGlsZChhZ2VudENvbnRyb2xSb3coXCJcdTdDRkJcdTdFREZcdTYzRDBcdTc5M0FcdThCQ0RcIiwgXCJcdTUzRUZcdTkwMDlcdUZGMUJcdTc1MjhcdTRFOEUgQ2hhdCBDb21wbGV0aW9ucyBcdTZBMjFcdTVGMEZcdTMwMDJcIiwgc3lzdGVtUHJvbXB0SW5wdXQsIFwic3RhcnRcIikpO1xuICBhZHZhbmNlZC5ib2R5LmFwcGVuZENoaWxkKFxuICAgIGFnZW50Q29udHJvbFJvdyhcbiAgICAgIFwiXHU5MUM3XHU2ODM3XHU0RTBFXHU5NTdGXHU1RUE2XCIsXG4gICAgICBcInRlbXBlcmF0dXJlIFx1NjNBN1x1NTIzNlx1NTNEMVx1NjU2M1x1N0EwQlx1NUVBNlx1RkYxQlx1NjcwMFx1NTkyN1x1OEY5M1x1NTFGQVx1OTY1MFx1NTIzNlx1NjcyQ1x1NkIyMVx1NTZERVx1N0I1NFx1OTU3Rlx1NUVBNlx1MzAwMlwiLFxuICAgICAgYWdlbnRJbmxpbmVDb250cm9scyhbXG4gICAgICAgIFtcInRlbXBlcmF0dXJlXCIsIHRlbXBlcmF0dXJlSW5wdXRdLFxuICAgICAgICBbXCJtYXggdG9rZW5zXCIsIG1heFRva2Vuc0lucHV0XSxcbiAgICAgIF0pLFxuICAgICksXG4gICk7XG4gIGNvbnN0IGRvY3NSb3cgPSBhY3Rpb25Sb3coXCJcdTY1ODdcdTY4NjNcIiwgXCJcdTYyNTNcdTVGMDBcdTY3MERcdTUyQTFcdTU1NDZcdTYzQTVcdTUzRTNcdTY1ODdcdTY4NjNcdTYyMTYgQVBJIEtleSBcdTk4NzVcdTk3NjJcdTMwMDJcIik7XG4gIGNvbnN0IGRvY3NBY3Rpb25zID0gZG9jc1Jvdy5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcIltkYXRhLWNvZGV4cHAtcm93LWFjdGlvbnNdXCIpO1xuICBkb2NzQWN0aW9ucz8uYXBwZW5kQ2hpbGQoXG4gICAgY29tcGFjdEJ1dHRvbihcIlx1NjI1M1x1NUYwMFx1NjU4N1x1Njg2M1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6b3Blbi1leHRlcm5hbFwiLCBtZXRhLmRvY3NVcmwpO1xuICAgIH0pLFxuICApO1xuICBpZiAobWV0YS5rZXlVcmwpIHtcbiAgICBkb2NzQWN0aW9ucz8uYXBwZW5kQ2hpbGQoXG4gICAgICBjb21wYWN0QnV0dG9uKFwiXHU3NTMzXHU4QkY3IEFQSSBLZXlcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6b3Blbi1leHRlcm5hbFwiLCBtZXRhLmtleVVybCk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG4gIGFkdmFuY2VkLmJvZHkuYXBwZW5kQ2hpbGQoZG9jc1Jvdyk7XG4gIHNldHRpbmdzQ2FyZC5hcHBlbmRDaGlsZChhZHZhbmNlZC5vdXRlcik7XG5cbiAgY29uc3Qgc3RhdHVzUm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgc3RhdHVzUm93LmNsYXNzTmFtZSA9IFwicC0zXCI7XG4gIHNhdmVkU3RhdHVzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgc2F2ZWRTdGF0dXMuY2xhc3NOYW1lID0gXCJtaW4taC01IHRleHQtc20gdGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xuICBzYXZlZFN0YXR1cy50ZXh0Q29udGVudCA9IGNvbmZpZy5hcGlLZXkgPyBcIlx1NURGMlx1NTJBMFx1OEY3RFx1NjcyQ1x1NjczQVx1OTE0RFx1N0Y2RVx1RkYwQ1x1OEY5M1x1NTE2NVx1NTQwRVx1NEYxQVx1ODFFQVx1NTJBOFx1NEZERFx1NUI1OFx1MzAwMlwiIDogXCJcdTVDMUFcdTY3MkFcdTU4NkJcdTUxOTkgQVBJIEtleVx1MzAwMlwiO1xuICBzdGF0dXNSb3cuYXBwZW5kQ2hpbGQoc2F2ZWRTdGF0dXMpO1xuICBzZXR0aW5nc0NhcmQuYXBwZW5kQ2hpbGQoc3RhdHVzUm93KTtcblxuICBiaW5kQXV0b1NhdmUoYXBpS2V5SW5wdXQsIFwiaW5wdXRcIiwgeyByZWZyZXNoTW9kZWxzOiB0cnVlLCBhdXRvVGVzdDogdHJ1ZSB9KTtcbiAgYmluZEF1dG9TYXZlKGFjY2Vzc01vZGVTZWxlY3QsIFwiY2hhbmdlXCIsIHsgYXV0b1Rlc3Q6IHRydWUgfSk7XG4gIGJpbmRBdXRvU2F2ZShiYXNlVXJsSW5wdXQsIFwiaW5wdXRcIiwgeyByZWZyZXNoTW9kZWxzOiB0cnVlLCBhdXRvVGVzdDogdHJ1ZSB9KTtcbiAgYmluZEF1dG9TYXZlKG1vZGVsU2VsZWN0LCBcImNoYW5nZVwiLCB7IGF1dG9UZXN0OiB0cnVlIH0pO1xuICBiaW5kQXV0b1NhdmUoYXBwSWRJbnB1dCwgXCJpbnB1dFwiLCB7IGF1dG9UZXN0OiB0cnVlIH0pO1xuICBiaW5kQXV0b1NhdmUoc2Vzc2lvbklkSW5wdXQsIFwiaW5wdXRcIik7XG4gIGJpbmRBdXRvU2F2ZShzeXN0ZW1Qcm9tcHRJbnB1dCwgXCJpbnB1dFwiKTtcbiAgYmluZEF1dG9TYXZlKHRlbXBlcmF0dXJlSW5wdXQsIFwiaW5wdXRcIik7XG4gIGJpbmRBdXRvU2F2ZShtYXhUb2tlbnNJbnB1dCwgXCJpbnB1dFwiKTtcblxuICBzeW5jTW9kZWxTZWxlY3RTdGF0ZSgpO1xuICB2b2lkIHJlZnJlc2hNb2RlbHMoKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0QWdlbnRQcm92aWRlclRlc3RSZXN1bHQocmVzdWx0OiBBZ2VudFByb3ZpZGVyVGVzdFJlc3VsdCk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gW3Jlc3VsdC50ZXh0LnRyaW0oKSB8fCBcIihcdTdBN0FcdTU0Q0RcdTVFOTQpXCJdO1xuICBjb25zdCBtZXRhOiBzdHJpbmdbXSA9IFtdO1xuICBpZiAocmVzdWx0Lm1vZGVsKSBtZXRhLnB1c2goYG1vZGVsOiAke3Jlc3VsdC5tb2RlbH1gKTtcbiAgaWYgKHJlc3VsdC5zZXNzaW9uSWQpIG1ldGEucHVzaChgc2Vzc2lvbl9pZDogJHtyZXN1bHQuc2Vzc2lvbklkfWApO1xuICBpZiAocmVzdWx0LnVzYWdlKSBtZXRhLnB1c2goYHVzYWdlOiAke0pTT04uc3RyaW5naWZ5KHJlc3VsdC51c2FnZSl9YCk7XG4gIGlmIChtZXRhLmxlbmd0aCA+IDApIGxpbmVzLnB1c2goXCJcIiwgbWV0YS5qb2luKFwiXFxuXCIpKTtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdEFnZW50UHJvdmlkZXJDYXVnaHRFcnJvcihlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgY29uc3QgcmF3ID0gU3RyaW5nKChlIGFzIEVycm9yKS5tZXNzYWdlID8/IGUpO1xuICByZXR1cm4gcmF3XG4gICAgLnJlcGxhY2UoL15FcnJvciBpbnZva2luZyByZW1vdGUgbWV0aG9kICdbXiddKyc6XFxzKi9pLCBcIlwiKVxuICAgIC5yZXBsYWNlKC9eRXJyb3I6XFxzKi9pLCBcIlwiKVxuICAgIC50cmltKCkgfHwgXCJcdTY3MERcdTUyQTFcdTU1NDZcdThGRDRcdTU2REVcdTRFODZcdTY3MkFcdTc3RTVcdTk1MTlcdThCRUZcdTMwMDJcIjtcbn1cblxuZnVuY3Rpb24gZmlyc3RMaW5lKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdCgvXFxyP1xcbi8pLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkpLmZpbHRlcihCb29sZWFuKTtcbiAgcmV0dXJuIGxpbmVzLmZpbmQoKGxpbmUpID0+IGxpbmUuc3RhcnRzV2l0aChcIlx1NTM5Rlx1NTZFMFx1RkYxQVwiKSkgPz8gbGluZXNbMF0gPz8gdGV4dDtcbn1cblxuZnVuY3Rpb24gaXNBZ2VudFByb3ZpZGVyUmVhZHlGb3JBdXRvVGVzdChcbiAgcHJvdmlkZXJJZDogQWdlbnRQcm92aWRlcklkLFxuICBjb25maWc6IFBhcnRpYWw8QWdlbnRQcm92aWRlckNvbmZpZ1ZpZXc+LFxuKTogYm9vbGVhbiB7XG4gIGlmICghY29uZmlnLmVuYWJsZWQpIHJldHVybiBmYWxzZTtcbiAgaWYgKCFpc0NvbXBsZXRlQWdlbnRBcGlLZXkoY29uZmlnLmFwaUtleSA/PyBcIlwiKSkgcmV0dXJuIGZhbHNlO1xuICBpZiAoIWNvbmZpZy5iYXNlVXJsPy50cmltKCkpIHJldHVybiBmYWxzZTtcbiAgaWYgKHByb3ZpZGVySWQgPT09IFwicXdlblwiICYmIGNvbmZpZy5tb2RlID09PSBcImFwcFwiKSByZXR1cm4gQm9vbGVhbihjb25maWcuYXBwSWQ/LnRyaW0oKSk7XG4gIHJldHVybiBCb29sZWFuKGNvbmZpZy5tb2RlbD8udHJpbSgpKTtcbn1cblxuZnVuY3Rpb24gaXNDb21wbGV0ZUFnZW50QXBpS2V5KHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3Qga2V5ID0gdmFsdWUudHJpbSgpO1xuICByZXR1cm4ga2V5Lmxlbmd0aCA+PSAyNCAmJiAhL1xccy8udGVzdChrZXkpO1xufVxuXG5mdW5jdGlvbiBzaG91bGRQcm9tcHRYaWFvYmFpUmVnaXN0cmF0aW9uKHByb3ZpZGVySWQ6IEFnZW50UHJvdmlkZXJJZCwgY29uZmlnOiBBZ2VudFByb3ZpZGVyQ29uZmlnVmlldyk6IGJvb2xlYW4ge1xuICByZXR1cm4gcHJvdmlkZXJJZCAhPT0gXCJ6aGlwdVwiICYmICFjb25maWcuYXBpS2V5Py50cmltKCk7XG59XG5cbmZ1bmN0aW9uIG1heWJlUHJvbXB0WGlhb2JhaVJlZ2lzdHJhdGlvbihwcm92aWRlcklkOiBBZ2VudFByb3ZpZGVySWQsIGNvbmZpZzogQWdlbnRQcm92aWRlckNvbmZpZ1ZpZXcpOiB2b2lkIHtcbiAgaWYgKCFzaG91bGRQcm9tcHRYaWFvYmFpUmVnaXN0cmF0aW9uKHByb3ZpZGVySWQsIGNvbmZpZykpIHJldHVybjtcbiAgY29uc3QgbGFiZWwgPSBhZ2VudFByb3ZpZGVyTWV0YShwcm92aWRlcklkKS5sYWJlbDtcbiAgY29uc3QgYWNjZXB0ZWQgPSB3aW5kb3cuY29uZmlybShcbiAgICBgJHtsYWJlbH0gXHU1QzFBXHU2NzJBXHU1ODZCXHU1MTk5IEFQSSBLZXlcdTMwMDJcXG5cXG5cdTY2MkZcdTU0MjZcdTU0MkZcdTc1MjhcdTVDMEZcdTc2N0RBSVx1OEY4NVx1NTJBOVx1ODFFQVx1NTJBOFx1NkNFOFx1NTE4QyBBUElcdUZGMUZgLFxuICApO1xuICBpZiAoIWFjY2VwdGVkKSByZXR1cm47XG4gIHZvaWQgb3BlblhpYW9iYWlBaVRvb2xib3hGb3JBcGlSZWdpc3RyYXRpb24ocHJvdmlkZXJJZCk7XG59XG5cbmZ1bmN0aW9uIGFwaUtleUlucHV0V2l0aFhpYW9iYWlBc3Npc3QoaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQsIHByb3ZpZGVySWQ6IEFnZW50UHJvdmlkZXJJZCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgd3JhcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHdyYXAuY2xhc3NOYW1lID0gXCJmbGV4IHctZnVsbCBtaW4tdy0wIGl0ZW1zLWNlbnRlciBnYXAtMlwiO1xuICBpbnB1dC5jbGFzc0xpc3QuYWRkKFwibWluLXctMFwiLCBcImZsZXgtMVwiKTtcbiAgY29uc3QgYnV0dG9uID0gY29tcGFjdEJ1dHRvbihcIlx1NUMwRlx1NzY3REFJXHU4Rjg1XHU1MkE5XHU3NTMzXHU4QkY3XCIsICgpID0+IHtcbiAgICB2b2lkIG9wZW5YaWFvYmFpQWlUb29sYm94Rm9yQXBpUmVnaXN0cmF0aW9uKHByb3ZpZGVySWQpO1xuICB9KTtcbiAgYnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJzaHJpbmstMFwiKTtcbiAgYnV0dG9uLnRpdGxlID0gXCJcdTYyNTNcdTVGMDBcdTVDMEZcdTc2N0RBSVx1NURFNVx1NTE3N1x1N0JCMVx1RkYwQ1x1OEY4NVx1NTJBOVx1NzUzM1x1OEJGN1x1NUU3Nlx1NkNFOFx1NTE4QyBBUEkgS2V5XCI7XG4gIHdyYXAuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICB3cmFwLmFwcGVuZENoaWxkKGJ1dHRvbik7XG4gIHJldHVybiB3cmFwO1xufVxuXG5hc3luYyBmdW5jdGlvbiBvcGVuWGlhb2JhaUFpVG9vbGJveEZvckFwaVJlZ2lzdHJhdGlvbihwcm92aWRlcklkOiBBZ2VudFByb3ZpZGVySWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm9wZW4teGlhb2JhaS10b29sYm94XCIsIHtcbiAgICAgIHByb3ZpZGVyOiBwcm92aWRlcklkLFxuICAgICAgcHVycG9zZTogXCJhcGktcmVnaXN0cmF0aW9uXCIsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBzaG93QWdlbnRQcm92aWRlclRlc3REaWFsb2coXG4gICAgICBcIlx1NjVFMFx1NkNENVx1NjI1M1x1NUYwMFx1NUMwRlx1NzY3REFJXHU1REU1XHU1MTc3XHU3QkIxXCIsXG4gICAgICBmb3JtYXRBZ2VudFByb3ZpZGVyQ2F1Z2h0RXJyb3IoZSksXG4gICAgICBcImVycm9yXCIsXG4gICAgKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzaG93QWdlbnRQcm92aWRlclRlc3REaWFsb2coXG4gIHRpdGxlVGV4dDogc3RyaW5nLFxuICBib2R5VGV4dDogc3RyaW5nLFxuICB0b25lOiBcInBlbmRpbmdcIiB8IFwic3VjY2Vzc1wiIHwgXCJlcnJvclwiLFxuKTogdm9pZCB7XG4gIGNvbnN0IGV4aXN0aW5nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCJbZGF0YS1jb2RleHBwLWFnZW50LXRlc3QtZGlhbG9nXVwiKTtcbiAgZXhpc3Rpbmc/LnJlbW92ZSgpO1xuXG4gIGNvbnN0IG92ZXJsYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBvdmVybGF5LmRhdGFzZXQuY29kZXhwcEFnZW50VGVzdERpYWxvZyA9IFwidHJ1ZVwiO1xuICBvdmVybGF5LmNsYXNzTmFtZSA9IFwiZml4ZWQgaW5zZXQtMCB6LVs5OTk5XSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBiZy1ibGFjay80MCBwLTRcIjtcbiAgb3ZlcmxheS5zZXRBdHRyaWJ1dGUoXCJyb2xlXCIsIFwiZGlhbG9nXCIpO1xuICBvdmVybGF5LnNldEF0dHJpYnV0ZShcImFyaWEtbW9kYWxcIiwgXCJ0cnVlXCIpO1xuXG4gIGNvbnN0IGRpYWxvZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGRpYWxvZy5jbGFzc05hbWUgPVxuICAgIFwiZmxleCB3LWZ1bGwgbWF4LXcteGwgZmxleC1jb2wgZ2FwLTQgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBiZy10b2tlbi1tYWluLXN1cmZhY2UtcHJpbWFyeSBwLTQgc2hhZG93LXhsXCI7XG4gIG92ZXJsYXkuYXBwZW5kQ2hpbGQoZGlhbG9nKTtcblxuICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBoZWFkZXIuY2xhc3NOYW1lID0gXCJmbGV4IGl0ZW1zLXN0YXJ0IGp1c3RpZnktYmV0d2VlbiBnYXAtM1wiO1xuICBjb25zdCB0aXRsZVN0YWNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgdGl0bGVTdGFjay5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LWNvbCBnYXAtMVwiO1xuICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlLmNsYXNzTmFtZSA9IFwidGV4dC1iYXNlIGZvbnQtbWVkaXVtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XG4gIHRpdGxlLnRleHRDb250ZW50ID0gdGl0bGVUZXh0O1xuICBjb25zdCBzdGF0dXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBzdGF0dXMuY2xhc3NOYW1lID0gdG9uZSA9PT0gXCJzdWNjZXNzXCJcbiAgICA/IFwidGV4dC1zbSB0ZXh0LXRva2VuLWNoYXJ0cy1ncmVlblwiXG4gICAgOiB0b25lID09PSBcImVycm9yXCJcbiAgICAgID8gXCJ0ZXh0LXNtIHRleHQtdG9rZW4tY2hhcnRzLXJlZFwiXG4gICAgICA6IFwidGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5XCI7XG4gIHN0YXR1cy50ZXh0Q29udGVudCA9IHRvbmUgPT09IFwic3VjY2Vzc1wiID8gXCJcdTYzQTVcdTUxNjVcdTUzRUZcdTc1MjhcIiA6IHRvbmUgPT09IFwiZXJyb3JcIiA/IFwiXHU2M0E1XHU1MTY1XHU0RTBEXHU1M0VGXHU3NTI4XCIgOiBcIlx1NkI2M1x1NTcyOFx1OUE4Q1x1OEJDMVwiO1xuICB0aXRsZVN0YWNrLmFwcGVuZENoaWxkKHRpdGxlKTtcbiAgdGl0bGVTdGFjay5hcHBlbmRDaGlsZChzdGF0dXMpO1xuICBoZWFkZXIuYXBwZW5kQ2hpbGQodGl0bGVTdGFjayk7XG4gIGNvbnN0IGNsb3NlID0gY29tcGFjdEJ1dHRvbihcIlx1NTE3M1x1OTVFRFwiLCAoKSA9PiBvdmVybGF5LnJlbW92ZSgpKTtcbiAgaGVhZGVyLmFwcGVuZENoaWxkKGNsb3NlKTtcbiAgZGlhbG9nLmFwcGVuZENoaWxkKGhlYWRlcik7XG5cbiAgY29uc3QgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gIGJvZHkuY2xhc3NOYW1lID1cbiAgICBcIm1heC1oLTgwIHdoaXRlc3BhY2UtcHJlLXdyYXAgb3ZlcmZsb3ctYXV0byByb3VuZGVkLW1kIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyIGJnLXRva2VuLWZvcmVncm91bmQvNSBwLTMgdGV4dC1zbSBsZWFkaW5nLTUgdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgYm9keS50ZXh0Q29udGVudCA9IGJvZHlUZXh0O1xuICBkaWFsb2cuYXBwZW5kQ2hpbGQoYm9keSk7XG5cbiAgb3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICBpZiAoZS50YXJnZXQgPT09IG92ZXJsYXkpIG92ZXJsYXkucmVtb3ZlKCk7XG4gIH0pO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG92ZXJsYXkpO1xuICBjbG9zZS5mb2N1cygpO1xufVxuXG5mdW5jdGlvbiBhZ2VudENvbnRyb2xSb3coXG4gIHRpdGxlVGV4dDogc3RyaW5nLFxuICBkZXNjcmlwdGlvbjogc3RyaW5nLFxuICBjb250cm9sOiBIVE1MRWxlbWVudCxcbiAgYWxpZ246IFwiY2VudGVyXCIgfCBcInN0YXJ0XCIgPSBcImNlbnRlclwiLFxuKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICByb3cuY2xhc3NOYW1lID0gYGZsZXggJHthbGlnbiA9PT0gXCJzdGFydFwiID8gXCJpdGVtcy1zdGFydFwiIDogXCJpdGVtcy1jZW50ZXJcIn0ganVzdGlmeS1iZXR3ZWVuIGdhcC00IHAtM2A7XG4gIGNvbnN0IGxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBsZWZ0LmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGZsZXgtY29sIGdhcC0xXCI7XG4gIGNvbnN0IHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgdGl0bGUuY2xhc3NOYW1lID0gXCJtaW4tdy0wIHRleHQtc20gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgdGl0bGUudGV4dENvbnRlbnQgPSB0aXRsZVRleHQ7XG4gIGNvbnN0IGRlc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBkZXNjLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeSBtaW4tdy0wIHRleHQtc21cIjtcbiAgZGVzYy50ZXh0Q29udGVudCA9IGRlc2NyaXB0aW9uO1xuICBsZWZ0LmFwcGVuZENoaWxkKHRpdGxlKTtcbiAgbGVmdC5hcHBlbmRDaGlsZChkZXNjKTtcbiAgY29uc3QgcmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICByaWdodC5jbGFzc05hbWUgPSBcImZsZXggdy1mdWxsIG1heC13LXNtIHNocmluay0wIGp1c3RpZnktZW5kXCI7XG4gIHJpZ2h0LmFwcGVuZENoaWxkKGNvbnRyb2wpO1xuICByb3cuYXBwZW5kQ2hpbGQobGVmdCk7XG4gIHJvdy5hcHBlbmRDaGlsZChyaWdodCk7XG4gIHJldHVybiByb3c7XG59XG5cbmZ1bmN0aW9uIGFnZW50RGV0YWlscyh0aXRsZTogc3RyaW5nLCBkZXNjcmlwdGlvbjogc3RyaW5nKTogeyBvdXRlcjogSFRNTEVsZW1lbnQ7IGJvZHk6IEhUTUxFbGVtZW50IH0ge1xuICBjb25zdCBvdXRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkZXRhaWxzXCIpO1xuICBvdXRlci5jbGFzc05hbWUgPSBcImdyb3VwXCI7XG4gIGNvbnN0IHN1bW1hcnkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3VtbWFyeVwiKTtcbiAgc3VtbWFyeS5jbGFzc05hbWUgPVxuICAgIFwiZmxleCBjdXJzb3ItcG9pbnRlciBsaXN0LW5vbmUgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtNCBwLTMgdGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xuICBjb25zdCBsZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgbGVmdC5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LWNvbCBnYXAtMVwiO1xuICBjb25zdCBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgbmFtZS50ZXh0Q29udGVudCA9IHRpdGxlO1xuICBjb25zdCBkZXNjID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgZGVzYy5jbGFzc05hbWUgPSBcInRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnkgbWluLXctMCB0ZXh0LXNtXCI7XG4gIGRlc2MudGV4dENvbnRlbnQgPSBkZXNjcmlwdGlvbjtcbiAgbGVmdC5hcHBlbmRDaGlsZChuYW1lKTtcbiAgbGVmdC5hcHBlbmRDaGlsZChkZXNjKTtcbiAgY29uc3QgbWFya2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIG1hcmtlci5jbGFzc05hbWUgPSBcInNocmluay0wIHRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnlcIjtcbiAgbWFya2VyLnRleHRDb250ZW50ID0gXCJcdTVDNTVcdTVGMDBcIjtcbiAgc3VtbWFyeS5hcHBlbmRDaGlsZChsZWZ0KTtcbiAgc3VtbWFyeS5hcHBlbmRDaGlsZChtYXJrZXIpO1xuICBjb25zdCBib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgYm9keS5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZGl2aWRlLXktWzAuNXB4XSBkaXZpZGUtdG9rZW4tYm9yZGVyIGJvcmRlci10LVswLjVweF0gYm9yZGVyLXRva2VuLWJvcmRlclwiO1xuICBvdXRlci5hcHBlbmRDaGlsZChzdW1tYXJ5KTtcbiAgb3V0ZXIuYXBwZW5kQ2hpbGQoYm9keSk7XG4gIG91dGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b2dnbGVcIiwgKCkgPT4ge1xuICAgIG1hcmtlci50ZXh0Q29udGVudCA9IG91dGVyLm9wZW4gPyBcIlx1NjUzNlx1OEQ3N1wiIDogXCJcdTVDNTVcdTVGMDBcIjtcbiAgfSk7XG4gIHJldHVybiB7IG91dGVyLCBib2R5IH07XG59XG5cbmZ1bmN0aW9uIGFnZW50VGV4dElucHV0KHZhbHVlOiBzdHJpbmcsIHBsYWNlaG9sZGVyOiBzdHJpbmcsIHR5cGUgPSBcInRleHRcIik6IEhUTUxJbnB1dEVsZW1lbnQge1xuICBjb25zdCBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgaW5wdXQudHlwZSA9IHR5cGU7XG4gIGlucHV0LnZhbHVlID0gdmFsdWU7XG4gIGlucHV0LnBsYWNlaG9sZGVyID0gcGxhY2Vob2xkZXI7XG4gIGlucHV0LmF1dG9jb21wbGV0ZSA9IFwib2ZmXCI7XG4gIGlucHV0LnNwZWxsY2hlY2sgPSBmYWxzZTtcbiAgaW5wdXQuY2xhc3NOYW1lID1cbiAgICBcImgtOSB3LWZ1bGwgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBiZy10cmFuc3BhcmVudCBweC0zIHRleHQtc20gdGV4dC10b2tlbi10ZXh0LXByaW1hcnkgZm9jdXM6b3V0bGluZS1ub25lXCI7XG4gIHJldHVybiBpbnB1dDtcbn1cblxuZnVuY3Rpb24gYWdlbnROdW1iZXJJbnB1dChcbiAgdmFsdWU6IG51bWJlcixcbiAgcGxhY2Vob2xkZXI6IHN0cmluZyxcbiAgbWluOiBzdHJpbmcsXG4gIG1heDogc3RyaW5nLFxuICBzdGVwOiBzdHJpbmcsXG4pOiBIVE1MSW5wdXRFbGVtZW50IHtcbiAgY29uc3QgaW5wdXQgPSBhZ2VudFRleHRJbnB1dChTdHJpbmcodmFsdWUpLCBwbGFjZWhvbGRlciwgXCJudW1iZXJcIik7XG4gIGlucHV0Lm1pbiA9IG1pbjtcbiAgaW5wdXQubWF4ID0gbWF4O1xuICBpbnB1dC5zdGVwID0gc3RlcDtcbiAgcmV0dXJuIGlucHV0O1xufVxuXG5mdW5jdGlvbiBhZ2VudFRleHRhcmVhKHZhbHVlOiBzdHJpbmcsIHBsYWNlaG9sZGVyOiBzdHJpbmcsIHJvd3M6IG51bWJlcik6IEhUTUxUZXh0QXJlYUVsZW1lbnQge1xuICBjb25zdCB0ZXh0YXJlYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZXh0YXJlYVwiKTtcbiAgdGV4dGFyZWEudmFsdWUgPSB2YWx1ZTtcbiAgdGV4dGFyZWEucGxhY2Vob2xkZXIgPSBwbGFjZWhvbGRlcjtcbiAgdGV4dGFyZWEucm93cyA9IHJvd3M7XG4gIHRleHRhcmVhLnNwZWxsY2hlY2sgPSBmYWxzZTtcbiAgdGV4dGFyZWEuY2xhc3NOYW1lID1cbiAgICBcInctZnVsbCByZXNpemUteSByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyIGJnLXRyYW5zcGFyZW50IHB4LTMgcHktMiB0ZXh0LXNtIGxlYWRpbmctNSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeSBmb2N1czpvdXRsaW5lLW5vbmVcIjtcbiAgcmV0dXJuIHRleHRhcmVhO1xufVxuXG5mdW5jdGlvbiBhZ2VudFNlbGVjdChcbiAgdmFsdWU6IHN0cmluZyxcbiAgb3B0aW9uczogQXJyYXk8W3ZhbHVlOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmddPixcbik6IEhUTUxTZWxlY3RFbGVtZW50IHtcbiAgY29uc3Qgc2VsZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlbGVjdFwiKTtcbiAgc2VsZWN0LmNsYXNzTmFtZSA9XG4gICAgXCJoLTkgdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci10b2tlbi1ib3JkZXIgYmctdHJhbnNwYXJlbnQgcHgtMiB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5IGZvY3VzOm91dGxpbmUtbm9uZVwiO1xuICBmb3IgKGNvbnN0IFtvcHRpb25WYWx1ZSwgbGFiZWxdIG9mIG9wdGlvbnMpIHtcbiAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib3B0aW9uXCIpO1xuICAgIG9wdGlvbi52YWx1ZSA9IG9wdGlvblZhbHVlO1xuICAgIG9wdGlvbi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICAgIG9wdGlvbi5zZWxlY3RlZCA9IHZhbHVlID09PSBvcHRpb25WYWx1ZTtcbiAgICBzZWxlY3QuYXBwZW5kQ2hpbGQob3B0aW9uKTtcbiAgfVxuICByZXR1cm4gc2VsZWN0O1xufVxuXG5mdW5jdGlvbiBhZ2VudE1vZGVsU2VsZWN0KHNlbGVjdGVkOiBzdHJpbmcpOiBIVE1MU2VsZWN0RWxlbWVudCB7XG4gIGNvbnN0IHNlbGVjdCA9IGFnZW50U2VsZWN0KFwiXCIsIFtbXCJcIiwgXCJcdThCRjdcdTUyMzdcdTY1QjBcdTZBMjFcdTU3OEJcdTUyMTdcdTg4NjhcIl1dKTtcbiAgc2VsZWN0LnZhbHVlID0gc2VsZWN0ZWQ7XG4gIHNlbGVjdC5kaXNhYmxlZCA9IHRydWU7XG4gIHJldHVybiBzZWxlY3Q7XG59XG5cbmZ1bmN0aW9uIHNldEFnZW50TW9kZWxPcHRpb25zKFxuICBzZWxlY3Q6IEhUTUxTZWxlY3RFbGVtZW50LFxuICBtb2RlbHM6IEFnZW50UHJvdmlkZXJNb2RlbFZpZXdbXSxcbiAgcHJlZmVycmVkOiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgY29uc3QgcHJldmlvdXMgPSBzZWxlY3QudmFsdWUgfHwgcHJlZmVycmVkO1xuICBzZWxlY3QudGV4dENvbnRlbnQgPSBcIlwiO1xuICBpZiAobW9kZWxzLmxlbmd0aCA9PT0gMCkge1xuICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJvcHRpb25cIik7XG4gICAgb3B0aW9uLnZhbHVlID0gXCJcIjtcbiAgICBvcHRpb24udGV4dENvbnRlbnQgPSBcIlx1NjVFMFx1NTNFRlx1OTAwOVx1NkEyMVx1NTc4QlwiO1xuICAgIHNlbGVjdC5hcHBlbmRDaGlsZChvcHRpb24pO1xuICAgIHNlbGVjdC52YWx1ZSA9IFwiXCI7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZvciAoY29uc3QgbW9kZWwgb2YgbW9kZWxzKSB7XG4gICAgY29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIm9wdGlvblwiKTtcbiAgICBvcHRpb24udmFsdWUgPSBtb2RlbC5pZDtcbiAgICBvcHRpb24udGV4dENvbnRlbnQgPSBtb2RlbC5sYWJlbCAmJiBtb2RlbC5sYWJlbCAhPT0gbW9kZWwuaWRcbiAgICAgID8gYCR7bW9kZWwubGFiZWx9ICgke21vZGVsLmlkfSlgXG4gICAgICA6IG1vZGVsLmlkO1xuICAgIG9wdGlvbi50aXRsZSA9IG1vZGVsLm93bmVkQnkgPyBgJHttb2RlbC5pZH0gXHUwMEI3ICR7bW9kZWwub3duZWRCeX1gIDogbW9kZWwuaWQ7XG4gICAgc2VsZWN0LmFwcGVuZENoaWxkKG9wdGlvbik7XG4gIH1cbiAgY29uc3QgaWRzID0gbmV3IFNldChtb2RlbHMubWFwKChtb2RlbCkgPT4gbW9kZWwuaWQpKTtcbiAgc2VsZWN0LnZhbHVlID0gaWRzLmhhcyhwcmV2aW91cykgPyBwcmV2aW91cyA6IG1vZGVsc1swXSEuaWQ7XG59XG5cbmZ1bmN0aW9uIGFnZW50U3RhY2tDb250cm9sKHByaW1hcnk6IEhUTUxFbGVtZW50LCBzZWNvbmRhcnk6IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQge1xuICBjb25zdCB3cmFwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgd3JhcC5jbGFzc05hbWUgPSBcImZsZXggdy1mdWxsIGZsZXgtY29sIGdhcC0yXCI7XG4gIHdyYXAuYXBwZW5kQ2hpbGQocHJpbWFyeSk7XG4gIHdyYXAuYXBwZW5kQ2hpbGQoc2Vjb25kYXJ5KTtcbiAgcmV0dXJuIHdyYXA7XG59XG5cbmZ1bmN0aW9uIGFnZW50SW5saW5lQWN0aW9ucyhpdGVtczogSFRNTEVsZW1lbnRbXSk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgd3JhcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHdyYXAuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgaXRlbXMtY2VudGVyIGdhcC0yXCI7XG4gIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykgd3JhcC5hcHBlbmRDaGlsZChpdGVtKTtcbiAgcmV0dXJuIHdyYXA7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFVzZU1vZGVsU2VsZWN0KHByb3ZpZGVySWQ6IEFnZW50UHJvdmlkZXJJZCwgbW9kZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBwcm92aWRlcklkICE9PSBcInF3ZW5cIiB8fCBtb2RlID09PSBcImNoYXRcIjtcbn1cblxuZnVuY3Rpb24gYWdlbnRJbmxpbmVDb250cm9scyhpdGVtczogQXJyYXk8W2xhYmVsOiBzdHJpbmcsIGlucHV0OiBIVE1MSW5wdXRFbGVtZW50XT4pOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB3cmFwLmNsYXNzTmFtZSA9IFwiZ3JpZCB3LWZ1bGwgZ3JpZC1jb2xzLTIgZ2FwLTJcIjtcbiAgZm9yIChjb25zdCBbbGFiZWwsIGlucHV0XSBvZiBpdGVtcykge1xuICAgIGNvbnN0IGJveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsYWJlbFwiKTtcbiAgICBib3guY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC1jb2wgZ2FwLTEgdGV4dC14cyB0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5XCI7XG4gICAgY29uc3QgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgIHRleHQudGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgICBib3guYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgYm94LmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICB3cmFwLmFwcGVuZENoaWxkKGJveCk7XG4gIH1cbiAgcmV0dXJuIHdyYXA7XG59XG5cbmZ1bmN0aW9uIGNsYW1wTnVtYmVyKHZhbHVlOiBudW1iZXIsIG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciwgZmFsbGJhY2s6IG51bWJlcik6IG51bWJlciB7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKHZhbHVlKSkgcmV0dXJuIGZhbGxiYWNrO1xuICByZXR1cm4gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIHZhbHVlKSk7XG59XG5cbmZ1bmN0aW9uIGFnZW50QmFzZVVybFBsYWNlaG9sZGVyKHByb3ZpZGVySWQ6IEFnZW50UHJvdmlkZXJJZCwgbW9kZTogQWdlbnRQcm92aWRlck1vZGUpOiBzdHJpbmcge1xuICBpZiAocHJvdmlkZXJJZCA9PT0gXCJkZWVwc2Vla1wiKSByZXR1cm4gXCJodHRwczovL2FwaS5kZWVwc2Vlay5jb21cIjtcbiAgaWYgKHByb3ZpZGVySWQgPT09IFwiemhpcHVcIikgcmV0dXJuIFwiaHR0cHM6Ly9vcGVuLmJpZ21vZGVsLmNuL2FwaS9wYWFzL3Y0XCI7XG4gIHJldHVybiBtb2RlID09PSBcImNoYXRcIlxuICAgID8gXCJodHRwczovL2Rhc2hzY29wZS5hbGl5dW5jcy5jb20vY29tcGF0aWJsZS1tb2RlL3YxXCJcbiAgICA6IFwiaHR0cHM6Ly9kYXNoc2NvcGUuYWxpeXVuY3MuY29tL2FwaS92MVwiO1xufVxuXG5mdW5jdGlvbiBhZ2VudEJhc2VVcmxEZXNjcmlwdGlvbihwcm92aWRlcklkOiBBZ2VudFByb3ZpZGVySWQpOiBzdHJpbmcge1xuICBpZiAocHJvdmlkZXJJZCA9PT0gXCJkZWVwc2Vla1wiKSByZXR1cm4gXCJcdTlFRDhcdThCQTRcdThGRkRcdTUyQTAgL2NoYXQvY29tcGxldGlvbnNcdTMwMDJcIjtcbiAgaWYgKHByb3ZpZGVySWQgPT09IFwiemhpcHVcIikgcmV0dXJuIFwiXHU5RUQ4XHU4QkE0XHU4RkZEXHU1MkEwIC9jaGF0L2NvbXBsZXRpb25zXHVGRjBDXHU0RjdGXHU3NTI4XHU2NjdBXHU4QzMxIE9wZW5BSSBcdTUxN0NcdTVCQjlcdTYzQTVcdTUzRTNcdTMwMDJcIjtcbiAgcmV0dXJuIFwiXHU3NjdFXHU3MEJDXHU1RTk0XHU3NTI4XHU2QTIxXHU1RjBGXHU4RkZEXHU1MkEwIC9hcHBzL0FQUF9JRC9jb21wbGV0aW9uXHVGRjFCXHU1MzQzXHU5NUVFXHU2QTIxXHU1NzhCXHU2QTIxXHU1RjBGXHU4RkZEXHU1MkEwIC9jaGF0L2NvbXBsZXRpb25zXHUzMDAyXCI7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckNvZGV4UGx1c1BsdXNDb25maWcoY2FyZDogSFRNTEVsZW1lbnQsIGNvbmZpZzogQ29kZXhQbHVzUGx1c0NvbmZpZyk6IHZvaWQge1xuICBzZXRTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbihjb25maWcudXBkYXRlQ2hlY2spO1xuICBjYXJkLmFwcGVuZENoaWxkKHBsdWdpbkVuYWJsZWRSb3coY29uZmlnKSk7XG4gIGNhcmQuYXBwZW5kQ2hpbGQoYXV0b1VwZGF0ZVJvdyhjb25maWcpKTtcbiAgY2FyZC5hcHBlbmRDaGlsZCh1cGRhdGVDaGFubmVsUm93KGNvbmZpZykpO1xuICBjYXJkLmFwcGVuZENoaWxkKGluc3RhbGxhdGlvblNvdXJjZVJvdyhjb25maWcuaW5zdGFsbGF0aW9uU291cmNlKSk7XHJcbiAgY2FyZC5hcHBlbmRDaGlsZChzZWxmVXBkYXRlU3RhdHVzUm93KGNvbmZpZy5zZWxmVXBkYXRlKSk7XHJcbiAgY2FyZC5hcHBlbmRDaGlsZChjaGVja0ZvclVwZGF0ZXNSb3coY29uZmlnKSk7XHJcbiAgaWYgKGNvbmZpZy51cGRhdGVDaGVjaykgY2FyZC5hcHBlbmRDaGlsZChyZWxlYXNlTm90ZXNSb3coY29uZmlnLnVwZGF0ZUNoZWNrKSk7XHJcbn1cblxuZnVuY3Rpb24gcGx1Z2luRW5hYmxlZFJvdyhjb25maWc6IENvZGV4UGx1c1BsdXNDb25maWcpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHJvdy5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtNCBwLTNcIjtcbiAgY29uc3QgbGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGxlZnQuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC1jb2wgZ2FwLTFcIjtcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZS5jbGFzc05hbWUgPSBcIm1pbi13LTAgdGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xuICB0aXRsZS50ZXh0Q29udGVudCA9IFwiXHU2M0QyXHU0RUY2XHU2MDNCXHU1RjAwXHU1MTczXCI7XG4gIGNvbnN0IGRlc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBkZXNjLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeSBtaW4tdy0wIHRleHQtc21cIjtcbiAgZGVzYy50ZXh0Q29udGVudCA9IFwiXHU1MTczXHU5NUVEXHU1NDBFXHU1M0VBXHU0RkREXHU3NTU5XHU4QkJFXHU3RjZFXHU5ODc1XHU1NDhDXHU1RjAwXHU1MTczXHU3NkQxXHU1NDJDXHVGRjBDXHU3QjJDXHU0RTA5XHU2NUI5XHU2QTIxXHU1NzhCXHU2ODY1XHUzMDAxXHU2M0QyXHU0RUY2XHU1MjlGXHU4MEZEXHU1NDhDXHU1NDBFXHU1M0YwXHU4MUVBXHU1MkE4XHU0RkVFXHU1OTBEXHU5MEZEXHU0RjFBXHU2NjgyXHU1MDVDXHUzMDAyXCI7XG4gIGxlZnQuYXBwZW5kQ2hpbGQodGl0bGUpO1xuICBsZWZ0LmFwcGVuZENoaWxkKGRlc2MpO1xuICByb3cuYXBwZW5kQ2hpbGQobGVmdCk7XG4gIHJvdy5hcHBlbmRDaGlsZChcbiAgICBzd2l0Y2hDb250cm9sKGNvbmZpZy5lbmFibGVkLCBhc3luYyAobmV4dCkgPT4ge1xuICAgICAgYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpzZXQtcGx1Z2luLWVuYWJsZWRcIiwgbmV4dCk7XG4gICAgICByZWZyZXNoQ29uZmlnQ2FyZChyb3cpO1xuICAgIH0pLFxuICApO1xuICByZXR1cm4gcm93O1xufVxuXG5mdW5jdGlvbiBhdXRvVXBkYXRlUm93KGNvbmZpZzogQ29kZXhQbHVzUGx1c0NvbmZpZyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICByb3cuY2xhc3NOYW1lID0gXCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTQgcC0zXCI7XHJcbiAgY29uc3QgbGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgbGVmdC5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LWNvbCBnYXAtMVwiO1xyXG4gIGNvbnN0IHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgdGl0bGUuY2xhc3NOYW1lID0gXCJtaW4tdy0wIHRleHQtc20gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgdGl0bGUudGV4dENvbnRlbnQgPSBcIlx1ODFFQVx1NTJBOFx1NTIzN1x1NjVCMCBjb2RleFx1NkM0OVx1NTMxNlx1NTg5RVx1NUYzQXBsdXNcdTcyNDhcIjtcbiAgY29uc3QgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGRlc2MuY2xhc3NOYW1lID0gXCJ0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5IG1pbi13LTAgdGV4dC1zbVwiO1xuICBkZXNjLnRleHRDb250ZW50ID0gYFx1NURGMlx1NUI4OVx1ODhDNVx1NzI0OFx1NjcyQyB2JHtjb25maWcudmVyc2lvbn1cdTMwMDJcdTU0MEVcdTUzRjBcdTY3MERcdTUyQTFcdTRGMUFcdTk3NTlcdTlFRDhcdTY4QzBcdTY3RTVcdTY2RjRcdTY1QjBcdUZGMENcdTVFNzZcdTU3MjggQ29kZXggXHU2NkY0XHU2NUIwXHU1NDBFXHU4MUVBXHU1MkE4XHU2MDYyXHU1OTBEIGNvZGV4XHU2QzQ5XHU1MzE2XHU1ODlFXHU1RjNBcGx1c1x1NzI0OCBydW50aW1lXHUzMDAyYDtcbiAgbGVmdC5hcHBlbmRDaGlsZCh0aXRsZSk7XHJcbiAgbGVmdC5hcHBlbmRDaGlsZChkZXNjKTtcclxuICByb3cuYXBwZW5kQ2hpbGQobGVmdCk7XHJcbiAgcm93LmFwcGVuZENoaWxkKFxyXG4gICAgc3dpdGNoQ29udHJvbChjb25maWcuYXV0b1VwZGF0ZSwgYXN5bmMgKG5leHQpID0+IHtcclxuICAgICAgYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpzZXQtYXV0by11cGRhdGVcIiwgbmV4dCk7XHJcbiAgICB9KSxcclxuICApO1xyXG4gIHJldHVybiByb3c7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZUNoYW5uZWxSb3coY29uZmlnOiBDb2RleFBsdXNQbHVzQ29uZmlnKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCByb3cgPSBhY3Rpb25Sb3coXCJcdTUzRDFcdTVFMDNcdTkwMUFcdTkwNTNcIiwgdXBkYXRlQ2hhbm5lbFN1bW1hcnkoY29uZmlnKSk7XG4gIGNvbnN0IGFjdGlvbiA9IHJvdy5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcIltkYXRhLWNvZGV4cHAtcm93LWFjdGlvbnNdXCIpO1xyXG4gIGNvbnN0IHNlbGVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWxlY3RcIik7XHJcbiAgc2VsZWN0LmNsYXNzTmFtZSA9XHJcbiAgICBcImgtOCByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyIGJnLXRyYW5zcGFyZW50IHB4LTIgdGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeSBmb2N1czpvdXRsaW5lLW5vbmVcIjtcclxuICBmb3IgKGNvbnN0IFt2YWx1ZSwgbGFiZWxdIG9mIFtcbiAgICBbXCJzdGFibGVcIiwgXCJcdTdBMzNcdTVCOUFcdTcyNDhcIl0sXG4gICAgW1wicHJlcmVsZWFzZVwiLCBcIlx1OTg4NFx1NTNEMVx1NUUwM1x1NzI0OFwiXSxcbiAgICBbXCJjdXN0b21cIiwgXCJcdTgxRUFcdTVCOUFcdTRFNDlcIl0sXG4gIF0gYXMgY29uc3QpIHtcclxuICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJvcHRpb25cIik7XHJcbiAgICBvcHRpb24udmFsdWUgPSB2YWx1ZTtcclxuICAgIG9wdGlvbi50ZXh0Q29udGVudCA9IGxhYmVsO1xyXG4gICAgb3B0aW9uLnNlbGVjdGVkID0gY29uZmlnLnVwZGF0ZUNoYW5uZWwgPT09IHZhbHVlO1xyXG4gICAgc2VsZWN0LmFwcGVuZENoaWxkKG9wdGlvbik7XHJcbiAgfVxyXG4gIHNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcclxuICAgIHZvaWQgaXBjUmVuZGVyZXJcclxuICAgICAgLmludm9rZShcImNvZGV4cHA6c2V0LXVwZGF0ZS1jb25maWdcIiwgeyB1cGRhdGVDaGFubmVsOiBzZWxlY3QudmFsdWUgfSlcclxuICAgICAgLnRoZW4oKCkgPT4gcmVmcmVzaENvbmZpZ0NhcmQocm93KSlcclxuICAgICAgLmNhdGNoKChlKSA9PiBwbG9nKFwic2V0IHVwZGF0ZSBjaGFubmVsIGZhaWxlZFwiLCBTdHJpbmcoZSkpKTtcclxuICB9KTtcclxuICBhY3Rpb24/LmFwcGVuZENoaWxkKHNlbGVjdCk7XHJcbiAgaWYgKGNvbmZpZy51cGRhdGVDaGFubmVsID09PSBcImN1c3RvbVwiKSB7XG4gICAgYWN0aW9uPy5hcHBlbmRDaGlsZChcbiAgICAgIGNvbXBhY3RCdXR0b24oXCJcdTdGMTZcdThGOTFcIiwgKCkgPT4ge1xuICAgICAgICBjb25zdCByZXBvID0gd2luZG93LnByb21wdChcIkdpdEh1YiBcdTRFRDNcdTVFOTNcIiwgY29uZmlnLnVwZGF0ZVJlcG8gfHwgXCJjaGVuZ3lvdTg4OC8tXCIpO1xuICAgICAgICBpZiAocmVwbyA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICBjb25zdCByZWYgPSB3aW5kb3cucHJvbXB0KFwiR2l0IFx1NUYxNVx1NzUyOFwiLCBjb25maWcudXBkYXRlUmVmIHx8IFwibWFpblwiKTtcbiAgICAgICAgaWYgKHJlZiA9PT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIHZvaWQgaXBjUmVuZGVyZXJcclxuICAgICAgICAgIC5pbnZva2UoXCJjb2RleHBwOnNldC11cGRhdGUtY29uZmlnXCIsIHtcclxuICAgICAgICAgICAgdXBkYXRlQ2hhbm5lbDogXCJjdXN0b21cIixcclxuICAgICAgICAgICAgdXBkYXRlUmVwbzogcmVwbyxcclxuICAgICAgICAgICAgdXBkYXRlUmVmOiByZWYsXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4gcmVmcmVzaENvbmZpZ0NhcmQocm93KSlcclxuICAgICAgICAgIC5jYXRjaCgoZSkgPT4gcGxvZyhcInNldCBjdXN0b20gdXBkYXRlIHNvdXJjZSBmYWlsZWRcIiwgU3RyaW5nKGUpKSk7XHJcbiAgICAgIH0pLFxyXG4gICAgKTtcclxuICB9XHJcbiAgcmV0dXJuIHJvdztcclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbGF0aW9uU291cmNlUm93KHNvdXJjZTogSW5zdGFsbGF0aW9uU291cmNlKTogSFRNTEVsZW1lbnQge1xuICByZXR1cm4gcm93U2ltcGxlKFwiXHU1Qjg5XHU4OEM1XHU2NzY1XHU2RTkwXCIsIGxvY2FsaXplSW5zdGFsbGF0aW9uU291cmNlKHNvdXJjZSkpO1xufVxuXG5mdW5jdGlvbiBzZWxmVXBkYXRlU3RhdHVzUm93KHN0YXRlOiBTZWxmVXBkYXRlU3RhdGUgfCBudWxsKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCByb3cgPSByb3dTaW1wbGUoXCJcdTRFMEFcdTZCMjEgY29kZXhcdTZDNDlcdTUzMTZcdTU4OUVcdTVGM0FwbHVzXHU3MjQ4IFx1NjZGNFx1NjVCMFwiLCBzZWxmVXBkYXRlU3VtbWFyeShzdGF0ZSkpO1xuICBjb25zdCBsZWZ0ID0gcm93LmZpcnN0RWxlbWVudENoaWxkIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcclxuICBpZiAobGVmdCAmJiBzdGF0ZSkgbGVmdC5wcmVwZW5kKHN0YXR1c0JhZGdlKHNlbGZVcGRhdGVTdGF0dXNUb25lKHN0YXRlLnN0YXR1cyksIHNlbGZVcGRhdGVTdGF0dXNMYWJlbChzdGF0ZS5zdGF0dXMpKSk7XHJcbiAgcmV0dXJuIHJvdztcclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tGb3JVcGRhdGVzUm93KGNvbmZpZzogQ29kZXhQbHVzUGx1c0NvbmZpZyk6IEhUTUxFbGVtZW50IHtcclxuICBjb25zdCBjaGVjayA9IGNvbmZpZy51cGRhdGVDaGVjaztcclxuICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIHJvdy5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtNCBwLTNcIjtcclxuICBjb25zdCBsZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBsZWZ0LmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGZsZXgtY29sIGdhcC0xXCI7XHJcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIHRpdGxlLmNsYXNzTmFtZSA9IFwibWluLXctMCB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XHJcbiAgdGl0bGUudGV4dENvbnRlbnQgPSBjaGVjaz8udXBkYXRlQXZhaWxhYmxlID8gXCJjb2RleFx1NkM0OVx1NTMxNlx1NTg5RVx1NUYzQXBsdXNcdTcyNDggXHU2NzA5XHU1M0VGXHU3NTI4XHU2NkY0XHU2NUIwXCIgOiBcIlx1NjhDMFx1NjdFNSBjb2RleFx1NkM0OVx1NTMxNlx1NTg5RVx1NUYzQXBsdXNcdTcyNDggXHU2NkY0XHU2NUIwXCI7XG4gIGNvbnN0IGRlc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGRlc2MuY2xhc3NOYW1lID0gXCJ0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5IG1pbi13LTAgdGV4dC1zbVwiO1xyXG4gIGRlc2MudGV4dENvbnRlbnQgPSB1cGRhdGVTdW1tYXJ5KGNoZWNrKTtcclxuICBsZWZ0LmFwcGVuZENoaWxkKHRpdGxlKTtcclxuICBsZWZ0LmFwcGVuZENoaWxkKGRlc2MpO1xyXG4gIHJvdy5hcHBlbmRDaGlsZChsZWZ0KTtcclxuXHJcbiAgY29uc3QgYWN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgYWN0aW9ucy5jbGFzc05hbWUgPSBcImZsZXggc2hyaW5rLTAgaXRlbXMtY2VudGVyIGdhcC0yXCI7XHJcbiAgYWN0aW9ucy5hcHBlbmRDaGlsZChcbiAgICBjb21wYWN0QnV0dG9uKFwiXHU3QUNCXHU1MzczXHU2OEMwXHU2N0U1XCIsICgpID0+IHtcbiAgICAgIHJvdy5zdHlsZS5vcGFjaXR5ID0gXCIwLjY1XCI7XHJcbiAgICAgIHZvaWQgaXBjUmVuZGVyZXJcclxuICAgICAgICAuaW52b2tlKFwiY29kZXhwcDpjaGVjay1jb2RleHBwLXVwZGF0ZVwiLCB0cnVlKVxyXG4gICAgICAgIC50aGVuKChjaGVjaykgPT4ge1xyXG4gICAgICAgICAgc2V0U2lkZWJhckNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b24oY2hlY2sgYXMgQ29kZXhQbHVzUGx1c1VwZGF0ZUNoZWNrKTtcclxuICAgICAgICAgIHJlZnJlc2hDb25maWdDYXJkKHJvdyk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goKGUpID0+IHBsb2coXCJjb2RleFx1NkM0OVx1NTMxNlx1NTg5RVx1NUYzQXBsdXNcdTcyNDggcmVsZWFzZSBjaGVjayBmYWlsZWRcIiwgU3RyaW5nKGUpKSlcclxuICAgICAgICAuZmluYWxseSgoKSA9PiB7XHJcbiAgICAgICAgICByb3cuc3R5bGUub3BhY2l0eSA9IFwiXCI7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KSxcclxuICApO1xyXG4gIGFjdGlvbnMuYXBwZW5kQ2hpbGQoXHJcbiAgICBjb21wYWN0QnV0dG9uKFwiXHU0RTBCXHU4RjdEXHU2NkY0XHU2NUIwXCIsICgpID0+IHtcbiAgICAgIHJvdy5zdHlsZS5vcGFjaXR5ID0gXCIwLjY1XCI7XHJcbiAgICAgIGNvbnN0IGJ1dHRvbnMgPSBhY3Rpb25zLnF1ZXJ5U2VsZWN0b3JBbGwoXCJidXR0b25cIik7XHJcbiAgICAgIGJ1dHRvbnMuZm9yRWFjaCgoYnV0dG9uKSA9PiAoYnV0dG9uLmRpc2FibGVkID0gdHJ1ZSkpO1xyXG4gICAgICB2b2lkIGlwY1JlbmRlcmVyXHJcbiAgICAgICAgLmludm9rZShcImNvZGV4cHA6cnVuLWNvZGV4cHAtdXBkYXRlXCIpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgcmVmcmVzaFNpZGViYXJDb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uKHRydWUpO1xyXG4gICAgICAgICAgcmVmcmVzaENvbmZpZ0NhcmQocm93KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaCgoZSkgPT4ge1xyXG4gICAgICAgICAgcGxvZyhcImNvZGV4XHU2QzQ5XHU1MzE2XHU1ODlFXHU1RjNBcGx1c1x1NzI0OCBzZWxmLXVwZGF0ZSBmYWlsZWRcIiwgU3RyaW5nKGUpKTtcclxuICAgICAgICAgIHZvaWQgcmVmcmVzaENvbmZpZ0NhcmQocm93KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5maW5hbGx5KCgpID0+IHtcclxuICAgICAgICAgIHJvdy5zdHlsZS5vcGFjaXR5ID0gXCJcIjtcclxuICAgICAgICAgIGJ1dHRvbnMuZm9yRWFjaCgoYnV0dG9uKSA9PiAoYnV0dG9uLmRpc2FibGVkID0gZmFsc2UpKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pLFxyXG4gICk7XHJcbiAgcm93LmFwcGVuZENoaWxkKGFjdGlvbnMpO1xyXG4gIHJldHVybiByb3c7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbGVhc2VOb3Rlc1JvdyhjaGVjazogQ29kZXhQbHVzUGx1c1VwZGF0ZUNoZWNrKTogSFRNTEVsZW1lbnQge1xyXG4gIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgcm93LmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LWNvbCBnYXAtMiBwLTNcIjtcclxuICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlLmNsYXNzTmFtZSA9IFwidGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xuICB0aXRsZS50ZXh0Q29udGVudCA9IFwiXHU2NzAwXHU2NUIwXHU1M0QxXHU1RTAzXHU4QkY0XHU2NjBFXCI7XG4gIHJvdy5hcHBlbmRDaGlsZCh0aXRsZSk7XHJcbiAgY29uc3QgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgYm9keS5jbGFzc05hbWUgPVxyXG4gICAgXCJtYXgtaC02MCBvdmVyZmxvdy1hdXRvIHJvdW5kZWQtbWQgYm9yZGVyIGJvcmRlci10b2tlbi1ib3JkZXIgYmctdG9rZW4tZm9yZWdyb3VuZC81IHAtMyB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnlcIjtcclxuICBib2R5LmFwcGVuZENoaWxkKHJlbmRlclJlbGVhc2VOb3Rlc01hcmtkb3duKGxvY2FsaXplUmVsZWFzZU5vdGVzKGNoZWNrLnJlbGVhc2VOb3Rlcz8udHJpbSgpIHx8IGNoZWNrLmVycm9yIHx8IFwiXCIpKSk7XG4gIHJvdy5hcHBlbmRDaGlsZChib2R5KTtcclxuICByZXR1cm4gcm93O1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJSZWxlYXNlTm90ZXNNYXJrZG93bihtYXJrZG93bjogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xyXG4gIGNvbnN0IHJvb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIHJvb3QuY2xhc3NOYW1lID0gXCJmbGV4IGZsZXgtY29sIGdhcC0yXCI7XHJcbiAgY29uc3QgbGluZXMgPSBtYXJrZG93bi5yZXBsYWNlKC9cXHJcXG4/L2csIFwiXFxuXCIpLnNwbGl0KFwiXFxuXCIpO1xyXG4gIGxldCBwYXJhZ3JhcGg6IHN0cmluZ1tdID0gW107XHJcbiAgbGV0IGxpc3Q6IEhUTUxPTGlzdEVsZW1lbnQgfCBIVE1MVUxpc3RFbGVtZW50IHwgbnVsbCA9IG51bGw7XHJcbiAgbGV0IGNvZGVMaW5lczogc3RyaW5nW10gfCBudWxsID0gbnVsbDtcclxuXHJcbiAgY29uc3QgZmx1c2hQYXJhZ3JhcGggPSAoKSA9PiB7XHJcbiAgICBpZiAocGFyYWdyYXBoLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xyXG4gICAgY29uc3QgcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwXCIpO1xyXG4gICAgcC5jbGFzc05hbWUgPSBcIm0tMCBsZWFkaW5nLTVcIjtcclxuICAgIGFwcGVuZElubGluZU1hcmtkb3duKHAsIHBhcmFncmFwaC5qb2luKFwiIFwiKS50cmltKCkpO1xyXG4gICAgcm9vdC5hcHBlbmRDaGlsZChwKTtcclxuICAgIHBhcmFncmFwaCA9IFtdO1xyXG4gIH07XHJcbiAgY29uc3QgZmx1c2hMaXN0ID0gKCkgPT4ge1xyXG4gICAgaWYgKCFsaXN0KSByZXR1cm47XHJcbiAgICByb290LmFwcGVuZENoaWxkKGxpc3QpO1xyXG4gICAgbGlzdCA9IG51bGw7XHJcbiAgfTtcclxuICBjb25zdCBmbHVzaENvZGUgPSAoKSA9PiB7XHJcbiAgICBpZiAoIWNvZGVMaW5lcykgcmV0dXJuO1xyXG4gICAgY29uc3QgcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcclxuICAgIHByZS5jbGFzc05hbWUgPVxyXG4gICAgICBcIm0tMCBvdmVyZmxvdy1hdXRvIHJvdW5kZWQtbWQgYm9yZGVyIGJvcmRlci10b2tlbi1ib3JkZXIgYmctdG9rZW4tZm9yZWdyb3VuZC8xMCBwLTIgdGV4dC14cyB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xyXG4gICAgY29uc3QgY29kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjb2RlXCIpO1xyXG4gICAgY29kZS50ZXh0Q29udGVudCA9IGNvZGVMaW5lcy5qb2luKFwiXFxuXCIpO1xyXG4gICAgcHJlLmFwcGVuZENoaWxkKGNvZGUpO1xyXG4gICAgcm9vdC5hcHBlbmRDaGlsZChwcmUpO1xyXG4gICAgY29kZUxpbmVzID0gbnVsbDtcclxuICB9O1xyXG5cclxuICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcclxuICAgIGlmIChsaW5lLnRyaW0oKS5zdGFydHNXaXRoKFwiYGBgXCIpKSB7XHJcbiAgICAgIGlmIChjb2RlTGluZXMpIGZsdXNoQ29kZSgpO1xyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBmbHVzaFBhcmFncmFwaCgpO1xyXG4gICAgICAgIGZsdXNoTGlzdCgpO1xyXG4gICAgICAgIGNvZGVMaW5lcyA9IFtdO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG4gICAgaWYgKGNvZGVMaW5lcykge1xyXG4gICAgICBjb2RlTGluZXMucHVzaChsaW5lKTtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpO1xyXG4gICAgaWYgKCF0cmltbWVkKSB7XHJcbiAgICAgIGZsdXNoUGFyYWdyYXBoKCk7XHJcbiAgICAgIGZsdXNoTGlzdCgpO1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBoZWFkaW5nID0gL14oI3sxLDN9KVxccysoLispJC8uZXhlYyh0cmltbWVkKTtcclxuICAgIGlmIChoZWFkaW5nKSB7XHJcbiAgICAgIGZsdXNoUGFyYWdyYXBoKCk7XHJcbiAgICAgIGZsdXNoTGlzdCgpO1xyXG4gICAgICBjb25zdCBoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChoZWFkaW5nWzFdLmxlbmd0aCA9PT0gMSA/IFwiaDNcIiA6IFwiaDRcIik7XHJcbiAgICAgIGguY2xhc3NOYW1lID0gXCJtLTAgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xyXG4gICAgICBhcHBlbmRJbmxpbmVNYXJrZG93bihoLCBoZWFkaW5nWzJdKTtcclxuICAgICAgcm9vdC5hcHBlbmRDaGlsZChoKTtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdW5vcmRlcmVkID0gL15bLSpdXFxzKyguKykkLy5leGVjKHRyaW1tZWQpO1xyXG4gICAgY29uc3Qgb3JkZXJlZCA9IC9eXFxkK1suKV1cXHMrKC4rKSQvLmV4ZWModHJpbW1lZCk7XHJcbiAgICBpZiAodW5vcmRlcmVkIHx8IG9yZGVyZWQpIHtcclxuICAgICAgZmx1c2hQYXJhZ3JhcGgoKTtcclxuICAgICAgY29uc3Qgd2FudE9yZGVyZWQgPSBCb29sZWFuKG9yZGVyZWQpO1xyXG4gICAgICBpZiAoIWxpc3QgfHwgKHdhbnRPcmRlcmVkICYmIGxpc3QudGFnTmFtZSAhPT0gXCJPTFwiKSB8fCAoIXdhbnRPcmRlcmVkICYmIGxpc3QudGFnTmFtZSAhPT0gXCJVTFwiKSkge1xyXG4gICAgICAgIGZsdXNoTGlzdCgpO1xyXG4gICAgICAgIGxpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHdhbnRPcmRlcmVkID8gXCJvbFwiIDogXCJ1bFwiKTtcclxuICAgICAgICBsaXN0LmNsYXNzTmFtZSA9IHdhbnRPcmRlcmVkXHJcbiAgICAgICAgICA/IFwibS0wIGxpc3QtZGVjaW1hbCBzcGFjZS15LTEgcGwtNSBsZWFkaW5nLTVcIlxyXG4gICAgICAgICAgOiBcIm0tMCBsaXN0LWRpc2Mgc3BhY2UteS0xIHBsLTUgbGVhZGluZy01XCI7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XHJcbiAgICAgIGFwcGVuZElubGluZU1hcmtkb3duKGxpLCAodW5vcmRlcmVkID8/IG9yZGVyZWQpPy5bMV0gPz8gXCJcIik7XHJcbiAgICAgIGxpc3QuYXBwZW5kQ2hpbGQobGkpO1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBxdW90ZSA9IC9ePlxccz8oLispJC8uZXhlYyh0cmltbWVkKTtcclxuICAgIGlmIChxdW90ZSkge1xyXG4gICAgICBmbHVzaFBhcmFncmFwaCgpO1xyXG4gICAgICBmbHVzaExpc3QoKTtcclxuICAgICAgY29uc3QgYmxvY2txdW90ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJibG9ja3F1b3RlXCIpO1xyXG4gICAgICBibG9ja3F1b3RlLmNsYXNzTmFtZSA9IFwibS0wIGJvcmRlci1sLTIgYm9yZGVyLXRva2VuLWJvcmRlciBwbC0zIGxlYWRpbmctNVwiO1xyXG4gICAgICBhcHBlbmRJbmxpbmVNYXJrZG93bihibG9ja3F1b3RlLCBxdW90ZVsxXSk7XHJcbiAgICAgIHJvb3QuYXBwZW5kQ2hpbGQoYmxvY2txdW90ZSk7XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHBhcmFncmFwaC5wdXNoKHRyaW1tZWQpO1xyXG4gIH1cclxuXHJcbiAgZmx1c2hQYXJhZ3JhcGgoKTtcclxuICBmbHVzaExpc3QoKTtcclxuICBmbHVzaENvZGUoKTtcclxuICByZXR1cm4gcm9vdDtcclxufVxyXG5cclxuZnVuY3Rpb24gYXBwZW5kSW5saW5lTWFya2Rvd24ocGFyZW50OiBIVE1MRWxlbWVudCwgdGV4dDogc3RyaW5nKTogdm9pZCB7XHJcbiAgY29uc3QgcGF0dGVybiA9IC8oYChbXmBdKylgfFxcWyhbXlxcXV0rKVxcXVxcKChodHRwcz86XFwvXFwvW15cXHMpXSspXFwpfFxcKlxcKihbXipdKylcXCpcXCp8XFwqKFteKl0rKVxcKikvZztcclxuICBsZXQgbGFzdEluZGV4ID0gMDtcclxuICBmb3IgKGNvbnN0IG1hdGNoIG9mIHRleHQubWF0Y2hBbGwocGF0dGVybikpIHtcclxuICAgIGlmIChtYXRjaC5pbmRleCA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcclxuICAgIGFwcGVuZFRleHQocGFyZW50LCB0ZXh0LnNsaWNlKGxhc3RJbmRleCwgbWF0Y2guaW5kZXgpKTtcclxuICAgIGlmIChtYXRjaFsyXSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGNvbnN0IGNvZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY29kZVwiKTtcclxuICAgICAgY29kZS5jbGFzc05hbWUgPVxyXG4gICAgICAgIFwicm91bmRlZCBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBiZy10b2tlbi1mb3JlZ3JvdW5kLzEwIHB4LTEgcHktMC41IHRleHQteHMgdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcclxuICAgICAgY29kZS50ZXh0Q29udGVudCA9IG1hdGNoWzJdO1xyXG4gICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoY29kZSk7XHJcbiAgICB9IGVsc2UgaWYgKG1hdGNoWzNdICE9PSB1bmRlZmluZWQgJiYgbWF0Y2hbNF0gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICAgIGEuY2xhc3NOYW1lID0gXCJ0ZXh0LXRva2VuLXRleHQtcHJpbWFyeSB1bmRlcmxpbmUgdW5kZXJsaW5lLW9mZnNldC0yXCI7XHJcbiAgICAgIGEuaHJlZiA9IG1hdGNoWzRdO1xyXG4gICAgICBhLnRhcmdldCA9IFwiX2JsYW5rXCI7XHJcbiAgICAgIGEucmVsID0gXCJub29wZW5lciBub3JlZmVycmVyXCI7XHJcbiAgICAgIGEudGV4dENvbnRlbnQgPSBtYXRjaFszXTtcclxuICAgICAgcGFyZW50LmFwcGVuZENoaWxkKGEpO1xyXG4gICAgfSBlbHNlIGlmIChtYXRjaFs1XSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGNvbnN0IHN0cm9uZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHJvbmdcIik7XHJcbiAgICAgIHN0cm9uZy5jbGFzc05hbWUgPSBcImZvbnQtbWVkaXVtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XHJcbiAgICAgIHN0cm9uZy50ZXh0Q29udGVudCA9IG1hdGNoWzVdO1xyXG4gICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoc3Ryb25nKTtcclxuICAgIH0gZWxzZSBpZiAobWF0Y2hbNl0gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjb25zdCBlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJlbVwiKTtcclxuICAgICAgZW0udGV4dENvbnRlbnQgPSBtYXRjaFs2XTtcclxuICAgICAgcGFyZW50LmFwcGVuZENoaWxkKGVtKTtcclxuICAgIH1cclxuICAgIGxhc3RJbmRleCA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoO1xyXG4gIH1cclxuICBhcHBlbmRUZXh0KHBhcmVudCwgdGV4dC5zbGljZShsYXN0SW5kZXgpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYXBwZW5kVGV4dChwYXJlbnQ6IEhUTUxFbGVtZW50LCB0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcclxuICBpZiAodGV4dCkgcGFyZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyV2F0Y2hlckhlYWx0aENhcmQoY2FyZDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcclxuICB2b2lkIGlwY1JlbmRlcmVyXHJcbiAgICAuaW52b2tlKFwiY29kZXhwcDpnZXQtd2F0Y2hlci1oZWFsdGhcIilcclxuICAgIC50aGVuKChoZWFsdGgpID0+IHtcclxuICAgICAgY2FyZC50ZXh0Q29udGVudCA9IFwiXCI7XHJcbiAgICAgIHJlbmRlcldhdGNoZXJIZWFsdGgoY2FyZCwgaGVhbHRoIGFzIFdhdGNoZXJIZWFsdGgpO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgY2FyZC50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICBjYXJkLmFwcGVuZENoaWxkKHJvd1NpbXBsZShcIlx1NjVFMFx1NkNENVx1NjhDMFx1NjdFNVx1NTQwRVx1NTNGMFx1NjcwRFx1NTJBMVwiLCBTdHJpbmcoZSkpKTtcbiAgICB9KTtcbn1cblxyXG5mdW5jdGlvbiByZW5kZXJXYXRjaGVySGVhbHRoKGNhcmQ6IEhUTUxFbGVtZW50LCBoZWFsdGg6IFdhdGNoZXJIZWFsdGgpOiB2b2lkIHtcclxuICBjYXJkLmFwcGVuZENoaWxkKHdhdGNoZXJTdW1tYXJ5Um93KGhlYWx0aCkpO1xyXG4gIGZvciAoY29uc3QgY2hlY2sgb2YgaGVhbHRoLmNoZWNrcykge1xyXG4gICAgaWYgKGNoZWNrLnN0YXR1cyA9PT0gXCJva1wiKSBjb250aW51ZTtcclxuICAgIGNhcmQuYXBwZW5kQ2hpbGQod2F0Y2hlckNoZWNrUm93KGNoZWNrKSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB3YXRjaGVyU3VtbWFyeVJvdyhoZWFsdGg6IFdhdGNoZXJIZWFsdGgpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgcm93LmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC00IHAtM1wiO1xyXG4gIGNvbnN0IGxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGxlZnQuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgaXRlbXMtc3RhcnQgZ2FwLTNcIjtcclxuICBsZWZ0LmFwcGVuZENoaWxkKHN0YXR1c0JhZGdlKGhlYWx0aC5zdGF0dXMsIGhlYWx0aC53YXRjaGVyKSk7XHJcbiAgY29uc3Qgc3RhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIHN0YWNrLmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGZsZXgtY29sIGdhcC0xXCI7XHJcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZS5jbGFzc05hbWUgPSBcIm1pbi13LTAgdGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xuICB0aXRsZS50ZXh0Q29udGVudCA9IGxvY2FsaXplV2F0Y2hlclRleHQoaGVhbHRoLnRpdGxlKTtcbiAgY29uc3QgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGRlc2MuY2xhc3NOYW1lID0gXCJ0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5IG1pbi13LTAgdGV4dC1zbVwiO1xuICBkZXNjLnRleHRDb250ZW50ID0gYCR7bG9jYWxpemVXYXRjaGVyVGV4dChoZWFsdGguc3VtbWFyeSl9IFx1NjhDMFx1NjdFNVx1NjVGNlx1OTVGNFx1RkYxQSR7bmV3IERhdGUoaGVhbHRoLmNoZWNrZWRBdCkudG9Mb2NhbGVTdHJpbmcoKX1cdTMwMDJgO1xuICBzdGFjay5hcHBlbmRDaGlsZCh0aXRsZSk7XHJcbiAgc3RhY2suYXBwZW5kQ2hpbGQoZGVzYyk7XHJcbiAgbGVmdC5hcHBlbmRDaGlsZChzdGFjayk7XHJcbiAgcm93LmFwcGVuZENoaWxkKGxlZnQpO1xyXG5cclxuICBjb25zdCBhY3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGFjdGlvbi5jbGFzc05hbWUgPSBcImZsZXggc2hyaW5rLTAgaXRlbXMtY2VudGVyIGdhcC0yXCI7XHJcbiAgYWN0aW9uLmFwcGVuZENoaWxkKFxyXG4gICAgY29tcGFjdEJ1dHRvbihcIlx1N0FDQlx1NTM3M1x1NjhDMFx1NjdFNVwiLCAoKSA9PiB7XG4gICAgICBjb25zdCBjYXJkID0gcm93LnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgIGlmICghY2FyZCkgcmV0dXJuO1xyXG4gICAgICBjYXJkLnRleHRDb250ZW50ID0gXCJcIjtcclxuICAgICAgY2FyZC5hcHBlbmRDaGlsZChyb3dTaW1wbGUoXCJcdTZCNjNcdTU3MjhcdTY4QzBcdTY3RTVcdTU0MEVcdTUzRjBcdTY3MERcdTUyQTFcIiwgXCJcdTZCNjNcdTU3MjhcdTlBOENcdThCQzFcdTY2RjRcdTY1QjBcdTU2NjhcdTRGRUVcdTU5MERcdTY3MERcdTUyQTFcdTMwMDJcIikpO1xuICAgICAgcmVuZGVyV2F0Y2hlckhlYWx0aENhcmQoY2FyZCk7XHJcbiAgICB9KSxcclxuICApO1xyXG4gIHJvdy5hcHBlbmRDaGlsZChhY3Rpb24pO1xyXG4gIHJldHVybiByb3c7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdhdGNoZXJDaGVja1JvdyhjaGVjazogV2F0Y2hlckhlYWx0aENoZWNrKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCByb3cgPSByb3dTaW1wbGUobG9jYWxpemVXYXRjaGVyVGV4dChjaGVjay5uYW1lKSwgbG9jYWxpemVXYXRjaGVyVGV4dChjaGVjay5kZXRhaWwpKTtcbiAgY29uc3QgbGVmdCA9IHJvdy5maXJzdEVsZW1lbnRDaGlsZCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XHJcbiAgaWYgKGxlZnQpIGxlZnQucHJlcGVuZChzdGF0dXNCYWRnZShjaGVjay5zdGF0dXMpKTtcclxuICByZXR1cm4gcm93O1xyXG59XHJcblxyXG5mdW5jdGlvbiBzdGF0dXNCYWRnZShzdGF0dXM6IFwib2tcIiB8IFwid2FyblwiIHwgXCJlcnJvclwiLCBsYWJlbD86IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcclxuICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gIGNvbnN0IHRvbmUgPVxyXG4gICAgc3RhdHVzID09PSBcIm9rXCJcclxuICAgICAgPyBcImJvcmRlci10b2tlbi1jaGFydHMtZ3JlZW4gdGV4dC10b2tlbi1jaGFydHMtZ3JlZW5cIlxyXG4gICAgICA6IHN0YXR1cyA9PT0gXCJ3YXJuXCJcclxuICAgICAgICA/IFwiYm9yZGVyLXRva2VuLWNoYXJ0cy15ZWxsb3cgdGV4dC10b2tlbi1jaGFydHMteWVsbG93XCJcclxuICAgICAgICA6IFwiYm9yZGVyLXRva2VuLWNoYXJ0cy1yZWQgdGV4dC10b2tlbi1jaGFydHMtcmVkXCI7XHJcbiAgYmFkZ2UuY2xhc3NOYW1lID0gYGlubGluZS1mbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciByb3VuZGVkLWZ1bGwgYm9yZGVyIHB4LTIgcHktMC41IHRleHQteHMgZm9udC1tZWRpdW0gJHt0b25lfWA7XHJcbiAgYmFkZ2UudGV4dENvbnRlbnQgPSBsYWJlbCA/IGxvY2FsaXplV2F0Y2hlclRleHQobGFiZWwpIDogKHN0YXR1cyA9PT0gXCJva1wiID8gXCJcdTZCNjNcdTVFMzhcIiA6IHN0YXR1cyA9PT0gXCJ3YXJuXCIgPyBcIlx1OTcwMFx1NjhDMFx1NjdFNVwiIDogXCJcdTk1MTlcdThCRUZcIik7XG4gIHJldHVybiBiYWRnZTtcbn1cblxuZnVuY3Rpb24gbG9jYWxpemVXYXRjaGVyVGV4dCh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dFxuICAgIC5yZXBsYWNlKC9ec2NoZWR1bGVkLXRhc2skL2ksIFwiXHU4QkExXHU1MjEyXHU0RUZCXHU1MkExXCIpXG4gICAgLnJlcGxhY2UoL153aW5kb3dzLXNlcnZpY2UkL2ksIFwiV2luZG93cyBcdTY3MERcdTUyQTFcIilcbiAgICAucmVwbGFjZSgvXmxhdW5jaGQkL2ksIFwibGF1bmNoZFwiKVxuICAgIC5yZXBsYWNlKC9eQXV0by1yZXBhaXIgd2F0Y2hlciBuZWVkcyByZXZpZXckL2ksIFwiXHU1NDBFXHU1M0YwXHU0RkVFXHU1OTBEXHU2NzBEXHU1MkExXHU5NzAwXHU4OTgxXHU2OEMwXHU2N0U1XCIpXG4gICAgLnJlcGxhY2UoL15BdXRvLXJlcGFpciB3YXRjaGVyIGlzIGhlYWx0aHkkL2ksIFwiXHU1NDBFXHU1M0YwXHU0RkVFXHU1OTBEXHU2NzBEXHU1MkExXHU2QjYzXHU1RTM4XCIpXG4gICAgLnJlcGxhY2UoL15BdXRvLXJlcGFpciB3YXRjaGVyIGZhaWxlZCQvaSwgXCJcdTU0MEVcdTUzRjBcdTRGRUVcdTU5MERcdTY3MERcdTUyQTFcdTU5MzFcdThEMjVcIilcbiAgICAucmVwbGFjZSgvKFxcZCspIGZhaWxpbmcgY2hlY2tcXChzXFwpLCAoXFxkKykgd2FybmluZ1xcKHNcXClcXC4vaSwgXCIkMSBcdTk4NzlcdTY4QzBcdTY3RTVcdTU5MzFcdThEMjVcdUZGMEMkMiBcdTk4NzlcdThCNjZcdTU0NEFcdTMwMDJcIilcbiAgICAucmVwbGFjZSgvXndhdGNoZXIgdGFzayQvaSwgXCJcdTU0MEVcdTUzRjBcdTRFRkJcdTUyQTFcIilcbiAgICAucmVwbGFjZSgvXndhdGNoZXIgbG9nJC9pLCBcIlx1NjcwRFx1NTJBMVx1NjVFNVx1NUZEN1wiKVxuICAgIC5yZXBsYWNlKC9eUGx1Z2luIHN3aXRjaCQvaSwgXCJcdTYzRDJcdTRFRjZcdTYwM0JcdTVGMDBcdTUxNzNcIilcbiAgICAucmVwbGFjZSgvXldpbmRvd3Mgc2VydmljZSQvaSwgXCJXaW5kb3dzIFx1NjcwRFx1NTJBMVwiKVxuICAgIC5yZXBsYWNlKC9ec2VydmljZSBzdGF0ZSQvaSwgXCJcdTY3MERcdTUyQTFcdTcyQjZcdTYwMDFcIilcbiAgICAucmVwbGFjZSgvXmxlZ2FjeSBzY2hlZHVsZWQgdGFza3MkL2ksIFwiXHU2NUU3XHU4QkExXHU1MjEyXHU0RUZCXHU1MkExXCIpXG4gICAgLnJlcGxhY2UoL15kaXNhYmxlZCBpbiBjb2RleC1wbHVzcGx1cyBjb25maWckL2ksIFwiXHU1REYyXHU1NzI4IGNvZGV4XHU2QzQ5XHU1MzE2XHU1ODlFXHU1RjNBcGx1c1x1NzI0OCBcdTkxNERcdTdGNkVcdTRFMkRcdTUxNzNcdTk1RURcIilcbiAgICAucmVwbGFjZSgvXnNraXBwZWQgYmVjYXVzZSBwbHVnaW4gc3dpdGNoIGlzIG9mZiQvaSwgXCJcdTYzRDJcdTRFRjZcdTYwM0JcdTVGMDBcdTUxNzNcdTVERjJcdTUxNzNcdTk1RURcdUZGMENcdTVERjJcdThERjNcdThGQzdcIilcbiAgICAucmVwbGFjZSgvXmluc3RhbGxlZCBidXQgbm90IHJ1bm5pbmckL2ksIFwiXHU1REYyXHU1Qjg5XHU4OEM1XHU0RjQ2XHU2NzJBXHU4RkQwXHU4ODRDXCIpXG4gICAgLnJlcGxhY2UoL15vbGQgd2F0Y2hlciB0YXNrcyBzdGlsbCBleGlzdCQvaSwgXCJcdTRFQ0RcdTY3MDlcdTY1RTdcdThCQTFcdTUyMTJcdTRFRkJcdTUyQTFcdTZCOEJcdTc1NTlcIilcbiAgICAucmVwbGFjZSgvXnJlbW92ZWQkL2ksIFwiXHU1REYyXHU3OUZCXHU5NjY0XCIpXG4gICAgLnJlcGxhY2UoL15pbnN0YWxsIHN0YXRlJC9pLCBcIlx1NUI4OVx1ODhDNVx1NzJCNlx1NjAwMVwiKVxuICAgIC5yZXBsYWNlKC9ecnVudGltZSQvaSwgXCJydW50aW1lXCIpXG4gICAgLnJlcGxhY2UoL15yZXBhaXIgc3RhdGUkL2ksIFwiXHU0RkVFXHU1OTBEXHU3MkI2XHU2MDAxXCIpO1xufVxuXHJcbmZ1bmN0aW9uIHVwZGF0ZVN1bW1hcnkoY2hlY2s6IENvZGV4UGx1c1BsdXNVcGRhdGVDaGVjayB8IG51bGwpOiBzdHJpbmcge1xuICBpZiAoIWNoZWNrKSByZXR1cm4gXCJcdTVDMUFcdTY3MkFcdTY4QzBcdTY3RTVcdTY2RjRcdTY1QjBcdTMwMDJcIjtcbiAgY29uc3QgbGF0ZXN0ID0gY2hlY2subGF0ZXN0VmVyc2lvbiA/IGBcdTY3MDBcdTY1QjAgdiR7Y2hlY2subGF0ZXN0VmVyc2lvbn1cdTMwMDJgIDogXCJcIjtcbiAgY29uc3QgY2hlY2tlZCA9IGBcdTY4QzBcdTY3RTVcdTY1RjZcdTk1RjRcdUZGMUEke25ldyBEYXRlKGNoZWNrLmNoZWNrZWRBdCkudG9Mb2NhbGVTdHJpbmcoKX1cdTMwMDJgO1xuICBpZiAoY2hlY2suZXJyb3IpIHJldHVybiBgJHtsYXRlc3R9JHtjaGVja2VkfSAke2NoZWNrLmVycm9yfWA7XG4gIHJldHVybiBgJHtsYXRlc3R9JHtjaGVja2VkfWA7XG59XG5cclxuZnVuY3Rpb24gdXBkYXRlQ2hhbm5lbFN1bW1hcnkoY29uZmlnOiBDb2RleFBsdXNQbHVzQ29uZmlnKTogc3RyaW5nIHtcclxuICBpZiAoY29uZmlnLnVwZGF0ZUNoYW5uZWwgPT09IFwiY3VzdG9tXCIpIHtcbiAgICByZXR1cm4gYCR7Y29uZmlnLnVwZGF0ZVJlcG8gfHwgXCJjaGVuZ3lvdTg4OC8tXCJ9ICR7Y29uZmlnLnVwZGF0ZVJlZiB8fCBcIlx1RkYwOFx1NjcyQVx1OEJCRVx1N0Y2RSByZWZcdUZGMDlcIn1gO1xuICB9XG4gIGlmIChjb25maWcudXBkYXRlQ2hhbm5lbCA9PT0gXCJwcmVyZWxlYXNlXCIpIHtcbiAgICByZXR1cm4gXCJcdTRGN0ZcdTc1MjhcdTY3MDBcdTY1QjBcdTUzRDFcdTVFMDNcdTc2ODQgR2l0SHViIHJlbGVhc2VcdUZGMENcdTUzMDVcdTYyRUNcdTk4ODRcdTUzRDFcdTVFMDNcdTcyNDhcdTY3MkNcdTMwMDJcIjtcbiAgfVxuICByZXR1cm4gXCJcdTRGN0ZcdTc1MjhcdTY3MDBcdTY1QjBcdTdBMzNcdTVCOUFcdTcyNDggR2l0SHViIHJlbGVhc2VcdTMwMDJcIjtcbn1cblxuZnVuY3Rpb24gc2VsZlVwZGF0ZVN1bW1hcnkoc3RhdGU6IFNlbGZVcGRhdGVTdGF0ZSB8IG51bGwpOiBzdHJpbmcge1xuICBpZiAoIXN0YXRlKSByZXR1cm4gXCJcdTVDMUFcdTY3MkFcdThGRDBcdTg4NENcdThGQzdcdTgxRUFcdTUyQTggY29kZXhcdTZDNDlcdTUzMTZcdTU4OUVcdTVGM0FwbHVzXHU3MjQ4IFx1NjZGNFx1NjVCMFx1MzAwMlwiO1xuICBjb25zdCBjaGVja2VkID0gbmV3IERhdGUoc3RhdGUuY29tcGxldGVkQXQgPz8gc3RhdGUuY2hlY2tlZEF0KS50b0xvY2FsZVN0cmluZygpO1xuICBjb25zdCB0YXJnZXQgPSBzdGF0ZS5sYXRlc3RWZXJzaW9uID8gYCBcdTc2RUVcdTY4MDcgdiR7c3RhdGUubGF0ZXN0VmVyc2lvbn1cdTMwMDJgIDogc3RhdGUudGFyZ2V0UmVmID8gYCBcdTc2RUVcdTY4MDcgJHtzdGF0ZS50YXJnZXRSZWZ9XHUzMDAyYCA6IFwiXCI7XG4gIGNvbnN0IHNvdXJjZSA9IHN0YXRlLmluc3RhbGxhdGlvblNvdXJjZSA/IGxvY2FsaXplSW5zdGFsbGF0aW9uU291cmNlKHN0YXRlLmluc3RhbGxhdGlvblNvdXJjZSkgOiBcIlx1NjcyQVx1NzdFNVx1Njc2NVx1NkU5MFwiO1xuICBpZiAoc3RhdGUuc3RhdHVzID09PSBcImZhaWxlZFwiKSByZXR1cm4gYFx1NTkzMVx1OEQyNVx1NEU4RSAke2NoZWNrZWR9XHUzMDAyJHt0YXJnZXR9ICR7c3RhdGUuZXJyb3IgPz8gXCJcdTY3MkFcdTc3RTVcdTk1MTlcdThCRUZcIn1gO1xuICBpZiAoc3RhdGUuc3RhdHVzID09PSBcInVwZGF0ZWRcIikgcmV0dXJuIGBcdTVERjJcdTY2RjRcdTY1QjBcdTRFOEUgJHtjaGVja2VkfVx1MzAwMiR7dGFyZ2V0fSBcdTY3NjVcdTZFOTBcdUZGMUEke3NvdXJjZX1cdTMwMDJgO1xuICBpZiAoc3RhdGUuc3RhdHVzID09PSBcInVwLXRvLWRhdGVcIikgcmV0dXJuIGBcdTVERjJcdTY2MkZcdTY3MDBcdTY1QjAgJHtjaGVja2VkfVx1MzAwMiR7dGFyZ2V0fSBcdTY3NjVcdTZFOTBcdUZGMUEke3NvdXJjZX1cdTMwMDJgO1xuICBpZiAoc3RhdGUuc3RhdHVzID09PSBcImRpc2FibGVkXCIpIHJldHVybiBgXHU1REYyXHU4REYzXHU4RkM3ICR7Y2hlY2tlZH1cdUZGMUJcdTgxRUFcdTUyQThcdTUyMzdcdTY1QjBcdTVERjJcdTUxNzNcdTk1RURcdTMwMDJgO1xuICByZXR1cm4gYFx1NkI2M1x1NTcyOFx1NjhDMFx1NjdFNVx1NjZGNFx1NjVCMFx1MzAwMlx1Njc2NVx1NkU5MFx1RkYxQSR7c291cmNlfVx1MzAwMmA7XG59XG5cclxuZnVuY3Rpb24gc2VsZlVwZGF0ZVN0YXR1c1RvbmUoc3RhdHVzOiBTZWxmVXBkYXRlU3RhdHVzKTogXCJva1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCIge1xyXG4gIGlmIChzdGF0dXMgPT09IFwiZmFpbGVkXCIpIHJldHVybiBcImVycm9yXCI7XHJcbiAgaWYgKHN0YXR1cyA9PT0gXCJkaXNhYmxlZFwiIHx8IHN0YXR1cyA9PT0gXCJjaGVja2luZ1wiKSByZXR1cm4gXCJ3YXJuXCI7XHJcbiAgcmV0dXJuIFwib2tcIjtcclxufVxyXG5cclxuZnVuY3Rpb24gc2VsZlVwZGF0ZVN0YXR1c0xhYmVsKHN0YXR1czogU2VsZlVwZGF0ZVN0YXR1cyk6IHN0cmluZyB7XG4gIGlmIChzdGF0dXMgPT09IFwidXAtdG8tZGF0ZVwiKSByZXR1cm4gXCJcdTY3MDBcdTY1QjBcIjtcbiAgaWYgKHN0YXR1cyA9PT0gXCJ1cGRhdGVkXCIpIHJldHVybiBcIlx1NURGMlx1NjZGNFx1NjVCMFwiO1xuICBpZiAoc3RhdHVzID09PSBcImZhaWxlZFwiKSByZXR1cm4gXCJcdTU5MzFcdThEMjVcIjtcbiAgaWYgKHN0YXR1cyA9PT0gXCJkaXNhYmxlZFwiKSByZXR1cm4gXCJcdTVERjJcdTUxNzNcdTk1RURcIjtcbiAgcmV0dXJuIFwiXHU2OEMwXHU2N0U1XHU0RTJEXCI7XG59XG5cclxuZnVuY3Rpb24gcmVmcmVzaENvbmZpZ0NhcmQocm93OiBIVE1MRWxlbWVudCk6IHZvaWQge1xyXG4gIGNvbnN0IGNhcmQgPSByb3cuY2xvc2VzdChcIltkYXRhLWNvZGV4cHAtY29uZmlnLWNhcmRdXCIpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcclxuICBpZiAoIWNhcmQpIHJldHVybjtcclxuICBjYXJkLnRleHRDb250ZW50ID0gXCJcIjtcclxuICBjYXJkLmFwcGVuZENoaWxkKHJvd1NpbXBsZShcIlx1NkI2M1x1NTcyOFx1NTIzN1x1NjVCMFwiLCBcIlx1NkI2M1x1NTcyOFx1NTJBMFx1OEY3RFx1NUY1M1x1NTI0RCBjb2RleFx1NkM0OVx1NTMxNlx1NTg5RVx1NUYzQXBsdXNcdTcyNDggXHU2NkY0XHU2NUIwXHU3MkI2XHU2MDAxXHUzMDAyXCIpKTtcbiAgdm9pZCBpcGNSZW5kZXJlclxyXG4gICAgLmludm9rZShcImNvZGV4cHA6Z2V0LWNvbmZpZ1wiKVxyXG4gICAgLnRoZW4oKGNvbmZpZykgPT4ge1xyXG4gICAgICBjYXJkLnRleHRDb250ZW50ID0gXCJcIjtcclxuICAgICAgcmVuZGVyQ29kZXhQbHVzUGx1c0NvbmZpZyhjYXJkLCBjb25maWcgYXMgQ29kZXhQbHVzUGx1c0NvbmZpZyk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKChlKSA9PiB7XHJcbiAgICAgIGNhcmQudGV4dENvbnRlbnQgPSBcIlwiO1xyXG4gICAgICBjYXJkLmFwcGVuZENoaWxkKHJvd1NpbXBsZShcIlx1NjVFMFx1NkNENVx1NTIzN1x1NjVCMFx1NjZGNFx1NjVCMFx1OEJCRVx1N0Y2RVwiLCBTdHJpbmcoZSkpKTtcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdW5pbnN0YWxsUm93KCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm93ID0gYWN0aW9uUm93KFxuICAgIFwiXHU1Mzc4XHU4RjdEIGNvZGV4XHU2QzQ5XHU1MzE2XHU1ODlFXHU1RjNBcGx1c1x1NzI0OFwiLFxuICAgIFwiXHU1OTBEXHU1MjM2XHU1Mzc4XHU4RjdEXHU1NDdEXHU0RUU0XHUzMDAyXHU1QjhDXHU1MTY4XHU5MDAwXHU1MUZBIENvZGV4IFx1NTQwRVx1RkYwQ1x1NTcyOFx1N0VDOFx1N0FFRlx1NEUyRFx1OEZEMFx1ODg0Q1x1NUI4M1x1MzAwMlwiLFxuICApO1xuICBjb25zdCBhY3Rpb24gPSByb3cucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCJbZGF0YS1jb2RleHBwLXJvdy1hY3Rpb25zXVwiKTtcbiAgYWN0aW9uPy5hcHBlbmRDaGlsZChcbiAgICBjb21wYWN0QnV0dG9uKFwiXHU1OTBEXHU1MjM2XHU1NDdEXHU0RUU0XCIsICgpID0+IHtcbiAgICAgIHZvaWQgaXBjUmVuZGVyZXJcclxuICAgICAgICAuaW52b2tlKFwiY29kZXhwcDpjb3B5LXRleHRcIiwgXCJub2RlIH4vLmNvZGV4LXBsdXNwbHVzL3NvdXJjZS9wYWNrYWdlcy9pbnN0YWxsZXIvZGlzdC9jbGkuanMgdW5pbnN0YWxsXCIpXHJcbiAgICAgICAgLmNhdGNoKChlKSA9PiBwbG9nKFwiY29weSB1bmluc3RhbGwgY29tbWFuZCBmYWlsZWRcIiwgU3RyaW5nKGUpKSk7XHJcbiAgICB9KSxcclxuICApO1xyXG4gIHJldHVybiByb3c7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlcG9ydEJ1Z1JvdygpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHJvdyA9IGFjdGlvblJvdyhcbiAgICBcIkFpIE9wZW4gVG9vbFwiLFxuICAgIFwiXHU2MjUzXHU1RjAwIEFpIE9wZW4gVG9vbCBcdTgzQjdcdTUzRDZcdTUzQ0RcdTk5ODhcdTMwMDFcdTY1MkZcdTYzMDFcdTU0OENcdTVERTVcdTUxNzdcdTdCQjFcdTc2RjhcdTUxNzNcdTRGRTFcdTYwNkZcdTMwMDJcIixcbiAgKTtcbiAgY29uc3QgYWN0aW9uID0gcm93LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFwiW2RhdGEtY29kZXhwcC1yb3ctYWN0aW9uc11cIik7XG4gIGFjdGlvbj8uYXBwZW5kQ2hpbGQoXG4gICAgY29tcGFjdEJ1dHRvbihcIlx1NjI1M1x1NUYwMCBBaSBPcGVuIFRvb2xcIiwgKCkgPT4ge1xuICAgICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm9wZW4tZXh0ZXJuYWxcIiwgQUlfT1BFTl9UT09MX1VSTCk7XG4gICAgfSksXG4gICk7XG4gIHJldHVybiByb3c7XG59XG5cclxuZnVuY3Rpb24gYWN0aW9uUm93KHRpdGxlVGV4dDogc3RyaW5nLCBkZXNjcmlwdGlvbjogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xyXG4gIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgcm93LmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC00IHAtM1wiO1xyXG4gIGNvbnN0IGxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGxlZnQuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC1jb2wgZ2FwLTFcIjtcclxuICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgdGl0bGUuY2xhc3NOYW1lID0gXCJtaW4tdy0wIHRleHQtc20gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcclxuICB0aXRsZS50ZXh0Q29udGVudCA9IHRpdGxlVGV4dDtcclxuICBjb25zdCBkZXNjID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBkZXNjLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeSBtaW4tdy0wIHRleHQtc21cIjtcclxuICBkZXNjLnRleHRDb250ZW50ID0gZGVzY3JpcHRpb247XHJcbiAgbGVmdC5hcHBlbmRDaGlsZCh0aXRsZSk7XHJcbiAgbGVmdC5hcHBlbmRDaGlsZChkZXNjKTtcclxuICByb3cuYXBwZW5kQ2hpbGQobGVmdCk7XHJcbiAgY29uc3QgYWN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgYWN0aW9ucy5kYXRhc2V0LmNvZGV4cHBSb3dBY3Rpb25zID0gXCJ0cnVlXCI7XHJcbiAgYWN0aW9ucy5jbGFzc05hbWUgPSBcImZsZXggc2hyaW5rLTAgaXRlbXMtY2VudGVyIGdhcC0yXCI7XHJcbiAgcm93LmFwcGVuZENoaWxkKGFjdGlvbnMpO1xyXG4gIHJldHVybiByb3c7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlclR3ZWFrU3RvcmVQYWdlKFxyXG4gIHNlY3Rpb25zV3JhcDogSFRNTEVsZW1lbnQsXHJcbiAgaGVhZGVyQWN0aW9ucz86IEhUTUxFbGVtZW50LFxyXG4pOiB2b2lkIHtcclxuICBjb25zdCBzZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlY3Rpb25cIik7XHJcbiAgc2VjdGlvbi5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLTRcIjtcclxuXHJcbiAgY29uc3Qgc291cmNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIHNvdXJjZS5oaWRkZW4gPSB0cnVlO1xuICBzb3VyY2UuZGF0YXNldC5jb2RleHBwU3RvcmVTb3VyY2UgPSBcInRydWVcIjtcbiAgc291cmNlLnRleHRDb250ZW50ID0gXCJcdTZCNjNcdTU3MjhcdTUyQTBcdThGN0RcdTU3MjhcdTdFQkZcdTYzRDJcdTRFRjZcdTdEMjJcdTVGMTVcIjtcblxyXG4gIGNvbnN0IGFjdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGFjdGlvbnMuY2xhc3NOYW1lID0gXCJmbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciBnYXAtMlwiO1xyXG4gIGNvbnN0IHJlZnJlc2hCdG4gPSBzdG9yZUljb25CdXR0b24ocmVmcmVzaEljb25TdmcoKSwgXCJcdTUyMzdcdTY1QjBcdTYzRDJcdTRFRjZcdTU1NDZcdTVFOTdcIiwgKCkgPT4ge1xuICAgIHJlZnJlc2hCdG4uZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgdXBkYXRlU3RvcmVVcGRhdGVCYWRnZShudWxsKTtcclxuICAgIGdyaWQudGV4dENvbnRlbnQgPSBcIlwiO1xyXG4gICAgcmVuZGVyVHdlYWtTdG9yZUdob3N0R3JpZChncmlkKTtcclxuICAgIHJlZnJlc2hUd2Vha1N0b3JlR3JpZChncmlkLCBzb3VyY2UsIHJlZnJlc2hCdG4sIHRydWUpO1xyXG4gIH0pO1xyXG4gIGFjdGlvbnMuYXBwZW5kQ2hpbGQocmVmcmVzaEJ0bik7XG4gIGlmIChoZWFkZXJBY3Rpb25zKSB7XG4gICAgaGVhZGVyQWN0aW9ucy5yZXBsYWNlQ2hpbGRyZW4oYWN0aW9ucyk7XG4gIH1cblxyXG4gIGNvbnN0IGdyaWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGdyaWQuZGF0YXNldC5jb2RleHBwU3RvcmVHcmlkID0gXCJ0cnVlXCI7XHJcbiAgZ3JpZC5jbGFzc05hbWUgPSBcImdyaWQgZ2FwLTRcIjtcclxuICBpZiAoc3RhdGUudHdlYWtTdG9yZSkge1xyXG4gICAgZ3JpZC5kYXRhc2V0LmNvZGV4cHBTdG9yZSA9IEpTT04uc3RyaW5naWZ5KHN0YXRlLnR3ZWFrU3RvcmUpO1xyXG4gICAgcmVuZGVyVHdlYWtTdG9yZUdyaWQoZ3JpZCwgc291cmNlKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmVuZGVyVHdlYWtTdG9yZUdob3N0R3JpZChncmlkKTtcclxuICB9XHJcbiAgc2VjdGlvbi5hcHBlbmRDaGlsZChzb3VyY2UpO1xyXG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQoZ3JpZCk7XHJcbiAgc2VjdGlvbnNXcmFwLmFwcGVuZENoaWxkKHNlY3Rpb24pO1xyXG4gIHJlZnJlc2hUd2Vha1N0b3JlR3JpZChncmlkLCBzb3VyY2UsIHJlZnJlc2hCdG4pO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWZyZXNoVHdlYWtTdG9yZUdyaWQoXHJcbiAgZ3JpZDogSFRNTEVsZW1lbnQsXHJcbiAgc291cmNlOiBIVE1MRWxlbWVudCxcclxuICByZWZyZXNoQnRuPzogSFRNTEJ1dHRvbkVsZW1lbnQsXHJcbiAgZm9yY2UgPSBmYWxzZSxcclxuKTogdm9pZCB7XHJcbiAgdm9pZCBnZXRUd2Vha1N0b3JlKGZvcmNlKVxyXG4gICAgLnRoZW4oKHN0b3JlKSA9PiB7XHJcbiAgICAgIGdyaWQuZGF0YXNldC5jb2RleHBwU3RvcmUgPSBKU09OLnN0cmluZ2lmeShzdG9yZSk7XHJcbiAgICAgIHJlbmRlclR3ZWFrU3RvcmVHcmlkKGdyaWQsIHNvdXJjZSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKChlKSA9PiB7XHJcbiAgICAgIGdyaWQuZGF0YXNldC5jb2RleHBwU3RvcmUgPSBcIlwiO1xuICAgICAgZ3JpZC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWJ1c3lcIik7XG4gICAgICBzb3VyY2UudGV4dENvbnRlbnQgPSBcIlx1NTcyOFx1N0VCRlx1NjNEMlx1NEVGNlx1N0QyMlx1NUYxNVx1NEUwRFx1NTNFRlx1NzUyOFwiO1xuICAgICAgdXBkYXRlU3RvcmVVcGRhdGVCYWRnZShudWxsKTtcbiAgICAgIGdyaWQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgZ3JpZC5hcHBlbmRDaGlsZChzdG9yZU1lc3NhZ2VDYXJkKFwiXHU2NUUwXHU2Q0Q1XHU1MkEwXHU4RjdEXHU2M0QyXHU0RUY2XHU1NTQ2XHU1RTk3XCIsIFN0cmluZyhlKSkpO1xuICAgIH0pXHJcbiAgICAuZmluYWxseSgoKSA9PiB7XHJcbiAgICAgIGlmIChyZWZyZXNoQnRuKSByZWZyZXNoQnRuLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gd2FybVR3ZWFrU3RvcmUoKTogdm9pZCB7XHJcbiAgaWYgKHN0YXRlLnR3ZWFrU3RvcmUgfHwgc3RhdGUudHdlYWtTdG9yZVByb21pc2UpIHJldHVybjtcclxuICB2b2lkIGdldFR3ZWFrU3RvcmUoKS50aGVuKChzdG9yZSkgPT4ge1xyXG4gICAgdXBkYXRlU3RvcmVVcGRhdGVCYWRnZShvdXRkYXRlZEluc3RhbGxlZFN0b3JlQ291bnQoc3RvcmUuZW50cmllcykpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRUd2Vha1N0b3JlKGZvcmNlID0gZmFsc2UpOiBQcm9taXNlPFR3ZWFrU3RvcmVSZWdpc3RyeVZpZXc+IHtcclxuICBpZiAoIWZvcmNlKSB7XHJcbiAgICBpZiAoc3RhdGUudHdlYWtTdG9yZSkgcmV0dXJuIFByb21pc2UucmVzb2x2ZShzdGF0ZS50d2Vha1N0b3JlKTtcclxuICAgIGlmIChzdGF0ZS50d2Vha1N0b3JlUHJvbWlzZSkgcmV0dXJuIHN0YXRlLnR3ZWFrU3RvcmVQcm9taXNlO1xyXG4gIH1cclxuICBzdGF0ZS50d2Vha1N0b3JlRXJyb3IgPSBudWxsO1xyXG4gIGNvbnN0IHByb21pc2UgPSBpcGNSZW5kZXJlclxyXG4gICAgLmludm9rZShcImNvZGV4cHA6Z2V0LXR3ZWFrLXN0b3JlXCIpXHJcbiAgICAudGhlbigoc3RvcmUpID0+IHtcclxuICAgICAgc3RhdGUudHdlYWtTdG9yZSA9IHN0b3JlIGFzIFR3ZWFrU3RvcmVSZWdpc3RyeVZpZXc7XHJcbiAgICAgIHJldHVybiBzdGF0ZS50d2Vha1N0b3JlO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaCgoZSkgPT4ge1xyXG4gICAgICBzdGF0ZS50d2Vha1N0b3JlRXJyb3IgPSBlO1xyXG4gICAgICB0aHJvdyBlO1xyXG4gICAgfSlcclxuICAgIC5maW5hbGx5KCgpID0+IHtcclxuICAgICAgaWYgKHN0YXRlLnR3ZWFrU3RvcmVQcm9taXNlID09PSBwcm9taXNlKSBzdGF0ZS50d2Vha1N0b3JlUHJvbWlzZSA9IG51bGw7XHJcbiAgICB9KTtcclxuICBzdGF0ZS50d2Vha1N0b3JlUHJvbWlzZSA9IHByb21pc2U7XHJcbiAgcmV0dXJuIHByb21pc2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlclR3ZWFrU3RvcmVHcmlkKGdyaWQ6IEhUTUxFbGVtZW50LCBzb3VyY2U6IEhUTUxFbGVtZW50KTogdm9pZCB7XHJcbiAgY29uc3Qgc3RvcmUgPSBwYXJzZVN0b3JlRGF0YXNldChncmlkKTtcclxuICBpZiAoIXN0b3JlKSByZXR1cm47XHJcbiAgY29uc3QgZW50cmllcyA9IHN0b3JlLmVudHJpZXM7XHJcbiAgZ3JpZC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWJ1c3lcIik7XHJcbiAgc291cmNlLnRleHRDb250ZW50ID0gYFx1NTIzN1x1NjVCMFx1NjVGNlx1OTVGNFx1RkYxQSR7bmV3IERhdGUoc3RvcmUuZmV0Y2hlZEF0KS50b0xvY2FsZVN0cmluZygpfWA7XG4gIHVwZGF0ZVN0b3JlVXBkYXRlQmFkZ2Uob3V0ZGF0ZWRJbnN0YWxsZWRTdG9yZUNvdW50KGVudHJpZXMpKTtcclxuICBncmlkLnRleHRDb250ZW50ID0gXCJcIjtcbiAgaWYgKHN0b3JlLmVudHJpZXMubGVuZ3RoID09PSAwKSB7XG4gICAgZ3JpZC5hcHBlbmRDaGlsZChzdG9yZU1lc3NhZ2VDYXJkKFwiXHU2NjgyXHU2NUUwXHU2M0QyXHU0RUY2XCIsIFwiXHU1RjUzXHU1MjREXHU2Q0ExXHU2NzA5XHU1M0VGXHU1Qjg5XHU4OEM1XHU2M0QyXHU0RUY2XHUzMDAyXCIpKTtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSBncmlkLmFwcGVuZENoaWxkKHR3ZWFrU3RvcmVDYXJkKGVudHJ5KSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlU3RvcmVEYXRhc2V0KGdyaWQ6IEhUTUxFbGVtZW50KTogVHdlYWtTdG9yZVJlZ2lzdHJ5VmlldyB8IG51bGwge1xyXG4gIGNvbnN0IHJhdyA9IGdyaWQuZGF0YXNldC5jb2RleHBwU3RvcmU7XHJcbiAgaWYgKCFyYXcpIHJldHVybiBudWxsO1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gSlNPTi5wYXJzZShyYXcpIGFzIFR3ZWFrU3RvcmVSZWdpc3RyeVZpZXc7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHR3ZWFrU3RvcmVDYXJkKGVudHJ5OiBUd2Vha1N0b3JlRW50cnlWaWV3KTogSFRNTEVsZW1lbnQge1xyXG4gIGNvbnN0IHNoZWxsID0gdHdlYWtTdG9yZUNhcmRTaGVsbCgpO1xyXG4gIGNvbnN0IHsgY2FyZCwgbGVmdCwgc3RhY2ssIHZlcnNpb25zLCBhY3Rpb25zIH0gPSBzaGVsbDtcclxuXHJcbiAgbGVmdC5pbnNlcnRCZWZvcmUoc3RvcmVBdmF0YXIoZW50cnkpLCBzdGFjayk7XHJcblxyXG4gIGNvbnN0IHRpdGxlUm93ID0gdHdlYWtTdG9yZVRpdGxlUm93KCk7XHJcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZS5jbGFzc05hbWUgPSBcIm1pbi13LTAgdGV4dC1sZyBmb250LXNlbWlib2xkIGxlYWRpbmctNyB0ZXh0LXRva2VuLWZvcmVncm91bmRcIjtcbiAgdGl0bGUudGV4dENvbnRlbnQgPSBzdG9yZUVudHJ5RGlzcGxheU5hbWUoZW50cnkpO1xuICB0aXRsZVJvdy5hcHBlbmRDaGlsZCh0aXRsZSk7XHJcbiAgdGl0bGVSb3cuYXBwZW5kQ2hpbGQodmVyaWZpZWRTYWZlQmFkZ2UoKSk7XHJcbiAgc3RhY2suYXBwZW5kQ2hpbGQodGl0bGVSb3cpO1xyXG5cclxuICBpZiAoZW50cnkubWFuaWZlc3QuZGVzY3JpcHRpb24pIHtcclxuICAgIGNvbnN0IGRlc2MgPSB0d2Vha1N0b3JlRGVzY3JpcHRpb24oKTtcclxuICAgIGRlc2MudGV4dENvbnRlbnQgPSBzdG9yZUVudHJ5RGlzcGxheURlc2NyaXB0aW9uKGVudHJ5KSA/PyBcIlwiO1xuICAgIHN0YWNrLmFwcGVuZENoaWxkKGRlc2MpO1xyXG4gIH1cclxuXHJcbiAgc3RhY2suYXBwZW5kQ2hpbGQodHdlYWtTdG9yZVJlYWRNb3JlQnV0dG9uKGVudHJ5LnJlcG8pKTtcclxuICB2ZXJzaW9ucy5hcHBlbmRDaGlsZCh0d2Vha1N0b3JlVmVyc2lvbkJhZGdlKGVudHJ5KSk7XHJcblxyXG4gIGlmIChlbnRyeS5yZWxlYXNlVXJsKSB7XHJcbiAgICBhY3Rpb25zLmFwcGVuZENoaWxkKFxyXG4gICAgICBjb21wYWN0QnV0dG9uKFwiXHU3MjQ4XHU2NzJDXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm9wZW4tZXh0ZXJuYWxcIiwgZW50cnkucmVsZWFzZVVybCk7XHJcbiAgICAgIH0pLFxyXG4gICAgKTtcclxuICB9XHJcbiAgY29uc3QgaGFzVXBkYXRlID0gISFlbnRyeS5pbnN0YWxsZWQgJiYgZW50cnkuaW5zdGFsbGVkLnZlcnNpb24gIT09IGVudHJ5Lm1hbmlmZXN0LnZlcnNpb247XHJcbiAgaWYgKGVudHJ5Lmluc3RhbGxlZCAmJiAhaGFzVXBkYXRlKSB7XG4gICAgYWN0aW9ucy5hcHBlbmRDaGlsZChzdG9yZVN0YXR1c1BpbGwoXCJcdTVERjJcdTVCODlcdTg4QzVcIikpO1xuICB9IGVsc2UgaWYgKGVudHJ5LnBsYXRmb3JtICYmICFlbnRyeS5wbGF0Zm9ybS5jb21wYXRpYmxlKSB7XHJcbiAgICBjYXJkLmNsYXNzTGlzdC5hZGQoXCJvcGFjaXR5LTcwXCIpO1xyXG4gICAgYWN0aW9ucy5hcHBlbmRDaGlsZChzdG9yZVN0YXR1c1BpbGwocGxhdGZvcm1Mb2NrZWRMYWJlbChlbnRyeS5wbGF0Zm9ybSkpKTtcclxuICB9IGVsc2UgaWYgKGVudHJ5LnJ1bnRpbWUgJiYgIWVudHJ5LnJ1bnRpbWUuY29tcGF0aWJsZSkge1xyXG4gICAgY2FyZC5jbGFzc0xpc3QuYWRkKFwib3BhY2l0eS03MFwiKTtcclxuICAgIGFjdGlvbnMuYXBwZW5kQ2hpbGQoc3RvcmVTdGF0dXNQaWxsKHJ1bnRpbWVMb2NrZWRMYWJlbChlbnRyeS5ydW50aW1lKSkpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zdCBpbnN0YWxsTGFiZWwgPSBlbnRyeS5pbnN0YWxsZWQgPyBcIlx1NjZGNFx1NjVCMFwiIDogXCJcdTVCODlcdTg4QzVcIjtcbiAgICBpZiAoaGFzVXBkYXRlKSBhY3Rpb25zLmFwcGVuZENoaWxkKHN0b3JlU3RhdHVzUGlsbChcIlx1NjcwOVx1NTNFRlx1NzUyOFx1NjZGNFx1NjVCMFwiLCBcImluZm9cIikpO1xuICAgIGNvbnN0IGluc3RhbGxCdXR0b24gPSBzdG9yZUluc3RhbGxCdXR0b24oaW5zdGFsbExhYmVsLCAoYnV0dG9uKSA9PiB7XHJcbiAgICAgIGNvbnN0IGdyaWQgPSBjYXJkLmNsb3Nlc3QoXCJbZGF0YS1jb2RleHBwLXN0b3JlLWdyaWRdXCIpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcclxuICAgICAgY29uc3Qgc291cmNlID0gZ3JpZD8ucGFyZW50RWxlbWVudD8ucXVlcnlTZWxlY3RvcihcIltkYXRhLWNvZGV4cHAtc3RvcmUtc291cmNlXVwiKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XHJcbiAgICAgIHNob3dTdG9yZUJ1dHRvbkxvYWRpbmcoYnV0dG9uLCBlbnRyeS5pbnN0YWxsZWQgPyBcIlx1NjZGNFx1NjVCMFx1NEUyRFwiIDogXCJcdTVCODlcdTg4QzVcdTRFMkRcIik7XG4gICAgICBhY3Rpb25zLnF1ZXJ5U2VsZWN0b3JBbGwoXCJidXR0b25cIikuZm9yRWFjaCgoYnV0dG9uKSA9PiAoYnV0dG9uLmRpc2FibGVkID0gdHJ1ZSkpO1xyXG4gICAgICB2b2lkIGlwY1JlbmRlcmVyXHJcbiAgICAgICAgLmludm9rZShcImNvZGV4cHA6aW5zdGFsbC1zdG9yZS10d2Vha1wiLCBlbnRyeS5pZClcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICBzaG93U3RvcmVUb2FzdChgJHtzdG9yZUVudHJ5RGlzcGxheU5hbWUoZW50cnkpfSBcdTVERjJcdTVCODlcdTg4QzVcdTMwMDJgKTtcbiAgICAgICAgICBzaG93U3RvcmVCdXR0b25JbnN0YWxsZWQoYnV0dG9uKTtcclxuICAgICAgICAgIHZlcnNpb25zLnJlcGxhY2VDaGlsZHJlbih0d2Vha1N0b3JlVmVyc2lvbkJhZGdlKGVudHJ5LCBlbnRyeS5tYW5pZmVzdC52ZXJzaW9uKSk7XHJcbiAgICAgICAgICB1cGRhdGVTdG9yZVVwZGF0ZUJhZGdlKE1hdGgubWF4KDAsIGN1cnJlbnRTdG9yZVVwZGF0ZUJhZGdlQ291bnQoKSAtIDEpKTtcclxuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICBhY3Rpb25zLnJlcGxhY2VDaGlsZHJlbihzdG9yZVN0YXR1c1BpbGwoXCJcdTVERjJcdTVCODlcdTg4QzVcIikpO1xuICAgICAgICAgICAgaWYgKGdyaWQgJiYgc291cmNlKSByZWZyZXNoVHdlYWtTdG9yZUdyaWQoZ3JpZCwgc291cmNlLCB1bmRlZmluZWQsIHRydWUpO1xyXG4gICAgICAgICAgfSwgOTAwKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaCgoZSkgPT4ge1xyXG4gICAgICAgICAgcmVzZXRTdG9yZUluc3RhbGxCdXR0b24oYnV0dG9uLCBpbnN0YWxsTGFiZWwpO1xyXG4gICAgICAgICAgYWN0aW9ucy5xdWVyeVNlbGVjdG9yQWxsKFwiYnV0dG9uXCIpLmZvckVhY2goKGJ1dHRvbikgPT4gKGJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlKSk7XHJcbiAgICAgICAgICBzaG93U3RvcmVDYXJkTWVzc2FnZShjYXJkLCBTdHJpbmcoKGUgYXMgRXJyb3IpLm1lc3NhZ2UgPz8gZSkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICBhY3Rpb25zLmFwcGVuZENoaWxkKGluc3RhbGxCdXR0b24pO1xyXG4gIH1cclxuICByZXR1cm4gY2FyZDtcclxufVxyXG5cclxuZnVuY3Rpb24gcGxhdGZvcm1Mb2NrZWRMYWJlbChwbGF0Zm9ybTogTm9uTnVsbGFibGU8VHdlYWtTdG9yZUVudHJ5Vmlld1tcInBsYXRmb3JtXCJdPik6IHN0cmluZyB7XG4gIGNvbnN0IHN1cHBvcnRlZCA9IHBsYXRmb3JtLnN1cHBvcnRlZCA/PyBbXTtcbiAgaWYgKHN1cHBvcnRlZC5pbmNsdWRlcyhcIndpbjMyXCIpKSByZXR1cm4gXCJcdTRFQzUgV2luZG93c1wiO1xuICBpZiAoc3VwcG9ydGVkLmluY2x1ZGVzKFwiZGFyd2luXCIpKSByZXR1cm4gXCJcdTRFQzUgbWFjT1NcIjtcbiAgaWYgKHN1cHBvcnRlZC5pbmNsdWRlcyhcImxpbnV4XCIpKSByZXR1cm4gXCJcdTRFQzUgTGludXhcIjtcbiAgcmV0dXJuIFwiXHU0RTBEXHU1M0VGXHU3NTI4XCI7XG59XG5cbmZ1bmN0aW9uIHJ1bnRpbWVMb2NrZWRMYWJlbChydW50aW1lOiBOb25OdWxsYWJsZTxUd2Vha1N0b3JlRW50cnlWaWV3W1wicnVudGltZVwiXT4pOiBzdHJpbmcge1xuICByZXR1cm4gcnVudGltZS5yZXF1aXJlZCA/IGBcdTk3MDBcdTg5ODEgY29kZXhcdTZDNDlcdTUzMTZcdTU4OUVcdTVGM0FwbHVzXHU3MjQ4ICR7cnVudGltZS5yZXF1aXJlZH1gIDogXCJcdTk3MDBcdTg5ODFcdTY2RjRcdTY1QjBcdTcyNDhcdTY3MkNcdTc2ODQgY29kZXhcdTZDNDlcdTUzMTZcdTU4OUVcdTVGM0FwbHVzXHU3MjQ4XCI7XG59XG5cclxuZnVuY3Rpb24gc2hvd1N0b3JlQ2FyZE1lc3NhZ2UoY2FyZDogSFRNTEVsZW1lbnQsIG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xyXG4gIGNhcmQucXVlcnlTZWxlY3RvcihcIltkYXRhLWNvZGV4cHAtc3RvcmUtY2FyZC1tZXNzYWdlXVwiKT8ucmVtb3ZlKCk7XHJcbiAgY29uc3Qgbm90aWNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBub3RpY2UuZGF0YXNldC5jb2RleHBwU3RvcmVDYXJkTWVzc2FnZSA9IFwidHJ1ZVwiO1xyXG4gIG5vdGljZS5jbGFzc05hbWUgPVxyXG4gICAgXCJyb3VuZGVkLWxnIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyLzUwIGJnLXRva2VuLWZvcmVncm91bmQvNSBweC0zIHB5LTIgdGV4dC1zbSBsZWFkaW5nLTUgdGV4dC10b2tlbi1kZXNjcmlwdGlvbi1mb3JlZ3JvdW5kXCI7XHJcbiAgbm90aWNlLnRleHRDb250ZW50ID0gbWVzc2FnZTtcclxuICBjb25zdCBhY3Rpb25zID0gY2FyZC5sYXN0RWxlbWVudENoaWxkO1xyXG4gIGlmIChhY3Rpb25zKSBjYXJkLmluc2VydEJlZm9yZShub3RpY2UsIGFjdGlvbnMpO1xyXG4gIGVsc2UgY2FyZC5hcHBlbmRDaGlsZChub3RpY2UpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0d2Vha1N0b3JlQ2FyZFNoZWxsKCk6IHtcclxuICBjYXJkOiBIVE1MRWxlbWVudDtcclxuICBsZWZ0OiBIVE1MRWxlbWVudDtcclxuICBzdGFjazogSFRNTEVsZW1lbnQ7XHJcbiAgdmVyc2lvbnM6IEhUTUxFbGVtZW50O1xyXG4gIGFjdGlvbnM6IEhUTUxFbGVtZW50O1xyXG59IHtcclxuICBjb25zdCBjYXJkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBjYXJkLmNsYXNzTmFtZSA9XHJcbiAgICBcImJvcmRlci10b2tlbi1ib3JkZXIvNDAgZmxleCBtaW4taC1bMTkwcHhdIGZsZXgtY29sIGp1c3RpZnktYmV0d2VlbiBnYXAtNCByb3VuZGVkLTJ4bCBib3JkZXIgcC00IHRyYW5zaXRpb24tY29sb3JzIGhvdmVyOmJnLXRva2VuLWZvcmVncm91bmQvNVwiO1xyXG5cclxuICBjb25zdCBsZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBsZWZ0LmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGZsZXgtMSBpdGVtcy1zdGFydCBnYXAtM1wiO1xyXG4gIGNvbnN0IHN0YWNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBzdGFjay5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LTEgZmxleC1jb2wgZ2FwLTJcIjtcclxuICBsZWZ0LmFwcGVuZENoaWxkKHN0YWNrKTtcclxuICBjYXJkLmFwcGVuZENoaWxkKGxlZnQpO1xyXG5cclxuICBjb25zdCBmb290ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGZvb3Rlci5jbGFzc05hbWUgPSBcIm10LWF1dG8gZmxleCBtaW4tdy0wIGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yXCI7XHJcbiAgY29uc3QgdmVyc2lvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIHZlcnNpb25zLmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGZsZXgtMSBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcclxuICBmb290ZXIuYXBwZW5kQ2hpbGQodmVyc2lvbnMpO1xyXG4gIGNvbnN0IGFjdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGFjdGlvbnMuY2xhc3NOYW1lID0gXCJmbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWVuZCBnYXAtMlwiO1xyXG4gIGZvb3Rlci5hcHBlbmRDaGlsZChhY3Rpb25zKTtcclxuICBjYXJkLmFwcGVuZENoaWxkKGZvb3Rlcik7XHJcblxyXG4gIHJldHVybiB7IGNhcmQsIGxlZnQsIHN0YWNrLCB2ZXJzaW9ucywgYWN0aW9ucyB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiB0d2Vha1N0b3JlVGl0bGVSb3coKTogSFRNTEVsZW1lbnQge1xyXG4gIGNvbnN0IHRpdGxlUm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICB0aXRsZVJvdy5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBpdGVtcy1zdGFydCBqdXN0aWZ5LWJldHdlZW4gZ2FwLTNcIjtcclxuICByZXR1cm4gdGl0bGVSb3c7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHR3ZWFrU3RvcmVEZXNjcmlwdGlvbigpOiBIVE1MRWxlbWVudCB7XHJcbiAgY29uc3QgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgZGVzYy5jbGFzc05hbWUgPSBcImxpbmUtY2xhbXAtMyBtaW4tdy0wIHRleHQtc20gbGVhZGluZy01IHRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnlcIjtcclxuICByZXR1cm4gZGVzYztcclxufVxyXG5cclxuZnVuY3Rpb24gdHdlYWtTdG9yZVJlYWRNb3JlQnV0dG9uKHJlcG86IHN0cmluZyk6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgY29uc3QgcmVhZE1vcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xyXG4gIHJlYWRNb3JlLnR5cGUgPSBcImJ1dHRvblwiO1xyXG4gIHJlYWRNb3JlLmNsYXNzTmFtZSA9XHJcbiAgICBcImlubGluZS1mbGV4IHctZml0IGl0ZW1zLWNlbnRlciBnYXAtMSB0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtdG9rZW4tdGV4dC1saW5rLWZvcmVncm91bmQgaG92ZXI6dW5kZXJsaW5lXCI7XHJcbiAgcmVhZE1vcmUuaW5uZXJIVE1MID1cbiAgICBgXHU2N0U1XHU3NzBCXHU4QkU2XHU2MEM1YCArXG4gICAgYDxzdmcgd2lkdGg9XCIxNFwiIGhlaWdodD1cIjE0XCIgdmlld0JveD1cIjAgMCAxNiAxNlwiIGZpbGw9XCJub25lXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+YCArXHJcbiAgICBgPHBhdGggZD1cIk02IDMuNWg2LjVWMTBNMTIuMjUgMy43NSA0IDEyXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS40NVwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiLz5gICtcclxuICAgIGA8L3N2Zz5gO1xyXG4gIHJlYWRNb3JlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIHZvaWQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpvcGVuLWV4dGVybmFsXCIsIGBodHRwczovL2dpdGh1Yi5jb20vJHtyZXBvfWApO1xyXG4gIH0pO1xyXG4gIHJldHVybiByZWFkTW9yZTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyVHdlYWtTdG9yZUdob3N0R3JpZChncmlkOiBIVE1MRWxlbWVudCk6IHZvaWQge1xyXG4gIGdyaWQuc2V0QXR0cmlidXRlKFwiYXJpYS1idXN5XCIsIFwidHJ1ZVwiKTtcclxuICBncmlkLnRleHRDb250ZW50ID0gXCJcIjtcclxuICBncmlkLmFwcGVuZENoaWxkKHR3ZWFrU3RvcmVHaG9zdENhcmQoKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHR3ZWFrU3RvcmVHaG9zdENhcmQoKTogSFRNTEVsZW1lbnQge1xyXG4gIGNvbnN0IHsgY2FyZCwgbGVmdCwgc3RhY2ssIHZlcnNpb25zLCBhY3Rpb25zIH0gPSB0d2Vha1N0b3JlQ2FyZFNoZWxsKCk7XHJcbiAgY2FyZC5jbGFzc0xpc3QuYWRkKFwicG9pbnRlci1ldmVudHMtbm9uZVwiKTtcclxuICBjYXJkLnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIFwidHJ1ZVwiKTtcclxuXHJcbiAgbGVmdC5pbnNlcnRCZWZvcmUoc3RvcmVBdmF0YXJHaG9zdCgpLCBzdGFjayk7XHJcblxyXG4gIGNvbnN0IHRpdGxlUm93ID0gdHdlYWtTdG9yZVRpdGxlUm93KCk7XHJcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIHRpdGxlLmNsYXNzTmFtZSA9IFwibWluLXctMCB0ZXh0LWxnIGZvbnQtc2VtaWJvbGQgbGVhZGluZy03IHRleHQtdG9rZW4tZm9yZWdyb3VuZFwiO1xyXG4gIHRpdGxlLmFwcGVuZENoaWxkKGdob3N0QmxvY2soXCJteS0xIGgtNSB3LTQ0IHJvdW5kZWQtbWRcIikpO1xyXG4gIHRpdGxlUm93LmFwcGVuZENoaWxkKHRpdGxlKTtcclxuICB0aXRsZVJvdy5hcHBlbmRDaGlsZCh2ZXJpZmllZFNhZmVHaG9zdEJhZGdlKCkpO1xyXG4gIHN0YWNrLmFwcGVuZENoaWxkKHRpdGxlUm93KTtcclxuXHJcbiAgY29uc3QgZGVzYyA9IHR3ZWFrU3RvcmVEZXNjcmlwdGlvbigpO1xyXG4gIGRlc2MuYXBwZW5kQ2hpbGQoZ2hvc3RCbG9jayhcIm10LTEgaC0zIHctZnVsbCByb3VuZGVkXCIpKTtcclxuICBkZXNjLmFwcGVuZENoaWxkKGdob3N0QmxvY2soXCJtdC0yIGgtMyB3LTExLzEyIHJvdW5kZWRcIikpO1xyXG4gIGRlc2MuYXBwZW5kQ2hpbGQoZ2hvc3RCbG9jayhcIm10LTIgaC0zIHctNy8xMiByb3VuZGVkXCIpKTtcclxuICBzdGFjay5hcHBlbmRDaGlsZChkZXNjKTtcclxuXHJcbiAgY29uc3QgcmVhZE1vcmUgPSB0d2Vha1N0b3JlUmVhZE1vcmVCdXR0b24oXCJcIik7XHJcbiAgcmVhZE1vcmUucmVwbGFjZUNoaWxkcmVuKGdob3N0QmxvY2soXCJoLTUgdy0yNCByb3VuZGVkXCIpKTtcclxuICBzdGFjay5hcHBlbmRDaGlsZChyZWFkTW9yZSk7XHJcblxyXG4gIHZlcnNpb25zLmFwcGVuZENoaWxkKHN0b3JlVmVyc2lvbkdob3N0QmFkZ2UoKSk7XHJcbiAgYWN0aW9ucy5hcHBlbmRDaGlsZChzdG9yZVN0YXR1c0dob3N0UGlsbCgpKTtcclxuICByZXR1cm4gY2FyZDtcclxufVxyXG5cclxuZnVuY3Rpb24gc3RvcmVBdmF0YXJHaG9zdCgpOiBIVE1MRWxlbWVudCB7XHJcbiAgY29uc3QgYXZhdGFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBhdmF0YXIuY2xhc3NOYW1lID1cclxuICAgIFwiZmxleCBoLTEwIHctMTAgc2hyaW5rLTAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyLWRlZmF1bHQgYmctdHJhbnNwYXJlbnQgdGV4dC10b2tlbi1kZXNjcmlwdGlvbi1mb3JlZ3JvdW5kXCI7XHJcbiAgYXZhdGFyLmFwcGVuZENoaWxkKGdob3N0QmxvY2soXCJoLWZ1bGwgdy1mdWxsXCIpKTtcclxuICByZXR1cm4gYXZhdGFyO1xyXG59XHJcblxyXG5mdW5jdGlvbiB2ZXJpZmllZFNhZmVHaG9zdEJhZGdlKCk6IEhUTUxFbGVtZW50IHtcclxuICBjb25zdCBiYWRnZSA9IHZlcmlmaWVkU2FmZUJhZGdlKCk7XHJcbiAgYmFkZ2UucmVwbGFjZUNoaWxkcmVuKGdob3N0QmxvY2soXCJoLVsxM3B4XSB3LVsxM3B4XSByb3VuZGVkLXNtXCIpLCBnaG9zdEJsb2NrKFwiaC0zIHctMjAgcm91bmRlZFwiKSk7XHJcbiAgcmV0dXJuIGJhZGdlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzdG9yZVN0YXR1c0dob3N0UGlsbCgpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHBpbGwgPSBzdG9yZVN0YXR1c1BpbGwoXCJcdTVERjJcdTVCODlcdTg4QzVcIik7XG4gIHBpbGwuY2xhc3NMaXN0LmFkZChcImFuaW1hdGUtcHVsc2VcIik7XHJcbiAgcGlsbC5zdHlsZS5jb2xvciA9IFwidHJhbnNwYXJlbnRcIjtcclxuICByZXR1cm4gcGlsbDtcclxufVxyXG5cclxuZnVuY3Rpb24gc3RvcmVWZXJzaW9uR2hvc3RCYWRnZSgpOiBIVE1MRWxlbWVudCB7XHJcbiAgY29uc3QgYmFkZ2UgPSBzdG9yZVZlcnNpb25CYWRnZVNoZWxsKGZhbHNlKTtcclxuICBiYWRnZS5hcHBlbmRDaGlsZChnaG9zdEJsb2NrKFwiaC0zIHctMzYgcm91bmRlZFwiKSk7XHJcbiAgcmV0dXJuIGJhZGdlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnaG9zdEJsb2NrKGNsYXNzTmFtZTogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xyXG4gIGNvbnN0IGJsb2NrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBibG9jay5jbGFzc05hbWUgPSBgYW5pbWF0ZS1wdWxzZSBiZy10b2tlbi1mb3JlZ3JvdW5kLzEwICR7Y2xhc3NOYW1lfWA7XHJcbiAgYmxvY2suc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xyXG4gIHJldHVybiBibG9jaztcclxufVxyXG5cclxuZnVuY3Rpb24gc3RvcmVBdmF0YXIoZW50cnk6IFR3ZWFrU3RvcmVFbnRyeVZpZXcpOiBIVE1MRWxlbWVudCB7XHJcbiAgY29uc3QgYXZhdGFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBhdmF0YXIuY2xhc3NOYW1lID1cclxuICAgIFwiZmxleCBoLTEwIHctMTAgc2hyaW5rLTAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyLWRlZmF1bHQgYmctdHJhbnNwYXJlbnQgdGV4dC10b2tlbi1kZXNjcmlwdGlvbi1mb3JlZ3JvdW5kXCI7XHJcbiAgY29uc3QgaW5pdGlhbCA9IChlbnRyeS5tYW5pZmVzdC5uYW1lPy5bMF0gPz8gXCI/XCIpLnRvVXBwZXJDYXNlKCk7XHJcbiAgY29uc3QgZmFsbGJhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICBmYWxsYmFjay50ZXh0Q29udGVudCA9IGluaXRpYWw7XHJcbiAgYXZhdGFyLmFwcGVuZENoaWxkKGZhbGxiYWNrKTtcclxuICBjb25zdCBpY29uVXJsID0gc3RvcmVFbnRyeUljb25VcmwoZW50cnkpO1xyXG4gIGlmIChpY29uVXJsKSB7XHJcbiAgICBjb25zdCBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xyXG4gICAgaW1nLmFsdCA9IFwiXCI7XHJcbiAgICBpbWcuY2xhc3NOYW1lID0gXCJoLWZ1bGwgdy1mdWxsIG9iamVjdC1jb3ZlclwiO1xyXG4gICAgaW1nLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgIGltZy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKSA9PiB7XHJcbiAgICAgIGZhbGxiYWNrLnJlbW92ZSgpO1xyXG4gICAgICBpbWcuc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcbiAgICB9KTtcclxuICAgIGltZy5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgKCkgPT4ge1xyXG4gICAgICBpbWcucmVtb3ZlKCk7XHJcbiAgICB9KTtcclxuICAgIGltZy5zcmMgPSBpY29uVXJsO1xyXG4gICAgYXZhdGFyLmFwcGVuZENoaWxkKGltZyk7XHJcbiAgfVxyXG4gIHJldHVybiBhdmF0YXI7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0b3JlRW50cnlJY29uVXJsKGVudHJ5OiBUd2Vha1N0b3JlRW50cnlWaWV3KTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgY29uc3QgaWNvblVybCA9IGVudHJ5Lm1hbmlmZXN0Lmljb25Vcmw/LnRyaW0oKTtcclxuICBpZiAoIWljb25VcmwpIHJldHVybiBudWxsO1xyXG4gIGlmICgvXihodHRwcz86fGRhdGE6KS9pLnRlc3QoaWNvblVybCkpIHJldHVybiBpY29uVXJsO1xyXG4gIGNvbnN0IHJlbCA9IGljb25VcmwucmVwbGFjZSgvXlxcLj9cXC8vLCBcIlwiKTtcclxuICBpZiAoIXJlbCB8fCByZWwuc3RhcnRzV2l0aChcIi4uL1wiKSkgcmV0dXJuIG51bGw7XHJcbiAgcmV0dXJuIGBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vJHtlbnRyeS5yZXBvfS8ke2VudHJ5LmFwcHJvdmVkQ29tbWl0U2hhfS8ke3JlbH1gO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaWRlYmFyVXBkYXRlUGlsbEJ1dHRvbigpOiBIVE1MQnV0dG9uRWxlbWVudCB7XHJcbiAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcclxuICBidG4udHlwZSA9IFwiYnV0dG9uXCI7XHJcbiAgYnRuLmRhdGFzZXQuY29kZXhwcFNpZGViYXJVcGRhdGUgPSBcInRydWVcIjtcclxuICBidG4uY2xhc3NOYW1lID1cclxuICAgIFwidXNlci1zZWxlY3Qtbm9uZSBuby1kcmFnIGN1cnNvci1pbnRlcmFjdGlvbiBpbmxpbmUtZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgd2hpdGVzcGFjZS1ub3dyYXBcIjtcclxuICBPYmplY3QuYXNzaWduKGJ0bi5zdHlsZSwge1xyXG4gICAgZGlzcGxheTogXCJub25lXCIsXHJcbiAgICBoZWlnaHQ6IFwiMjBweFwiLFxyXG4gICAgYm9yZGVyUmFkaXVzOiBcIjk5OTlweFwiLFxyXG4gICAgYm9yZGVyOiBcIjBcIixcclxuICAgIGJhY2tncm91bmQ6IFwiIzBBODRGRlwiLFxyXG4gICAgY29sb3I6IFwiI0ZGRkZGRlwiLFxyXG4gICAgcGFkZGluZzogXCIwIDhweFwiLFxyXG4gICAgZm9udFNpemU6IFwiMTBweFwiLFxyXG4gICAgZm9udFdlaWdodDogXCI3MDBcIixcclxuICAgIGxpbmVIZWlnaHQ6IFwiMjBweFwiLFxyXG4gICAgbGV0dGVyU3BhY2luZzogXCIwXCIsXHJcbiAgICB0ZXh0VHJhbnNmb3JtOiBcIm5vbmVcIixcclxuICAgIGJveFNoYWRvdzogXCIwIDFweCAycHggcmdiYSgwLCAwLCAwLCAwLjE4KVwiLFxyXG4gIH0pO1xyXG4gIGJ0bi50ZXh0Q29udGVudCA9IFwiXHU2NkY0XHU2NUIwXCI7XG4gIGJ0bi50aXRsZSA9IFwiXHU2MjUzXHU1RjAwIGNvZGV4XHU2QzQ5XHU1MzE2XHU1ODlFXHU1RjNBcGx1c1x1NzI0OCBcdTY2RjRcdTY1QjBcIjtcbiAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWVudGVyXCIsICgpID0+IHtcclxuICAgIGJ0bi5zdHlsZS5iYWNrZ3JvdW5kID0gXCIjMDA3MUUzXCI7XHJcbiAgfSk7XHJcbiAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWxlYXZlXCIsICgpID0+IHtcclxuICAgIGJ0bi5zdHlsZS5iYWNrZ3JvdW5kID0gXCIjMEE4NEZGXCI7XHJcbiAgfSk7XHJcbiAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGFjdGl2YXRlUGFnZSh7IGtpbmQ6IFwiY29uZmlnXCIgfSk7XG4gIH0pO1xuICByZXR1cm4gYnRuO1xufVxuXHJcbmZ1bmN0aW9uIHJlZnJlc2hTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbihmb3JjZSA9IGZhbHNlKTogdm9pZCB7XHJcbiAgY29uc3QgYnRuID0gc3RhdGUuY29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbjtcclxuICBpZiAoIWJ0bikgcmV0dXJuO1xyXG4gIHZvaWQgaXBjUmVuZGVyZXJcclxuICAgIC5pbnZva2UoXCJjb2RleHBwOmNoZWNrLWNvZGV4cHAtdXBkYXRlXCIsIGZvcmNlKVxyXG4gICAgLnRoZW4oKGNoZWNrKSA9PiBzZXRTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbihjaGVjayBhcyBDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2spKVxyXG4gICAgLmNhdGNoKChlKSA9PiB7XHJcbiAgICAgIHBsb2coXCJjb2RleFx1NkM0OVx1NTMxNlx1NTg5RVx1NUYzQXBsdXNcdTcyNDggc2lkZWJhciByZWxlYXNlIGNoZWNrIGZhaWxlZFwiLCBTdHJpbmcoZSkpO1xyXG4gICAgICBzZXRTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbihudWxsKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbihjaGVjazogQ29kZXhQbHVzUGx1c1VwZGF0ZUNoZWNrIHwgbnVsbCk6IHZvaWQge1xyXG4gIGNvbnN0IGJ0biA9IHN0YXRlLmNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b247XHJcbiAgaWYgKCFidG4pIHJldHVybjtcclxuICBjb25zdCB1cGRhdGVBdmFpbGFibGUgPSBjaGVjaz8udXBkYXRlQXZhaWxhYmxlID09PSB0cnVlO1xuICBidG4uc3R5bGUuZGlzcGxheSA9IHVwZGF0ZUF2YWlsYWJsZSA/IFwiaW5saW5lLWZsZXhcIiA6IFwibm9uZVwiO1xuICBidG4uaGlkZGVuID0gIXVwZGF0ZUF2YWlsYWJsZTtcbiAgZGVsZXRlIGJ0bi5kYXRhc2V0LmNvZGV4cHBSZWxlYXNlVXJsO1xuICBidG4udGl0bGUgPVxuICAgIHVwZGF0ZUF2YWlsYWJsZSAmJiBjaGVjaz8ubGF0ZXN0VmVyc2lvblxuICAgICAgPyBgXHU2N0U1XHU3NzBCIGNvZGV4XHU2QzQ5XHU1MzE2XHU1ODlFXHU1RjNBcGx1c1x1NzI0OCAke2NoZWNrLmxhdGVzdFZlcnNpb259IFx1NjZGNFx1NjVCMFx1OEJCRVx1N0Y2RWBcbiAgICAgIDogXCJcdTY3RTVcdTc3MEIgY29kZXhcdTZDNDlcdTUzMTZcdTU4OUVcdTVGM0FwbHVzXHU3MjQ4IFx1NjZGNFx1NjVCMFx1OEJCRVx1N0Y2RVwiO1xufVxuXHJcbmZ1bmN0aW9uIHVwZGF0ZVN0b3JlVXBkYXRlQmFkZ2UoY291bnQ6IG51bWJlciB8IG51bGwpOiB2b2lkIHtcclxuICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFwiW2RhdGEtY29kZXhwcC1zdG9yZS11cGRhdGUtYmFkZ2VdXCIpO1xyXG4gIGlmICghYmFkZ2UpIHJldHVybjtcclxuICBiYWRnZS5kYXRhc2V0LmNvZGV4cHBTdG9yZVVwZGF0ZUNvdW50ID0gY291bnQgPT09IG51bGwgPyBcIlwiIDogU3RyaW5nKGNvdW50KTtcclxuICBhcHBseVN0b3JlVXBkYXRlQmFkZ2VTdHlsZShiYWRnZSwgY291bnQpO1xyXG4gIGJhZGdlLmhpZGRlbiA9IGNvdW50ID09PSBudWxsIHx8IGNvdW50IDw9IDA7XHJcbiAgYmFkZ2UudGV4dENvbnRlbnQgPSBjb3VudCAmJiBjb3VudCA+IDAgPyBTdHJpbmcoY291bnQpIDogXCJcIjtcclxuICBiYWRnZS50aXRsZSA9XG4gICAgY291bnQgJiYgY291bnQgPiAwXG4gICAgICA/IGAke2NvdW50fSBcdTRFMkFcdTVERjJcdTVCODlcdTg4QzVcdTYzRDJcdTRFRjZcdTUzRUZcdTRFRTVcdTY2RjRcdTY1QjBgXG4gICAgICA6IFwiXHU1REYyXHU1Qjg5XHU4OEM1XHU2M0QyXHU0RUY2XHU1NzQ3XHU0RTNBXHU2NzAwXHU2NUIwXCI7XG59XHJcblxyXG5mdW5jdGlvbiBhcHBseVN0b3JlVXBkYXRlQmFkZ2VTdHlsZShiYWRnZTogSFRNTEVsZW1lbnQsIGNvdW50OiBudW1iZXIgfCBudWxsKTogdm9pZCB7XHJcbiAgY29uc3QgaGFzVXBkYXRlcyA9ICEhY291bnQgJiYgY291bnQgPiAwO1xyXG4gIE9iamVjdC5hc3NpZ24oYmFkZ2Uuc3R5bGUsIHtcclxuICAgIG1pbldpZHRoOiBcIjI0cHhcIixcclxuICAgIGhlaWdodDogXCIyMHB4XCIsXHJcbiAgICBib3JkZXJSYWRpdXM6IFwiOTk5OXB4XCIsXHJcbiAgICBib3JkZXI6IFwiMFwiLFxyXG4gICAgYmFja2dyb3VuZDogaGFzVXBkYXRlcyA/IFwiIzBBODRGRlwiIDogXCJ0cmFuc3BhcmVudFwiLFxyXG4gICAgY29sb3I6IFwiI0ZGRkZGRlwiLFxyXG4gICAgcGFkZGluZzogXCIwIDdweFwiLFxyXG4gICAgZm9udFNpemU6IFwiMTJweFwiLFxyXG4gICAgZm9udFdlaWdodDogXCI3MDBcIixcclxuICAgIGxpbmVIZWlnaHQ6IFwiMjBweFwiLFxyXG4gICAgbGV0dGVyU3BhY2luZzogXCIwXCIsXHJcbiAgICBib3hTaGFkb3c6IGhhc1VwZGF0ZXMgPyBcIjAgMXB4IDJweCByZ2JhKDAsIDAsIDAsIDAuMjIpXCIgOiBcIm5vbmVcIixcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gY3VycmVudFN0b3JlVXBkYXRlQmFkZ2VDb3VudCgpOiBudW1iZXIge1xyXG4gIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCJbZGF0YS1jb2RleHBwLXN0b3JlLXVwZGF0ZS1iYWRnZV1cIik7XHJcbiAgY29uc3QgcmF3ID0gYmFkZ2U/LmRhdGFzZXQuY29kZXhwcFN0b3JlVXBkYXRlQ291bnQ7XHJcbiAgY29uc3QgcGFyc2VkID0gcmF3ID8gTnVtYmVyKHJhdykgOiAwO1xyXG4gIHJldHVybiBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSA/IHBhcnNlZCA6IDA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG91dGRhdGVkSW5zdGFsbGVkU3RvcmVDb3VudChlbnRyaWVzOiBUd2Vha1N0b3JlRW50cnlWaWV3W10pOiBudW1iZXIge1xyXG4gIHJldHVybiBlbnRyaWVzLmZpbHRlcigoZW50cnkpID0+ICEhZW50cnkuaW5zdGFsbGVkICYmIGVudHJ5Lmluc3RhbGxlZC52ZXJzaW9uICE9PSBlbnRyeS5tYW5pZmVzdC52ZXJzaW9uKS5sZW5ndGg7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0b3JlVG9vbGJhckJ1dHRvbihcclxuICBsYWJlbDogc3RyaW5nLFxyXG4gIG9uQ2xpY2s6ICgpID0+IHZvaWQsXHJcbiAgdmFyaWFudDogXCJwcmltYXJ5XCIgfCBcInNlY29uZGFyeVwiID0gXCJzZWNvbmRhcnlcIixcclxuKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xyXG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XHJcbiAgYnRuLnR5cGUgPSBcImJ1dHRvblwiO1xyXG4gIGJ0bi5jbGFzc05hbWUgPVxyXG4gICAgdmFyaWFudCA9PT0gXCJwcmltYXJ5XCJcclxuICAgICAgPyBcImJvcmRlci10b2tlbi1ib3JkZXIgdXNlci1zZWxlY3Qtbm9uZSBuby1kcmFnIGN1cnNvci1pbnRlcmFjdGlvbiBmbGV4IGgtOCBpdGVtcy1jZW50ZXIgZ2FwLTEgd2hpdGVzcGFjZS1ub3dyYXAgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBiZy10b2tlbi1iZy1mb2cgcHgtMiBweS0wIHRleHQtc20gdGV4dC10b2tlbi1idXR0b24tdGVydGlhcnktZm9yZWdyb3VuZCBlbmFibGVkOmhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZCBkaXNhYmxlZDpjdXJzb3Itbm90LWFsbG93ZWQgZGlzYWJsZWQ6b3BhY2l0eS00MFwiXHJcbiAgICAgIDogXCJib3JkZXItdG9rZW4tYm9yZGVyIHVzZXItc2VsZWN0LW5vbmUgbm8tZHJhZyBjdXJzb3ItaW50ZXJhY3Rpb24gZmxleCBoLTggaXRlbXMtY2VudGVyIGdhcC0xIHdoaXRlc3BhY2Utbm93cmFwIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci10cmFuc3BhcmVudCBiZy10b2tlbi1mb3JlZ3JvdW5kLzUgcHgtMiBweS0wIHRleHQtc20gdGV4dC10b2tlbi1mb3JlZ3JvdW5kIGVuYWJsZWQ6aG92ZXI6YmctdG9rZW4tZm9yZWdyb3VuZC8xMCBkaXNhYmxlZDpjdXJzb3Itbm90LWFsbG93ZWQgZGlzYWJsZWQ6b3BhY2l0eS00MFwiO1xyXG4gIGJ0bi50ZXh0Q29udGVudCA9IGxhYmVsO1xyXG4gIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICBvbkNsaWNrKCk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGJ0bjtcclxufVxyXG5cclxuZnVuY3Rpb24gc3RvcmVJY29uQnV0dG9uKFxyXG4gIGljb25Tdmc6IHN0cmluZyxcclxuICBsYWJlbDogc3RyaW5nLFxyXG4gIG9uQ2xpY2s6ICgpID0+IHZvaWQsXHJcbik6IEhUTUxCdXR0b25FbGVtZW50IHtcclxuICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xyXG4gIGJ0bi50eXBlID0gXCJidXR0b25cIjtcclxuICBidG4uY2xhc3NOYW1lID1cclxuICAgIFwiYm9yZGVyLXRva2VuLWJvcmRlciB1c2VyLXNlbGVjdC1ub25lIG5vLWRyYWcgY3Vyc29yLWludGVyYWN0aW9uIGZsZXggaC04IHctOCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXRyYW5zcGFyZW50IGJnLXRva2VuLWZvcmVncm91bmQvNSBwLTAgdGV4dC10b2tlbi1mb3JlZ3JvdW5kIGVuYWJsZWQ6aG92ZXI6YmctdG9rZW4tZm9yZWdyb3VuZC8xMCBkaXNhYmxlZDpjdXJzb3Itbm90LWFsbG93ZWQgZGlzYWJsZWQ6b3BhY2l0eS00MFwiO1xyXG4gIGJ0bi5pbm5lckhUTUwgPSBpY29uU3ZnO1xyXG4gIGJ0bi5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIGxhYmVsKTtcclxuICBidG4udGl0bGUgPSBsYWJlbDtcclxuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgb25DbGljaygpO1xyXG4gIH0pO1xyXG4gIHJldHVybiBidG47XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlZnJlc2hJY29uU3ZnKCk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIChcclxuICAgIGA8c3ZnIHdpZHRoPVwiMThcIiBoZWlnaHQ9XCIxOFwiIHZpZXdCb3g9XCIwIDAgMjAgMjBcIiBmaWxsPVwibm9uZVwiIGNsYXNzPVwiaWNvbi14c1wiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmAgK1xyXG4gICAgYDxwYXRoIGQ9XCJNNC40IDkuMzVBNS42NSA1LjY1IDAgMCAxIDE0IDUuM0wxNS43NSA3TTE1Ljc1IDMuNzVWN2gtMy4yNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuNVwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiLz5gICtcclxuICAgIGA8cGF0aCBkPVwiTTE1LjYgMTAuNjVBNS42NSA1LjY1IDAgMCAxIDYgMTQuN0w0LjI1IDEzTTQuMjUgMTYuMjVWMTNINy41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIvPmAgK1xyXG4gICAgYDwvc3ZnPmBcclxuICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiB2ZXJpZmllZFNhZmVCYWRnZSgpOiBIVE1MRWxlbWVudCB7XHJcbiAgY29uc3QgYmFkZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICBiYWRnZS5jbGFzc05hbWUgPVxyXG4gICAgXCJpbmxpbmUtZmxleCBoLTYgc2hyaW5rLTAgaXRlbXMtY2VudGVyIGdhcC0xLjUgcm91bmRlZC1tZCBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlci8zMCBiZy10cmFuc3BhcmVudCBweC0yIHRleHQteHMgZm9udC1tZWRpdW0gdGV4dC10b2tlbi1kZXNjcmlwdGlvbi1mb3JlZ3JvdW5kXCI7XHJcbiAgYmFkZ2UuaW5uZXJIVE1MID1cclxuICAgIGA8c3ZnIHdpZHRoPVwiMTNcIiBoZWlnaHQ9XCIxM1wiIHZpZXdCb3g9XCIwIDAgMTQgMTRcIiBmaWxsPVwibm9uZVwiIGNsYXNzPVwidGV4dC1ibHVlLTUwMFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmAgK1xyXG4gICAgYDxwYXRoIGQ9XCJNNyAxLjc1IDExLjI1IDMuNHYzLjJjMCAyLjYtMS42NSA0LjI1LTQuMjUgNS40LTIuNi0xLjE1LTQuMjUtMi44LTQuMjUtNS40VjMuNEw3IDEuNzVaXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS4xNVwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIvPmAgK1xyXG4gICAgYDxwYXRoIGQ9XCJNNC44NSA3LjA1IDYuMyA4LjQ1bDIuODUtMy4wNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuMjVcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXHJcbiAgICBgPC9zdmc+YCArXHJcbiAgICBgPHNwYW4+XHU1REYyXHU1Qjg5XHU1MTY4XHU1QkExXHU2ODM4PC9zcGFuPmA7XG4gIHJldHVybiBiYWRnZTtcclxufVxyXG5cclxuZnVuY3Rpb24gdHdlYWtTdG9yZVZlcnNpb25CYWRnZShlbnRyeTogVHdlYWtTdG9yZUVudHJ5VmlldywgaW5zdGFsbGVkT3ZlcnJpZGU/OiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XHJcbiAgY29uc3QgaW5zdGFsbGVkID0gaW5zdGFsbGVkT3ZlcnJpZGUgPz8gZW50cnkuaW5zdGFsbGVkPy52ZXJzaW9uID8/IG51bGw7XHJcbiAgY29uc3QgbGF0ZXN0ID0gZW50cnkubWFuaWZlc3QudmVyc2lvbjtcclxuICBjb25zdCBoYXNVcGRhdGUgPSAhIWluc3RhbGxlZCAmJiBpbnN0YWxsZWQgIT09IGxhdGVzdDtcclxuICBjb25zdCBiYWRnZSA9IHN0b3JlVmVyc2lvbkJhZGdlU2hlbGwoaGFzVXBkYXRlKTtcclxuICBjb25zdCBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gIGxhYmVsLmNsYXNzTmFtZSA9IFwidHJ1bmNhdGVcIjtcclxuICBsYWJlbC50ZXh0Q29udGVudCA9IGluc3RhbGxlZFxuICAgID8gYFx1NURGMlx1NUI4OVx1ODhDNSB2JHtpbnN0YWxsZWR9IFx1MDBCNyBcdTY3MDBcdTY1QjAgdiR7bGF0ZXN0fWBcbiAgICA6IGBcdTY3MDBcdTY1QjAgdiR7bGF0ZXN0fWA7XG4gIGJhZGdlLnRpdGxlID0gaW5zdGFsbGVkXG4gICAgPyBgXHU1REYyXHU1Qjg5XHU4OEM1XHU3MjQ4XHU2NzJDICR7aW5zdGFsbGVkfVx1MzAwMlx1NjcwMFx1NjVCMFx1NUJBMVx1NjgzOFx1NzI0OFx1NjcyQyAke2xhdGVzdH1cdTMwMDJgXG4gICAgOiBgXHU2NzAwXHU2NUIwXHU1QkExXHU2ODM4XHU3MjQ4XHU2NzJDICR7bGF0ZXN0fVx1MzAwMmA7XG4gIGJhZGdlLmFwcGVuZENoaWxkKGxhYmVsKTtcclxuICByZXR1cm4gYmFkZ2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0b3JlVmVyc2lvbkJhZGdlU2hlbGwoaGFzVXBkYXRlOiBib29sZWFuKTogSFRNTEVsZW1lbnQge1xyXG4gIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgYmFkZ2UuY2xhc3NOYW1lID0gW1xyXG4gICAgXCJpbmxpbmUtZmxleCBoLTggbWluLXctMCBtYXgtdy1mdWxsIGl0ZW1zLWNlbnRlciByb3VuZGVkLWxnIGJvcmRlciBweC0yLjUgdGV4dC14cyBmb250LW1lZGl1bVwiLFxyXG4gICAgaGFzVXBkYXRlXHJcbiAgICAgID8gXCJib3JkZXItYmx1ZS01MDAvMzAgYmctYmx1ZS01MDAvMTAgdGV4dC10b2tlbi1mb3JlZ3JvdW5kXCJcclxuICAgICAgOiBcImJvcmRlci10b2tlbi1ib3JkZXIvNDAgYmctdG9rZW4tZm9yZWdyb3VuZC81IHRleHQtdG9rZW4tZGVzY3JpcHRpb24tZm9yZWdyb3VuZFwiLFxyXG4gIF0uam9pbihcIiBcIik7XHJcbiAgcmV0dXJuIGJhZGdlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzdG9yZVN0YXR1c1BpbGwobGFiZWw6IHN0cmluZywgdG9uZTogXCJuZXV0cmFsXCIgfCBcImluZm9cIiA9IFwibmV1dHJhbFwiKTogSFRNTEVsZW1lbnQge1xyXG4gIGNvbnN0IHBpbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICBwaWxsLmNsYXNzTmFtZSA9IFtcclxuICAgIFwiaW5saW5lLWZsZXggaC04IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB3aGl0ZXNwYWNlLW5vd3JhcCByb3VuZGVkLWxnIHB4LTMgdGV4dC1zbSBmb250LW1lZGl1bVwiLFxyXG4gICAgdG9uZSA9PT0gXCJpbmZvXCJcclxuICAgICAgPyBcImJvcmRlciBib3JkZXItYmx1ZS01MDAvMzAgYmctYmx1ZS01MDAvMTAgdGV4dC10b2tlbi1mb3JlZ3JvdW5kXCJcclxuICAgICAgOiBcImJnLXRva2VuLWZvcmVncm91bmQvNSB0ZXh0LXRva2VuLWRlc2NyaXB0aW9uLWZvcmVncm91bmRcIixcclxuICBdLmpvaW4oXCIgXCIpO1xyXG4gIHBpbGwudGV4dENvbnRlbnQgPSBsYWJlbDtcclxuICByZXR1cm4gcGlsbDtcclxufVxyXG5cclxuZnVuY3Rpb24gc3RvcmVJbnN0YWxsQnV0dG9uKGxhYmVsOiBzdHJpbmcsIG9uQ2xpY2s6IChidXR0b246IEhUTUxCdXR0b25FbGVtZW50KSA9PiB2b2lkKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xyXG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XHJcbiAgYnRuLnR5cGUgPSBcImJ1dHRvblwiO1xyXG4gIGJ0bi5jbGFzc05hbWUgPVxyXG4gICAgc3RvcmVJbnN0YWxsQnV0dG9uQ2xhc3MoKTtcclxuICBidG4udGV4dENvbnRlbnQgPSBsYWJlbDtcclxuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgb25DbGljayhidG4pO1xyXG4gIH0pO1xyXG4gIHJldHVybiBidG47XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0b3JlSW5zdGFsbEJ1dHRvbkNsYXNzKGV4dHJhID0gXCJcIik6IHN0cmluZyB7XHJcbiAgcmV0dXJuIFtcclxuICAgIFwiYm9yZGVyLXRva2VuLWJvcmRlciB1c2VyLXNlbGVjdC1ub25lIG5vLWRyYWcgY3Vyc29yLWludGVyYWN0aW9uIGZsZXggaC04IG1pbi13LVs4MnB4XSBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEuNSB3aGl0ZXNwYWNlLW5vd3JhcCByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItYmx1ZS01MDAvNDAgYmctYmx1ZS01MDAgcHgtMyBweS0wIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC10b2tlbi1mb3JlZ3JvdW5kIHNoYWRvdy1zbSB0cmFuc2l0aW9uLWNvbG9ycyBlbmFibGVkOmhvdmVyOmJnLWJsdWUtNjAwIGRpc2FibGVkOmN1cnNvci1ub3QtYWxsb3dlZCBkaXNhYmxlZDpvcGFjaXR5LTgwXCIsXHJcbiAgICBleHRyYSxcclxuICBdLmZpbHRlcihCb29sZWFuKS5qb2luKFwiIFwiKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2hvd1N0b3JlQnV0dG9uTG9hZGluZyhidXR0b246IEhUTUxCdXR0b25FbGVtZW50LCBsYWJlbDogc3RyaW5nKTogdm9pZCB7XHJcbiAgYnV0dG9uLmNsYXNzTmFtZSA9IHN0b3JlSW5zdGFsbEJ1dHRvbkNsYXNzKCk7XHJcbiAgYnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuICBidXR0b24uc2V0QXR0cmlidXRlKFwiYXJpYS1idXN5XCIsIFwidHJ1ZVwiKTtcclxuICBidXR0b24uaW5uZXJIVE1MID1cclxuICAgIGA8c3ZnIGNsYXNzPVwiYW5pbWF0ZS1zcGluXCIgd2lkdGg9XCIxNFwiIGhlaWdodD1cIjE0XCIgdmlld0JveD1cIjAgMCAxNiAxNlwiIGZpbGw9XCJub25lXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+YCArXHJcbiAgICBgPGNpcmNsZSBjeD1cIjhcIiBjeT1cIjhcIiByPVwiNS41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIG9wYWNpdHk9XCIuMjVcIi8+YCArXHJcbiAgICBgPHBhdGggZD1cIk0xMy41IDhBNS41IDUuNSAwIDAgMCA4IDIuNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIvPmAgK1xyXG4gICAgYDwvc3ZnPmAgK1xyXG4gICAgYDxzcGFuPiR7bGFiZWx9PC9zcGFuPmA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3dTdG9yZUJ1dHRvbkluc3RhbGxlZChidXR0b246IEhUTUxCdXR0b25FbGVtZW50KTogdm9pZCB7XHJcbiAgYnV0dG9uLmNsYXNzTmFtZSA9IHN0b3JlSW5zdGFsbEJ1dHRvbkNsYXNzKFwiYm9yZGVyLWJsdWUtNTAwIGJnLWJsdWUtNTAwXCIpO1xyXG4gIGJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcbiAgYnV0dG9uLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtYnVzeVwiKTtcclxuICBidXR0b24uaW5uZXJIVE1MID1cclxuICAgIGA8c3ZnIHdpZHRoPVwiMTRcIiBoZWlnaHQ9XCIxNFwiIHZpZXdCb3g9XCIwIDAgMTYgMTZcIiBmaWxsPVwibm9uZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmAgK1xyXG4gICAgYDxwYXRoIGQ9XCJNMy43NSA4LjE1IDYuNjUgMTEgMTIuMjUgNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuOFwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiLz5gICtcbiAgICBgPC9zdmc+YCArXG4gICAgYDxzcGFuPlx1NURGMlx1NUI4OVx1ODhDNTwvc3Bhbj5gO1xufVxyXG5cclxuZnVuY3Rpb24gcmVzZXRTdG9yZUluc3RhbGxCdXR0b24oYnV0dG9uOiBIVE1MQnV0dG9uRWxlbWVudCwgbGFiZWw6IHN0cmluZyk6IHZvaWQge1xyXG4gIGJ1dHRvbi5jbGFzc05hbWUgPSBzdG9yZUluc3RhbGxCdXR0b25DbGFzcygpO1xyXG4gIGJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gIGJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWJ1c3lcIik7XHJcbiAgYnV0dG9uLnRleHRDb250ZW50ID0gbGFiZWw7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3dTdG9yZVRvYXN0KG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xyXG4gIGxldCBob3N0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCJbZGF0YS1jb2RleHBwLXN0b3JlLXRvYXN0LWhvc3RdXCIpO1xyXG4gIGlmICghaG9zdCkge1xyXG4gICAgaG9zdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICBob3N0LmRhdGFzZXQuY29kZXhwcFN0b3JlVG9hc3RIb3N0ID0gXCJ0cnVlXCI7XHJcbiAgICBob3N0LmNsYXNzTmFtZSA9IFwicG9pbnRlci1ldmVudHMtbm9uZSBmaXhlZCBib3R0b20tNSByaWdodC01IHotWzk5OTldIGZsZXggZmxleC1jb2wgaXRlbXMtZW5kIGdhcC0yXCI7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGhvc3QpO1xyXG4gIH1cclxuICBjb25zdCB0b2FzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgdG9hc3QuY2xhc3NOYW1lID1cclxuICAgIFwidHJhbnNsYXRlLXktMiByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyLzUwIGJnLXRva2VuLW1haW4tc3VyZmFjZS1wcmltYXJ5IHB4LTMgcHktMiB0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtdG9rZW4tZm9yZWdyb3VuZCBvcGFjaXR5LTAgc2hhZG93LWxnIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTIwMFwiO1xyXG4gIHRvYXN0LnRleHRDb250ZW50ID0gbWVzc2FnZTtcclxuICBob3N0LmFwcGVuZENoaWxkKHRvYXN0KTtcclxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG4gICAgdG9hc3QuY2xhc3NMaXN0LnJlbW92ZShcInRyYW5zbGF0ZS15LTJcIiwgXCJvcGFjaXR5LTBcIik7XHJcbiAgfSk7XHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICB0b2FzdC5jbGFzc0xpc3QuYWRkKFwidHJhbnNsYXRlLXktMlwiLCBcIm9wYWNpdHktMFwiKTtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICB0b2FzdC5yZW1vdmUoKTtcclxuICAgICAgaWYgKGhvc3QgJiYgaG9zdC5jaGlsZEVsZW1lbnRDb3VudCA9PT0gMCkgaG9zdC5yZW1vdmUoKTtcclxuICAgIH0sIDIyMCk7XHJcbiAgfSwgMjYwMCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0b3JlTWVzc2FnZUNhcmQodGl0bGU6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XHJcbiAgY29uc3QgY2FyZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgY2FyZC5jbGFzc05hbWUgPVxyXG4gICAgXCJib3JkZXItdG9rZW4tYm9yZGVyLzQwIGZsZXggbWluLWgtWzg0cHhdIGZsZXgtY29sIGp1c3RpZnktY2VudGVyIGdhcC0xIHJvdW5kZWQtMnhsIGJvcmRlciBwLTQgdGV4dC1zbVwiO1xyXG4gIGNvbnN0IHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIHQuY2xhc3NOYW1lID0gXCJmb250LW1lZGl1bSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xyXG4gIHQudGV4dENvbnRlbnQgPSB0aXRsZTtcclxuICBjYXJkLmFwcGVuZENoaWxkKHQpO1xyXG4gIGlmIChkZXNjcmlwdGlvbikge1xyXG4gICAgY29uc3QgZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICBkLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xyXG4gICAgZC50ZXh0Q29udGVudCA9IGRlc2NyaXB0aW9uO1xyXG4gICAgY2FyZC5hcHBlbmRDaGlsZChkKTtcclxuICB9XHJcbiAgcmV0dXJuIGNhcmQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3J0U2hhKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gIHJldHVybiB2YWx1ZS5zbGljZSgwLCA3KTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyVHdlYWtzUGFnZShzZWN0aW9uc1dyYXA6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGNvbnN0IG9wZW5CdG4gPSBvcGVuSW5QbGFjZUJ1dHRvbihcIlx1NjI1M1x1NUYwMFx1NjNEMlx1NEVGNlx1NjU4N1x1NEVGNlx1NTkzOVwiLCAoKSA9PiB7XG4gICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOnJldmVhbFwiLCB0d2Vha3NQYXRoKCkpO1xuICB9KTtcbiAgY29uc3QgcmVsb2FkQnRuID0gb3BlbkluUGxhY2VCdXR0b24oXCJcdTVGM0FcdTUyMzZcdTkxQ0RcdThGN0RcIiwgKCkgPT4ge1xuICAgIC8vIEZ1bGwgcGFnZSByZWZyZXNoIFx1MjAxNCBzYW1lIGFzIERldlRvb2xzIENtZC1SIC8gb3VyIENEUCBQYWdlLnJlbG9hZC5cclxuICAgIC8vIE1haW4gcmUtZGlzY292ZXJzIHR3ZWFrcyBmaXJzdCBzbyB0aGUgbmV3IHJlbmRlcmVyIGNvbWVzIHVwIHdpdGggYVxyXG4gICAgLy8gZnJlc2ggdHdlYWsgc2V0OyB0aGVuIGxvY2F0aW9uLnJlbG9hZCByZXN0YXJ0cyB0aGUgcmVuZGVyZXIgc28gdGhlXHJcbiAgICAvLyBwcmVsb2FkIHJlLWluaXRpYWxpemVzIGFnYWluc3QgaXQuXHJcbiAgICB2b2lkIGlwY1JlbmRlcmVyXHJcbiAgICAgIC5pbnZva2UoXCJjb2RleHBwOnJlbG9hZC10d2Vha3NcIilcclxuICAgICAgLmNhdGNoKChlKSA9PiBwbG9nKFwiZm9yY2UgcmVsb2FkIChtYWluKSBmYWlsZWRcIiwgU3RyaW5nKGUpKSlcclxuICAgICAgLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgICB9KTtcclxuICB9KTtcclxuICAvLyBEcm9wIHRoZSBkaWFnb25hbC1hcnJvdyBpY29uIGZyb20gdGhlIHJlbG9hZCBidXR0b24gXHUyMDE0IGl0IGltcGxpZXMgXCJvcGVuXHJcbiAgLy8gb3V0IG9mIGFwcFwiIHdoaWNoIGRvZXNuJ3QgZml0LiBSZXBsYWNlIGl0cyB0cmFpbGluZyBzdmcgd2l0aCBhIHJlZnJlc2guXHJcbiAgY29uc3QgcmVsb2FkU3ZnID0gcmVsb2FkQnRuLnF1ZXJ5U2VsZWN0b3IoXCJzdmdcIik7XHJcbiAgaWYgKHJlbG9hZFN2Zykge1xyXG4gICAgcmVsb2FkU3ZnLm91dGVySFRNTCA9XHJcbiAgICAgIGA8c3ZnIHdpZHRoPVwiMjBcIiBoZWlnaHQ9XCIyMFwiIHZpZXdCb3g9XCIwIDAgMjAgMjBcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBjbGFzcz1cImljb24tMnhzXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+YCArXHJcbiAgICAgIGA8cGF0aCBkPVwiTTQgMTBhNiA2IDAgMCAxIDEwLjI0LTQuMjRMMTYgNy41TTE2IDR2My41aC0zLjVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXHJcbiAgICAgIGA8cGF0aCBkPVwiTTE2IDEwYTYgNiAwIDAgMS0xMC4yNCA0LjI0TDQgMTIuNU00IDE2di0zLjVoMy41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIvPmAgK1xyXG4gICAgICBgPC9zdmc+YDtcclxuICB9XHJcblxyXG4gIGNvbnN0IHRyYWlsaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICB0cmFpbGluZy5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI7XHJcbiAgdHJhaWxpbmcuYXBwZW5kQ2hpbGQocmVsb2FkQnRuKTtcclxuICB0cmFpbGluZy5hcHBlbmRDaGlsZChvcGVuQnRuKTtcclxuXHJcbiAgaWYgKHN0YXRlLmxpc3RlZFR3ZWFrcy5sZW5ndGggPT09IDApIHtcbiAgICBjb25zdCBzZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlY3Rpb25cIik7XG4gICAgc2VjdGlvbi5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLTJcIjtcbiAgICBzZWN0aW9uLmFwcGVuZENoaWxkKHNlY3Rpb25UaXRsZShcIlx1NURGMlx1NUI4OVx1ODhDNVx1NjNEMlx1NEVGNlwiLCB0cmFpbGluZykpO1xuICAgIGNvbnN0IGNhcmQgPSByb3VuZGVkQ2FyZCgpO1xuICAgIGNhcmQuYXBwZW5kQ2hpbGQoXG4gICAgICByb3dTaW1wbGUoXG4gICAgICAgIFwiXHU1QzFBXHU2NzJBXHU1Qjg5XHU4OEM1XHU2M0QyXHU0RUY2XCIsXG4gICAgICAgIGBcdTYyOEFcdTYzRDJcdTRFRjZcdTY1ODdcdTRFRjZcdTU5MzlcdTY1M0VcdTUxNjUgJHt0d2Vha3NQYXRoKCl9XHVGRjBDXHU3MTM2XHU1NDBFXHU5MUNEXHU4RjdEXHUzMDAyYCxcbiAgICAgICksXG4gICAgKTtcclxuICAgIHNlY3Rpb24uYXBwZW5kQ2hpbGQoY2FyZCk7XHJcbiAgICBzZWN0aW9uc1dyYXAuYXBwZW5kQ2hpbGQoc2VjdGlvbik7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICAvLyBHcm91cCByZWdpc3RlcmVkIFNldHRpbmdzU2VjdGlvbnMgYnkgdHdlYWsgaWQgKHByZWZpeCBzcGxpdCBhdCBcIjpcIikuXHJcbiAgY29uc3Qgc2VjdGlvbnNCeVR3ZWFrID0gbmV3IE1hcDxzdHJpbmcsIFNldHRpbmdzU2VjdGlvbltdPigpO1xyXG4gIGZvciAoY29uc3QgcyBvZiBzdGF0ZS5zZWN0aW9ucy52YWx1ZXMoKSkge1xyXG4gICAgY29uc3QgdHdlYWtJZCA9IHMuaWQuc3BsaXQoXCI6XCIpWzBdO1xyXG4gICAgaWYgKCFzZWN0aW9uc0J5VHdlYWsuaGFzKHR3ZWFrSWQpKSBzZWN0aW9uc0J5VHdlYWsuc2V0KHR3ZWFrSWQsIFtdKTtcclxuICAgIHNlY3Rpb25zQnlUd2Vhay5nZXQodHdlYWtJZCkhLnB1c2gocyk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBwYWdlc0J5VHdlYWsgPSBuZXcgTWFwPHN0cmluZywgUmVnaXN0ZXJlZFBhZ2VbXT4oKTtcclxuICBmb3IgKGNvbnN0IHAgb2Ygc3RhdGUucGFnZXMudmFsdWVzKCkpIHtcclxuICAgIGlmICghcGFnZXNCeVR3ZWFrLmhhcyhwLnR3ZWFrSWQpKSBwYWdlc0J5VHdlYWsuc2V0KHAudHdlYWtJZCwgW10pO1xyXG4gICAgcGFnZXNCeVR3ZWFrLmdldChwLnR3ZWFrSWQpIS5wdXNoKHApO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgd3JhcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWN0aW9uXCIpO1xuICB3cmFwLmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LWNvbCBnYXAtMlwiO1xuICB3cmFwLmFwcGVuZENoaWxkKHNlY3Rpb25UaXRsZShcIlx1NURGMlx1NUI4OVx1ODhDNVx1NjNEMlx1NEVGNlwiLCB0cmFpbGluZykpO1xuXHJcbiAgY29uc3QgY2FyZCA9IHJvdW5kZWRDYXJkKCk7XHJcbiAgZm9yIChjb25zdCB0IG9mIHN0YXRlLmxpc3RlZFR3ZWFrcykge1xyXG4gICAgY2FyZC5hcHBlbmRDaGlsZChcclxuICAgICAgdHdlYWtSb3coXHJcbiAgICAgICAgdCxcclxuICAgICAgICBzZWN0aW9uc0J5VHdlYWsuZ2V0KHQubWFuaWZlc3QuaWQpID8/IFtdLFxyXG4gICAgICAgIHBhZ2VzQnlUd2Vhay5nZXQodC5tYW5pZmVzdC5pZCkgPz8gW10sXHJcbiAgICAgICksXHJcbiAgICApO1xyXG4gIH1cclxuICB3cmFwLmFwcGVuZENoaWxkKGNhcmQpO1xyXG4gIHNlY3Rpb25zV3JhcC5hcHBlbmRDaGlsZCh3cmFwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdHdlYWtSb3coXHJcbiAgdDogTGlzdGVkVHdlYWssXHJcbiAgc2VjdGlvbnM6IFNldHRpbmdzU2VjdGlvbltdLFxyXG4gIHBhZ2VzOiBSZWdpc3RlcmVkUGFnZVtdLFxyXG4pOiBIVE1MRWxlbWVudCB7XHJcbiAgY29uc3QgbSA9IHQubWFuaWZlc3Q7XHJcblxyXG4gIC8vIE91dGVyIGNlbGwgd3JhcHMgdGhlIGhlYWRlciByb3cgKyAob3B0aW9uYWwpIG5lc3RlZCBzZWN0aW9ucyBzbyB0aGVcclxuICAvLyBwYXJlbnQgY2FyZCdzIGRpdmlkZXIgc3RheXMgYmV0d2VlbiAqdHdlYWtzKiwgbm90IGJldHdlZW4gaGVhZGVyIGFuZFxyXG4gIC8vIGJvZHkgb2YgdGhlIHNhbWUgdHdlYWsuXHJcbiAgY29uc3QgY2VsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgY2VsbC5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2xcIjtcclxuICBpZiAoIXQuZW5hYmxlZCkgY2VsbC5zdHlsZS5vcGFjaXR5ID0gXCIwLjdcIjtcclxuXHJcbiAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBoZWFkZXIuY2xhc3NOYW1lID0gXCJmbGV4IGl0ZW1zLXN0YXJ0IGp1c3RpZnktYmV0d2VlbiBnYXAtNCBwLTNcIjtcclxuXHJcbiAgY29uc3QgbGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgbGVmdC5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LTEgaXRlbXMtc3RhcnQgZ2FwLTNcIjtcclxuXHJcbiAgLy8gXHUyNTAwXHUyNTAwIEF2YXRhciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuICBjb25zdCBhdmF0YXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGF2YXRhci5jbGFzc05hbWUgPVxyXG4gICAgXCJmbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciByb3VuZGVkLW1kIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyIG92ZXJmbG93LWhpZGRlbiB0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5XCI7XHJcbiAgYXZhdGFyLnN0eWxlLndpZHRoID0gXCI1NnB4XCI7XHJcbiAgYXZhdGFyLnN0eWxlLmhlaWdodCA9IFwiNTZweFwiO1xyXG4gIGF2YXRhci5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcInZhcigtLWNvbG9yLXRva2VuLWJnLWZvZywgdHJhbnNwYXJlbnQpXCI7XHJcbiAgaWYgKG0uaWNvblVybCkge1xyXG4gICAgY29uc3QgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcclxuICAgIGltZy5hbHQgPSBcIlwiO1xyXG4gICAgaW1nLmNsYXNzTmFtZSA9IFwic2l6ZS1mdWxsIG9iamVjdC1jb250YWluXCI7XHJcbiAgICAvLyBJbml0aWFsOiBzaG93IGZhbGxiYWNrIGluaXRpYWwgaW4gY2FzZSB0aGUgaWNvbiBmYWlscyB0byBsb2FkLlxyXG4gICAgY29uc3QgaW5pdGlhbCA9IChtLm5hbWU/LlswXSA/PyBcIj9cIikudG9VcHBlckNhc2UoKTtcclxuICAgIGNvbnN0IGZhbGxiYWNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICBmYWxsYmFjay5jbGFzc05hbWUgPSBcInRleHQteGwgZm9udC1tZWRpdW1cIjtcclxuICAgIGZhbGxiYWNrLnRleHRDb250ZW50ID0gaW5pdGlhbDtcclxuICAgIGF2YXRhci5hcHBlbmRDaGlsZChmYWxsYmFjayk7XHJcbiAgICBpbWcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgaW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsICgpID0+IHtcclxuICAgICAgZmFsbGJhY2sucmVtb3ZlKCk7XHJcbiAgICAgIGltZy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcclxuICAgIH0pO1xyXG4gICAgaW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCAoKSA9PiB7XHJcbiAgICAgIGltZy5yZW1vdmUoKTtcclxuICAgIH0pO1xyXG4gICAgdm9pZCByZXNvbHZlSWNvblVybChtLmljb25VcmwsIHQuZGlyKS50aGVuKCh1cmwpID0+IHtcclxuICAgICAgaWYgKHVybCkgaW1nLnNyYyA9IHVybDtcclxuICAgICAgZWxzZSBpbWcucmVtb3ZlKCk7XHJcbiAgICB9KTtcclxuICAgIGF2YXRhci5hcHBlbmRDaGlsZChpbWcpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zdCBpbml0aWFsID0gKG0ubmFtZT8uWzBdID8/IFwiP1wiKS50b1VwcGVyQ2FzZSgpO1xyXG4gICAgY29uc3Qgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgc3Bhbi5jbGFzc05hbWUgPSBcInRleHQteGwgZm9udC1tZWRpdW1cIjtcclxuICAgIHNwYW4udGV4dENvbnRlbnQgPSBpbml0aWFsO1xyXG4gICAgYXZhdGFyLmFwcGVuZENoaWxkKHNwYW4pO1xyXG4gIH1cclxuICBsZWZ0LmFwcGVuZENoaWxkKGF2YXRhcik7XHJcblxyXG4gIC8vIFx1MjUwMFx1MjUwMCBUZXh0IHN0YWNrIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG4gIGNvbnN0IHN0YWNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBzdGFjay5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LWNvbCBnYXAtMC41XCI7XHJcblxyXG4gIGNvbnN0IHRpdGxlUm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICB0aXRsZVJvdy5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI7XHJcbiAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIG5hbWUuY2xhc3NOYW1lID0gXCJtaW4tdy0wIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgbmFtZS50ZXh0Q29udGVudCA9IHR3ZWFrRGlzcGxheU5hbWUobSk7XG4gIHRpdGxlUm93LmFwcGVuZENoaWxkKG5hbWUpO1xyXG4gIGlmIChtLnZlcnNpb24pIHtcclxuICAgIGNvbnN0IHZlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgdmVyLmNsYXNzTmFtZSA9XHJcbiAgICAgIFwidGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeSB0ZXh0LXhzIGZvbnQtbm9ybWFsIHRhYnVsYXItbnVtc1wiO1xyXG4gICAgdmVyLnRleHRDb250ZW50ID0gYHYke20udmVyc2lvbn1gO1xyXG4gICAgdGl0bGVSb3cuYXBwZW5kQ2hpbGQodmVyKTtcclxuICB9XHJcbiAgaWYgKHQudXBkYXRlPy51cGRhdGVBdmFpbGFibGUpIHtcclxuICAgIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICBiYWRnZS5jbGFzc05hbWUgPVxyXG4gICAgICBcInJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBiZy10b2tlbi1mb3JlZ3JvdW5kLzUgcHgtMiBweS0wLjUgdGV4dC1bMTFweF0gZm9udC1tZWRpdW0gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcclxuICAgIGJhZGdlLnRleHRDb250ZW50ID0gXCJcdTY3MDlcdTUzRUZcdTc1MjhcdTY2RjRcdTY1QjBcIjtcbiAgICB0aXRsZVJvdy5hcHBlbmRDaGlsZChiYWRnZSk7XHJcbiAgfVxyXG4gIHN0YWNrLmFwcGVuZENoaWxkKHRpdGxlUm93KTtcclxuXHJcbiAgaWYgKG0uZGVzY3JpcHRpb24pIHtcclxuICAgIGNvbnN0IGRlc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgZGVzYy5jbGFzc05hbWUgPSBcInRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnkgbWluLXctMCB0ZXh0LXNtXCI7XHJcbiAgICBkZXNjLnRleHRDb250ZW50ID0gdHdlYWtEaXNwbGF5RGVzY3JpcHRpb24obSkgPz8gXCJcIjtcbiAgICBzdGFjay5hcHBlbmRDaGlsZChkZXNjKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1ldGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIG1ldGEuY2xhc3NOYW1lID0gXCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzIHRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnlcIjtcclxuICBjb25zdCBhdXRob3JFbCA9IHJlbmRlckF1dGhvcihtLmF1dGhvcik7XHJcbiAgaWYgKGF1dGhvckVsKSBtZXRhLmFwcGVuZENoaWxkKGF1dGhvckVsKTtcclxuICBpZiAobS5naXRodWJSZXBvKSB7XHJcbiAgICBpZiAobWV0YS5jaGlsZHJlbi5sZW5ndGggPiAwKSBtZXRhLmFwcGVuZENoaWxkKGRvdCgpKTtcclxuICAgIGNvbnN0IHJlcG8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xyXG4gICAgcmVwby50eXBlID0gXCJidXR0b25cIjtcclxuICAgIHJlcG8uY2xhc3NOYW1lID0gXCJpbmxpbmUtZmxleCB0ZXh0LXRva2VuLXRleHQtbGluay1mb3JlZ3JvdW5kIGhvdmVyOnVuZGVybGluZVwiO1xyXG4gICAgcmVwby50ZXh0Q29udGVudCA9IG0uZ2l0aHViUmVwbztcclxuICAgIHJlcG8uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm9wZW4tZXh0ZXJuYWxcIiwgYGh0dHBzOi8vZ2l0aHViLmNvbS8ke20uZ2l0aHViUmVwb31gKTtcclxuICAgIH0pO1xyXG4gICAgbWV0YS5hcHBlbmRDaGlsZChyZXBvKTtcclxuICB9XHJcbiAgaWYgKG0uaG9tZXBhZ2UpIHtcclxuICAgIGlmIChtZXRhLmNoaWxkcmVuLmxlbmd0aCA+IDApIG1ldGEuYXBwZW5kQ2hpbGQoZG90KCkpO1xyXG4gICAgY29uc3QgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xyXG4gICAgbGluay5ocmVmID0gbS5ob21lcGFnZTtcclxuICAgIGxpbmsudGFyZ2V0ID0gXCJfYmxhbmtcIjtcclxuICAgIGxpbmsucmVsID0gXCJub3JlZmVycmVyXCI7XHJcbiAgICBsaW5rLmNsYXNzTmFtZSA9IFwiaW5saW5lLWZsZXggdGV4dC10b2tlbi10ZXh0LWxpbmstZm9yZWdyb3VuZCBob3Zlcjp1bmRlcmxpbmVcIjtcclxuICAgIGxpbmsudGV4dENvbnRlbnQgPSBcIlx1NEUzQlx1OTg3NVwiO1xuICAgIG1ldGEuYXBwZW5kQ2hpbGQobGluayk7XHJcbiAgfVxyXG4gIGlmIChtZXRhLmNoaWxkcmVuLmxlbmd0aCA+IDApIHN0YWNrLmFwcGVuZENoaWxkKG1ldGEpO1xyXG5cclxuICAvLyBUYWdzIHJvdyAoaWYgYW55KSBcdTIwMTQgc21hbGwgcGlsbCBjaGlwcyBiZWxvdyB0aGUgbWV0YSBsaW5lLlxyXG4gIGlmIChtLnRhZ3MgJiYgbS50YWdzLmxlbmd0aCA+IDApIHtcclxuICAgIGNvbnN0IHRhZ3NSb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgdGFnc1Jvdy5jbGFzc05hbWUgPSBcImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBnYXAtMSBwdC0wLjVcIjtcclxuICAgIGZvciAoY29uc3QgdGFnIG9mIG0udGFncykge1xyXG4gICAgICBjb25zdCBwaWxsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgICAgIHBpbGwuY2xhc3NOYW1lID1cclxuICAgICAgICBcInJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBiZy10b2tlbi1mb3JlZ3JvdW5kLzUgcHgtMiBweS0wLjUgdGV4dC1bMTFweF0gdGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xyXG4gICAgICBwaWxsLnRleHRDb250ZW50ID0gdGFnO1xyXG4gICAgICB0YWdzUm93LmFwcGVuZENoaWxkKHBpbGwpO1xyXG4gICAgfVxyXG4gICAgc3RhY2suYXBwZW5kQ2hpbGQodGFnc1Jvdyk7XHJcbiAgfVxyXG5cclxuICBsZWZ0LmFwcGVuZENoaWxkKHN0YWNrKTtcclxuICBoZWFkZXIuYXBwZW5kQ2hpbGQobGVmdCk7XHJcblxyXG4gIC8vIFx1MjUwMFx1MjUwMCBUb2dnbGUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcbiAgY29uc3QgcmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIHJpZ2h0LmNsYXNzTmFtZSA9IFwiZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIgZ2FwLTIgcHQtMC41XCI7XHJcbiAgaWYgKHQuZW5hYmxlZCAmJiBwYWdlcy5sZW5ndGggPiAwKSB7XHJcbiAgICBjb25zdCBjb25maWd1cmVCdG4gPSBjb21wYWN0QnV0dG9uKFwiXHU5MTREXHU3RjZFXCIsICgpID0+IHtcbiAgICAgIGFjdGl2YXRlUGFnZSh7IGtpbmQ6IFwicmVnaXN0ZXJlZFwiLCBpZDogcGFnZXNbMF0hLmlkIH0pO1xyXG4gICAgfSk7XHJcbiAgICBjb25maWd1cmVCdG4udGl0bGUgPSBwYWdlcy5sZW5ndGggPT09IDFcbiAgICAgID8gYFx1NjI1M1x1NUYwMCAke3BhZ2VzWzBdIS5wYWdlLnRpdGxlfWBcbiAgICAgIDogYFx1NjI1M1x1NUYwMCAke3BhZ2VzLm1hcCgocCkgPT4gcC5wYWdlLnRpdGxlKS5qb2luKFwiLCBcIil9YDtcbiAgICByaWdodC5hcHBlbmRDaGlsZChjb25maWd1cmVCdG4pO1xyXG4gIH1cclxuICBpZiAodC51cGRhdGU/LnVwZGF0ZUF2YWlsYWJsZSAmJiB0LnVwZGF0ZS5yZWxlYXNlVXJsKSB7XHJcbiAgICByaWdodC5hcHBlbmRDaGlsZChcclxuICAgICAgY29tcGFjdEJ1dHRvbihcIlx1NjdFNVx1NzcwQlx1NzI0OFx1NjcyQ1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpvcGVuLWV4dGVybmFsXCIsIHQudXBkYXRlIS5yZWxlYXNlVXJsKTtcclxuICAgICAgfSksXHJcbiAgICApO1xyXG4gIH1cclxuICByaWdodC5hcHBlbmRDaGlsZChcclxuICAgIHN3aXRjaENvbnRyb2wodC5lbmFibGVkLCBhc3luYyAobmV4dCkgPT4ge1xyXG4gICAgICBhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOnNldC10d2Vhay1lbmFibGVkXCIsIG0uaWQsIG5leHQpO1xyXG4gICAgICAvLyBUaGUgbWFpbiBwcm9jZXNzIGJyb2FkY2FzdHMgYSByZWxvYWQgd2hpY2ggd2lsbCByZS1mZXRjaCB0aGUgbGlzdFxyXG4gICAgICAvLyBhbmQgcmUtcmVuZGVyLiBXZSBkb24ndCBvcHRpbWlzdGljYWxseSB0b2dnbGUgdG8gYXZvaWQgZHJpZnQuXHJcbiAgICB9KSxcclxuICApO1xyXG4gIGhlYWRlci5hcHBlbmRDaGlsZChyaWdodCk7XHJcblxyXG4gIGNlbGwuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcclxuXHJcbiAgLy8gSWYgdGhlIHR3ZWFrIGlzIGVuYWJsZWQgYW5kIHJlZ2lzdGVyZWQgc2V0dGluZ3Mgc2VjdGlvbnMsIHJlbmRlciB0aG9zZVxyXG4gIC8vIGJvZGllcyBhcyBuZXN0ZWQgcm93cyBiZW5lYXRoIHRoZSBoZWFkZXIgaW5zaWRlIHRoZSBzYW1lIGNlbGwuXHJcbiAgaWYgKHQuZW5hYmxlZCAmJiBzZWN0aW9ucy5sZW5ndGggPiAwKSB7XHJcbiAgICBjb25zdCBuZXN0ZWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgbmVzdGVkLmNsYXNzTmFtZSA9XHJcbiAgICAgIFwiZmxleCBmbGV4LWNvbCBkaXZpZGUteS1bMC41cHhdIGRpdmlkZS10b2tlbi1ib3JkZXIgYm9yZGVyLXQtWzAuNXB4XSBib3JkZXItdG9rZW4tYm9yZGVyXCI7XHJcbiAgICBmb3IgKGNvbnN0IHMgb2Ygc2VjdGlvbnMpIHtcclxuICAgICAgY29uc3QgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgIGJvZHkuY2xhc3NOYW1lID0gXCJwLTNcIjtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBzLnJlbmRlcihib2R5KTtcclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGJvZHkudGV4dENvbnRlbnQgPSBgXHU2RTMyXHU2N0QzXHU2M0QyXHU0RUY2XHU4QkJFXHU3RjZFXHU1MzNBXHU1N0RGXHU1MUZBXHU5NTE5XHVGRjFBJHsoZSBhcyBFcnJvcikubWVzc2FnZX1gO1xuICAgICAgfVxyXG4gICAgICBuZXN0ZWQuYXBwZW5kQ2hpbGQoYm9keSk7XHJcbiAgICB9XHJcbiAgICBjZWxsLmFwcGVuZENoaWxkKG5lc3RlZCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gY2VsbDtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQXV0aG9yKGF1dGhvcjogVHdlYWtNYW5pZmVzdFtcImF1dGhvclwiXSk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XHJcbiAgaWYgKCFhdXRob3IpIHJldHVybiBudWxsO1xyXG4gIGNvbnN0IHdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICB3cmFwLmNsYXNzTmFtZSA9IFwiaW5saW5lLWZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI7XHJcbiAgaWYgKHR5cGVvZiBhdXRob3IgPT09IFwic3RyaW5nXCIpIHtcbiAgICB3cmFwLnRleHRDb250ZW50ID0gYFx1NEY1Q1x1ODAwNVx1RkYxQSR7YXV0aG9yfWA7XG4gICAgcmV0dXJuIHdyYXA7XG4gIH1cbiAgd3JhcC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlx1NEY1Q1x1ODAwNVx1RkYxQVwiKSk7XG4gIGlmIChhdXRob3IudXJsKSB7XHJcbiAgICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICBhLmhyZWYgPSBhdXRob3IudXJsO1xyXG4gICAgYS50YXJnZXQgPSBcIl9ibGFua1wiO1xyXG4gICAgYS5yZWwgPSBcIm5vcmVmZXJyZXJcIjtcclxuICAgIGEuY2xhc3NOYW1lID0gXCJpbmxpbmUtZmxleCB0ZXh0LXRva2VuLXRleHQtbGluay1mb3JlZ3JvdW5kIGhvdmVyOnVuZGVybGluZVwiO1xyXG4gICAgYS50ZXh0Q29udGVudCA9IGF1dGhvci5uYW1lO1xyXG4gICAgd3JhcC5hcHBlbmRDaGlsZChhKTtcclxuICB9IGVsc2Uge1xyXG4gICAgY29uc3Qgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gICAgc3Bhbi50ZXh0Q29udGVudCA9IGF1dGhvci5uYW1lO1xyXG4gICAgd3JhcC5hcHBlbmRDaGlsZChzcGFuKTtcclxuICB9XHJcbiAgcmV0dXJuIHdyYXA7XHJcbn1cclxuXHJcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCBjb21wb25lbnRzIFx1MjUwMFx1MjUwMFxuXHJcbi8qKiBUaGUgZnVsbCBwYW5lbCBzaGVsbCAodG9vbGJhciArIHNjcm9sbCArIGhlYWRpbmcgKyBzZWN0aW9ucyB3cmFwKS4gKi9cclxuZnVuY3Rpb24gcGFuZWxTaGVsbChcclxuICB0aXRsZTogc3RyaW5nLFxyXG4gIHN1YnRpdGxlPzogc3RyaW5nLFxyXG4gIG9wdGlvbnM/OiB7IHdpZGU/OiBib29sZWFuIH0sXHJcbik6IHtcclxuICBvdXRlcjogSFRNTEVsZW1lbnQ7XHJcbiAgc2VjdGlvbnNXcmFwOiBIVE1MRWxlbWVudDtcclxuICBzdWJ0aXRsZT86IEhUTUxFbGVtZW50O1xyXG4gIGhlYWRlckFjdGlvbnM6IEhUTUxFbGVtZW50O1xyXG4gIGhlYWRlclRpdGxlQWN0aW9uczogSFRNTEVsZW1lbnQ7XHJcbn0ge1xyXG4gIGNvbnN0IG91dGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBvdXRlci5jbGFzc05hbWUgPSBcIm1haW4tc3VyZmFjZSBmbGV4IGgtZnVsbCBtaW4taC0wIGZsZXgtY29sXCI7XHJcblxyXG4gIGNvbnN0IHRvb2xiYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIHRvb2xiYXIuY2xhc3NOYW1lID1cclxuICAgIFwiZHJhZ2dhYmxlIGZsZXggaXRlbXMtY2VudGVyIHB4LXBhbmVsIGVsZWN0cm9uOmgtdG9vbGJhciBleHRlbnNpb246aC10b29sYmFyLXNtXCI7XHJcbiAgb3V0ZXIuYXBwZW5kQ2hpbGQodG9vbGJhcik7XHJcblxyXG4gIGNvbnN0IHNjcm9sbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgc2Nyb2xsLmNsYXNzTmFtZSA9IFwiZmxleC0xIG92ZXJmbG93LXktYXV0byBwLXBhbmVsXCI7XHJcbiAgb3V0ZXIuYXBwZW5kQ2hpbGQoc2Nyb2xsKTtcclxuXHJcbiAgY29uc3QgaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGlubmVyLmNsYXNzTmFtZSA9XHJcbiAgICBvcHRpb25zPy53aWRlXHJcbiAgICAgID8gXCJteC1hdXRvIGZsZXggdy1mdWxsIG1heC13LTV4bCBmbGV4LWNvbCBlbGVjdHJvbjptaW4tdy1bY2FsYygzMjBweCp2YXIoLS1jb2RleC13aW5kb3ctem9vbSkpXVwiXHJcbiAgICAgIDogXCJteC1hdXRvIGZsZXggdy1mdWxsIGZsZXgtY29sIG1heC13LTJ4bCBlbGVjdHJvbjptaW4tdy1bY2FsYygzMjBweCp2YXIoLS1jb2RleC13aW5kb3ctem9vbSkpXVwiO1xyXG4gIHNjcm9sbC5hcHBlbmRDaGlsZChpbm5lcik7XHJcblxyXG4gIGNvbnN0IGhlYWRlcldyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGhlYWRlcldyYXAuY2xhc3NOYW1lID0gXCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTMgcGItcGFuZWxcIjtcclxuICBjb25zdCBoZWFkZXJJbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgaGVhZGVySW5uZXIuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC0xIGZsZXgtY29sIGdhcC0xLjUgcGItcGFuZWxcIjtcclxuICBjb25zdCB0aXRsZUxpbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIHRpdGxlTGluZS5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcclxuICBjb25zdCBoZWFkaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBoZWFkaW5nLmNsYXNzTmFtZSA9IFwiZWxlY3Ryb246aGVhZGluZy1sZyBoZWFkaW5nLWJhc2UgdHJ1bmNhdGVcIjtcclxuICBoZWFkaW5nLnRleHRDb250ZW50ID0gdGl0bGU7XHJcbiAgdGl0bGVMaW5lLmFwcGVuZENoaWxkKGhlYWRpbmcpO1xyXG4gIGNvbnN0IGhlYWRlclRpdGxlQWN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgaGVhZGVyVGl0bGVBY3Rpb25zLmNsYXNzTmFtZSA9IFwiZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcclxuICB0aXRsZUxpbmUuYXBwZW5kQ2hpbGQoaGVhZGVyVGl0bGVBY3Rpb25zKTtcclxuICBoZWFkZXJJbm5lci5hcHBlbmRDaGlsZCh0aXRsZUxpbmUpO1xyXG4gIGxldCBzdWJ0aXRsZUVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xyXG4gIGlmIChzdWJ0aXRsZSkge1xyXG4gICAgY29uc3Qgc3ViID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgIHN1Yi5jbGFzc05hbWUgPSBcInRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnkgdGV4dC1zbVwiO1xyXG4gICAgc3ViLnRleHRDb250ZW50ID0gc3VidGl0bGU7XHJcbiAgICBoZWFkZXJJbm5lci5hcHBlbmRDaGlsZChzdWIpO1xyXG4gICAgc3VidGl0bGVFbGVtZW50ID0gc3ViO1xyXG4gIH1cclxuICBoZWFkZXJXcmFwLmFwcGVuZENoaWxkKGhlYWRlcklubmVyKTtcclxuICBjb25zdCBoZWFkZXJBY3Rpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICBoZWFkZXJBY3Rpb25zLmNsYXNzTmFtZSA9IFwiZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcclxuICBoZWFkZXJXcmFwLmFwcGVuZENoaWxkKGhlYWRlckFjdGlvbnMpO1xyXG4gIGlubmVyLmFwcGVuZENoaWxkKGhlYWRlcldyYXApO1xyXG5cclxuICBjb25zdCBzZWN0aW9uc1dyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIHNlY3Rpb25zV3JhcC5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLVt2YXIoLS1wYWRkaW5nLXBhbmVsKV1cIjtcclxuICBpbm5lci5hcHBlbmRDaGlsZChzZWN0aW9uc1dyYXApO1xyXG5cclxuICByZXR1cm4geyBvdXRlciwgc2VjdGlvbnNXcmFwLCBzdWJ0aXRsZTogc3VidGl0bGVFbGVtZW50LCBoZWFkZXJBY3Rpb25zLCBoZWFkZXJUaXRsZUFjdGlvbnMgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2VjdGlvblRpdGxlKHRleHQ6IHN0cmluZywgdHJhaWxpbmc/OiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHtcclxuICBjb25zdCB0aXRsZVJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgdGl0bGVSb3cuY2xhc3NOYW1lID1cclxuICAgIFwiZmxleCBoLXRvb2xiYXIgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBweC0wIHB5LTBcIjtcclxuICBjb25zdCB0aXRsZUlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICB0aXRsZUlubmVyLmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGZsZXgtMSBmbGV4LWNvbCBnYXAtMVwiO1xyXG4gIGNvbnN0IHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIHQuY2xhc3NOYW1lID0gXCJ0ZXh0LWJhc2UgZm9udC1tZWRpdW0gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcclxuICB0LnRleHRDb250ZW50ID0gdGV4dDtcclxuICB0aXRsZUlubmVyLmFwcGVuZENoaWxkKHQpO1xyXG4gIHRpdGxlUm93LmFwcGVuZENoaWxkKHRpdGxlSW5uZXIpO1xyXG4gIGlmICh0cmFpbGluZykge1xyXG4gICAgY29uc3QgcmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgcmlnaHQuY2xhc3NOYW1lID0gXCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiO1xyXG4gICAgcmlnaHQuYXBwZW5kQ2hpbGQodHJhaWxpbmcpO1xyXG4gICAgdGl0bGVSb3cuYXBwZW5kQ2hpbGQocmlnaHQpO1xyXG4gIH1cclxuICByZXR1cm4gdGl0bGVSb3c7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDb2RleCdzIFwiT3BlbiBjb25maWcudG9tbFwiLXN0eWxlIHRyYWlsaW5nIGJ1dHRvbjogZ2hvc3QgYm9yZGVyLCBtdXRlZFxyXG4gKiBsYWJlbCwgdG9wLXJpZ2h0IGRpYWdvbmFsIGFycm93IGljb24uIE1hcmt1cCBtaXJyb3JzIENvbmZpZ3VyYXRpb24gcGFuZWwuXHJcbiAqL1xyXG5mdW5jdGlvbiBvcGVuSW5QbGFjZUJ1dHRvbihsYWJlbDogc3RyaW5nLCBvbkNsaWNrOiAoKSA9PiB2b2lkKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xyXG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XHJcbiAgYnRuLnR5cGUgPSBcImJ1dHRvblwiO1xyXG4gIGJ0bi5jbGFzc05hbWUgPVxyXG4gICAgXCJib3JkZXItdG9rZW4tYm9yZGVyIHVzZXItc2VsZWN0LW5vbmUgbm8tZHJhZyBjdXJzb3ItaW50ZXJhY3Rpb24gZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgYm9yZGVyIHdoaXRlc3BhY2Utbm93cmFwIGZvY3VzOm91dGxpbmUtbm9uZSBkaXNhYmxlZDpjdXJzb3Itbm90LWFsbG93ZWQgZGlzYWJsZWQ6b3BhY2l0eS00MCByb3VuZGVkLWxnIHRleHQtdG9rZW4tZGVzY3JpcHRpb24tZm9yZWdyb3VuZCBlbmFibGVkOmhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZCBkYXRhLVtzdGF0ZT1vcGVuXTpiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmQgYm9yZGVyLXRyYW5zcGFyZW50IGgtdG9rZW4tYnV0dG9uLWNvbXBvc2VyIHB4LTIgcHktMCB0ZXh0LWJhc2UgbGVhZGluZy1bMThweF1cIjtcclxuICBidG4uaW5uZXJIVE1MID1cclxuICAgIGAke2xhYmVsfWAgK1xyXG4gICAgYDxzdmcgd2lkdGg9XCIyMFwiIGhlaWdodD1cIjIwXCIgdmlld0JveD1cIjAgMCAyMCAyMFwiIGZpbGw9XCJub25lXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIGNsYXNzPVwiaWNvbi0yeHNcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcclxuICAgIGA8cGF0aCBkPVwiTTE0LjMzNDkgMTMuMzMwMVY2LjYwNjQ1TDUuNDcwNjUgMTUuNDcwN0M1LjIxMDk1IDE1LjczMDQgNC43ODg5NSAxNS43MzA0IDQuNTI5MjUgMTUuNDcwN0M0LjI2OTU1IDE1LjIxMSA0LjI2OTU1IDE0Ljc4OSA0LjUyOTI1IDE0LjUyOTNMMTMuMzkzNSA1LjY2NTA0SDYuNjYwMTFDNi4yOTI4NCA1LjY2NTA0IDUuOTk1MDcgNS4zNjcyNyA1Ljk5NTA3IDVDNS45OTUwNyA0LjYzMjczIDYuMjkyODQgNC4zMzQ5NiA2LjY2MDExIDQuMzM0OTZIMTQuOTk5OUwxNS4xMzM3IDQuMzQ4NjNDMTUuNDM2OSA0LjQxMDU3IDE1LjY2NSA0LjY3ODU3IDE1LjY2NSA1VjEzLjMzMDFDMTUuNjY0OSAxMy42OTczIDE1LjM2NzIgMTMuOTk1MSAxNC45OTk5IDEzLjk5NTFDMTQuNjMyNyAxMy45OTUxIDE0LjMzNSAxMy42OTczIDE0LjMzNDkgMTMuMzMwMVpcIiBmaWxsPVwiY3VycmVudENvbG9yXCI+PC9wYXRoPmAgK1xyXG4gICAgYDwvc3ZnPmA7XHJcbiAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIG9uQ2xpY2soKTtcclxuICB9KTtcclxuICByZXR1cm4gYnRuO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb21wYWN0QnV0dG9uKGxhYmVsOiBzdHJpbmcsIG9uQ2xpY2s6ICgpID0+IHZvaWQpOiBIVE1MQnV0dG9uRWxlbWVudCB7XHJcbiAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcclxuICBidG4udHlwZSA9IFwiYnV0dG9uXCI7XHJcbiAgYnRuLmNsYXNzTmFtZSA9XHJcbiAgICBcImJvcmRlci10b2tlbi1ib3JkZXIgdXNlci1zZWxlY3Qtbm9uZSBuby1kcmFnIGN1cnNvci1pbnRlcmFjdGlvbiBpbmxpbmUtZmxleCBoLTggaXRlbXMtY2VudGVyIHdoaXRlc3BhY2Utbm93cmFwIHJvdW5kZWQtbGcgYm9yZGVyIHB4LTIgdGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeSBlbmFibGVkOmhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZCBkaXNhYmxlZDpjdXJzb3Itbm90LWFsbG93ZWQgZGlzYWJsZWQ6b3BhY2l0eS00MFwiO1xyXG4gIGJ0bi50ZXh0Q29udGVudCA9IGxhYmVsO1xyXG4gIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICBvbkNsaWNrKCk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGJ0bjtcclxufVxyXG5cclxuZnVuY3Rpb24gcm91bmRlZENhcmQoKTogSFRNTEVsZW1lbnQge1xyXG4gIGNvbnN0IGNhcmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gIGNhcmQuY2xhc3NOYW1lID1cclxuICAgIFwiYm9yZGVyLXRva2VuLWJvcmRlciBmbGV4IGZsZXgtY29sIGRpdmlkZS15LVswLjVweF0gZGl2aWRlLXRva2VuLWJvcmRlciByb3VuZGVkLWxnIGJvcmRlclwiO1xyXG4gIGNhcmQuc2V0QXR0cmlidXRlKFxyXG4gICAgXCJzdHlsZVwiLFxyXG4gICAgXCJiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb2xvci1iYWNrZ3JvdW5kLXBhbmVsLCB2YXIoLS1jb2xvci10b2tlbi1iZy1mb2cpKTtcIixcclxuICApO1xyXG4gIHJldHVybiBjYXJkO1xyXG59XHJcblxyXG5mdW5jdGlvbiByb3dTaW1wbGUodGl0bGU6IHN0cmluZyB8IHVuZGVmaW5lZCwgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XHJcbiAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICByb3cuY2xhc3NOYW1lID0gXCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTQgcC0zXCI7XHJcbiAgY29uc3QgbGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgbGVmdC5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBpdGVtcy1jZW50ZXIgZ2FwLTNcIjtcclxuICBjb25zdCBzdGFjayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgc3RhY2suY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC1jb2wgZ2FwLTFcIjtcclxuICBpZiAodGl0bGUpIHtcclxuICAgIGNvbnN0IHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgdC5jbGFzc05hbWUgPSBcIm1pbi13LTAgdGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xyXG4gICAgdC50ZXh0Q29udGVudCA9IHRpdGxlO1xyXG4gICAgc3RhY2suYXBwZW5kQ2hpbGQodCk7XHJcbiAgfVxyXG4gIGlmIChkZXNjcmlwdGlvbikge1xyXG4gICAgY29uc3QgZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICBkLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeSBtaW4tdy0wIHRleHQtc21cIjtcclxuICAgIGQudGV4dENvbnRlbnQgPSBkZXNjcmlwdGlvbjtcclxuICAgIHN0YWNrLmFwcGVuZENoaWxkKGQpO1xyXG4gIH1cclxuICBsZWZ0LmFwcGVuZENoaWxkKHN0YWNrKTtcclxuICByb3cuYXBwZW5kQ2hpbGQobGVmdCk7XHJcbiAgcmV0dXJuIHJvdztcclxufVxyXG5cclxuLyoqXHJcbiAqIENvZGV4LXN0eWxlZCB0b2dnbGUgc3dpdGNoLiBNYXJrdXAgbWlycm9ycyB0aGUgR2VuZXJhbCA+IFBlcm1pc3Npb25zIHJvd1xyXG4gKiBzd2l0Y2ggd2UgY2FwdHVyZWQ6IG91dGVyIGJ1dHRvbiAocm9sZT1zd2l0Y2gpLCBpbm5lciBwaWxsLCBzbGlkaW5nIGtub2IuXHJcbiAqL1xyXG5mdW5jdGlvbiBzd2l0Y2hDb250cm9sKFxyXG4gIGluaXRpYWw6IGJvb2xlYW4sXHJcbiAgb25DaGFuZ2U6IChuZXh0OiBib29sZWFuKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPixcclxuKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xyXG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XHJcbiAgYnRuLnR5cGUgPSBcImJ1dHRvblwiO1xyXG4gIGJ0bi5zZXRBdHRyaWJ1dGUoXCJyb2xlXCIsIFwic3dpdGNoXCIpO1xyXG5cclxuICBjb25zdCBwaWxsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcbiAgY29uc3Qga25vYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG4gIGtub2IuY2xhc3NOYW1lID1cclxuICAgIFwicm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItW2NvbG9yOnZhcigtLWdyYXktMCldIGJnLVtjb2xvcjp2YXIoLS1ncmF5LTApXSBzaGFkb3ctc20gdHJhbnNpdGlvbi10cmFuc2Zvcm0gZHVyYXRpb24tMjAwIGVhc2Utb3V0IGgtNCB3LTRcIjtcclxuICBwaWxsLmFwcGVuZENoaWxkKGtub2IpO1xyXG5cclxuICBjb25zdCBhcHBseSA9IChvbjogYm9vbGVhbik6IHZvaWQgPT4ge1xyXG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImFyaWEtY2hlY2tlZFwiLCBTdHJpbmcob24pKTtcclxuICAgIGJ0bi5kYXRhc2V0LnN0YXRlID0gb24gPyBcImNoZWNrZWRcIiA6IFwidW5jaGVja2VkXCI7XHJcbiAgICBidG4uY2xhc3NOYW1lID1cclxuICAgICAgXCJpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIgdGV4dC1zbSBmb2N1cy12aXNpYmxlOm91dGxpbmUtbm9uZSBmb2N1cy12aXNpYmxlOnJpbmctMiBmb2N1cy12aXNpYmxlOnJpbmctdG9rZW4tZm9jdXMtYm9yZGVyIGZvY3VzLXZpc2libGU6cm91bmRlZC1mdWxsIGN1cnNvci1pbnRlcmFjdGlvblwiO1xyXG4gICAgcGlsbC5jbGFzc05hbWUgPSBgcmVsYXRpdmUgaW5saW5lLWZsZXggc2hyaW5rLTAgaXRlbXMtY2VudGVyIHJvdW5kZWQtZnVsbCB0cmFuc2l0aW9uLWNvbG9ycyBkdXJhdGlvbi0yMDAgZWFzZS1vdXQgaC01IHctOCAke1xyXG4gICAgICBvbiA/IFwiYmctdG9rZW4tY2hhcnRzLWJsdWVcIiA6IFwiYmctdG9rZW4tZm9yZWdyb3VuZC8yMFwiXHJcbiAgICB9YDtcclxuICAgIHBpbGwuZGF0YXNldC5zdGF0ZSA9IG9uID8gXCJjaGVja2VkXCIgOiBcInVuY2hlY2tlZFwiO1xyXG4gICAga25vYi5kYXRhc2V0LnN0YXRlID0gb24gPyBcImNoZWNrZWRcIiA6IFwidW5jaGVja2VkXCI7XHJcbiAgICBrbm9iLnN0eWxlLnRyYW5zZm9ybSA9IG9uID8gXCJ0cmFuc2xhdGVYKDE0cHgpXCIgOiBcInRyYW5zbGF0ZVgoMnB4KVwiO1xyXG4gIH07XHJcbiAgYXBwbHkoaW5pdGlhbCk7XHJcblxyXG4gIGJ0bi5hcHBlbmRDaGlsZChwaWxsKTtcclxuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jIChlKSA9PiB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgY29uc3QgbmV4dCA9IGJ0bi5nZXRBdHRyaWJ1dGUoXCJhcmlhLWNoZWNrZWRcIikgIT09IFwidHJ1ZVwiO1xyXG4gICAgYXBwbHkobmV4dCk7XHJcbiAgICBidG4uZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgb25DaGFuZ2UobmV4dCk7XHJcbiAgICB9IGZpbmFsbHkge1xyXG4gICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4gYnRuO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkb3QoKTogSFRNTEVsZW1lbnQge1xyXG4gIGNvbnN0IHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuICBzLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi1kZXNjcmlwdGlvbi1mb3JlZ3JvdW5kXCI7XHJcbiAgcy50ZXh0Q29udGVudCA9IFwiXHUwMEI3XCI7XHJcbiAgcmV0dXJuIHM7XHJcbn1cclxuXHJcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCBpY29ucyBcdTI1MDBcdTI1MDBcclxuXHJcbmZ1bmN0aW9uIGNvbmZpZ0ljb25TdmcoKTogc3RyaW5nIHtcclxuICAvLyBTbGlkZXJzIC8gc2V0dGluZ3MgZ2x5cGguIDIweDIwIGN1cnJlbnRDb2xvci5cclxuICByZXR1cm4gKFxyXG4gICAgYDxzdmcgd2lkdGg9XCIyMFwiIGhlaWdodD1cIjIwXCIgdmlld0JveD1cIjAgMCAyMCAyMFwiIGZpbGw9XCJub25lXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIGNsYXNzPVwiaWNvbi1zbSBpbmxpbmUtYmxvY2sgYWxpZ24tbWlkZGxlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+YCArXHJcbiAgICBgPHBhdGggZD1cIk0zIDVoOU0xNSA1aDJNMyAxMGgyTTggMTBoOU0zIDE1aDExTTE3IDE1aDBcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIvPmAgK1xyXG4gICAgYDxjaXJjbGUgY3g9XCIxM1wiIGN5PVwiNVwiIHI9XCIxLjZcIiBmaWxsPVwiY3VycmVudENvbG9yXCIvPmAgK1xyXG4gICAgYDxjaXJjbGUgY3g9XCI2XCIgY3k9XCIxMFwiIHI9XCIxLjZcIiBmaWxsPVwiY3VycmVudENvbG9yXCIvPmAgK1xyXG4gICAgYDxjaXJjbGUgY3g9XCIxNVwiIGN5PVwiMTVcIiByPVwiMS42XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiLz5gICtcclxuICAgIGA8L3N2Zz5gXHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdHdlYWtzSWNvblN2ZygpOiBzdHJpbmcge1xyXG4gIC8vIFNwYXJrbGVzIC8gXCIrK1wiIGdseXBoIGZvciB0d2Vha3MuXHJcbiAgcmV0dXJuIChcclxuICAgIGA8c3ZnIHdpZHRoPVwiMjBcIiBoZWlnaHQ9XCIyMFwiIHZpZXdCb3g9XCIwIDAgMjAgMjBcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBjbGFzcz1cImljb24tc20gaW5saW5lLWJsb2NrIGFsaWduLW1pZGRsZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmAgK1xyXG4gICAgYDxwYXRoIGQ9XCJNMTAgMi41IEwxMS40IDguNiBMMTcuNSAxMCBMMTEuNCAxMS40IEwxMCAxNy41IEw4LjYgMTEuNCBMMi41IDEwIEw4LjYgOC42IFpcIiBmaWxsPVwiY3VycmVudENvbG9yXCIvPmAgK1xyXG4gICAgYDxwYXRoIGQ9XCJNMTUuNSAzIEwxNiA1IEwxOCA1LjUgTDE2IDYgTDE1LjUgOCBMMTUgNiBMMTMgNS41IEwxNSA1IFpcIiBmaWxsPVwiY3VycmVudENvbG9yXCIgb3BhY2l0eT1cIjAuN1wiLz5gICtcclxuICAgIGA8L3N2Zz5gXHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc3RvcmVJY29uU3ZnKCk6IHN0cmluZyB7XG4gIHJldHVybiAoXG4gICAgYDxzdmcgd2lkdGg9XCIyMFwiIGhlaWdodD1cIjIwXCIgdmlld0JveD1cIjAgMCAyMCAyMFwiIGZpbGw9XCJub25lXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIGNsYXNzPVwiaWNvbi1zbSBpbmxpbmUtYmxvY2sgYWxpZ24tbWlkZGxlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+YCArXG4gICAgYDxwYXRoIGQ9XCJNNCA4LjIgNS4xIDQuNUExLjUgMS41IDAgMCAxIDYuNTUgMy40aDYuOWExLjUgMS41IDAgMCAxIDEuNDUgMS4xTDE2IDguMlwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuNVwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIvPmAgK1xuICAgIGA8cGF0aCBkPVwiTTQuNSA4aDExdjcuNUExLjUgMS41IDAgMCAxIDE0IDE3SDZhMS41IDEuNSAwIDAgMS0xLjUtMS41VjhaXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXHJcbiAgICBgPHBhdGggZD1cIk03LjUgOHYxYTIuNSAyLjUgMCAwIDAgNSAwVjhcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIvPmAgK1xyXG4gICAgYDwvc3ZnPmBcbiAgKTtcbn1cblxuZnVuY3Rpb24gYWdlbnRQcm92aWRlckljb25TdmcoKTogc3RyaW5nIHtcbiAgcmV0dXJuIChcbiAgICBgPHN2ZyB3aWR0aD1cIjIwXCIgaGVpZ2h0PVwiMjBcIiB2aWV3Qm94PVwiMCAwIDIwIDIwXCIgZmlsbD1cIm5vbmVcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgY2xhc3M9XCJpY29uLXNtIGlubGluZS1ibG9jayBhbGlnbi1taWRkbGVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcbiAgICBgPHBhdGggZD1cIk0xMCAzLjI1YTYuNzUgNi43NSAwIDEgMCAwIDEzLjUgNi43NSA2Ljc1IDAgMCAwIDAtMTMuNVpcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjQ1XCIvPmAgK1xuICAgIGA8cGF0aCBkPVwiTTYuNiAxMGg2LjhNMTAgNi42djYuOFwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuNDVcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIvPmAgK1xuICAgIGA8cGF0aCBkPVwiTTQuNiA3Ljc1aDEwLjhNNC42IDEyLjI1aDEwLjhcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjFcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgb3BhY2l0eT1cIjAuNjVcIi8+YCArXG4gICAgYDwvc3ZnPmBcbiAgKTtcbn1cblxuZnVuY3Rpb24gZGVmYXVsdFBhZ2VJY29uU3ZnKCk6IHN0cmluZyB7XG4gIC8vIERvY3VtZW50L3BhZ2UgZ2x5cGggZm9yIHR3ZWFrLXJlZ2lzdGVyZWQgcGFnZXMgd2l0aG91dCB0aGVpciBvd24gaWNvbi5cbiAgcmV0dXJuIChcbiAgICBgPHN2ZyB3aWR0aD1cIjIwXCIgaGVpZ2h0PVwiMjBcIiB2aWV3Qm94PVwiMCAwIDIwIDIwXCIgZmlsbD1cIm5vbmVcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgY2xhc3M9XCJpY29uLXNtIGlubGluZS1ibG9jayBhbGlnbi1taWRkbGVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcclxuICAgIGA8cGF0aCBkPVwiTTUgM2g3bDMgM3YxMWExIDEgMCAwIDEtMSAxSDVhMSAxIDAgMCAxLTEtMVY0YTEgMSAwIDAgMSAxLTFaXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXHJcbiAgICBgPHBhdGggZD1cIk0xMiAzdjNhMSAxIDAgMCAwIDEgMWgyXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXHJcbiAgICBgPHBhdGggZD1cIk03IDExaDZNNyAxNGg0XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiLz5gICtcclxuICAgIGA8L3N2Zz5gXHJcbiAgKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUljb25VcmwoXHJcbiAgdXJsOiBzdHJpbmcsXHJcbiAgdHdlYWtEaXI6IHN0cmluZyxcclxuKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XHJcbiAgaWYgKC9eKGh0dHBzPzp8ZGF0YTopLy50ZXN0KHVybCkpIHJldHVybiB1cmw7XHJcbiAgLy8gUmVsYXRpdmUgcGF0aCBcdTIxOTIgYXNrIG1haW4gdG8gcmVhZCB0aGUgZmlsZSBhbmQgcmV0dXJuIGEgZGF0YTogVVJMLlxyXG4gIC8vIFJlbmRlcmVyIGlzIHNhbmRib3hlZCBzbyBmaWxlOi8vIHdvbid0IGxvYWQgZGlyZWN0bHkuXHJcbiAgY29uc3QgcmVsID0gdXJsLnN0YXJ0c1dpdGgoXCIuL1wiKSA/IHVybC5zbGljZSgyKSA6IHVybDtcclxuICB0cnkge1xyXG4gICAgcmV0dXJuIChhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXHJcbiAgICAgIFwiY29kZXhwcDpyZWFkLXR3ZWFrLWFzc2V0XCIsXHJcbiAgICAgIHR3ZWFrRGlyLFxyXG4gICAgICByZWwsXHJcbiAgICApKSBhcyBzdHJpbmc7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcGxvZyhcImljb24gbG9hZCBmYWlsZWRcIiwgeyB1cmwsIHR3ZWFrRGlyLCBlcnI6IFN0cmluZyhlKSB9KTtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxufVxyXG5cclxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwIERPTSBoZXVyaXN0aWNzIFx1MjUwMFx1MjUwMFxyXG5cclxuZnVuY3Rpb24gZmluZFNpZGViYXJJdGVtc0dyb3VwKCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XHJcbiAgY29uc3QgY2FuZGlkYXRlcyA9IEFycmF5LmZyb20oXHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcImFzaWRlLG5hdixbcm9sZT0nbmF2aWdhdGlvbiddLGRpdlwiKSxcclxuICApO1xyXG5cclxuICBsZXQgYmVzdDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcclxuICBsZXQgYmVzdFNjb3JlID0gLTE7XHJcbiAgbGV0IGJlc3RBcmVhID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xyXG5cclxuICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBjYW5kaWRhdGVzKSB7XHJcbiAgICBpZiAoY2FuZGlkYXRlLmRhdGFzZXQuY29kZXhwcCkgY29udGludWU7XHJcbiAgICBpZiAoIWlzU2V0dGluZ3NTaWRlYmFyQ2FuZGlkYXRlKGNhbmRpZGF0ZSkpIGNvbnRpbnVlO1xyXG5cclxuICAgIGNvbnN0IGxhYmVscyA9IGNvZGV4UHBTZXR0aW5nc0xhYmVsc0Zyb20oY2FuZGlkYXRlKTtcclxuICAgIGNvbnN0IHNjb3JlID0gY29kZXhQcFNldHRpbmdzTGFiZWxTY29yZShsYWJlbHMpO1xyXG4gICAgY29uc3QgcmVjdCA9IGNhbmRpZGF0ZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgIGNvbnN0IGFyZWEgPSByZWN0LndpZHRoICogcmVjdC5oZWlnaHQ7XHJcbiAgICBjb25zdCB3ZWlnaHRlZCA9IHNjb3JlLmNvcmUgKiAxMDAgKyBzY29yZS50b3RhbDtcclxuXHJcbiAgICBpZiAod2VpZ2h0ZWQgPiBiZXN0U2NvcmUgfHwgKHdlaWdodGVkID09PSBiZXN0U2NvcmUgJiYgYXJlYSA8IGJlc3RBcmVhKSkge1xyXG4gICAgICBiZXN0ID0gY2FuZGlkYXRlO1xyXG4gICAgICBiZXN0U2NvcmUgPSB3ZWlnaHRlZDtcclxuICAgICAgYmVzdEFyZWEgPSBhcmVhO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGJlc3Q7XHJcbn1cclxuXHJcbmNvbnN0IEZPUkJJRERFTl9TRVRUSU5HU19TSURFQkFSX1NFTEVDVE9SID0gW1xyXG4gIFwiW2RhdGEtY29tcG9zZXItb3ZlcmxheS1mbG9hdGluZy11aT0ndHJ1ZSddXCIsXHJcbiAgXCJbZGF0YS1jb2RleHBwLXNsYXNoLW1lbnU9J3RydWUnXVwiLFxyXG4gIFwiW2RhdGEtY29kZXhwcC1vdmVybGF5LW5vaXNlPSd0cnVlJ11cIixcclxuICBcIi5jb21wb3Nlci1ob21lLXRvcC1tZW51XCIsXHJcbiAgXCIudmVydGljYWwtc2Nyb2xsLWZhZGUtbWFza1wiLFxyXG4gIFwiW2NsYXNzKj0nW2NvbnRhaW5lci1uYW1lOmhvbWUtbWFpbi1jb250ZW50XSddXCIsXHJcbl0uam9pbihcIixcIik7XHJcblxyXG5mdW5jdGlvbiBpc0ZvcmJpZGRlblNldHRpbmdzU2lkZWJhclN1cmZhY2Uobm9kZTogRWxlbWVudCB8IG51bGwpOiBib29sZWFuIHtcclxuICBpZiAoIW5vZGUpIHJldHVybiBmYWxzZTtcclxuICBjb25zdCBlbCA9IG5vZGUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCA/IG5vZGUgOiBub2RlLnBhcmVudEVsZW1lbnQ7XHJcbiAgaWYgKCFlbCkgcmV0dXJuIGZhbHNlO1xyXG4gIGlmIChlbC5jbG9zZXN0KEZPUkJJRERFTl9TRVRUSU5HU19TSURFQkFSX1NFTEVDVE9SKSkgcmV0dXJuIHRydWU7XHJcbiAgaWYgKGVsLnF1ZXJ5U2VsZWN0b3IoXCJbZGF0YS1saXN0LW5hdmlnYXRpb24taXRlbT0ndHJ1ZSddLCBbY21kay1pdGVtXVwiKSkgcmV0dXJuIHRydWU7XHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc1NldHRpbmdzU2lkZWJhckNhbmRpZGF0ZShlbDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcclxuICBjb25zdCByZWN0ID0gY29kZXhQcFZpc2libGVCb3goZWwpO1xyXG4gIGlmICghcmVjdCkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAvLyBDdXJyZW50IENvZGV4IFNldHRpbmdzIHNpZGViYXI6IGxlZnQgY29sdW1uLCBub3QgdGhlIG1haW4gY29udGVudCBwYW5lbC5cclxuICBpZiAocmVjdC53aWR0aCA8IDEyMCB8fCByZWN0LndpZHRoID4gNjIwKSByZXR1cm4gZmFsc2U7XHJcbiAgaWYgKHJlY3QuaGVpZ2h0IDwgODApIHJldHVybiBmYWxzZTtcclxuICBpZiAocmVjdC5sZWZ0ID4gd2luZG93LmlubmVyV2lkdGggKiAwLjY1KSByZXR1cm4gZmFsc2U7XHJcblxyXG4gIGNvbnN0IGxhYmVscyA9IGNvZGV4UHBTZXR0aW5nc0xhYmVsc0Zyb20oZWwpO1xyXG4gIGlmIChoYXNNYWluQXBwU2lkZWJhclNpZ25hbHMobGFiZWxzKSAmJiAhaGFzQ29kZXhQcFNldHRpbmdzT25seVNpZ25hbChsYWJlbHMpKSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gaXNDb2RleFBwU2V0dGluZ3NMYWJlbFNldChsYWJlbHMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW1vdmVNaXNwbGFjZWRTZXR0aW5nc0dyb3VwcygpOiB2b2lkIHtcclxuICBjb25zdCBncm91cHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcclxuICAgIFwiW2RhdGEtY29kZXhwcD0nbmF2LWdyb3VwJ10sIFtkYXRhLWNvZGV4cHA9J3BhZ2VzLWdyb3VwJ10sIFtkYXRhLWNvZGV4cHA9J25hdGl2ZS1uYXYtaGVhZGVyJ11cIixcclxuICApO1xyXG4gIGZvciAoY29uc3QgZ3JvdXAgb2YgQXJyYXkuZnJvbShncm91cHMpKSB7XHJcbiAgICBpZiAoaXNDb2RleFBwSW5qZWN0ZWRTZXR0aW5nc0dyb3VwUGxhY2VtZW50VmFsaWQoZ3JvdXApKSBjb250aW51ZTtcclxuICAgIHJlc2V0Q29kZXhQcEluamVjdGVkU2V0dGluZ3NHcm91cFN0YXRlKGdyb3VwKTtcclxuICAgIGdyb3VwLnJlbW92ZSgpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaXNDb2RleFBwSW5qZWN0ZWRTZXR0aW5nc0dyb3VwUGxhY2VtZW50VmFsaWQoZ3JvdXA6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XHJcbiAgaWYgKGlzRm9yYmlkZGVuU2V0dGluZ3NTaWRlYmFyU3VyZmFjZShncm91cCkpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgbGV0IG5vZGUgPSBncm91cC5wYXJlbnRFbGVtZW50O1xyXG4gIGZvciAobGV0IGRlcHRoID0gMDsgbm9kZSAmJiBkZXB0aCA8IDQ7IGRlcHRoKyspIHtcclxuICAgIGlmIChpc0ZvcmJpZGRlblNldHRpbmdzU2lkZWJhclN1cmZhY2Uobm9kZSkpIHJldHVybiBmYWxzZTtcclxuICAgIGlmIChpc1NldHRpbmdzU2lkZWJhckNhbmRpZGF0ZShub2RlKSkgcmV0dXJuIHRydWU7XHJcbiAgICBub2RlID0gbm9kZS5wYXJlbnRFbGVtZW50O1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZXNldENvZGV4UHBJbmplY3RlZFNldHRpbmdzR3JvdXBTdGF0ZShncm91cDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcclxuICBpZiAoc3RhdGUubmF2R3JvdXAgPT09IGdyb3VwIHx8IChzdGF0ZS5uYXZHcm91cCAmJiBncm91cC5jb250YWlucyhzdGF0ZS5uYXZHcm91cCkpKSB7XHJcbiAgICBzdGF0ZS5uYXZHcm91cCA9IG51bGw7XHJcbiAgICBzdGF0ZS5uYXZCdXR0b25zID0gbnVsbDtcclxuICAgIHN0YXRlLmNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b24gPSBudWxsO1xyXG4gIH1cclxuICBpZiAoc3RhdGUucGFnZXNHcm91cCA9PT0gZ3JvdXAgfHwgKHN0YXRlLnBhZ2VzR3JvdXAgJiYgZ3JvdXAuY29udGFpbnMoc3RhdGUucGFnZXNHcm91cCkpKSB7XHJcbiAgICBzdGF0ZS5wYWdlc0dyb3VwID0gbnVsbDtcclxuICAgIHN0YXRlLnBhZ2VzR3JvdXBLZXkgPSBudWxsO1xyXG4gICAgZm9yIChjb25zdCBwIG9mIHN0YXRlLnBhZ2VzLnZhbHVlcygpKSBwLm5hdkJ1dHRvbiA9IG51bGw7XHJcbiAgfVxyXG4gIGlmIChzdGF0ZS5uYXRpdmVOYXZIZWFkZXIgPT09IGdyb3VwIHx8IChzdGF0ZS5uYXRpdmVOYXZIZWFkZXIgJiYgZ3JvdXAuY29udGFpbnMoc3RhdGUubmF0aXZlTmF2SGVhZGVyKSkpIHtcclxuICAgIHN0YXRlLm5hdGl2ZU5hdkhlYWRlciA9IG51bGw7XHJcbiAgfVxyXG4gIGlmIChzdGF0ZS5zaWRlYmFyUm9vdCAmJiBzdGF0ZS5zaWRlYmFyUm9vdC5jb250YWlucyhncm91cCkpIHtcclxuICAgIHN0YXRlLnNpZGViYXJSb290ID0gbnVsbDtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRDb250ZW50QXJlYSgpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICBjb25zdCBzaWRlYmFyID0gZmluZFNpZGViYXJJdGVtc0dyb3VwKCk7XG4gIGlmICghc2lkZWJhcikgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHNpZGViYXJSZWN0ID0gc2lkZWJhci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgY29uc3QgcmV1c2FibGVQYW5lbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KCdbZGF0YS1jb2RleHBwPVwidHdlYWtzLXBhbmVsXCJdJyk7XG4gIGlmIChyZXVzYWJsZVBhbmVsPy5wYXJlbnRFbGVtZW50KSByZXR1cm4gcmV1c2FibGVQYW5lbC5wYXJlbnRFbGVtZW50O1xuXG4gIGNvbnN0IGNhbmRpZGF0ZXM6IEFycmF5PHsgZWw6IEhUTUxFbGVtZW50OyBzY29yZTogbnVtYmVyIH0+ID0gW107XG4gIGxldCBwYXJlbnQgPSBzaWRlYmFyLnBhcmVudEVsZW1lbnQ7XG4gIGxldCBkZXB0aCA9IDA7XG4gIHdoaWxlIChwYXJlbnQgJiYgZGVwdGggPCA4KSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBBcnJheS5mcm9tKHBhcmVudC5jaGlsZHJlbikgYXMgSFRNTEVsZW1lbnRbXSkge1xuICAgICAgaWYgKGNoaWxkID09PSBzaWRlYmFyIHx8IGNoaWxkLmNvbnRhaW5zKHNpZGViYXIpKSBjb250aW51ZTtcbiAgICAgIGlmIChzaWRlYmFyLmNvbnRhaW5zKGNoaWxkKSkgY29udGludWU7XG4gICAgICBjb25zdCByID0gY29kZXhQcFZpc2libGVCb3goY2hpbGQpO1xuICAgICAgaWYgKCFyKSBjb250aW51ZTtcbiAgICAgIGlmIChyLndpZHRoIDwgMzAwIHx8IHIuaGVpZ2h0IDwgMjAwKSBjb250aW51ZTtcblxuICAgICAgLy8gVGhlIHNldHRpbmdzIGNvbnRlbnQgYXJlYSBpcyB0aGUgbGFyZ2UgcGFuZWwgdG8gdGhlIHJpZ2h0IG9mIHRoZVxuICAgICAgLy8gc2V0dGluZ3Mgc2lkZWJhci4gQXZvaWQgc2VsZWN0aW5nIHNjcm9sbC9ibGFuayBzaWJsaW5ncyBpbnNpZGUgdGhlXG4gICAgICAvLyBzaWRlYmFyIGl0c2VsZiwgd2hpY2ggY2F1c2VzIHByb3ZpZGVyIHBhZ2VzIHRvIHJlbmRlciBpbiB0aGUgbGVmdCBuYXYuXG4gICAgICBjb25zdCByaWdodE9mU2lkZWJhciA9IHIubGVmdCA+PSBzaWRlYmFyUmVjdC5yaWdodCAtIDg7XG4gICAgICBjb25zdCBtZWFuaW5nZnVsbHlXaWRlclRoYW5TaWRlYmFyID0gci53aWR0aCA+PSBNYXRoLm1heCgzNjAsIHNpZGViYXJSZWN0LndpZHRoICogMS4wNSk7XG4gICAgICBpZiAoIXJpZ2h0T2ZTaWRlYmFyICYmICFtZWFuaW5nZnVsbHlXaWRlclRoYW5TaWRlYmFyKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgdGV4dCA9IGNvbXBhY3RTZXR0aW5nc1RleHQoY2hpbGQudGV4dENvbnRlbnQgPz8gXCJcIik7XG4gICAgICBjb25zdCBuYXRpdmVTZXR0aW5nc1NpZ25hbCA9IC9cdTVERTVcdTRGNUNcdTZBMjFcdTVGMEZ8XHU2NzQzXHU5NjUwfFx1OUVEOFx1OEJBNFx1Njc0M1x1OTY1MHxcdTVFMzhcdTg5QzR8R2VuZXJhbHxQZXJtaXNzaW9uc3xXb3JrIG1vZGUvaS50ZXN0KHRleHQpID8gNTAwMCA6IDA7XG4gICAgICBjb25zdCByaWdodEJpYXMgPSBNYXRoLm1heCgwLCByLmxlZnQgLSBzaWRlYmFyUmVjdC5sZWZ0KTtcbiAgICAgIGNvbnN0IHNjb3JlID0gbmF0aXZlU2V0dGluZ3NTaWduYWwgKyByaWdodEJpYXMgKyByLndpZHRoICsgci5oZWlnaHQgLSBkZXB0aCAqIDEwMDtcbiAgICAgIGNhbmRpZGF0ZXMucHVzaCh7IGVsOiBjaGlsZCwgc2NvcmUgfSk7XG4gICAgfVxuICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnRFbGVtZW50O1xuICAgIGRlcHRoICs9IDE7XG4gIH1cbiAgY2FuZGlkYXRlcy5zb3J0KChhLCBiKSA9PiBiLnNjb3JlIC0gYS5zY29yZSk7XG4gIHJldHVybiBjYW5kaWRhdGVzWzBdPy5lbCA/PyBudWxsO1xufVxuXHJcbmZ1bmN0aW9uIG1heWJlRHVtcERvbSgpOiB2b2lkIHtcclxuICB0cnkge1xyXG4gICAgY29uc3Qgc2lkZWJhciA9IGZpbmRTaWRlYmFySXRlbXNHcm91cCgpO1xyXG4gICAgaWYgKHNpZGViYXIgJiYgIXN0YXRlLnNpZGViYXJEdW1wZWQpIHtcclxuICAgICAgc3RhdGUuc2lkZWJhckR1bXBlZCA9IHRydWU7XHJcbiAgICAgIGNvbnN0IHNiUm9vdCA9IHNpZGViYXIucGFyZW50RWxlbWVudCA/PyBzaWRlYmFyO1xyXG4gICAgICBwbG9nKGBjb2RleCBzaWRlYmFyIEhUTUxgLCBzYlJvb3Qub3V0ZXJIVE1MLnNsaWNlKDAsIDMyMDAwKSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBjb250ZW50ID0gZmluZENvbnRlbnRBcmVhKCk7XHJcbiAgICBpZiAoIWNvbnRlbnQpIHtcclxuICAgICAgaWYgKHN0YXRlLmZpbmdlcnByaW50ICE9PSBsb2NhdGlvbi5ocmVmKSB7XHJcbiAgICAgICAgc3RhdGUuZmluZ2VycHJpbnQgPSBsb2NhdGlvbi5ocmVmO1xyXG4gICAgICAgIHBsb2coXCJkb20gcHJvYmUgKG5vIGNvbnRlbnQpXCIsIHtcclxuICAgICAgICAgIHVybDogbG9jYXRpb24uaHJlZixcclxuICAgICAgICAgIHNpZGViYXI6IHNpZGViYXIgPyBkZXNjcmliZShzaWRlYmFyKSA6IG51bGwsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgbGV0IHBhbmVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xyXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBBcnJheS5mcm9tKGNvbnRlbnQuY2hpbGRyZW4pIGFzIEhUTUxFbGVtZW50W10pIHtcclxuICAgICAgaWYgKGNoaWxkLmRhdGFzZXQuY29kZXhwcCA9PT0gXCJ0d2Vha3MtcGFuZWxcIikgY29udGludWU7XHJcbiAgICAgIGlmIChjaGlsZC5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIikgY29udGludWU7XHJcbiAgICAgIHBhbmVsID0gY2hpbGQ7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgY29uc3QgYWN0aXZlTmF2ID0gc2lkZWJhclxyXG4gICAgICA/IEFycmF5LmZyb20oc2lkZWJhci5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcImJ1dHRvbiwgYVwiKSkuZmluZChcclxuICAgICAgICAgIChiKSA9PlxyXG4gICAgICAgICAgICBiLmdldEF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiKSA9PT0gXCJwYWdlXCIgfHxcclxuICAgICAgICAgICAgYi5nZXRBdHRyaWJ1dGUoXCJkYXRhLWFjdGl2ZVwiKSA9PT0gXCJ0cnVlXCIgfHxcclxuICAgICAgICAgICAgYi5nZXRBdHRyaWJ1dGUoXCJhcmlhLXNlbGVjdGVkXCIpID09PSBcInRydWVcIiB8fFxyXG4gICAgICAgICAgICBiLmNsYXNzTGlzdC5jb250YWlucyhcImFjdGl2ZVwiKSxcclxuICAgICAgICApXHJcbiAgICAgIDogbnVsbDtcclxuICAgIGNvbnN0IGhlYWRpbmcgPSBwYW5lbD8ucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXHJcbiAgICAgIFwiaDEsIGgyLCBoMywgW2NsYXNzKj0naGVhZGluZyddXCIsXHJcbiAgICApO1xyXG4gICAgY29uc3QgZmluZ2VycHJpbnQgPSBgJHthY3RpdmVOYXY/LnRleHRDb250ZW50ID8/IFwiXCJ9fCR7aGVhZGluZz8udGV4dENvbnRlbnQgPz8gXCJcIn18JHtwYW5lbD8uY2hpbGRyZW4ubGVuZ3RoID8/IDB9YDtcclxuICAgIGlmIChzdGF0ZS5maW5nZXJwcmludCA9PT0gZmluZ2VycHJpbnQpIHJldHVybjtcclxuICAgIHN0YXRlLmZpbmdlcnByaW50ID0gZmluZ2VycHJpbnQ7XHJcbiAgICBwbG9nKFwiZG9tIHByb2JlXCIsIHtcclxuICAgICAgdXJsOiBsb2NhdGlvbi5ocmVmLFxyXG4gICAgICBhY3RpdmVOYXY6IGFjdGl2ZU5hdj8udGV4dENvbnRlbnQ/LnRyaW0oKSA/PyBudWxsLFxyXG4gICAgICBoZWFkaW5nOiBoZWFkaW5nPy50ZXh0Q29udGVudD8udHJpbSgpID8/IG51bGwsXHJcbiAgICAgIGNvbnRlbnQ6IGRlc2NyaWJlKGNvbnRlbnQpLFxyXG4gICAgfSk7XHJcbiAgICBpZiAocGFuZWwpIHtcclxuICAgICAgY29uc3QgaHRtbCA9IHBhbmVsLm91dGVySFRNTDtcclxuICAgICAgcGxvZyhcclxuICAgICAgICBgY29kZXggcGFuZWwgSFRNTCAoJHthY3RpdmVOYXY/LnRleHRDb250ZW50Py50cmltKCkgPz8gXCI/XCJ9KWAsXHJcbiAgICAgICAgaHRtbC5zbGljZSgwLCAzMjAwMCksXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcGxvZyhcImRvbSBwcm9iZSBmYWlsZWRcIiwgU3RyaW5nKGUpKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlc2NyaWJlKGVsOiBIVE1MRWxlbWVudCk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcclxuICByZXR1cm4ge1xyXG4gICAgdGFnOiBlbC50YWdOYW1lLFxyXG4gICAgY2xzOiBlbC5jbGFzc05hbWUuc2xpY2UoMCwgMTIwKSxcclxuICAgIGlkOiBlbC5pZCB8fCB1bmRlZmluZWQsXHJcbiAgICBjaGlsZHJlbjogZWwuY2hpbGRyZW4ubGVuZ3RoLFxyXG4gICAgcmVjdDogKCgpID0+IHtcclxuICAgICAgY29uc3QgciA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICByZXR1cm4geyB3OiBNYXRoLnJvdW5kKHIud2lkdGgpLCBoOiBNYXRoLnJvdW5kKHIuaGVpZ2h0KSB9O1xyXG4gICAgfSkoKSxcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiB0d2Vha3NQYXRoKCk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIChcclxuICAgICh3aW5kb3cgYXMgdW5rbm93biBhcyB7IF9fY29kZXhwcF90d2Vha3NfZGlyX18/OiBzdHJpbmcgfSkuX19jb2RleHBwX3R3ZWFrc19kaXJfXyA/P1xyXG4gICAgXCI8dXNlciBkaXI+L3R3ZWFrc1wiXHJcbiAgKTtcclxufVxyXG4iLCAiLyoqXHJcbiAqIFJlbmRlcmVyLXNpZGUgdHdlYWsgaG9zdC4gV2U6XHJcbiAqICAgMS4gQXNrIG1haW4gZm9yIHRoZSB0d2VhayBsaXN0ICh3aXRoIHJlc29sdmVkIGVudHJ5IHBhdGgpLlxyXG4gKiAgIDIuIEZvciBlYWNoIHJlbmRlcmVyLXNjb3BlZCAob3IgXCJib3RoXCIpIHR3ZWFrLCBmZXRjaCBpdHMgc291cmNlIHZpYSBJUENcclxuICogICAgICBhbmQgZXhlY3V0ZSBpdCBhcyBhIENvbW1vbkpTLXNoYXBlZCBmdW5jdGlvbi5cclxuICogICAzLiBQcm92aWRlIGl0IHRoZSByZW5kZXJlciBoYWxmIG9mIHRoZSBBUEkuXHJcbiAqXHJcbiAqIENvZGV4IHJ1bnMgdGhlIHJlbmRlcmVyIHdpdGggc2FuZGJveDogdHJ1ZSwgc28gTm9kZSdzIGByZXF1aXJlKClgIGlzXHJcbiAqIHJlc3RyaWN0ZWQgdG8gYSB0aW55IHdoaXRlbGlzdCAoZWxlY3Ryb24gKyBhIGZldyBwb2x5ZmlsbHMpLiBUaGF0IG1lYW5zIHdlXHJcbiAqIGNhbm5vdCBgcmVxdWlyZSgpYCBhcmJpdHJhcnkgdHdlYWsgZmlsZXMgZnJvbSBkaXNrLiBJbnN0ZWFkIHdlIHB1bGwgdGhlXHJcbiAqIHNvdXJjZSBzdHJpbmcgZnJvbSBtYWluIGFuZCBldmFsdWF0ZSBpdCB3aXRoIGBuZXcgRnVuY3Rpb25gIGluc2lkZSB0aGVcclxuICogcHJlbG9hZCBjb250ZXh0LiBUd2VhayBhdXRob3JzIHdobyBuZWVkIG5wbSBkZXBzIG11c3QgYnVuZGxlIHRoZW0gaW4uXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgaXBjUmVuZGVyZXIgfSBmcm9tIFwiZWxlY3Ryb25cIjtcclxuaW1wb3J0IHsgcmVnaXN0ZXJTZWN0aW9uLCByZWdpc3RlclBhZ2UsIGNsZWFyU2VjdGlvbnMsIHNldExpc3RlZFR3ZWFrcyB9IGZyb20gXCIuL3NldHRpbmdzLWluamVjdG9yXCI7XHJcbmltcG9ydCB7IGZpYmVyRm9yTm9kZSB9IGZyb20gXCIuL3JlYWN0LWhvb2tcIjtcclxuaW1wb3J0IHR5cGUge1xyXG4gIENvZGV4Q2RwU3RhdHVzLFxyXG4gIENvZGV4Q2RwVGFyZ2V0LFxyXG4gIENvZGV4UnVudGltZUNhcGFiaWxpdGllcyxcclxuICBDb2RleFJ1bnRpbWVJbmZvLFxyXG4gIENvZGV4Vmlld1JlZixcclxuICBDb2RleFdpbmRvd1JlZixcclxuICBOYXRpdmVIZWxwZXJMYXVuY2hPcHRpb25zLFxyXG4gIE5hdGl2ZUhlbHBlclJlZixcclxuICBOYXRpdmVNb2R1bGVLaW5kLFxyXG4gIE5hdGl2ZU1vZHVsZUxvYWRPcHRpb25zLFxyXG4gIE5hdGl2ZU1vZHVsZVJlZixcclxuICBOYXRpdmVQYW5lbENyZWF0ZU9wdGlvbnMsXHJcbiAgTmF0aXZlUGFuZWxSZWYsXHJcbiAgTmF0aXZlVmlld0F0dGFjaE9wdGlvbnMsXHJcbiAgTmF0aXZlVmlld1JlZixcclxuICBUd2Vha01hbmlmZXN0LFxyXG4gIFR3ZWFrQXBpLFxyXG4gIFJlYWN0RmliZXJOb2RlLFxyXG4gIFR3ZWFrLFxyXG59IGZyb20gXCJAY29kZXgtcGx1c3BsdXMvc2RrXCI7XHJcblxyXG5pbnRlcmZhY2UgTGlzdGVkVHdlYWsge1xyXG4gIG1hbmlmZXN0OiBUd2Vha01hbmlmZXN0O1xyXG4gIGVudHJ5OiBzdHJpbmc7XHJcbiAgZGlyOiBzdHJpbmc7XHJcbiAgZW50cnlFeGlzdHM6IGJvb2xlYW47XHJcbiAgZW5hYmxlZDogYm9vbGVhbjtcclxuICB1cGRhdGU6IHtcclxuICAgIGNoZWNrZWRBdDogc3RyaW5nO1xyXG4gICAgcmVwbzogc3RyaW5nO1xyXG4gICAgY3VycmVudFZlcnNpb246IHN0cmluZztcclxuICAgIGxhdGVzdFZlcnNpb246IHN0cmluZyB8IG51bGw7XHJcbiAgICBsYXRlc3RUYWc6IHN0cmluZyB8IG51bGw7XHJcbiAgICByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsO1xyXG4gICAgdXBkYXRlQXZhaWxhYmxlOiBib29sZWFuO1xyXG4gICAgZXJyb3I/OiBzdHJpbmc7XHJcbiAgfSB8IG51bGw7XHJcbn1cclxuXHJcbmludGVyZmFjZSBVc2VyUGF0aHMge1xyXG4gIHVzZXJSb290OiBzdHJpbmc7XHJcbiAgcnVudGltZURpcjogc3RyaW5nO1xyXG4gIHR3ZWFrc0Rpcjogc3RyaW5nO1xyXG4gIGxvZ0Rpcjogc3RyaW5nO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgRWxlY3Ryb25CcmlkZ2Uge1xyXG4gIGdldEJ1aWxkRmxhdm9yPzogKCkgPT4gc3RyaW5nIHwgbnVsbDtcclxuICB1c2VzT3dsQXBwU2hlbGw/OiAoKSA9PiBib29sZWFuO1xyXG59XHJcblxyXG5jb25zdCBsb2FkZWQgPSBuZXcgTWFwPHN0cmluZywgeyBzdG9wPzogKCkgPT4gdm9pZCB9PigpO1xyXG5sZXQgY2FjaGVkUGF0aHM6IFVzZXJQYXRocyB8IG51bGwgPSBudWxsO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0YXJ0VHdlYWtIb3N0KCk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IHR3ZWFrcyA9IChhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmxpc3QtdHdlYWtzXCIpKSBhcyBMaXN0ZWRUd2Vha1tdO1xyXG4gIGNvbnN0IHBhdGhzID0gKGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6dXNlci1wYXRoc1wiKSkgYXMgVXNlclBhdGhzO1xyXG4gIGNhY2hlZFBhdGhzID0gcGF0aHM7XHJcbiAgLy8gUHVzaCB0aGUgbGlzdCB0byB0aGUgc2V0dGluZ3MgaW5qZWN0b3Igc28gdGhlIFR3ZWFrcyBwYWdlIGNhbiByZW5kZXJcclxuICAvLyBjYXJkcyBldmVuIGJlZm9yZSBhbnkgdHdlYWsncyBzdGFydCgpIHJ1bnMgKGFuZCBmb3IgZGlzYWJsZWQgdHdlYWtzXHJcbiAgLy8gdGhhdCB3ZSBuZXZlciBsb2FkKS5cclxuICBzZXRMaXN0ZWRUd2Vha3ModHdlYWtzKTtcclxuICAvLyBTdGFzaCBmb3IgdGhlIHNldHRpbmdzIGluamVjdG9yJ3MgZW1wdHktc3RhdGUgbWVzc2FnZS5cclxuICAod2luZG93IGFzIHVua25vd24gYXMgeyBfX2NvZGV4cHBfdHdlYWtzX2Rpcl9fPzogc3RyaW5nIH0pLl9fY29kZXhwcF90d2Vha3NfZGlyX18gPVxyXG4gICAgcGF0aHMudHdlYWtzRGlyO1xyXG5cclxuICBmb3IgKGNvbnN0IHQgb2YgdHdlYWtzKSB7XHJcbiAgICBpZiAodC5tYW5pZmVzdC5zY29wZSA9PT0gXCJtYWluXCIpIGNvbnRpbnVlO1xyXG4gICAgaWYgKCF0LmVudHJ5RXhpc3RzKSBjb250aW51ZTtcclxuICAgIGlmICghdC5lbmFibGVkKSBjb250aW51ZTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGxvYWRUd2Vhayh0LCBwYXRocyk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJbY29kZXgtcGx1c3BsdXNdIHR3ZWFrIGxvYWQgZmFpbGVkOlwiLCB0Lm1hbmlmZXN0LmlkLCBlKTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBpcGNSZW5kZXJlci5zZW5kKFxyXG4gICAgICAgICAgXCJjb2RleHBwOnByZWxvYWQtbG9nXCIsXHJcbiAgICAgICAgICBcImVycm9yXCIsXHJcbiAgICAgICAgICBcInR3ZWFrIGxvYWQgZmFpbGVkOiBcIiArIHQubWFuaWZlc3QuaWQgKyBcIjogXCIgKyBTdHJpbmcoKGUgYXMgRXJyb3IpPy5zdGFjayA/PyBlKSxcclxuICAgICAgICApO1xyXG4gICAgICB9IGNhdGNoIHt9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zb2xlLmluZm8oXHJcbiAgICBgW2NvZGV4LXBsdXNwbHVzXSByZW5kZXJlciBob3N0IGxvYWRlZCAke2xvYWRlZC5zaXplfSB0d2VhayhzKTpgLFxyXG4gICAgWy4uLmxvYWRlZC5rZXlzKCldLmpvaW4oXCIsIFwiKSB8fCBcIihub25lKVwiLFxyXG4gICk7XHJcbiAgaXBjUmVuZGVyZXIuc2VuZChcclxuICAgIFwiY29kZXhwcDpwcmVsb2FkLWxvZ1wiLFxyXG4gICAgXCJpbmZvXCIsXHJcbiAgICBgcmVuZGVyZXIgaG9zdCBsb2FkZWQgJHtsb2FkZWQuc2l6ZX0gdHdlYWsocyk6ICR7Wy4uLmxvYWRlZC5rZXlzKCldLmpvaW4oXCIsIFwiKSB8fCBcIihub25lKVwifWAsXHJcbiAgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFN0b3AgZXZlcnkgcmVuZGVyZXItc2NvcGUgdHdlYWsgc28gYSBzdWJzZXF1ZW50IGBzdGFydFR3ZWFrSG9zdCgpYCB3aWxsXHJcbiAqIHJlLWV2YWx1YXRlIGZyZXNoIHNvdXJjZS4gTW9kdWxlIGNhY2hlIGlzbid0IHJlbGV2YW50IHNpbmNlIHdlIGV2YWxcclxuICogc291cmNlIHN0cmluZ3MgZGlyZWN0bHkgXHUyMDE0IGVhY2ggbG9hZCBjcmVhdGVzIGEgZnJlc2ggc2NvcGUuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdGVhcmRvd25Ud2Vha0hvc3QoKTogdm9pZCB7XHJcbiAgZm9yIChjb25zdCBbaWQsIHRdIG9mIGxvYWRlZCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgdC5zdG9wPy4oKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgY29uc29sZS53YXJuKFwiW2NvZGV4LXBsdXNwbHVzXSB0d2VhayBzdG9wIGZhaWxlZDpcIiwgaWQsIGUpO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXZpZXctZGlzcG9zZS10d2Vha1wiLCBpZCkuY2F0Y2goKCkgPT4ge30pO1xyXG4gICAgICB2b2lkIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6bmF0aXZlLWRpc3Bvc2UtdHdlYWtcIiwgaWQpLmNhdGNoKCgpID0+IHt9KTtcclxuICAgIH1cclxuICB9XHJcbiAgbG9hZGVkLmNsZWFyKCk7XHJcbiAgY2xlYXJTZWN0aW9ucygpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBsb2FkVHdlYWsodDogTGlzdGVkVHdlYWssIHBhdGhzOiBVc2VyUGF0aHMpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBzb3VyY2UgPSAoYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFxyXG4gICAgXCJjb2RleHBwOnJlYWQtdHdlYWstc291cmNlXCIsXHJcbiAgICB0LmVudHJ5LFxyXG4gICkpIGFzIHN0cmluZztcclxuXHJcbiAgLy8gRXZhbHVhdGUgYXMgQ0pTLXNoYXBlZDogcHJvdmlkZSBtb2R1bGUvZXhwb3J0cy9hcGkuIFR3ZWFrIGNvZGUgbWF5IHVzZVxyXG4gIC8vIGBtb2R1bGUuZXhwb3J0cyA9IHsgc3RhcnQsIHN0b3AgfWAgb3IgYGV4cG9ydHMuc3RhcnQgPSAuLi5gIG9yIHB1cmUgRVNNXHJcbiAgLy8gZGVmYXVsdCBleHBvcnQgc2hhcGUgKHdlIGFjY2VwdCBib3RoKS5cclxuICBjb25zdCBtb2R1bGUgPSB7IGV4cG9ydHM6IHt9IGFzIHsgZGVmYXVsdD86IFR3ZWFrIH0gJiBUd2VhayB9O1xyXG4gIGNvbnN0IGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cztcclxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWltcGxpZWQtZXZhbCwgbm8tbmV3LWZ1bmNcclxuICBjb25zdCBmbiA9IG5ldyBGdW5jdGlvbihcclxuICAgIFwibW9kdWxlXCIsXHJcbiAgICBcImV4cG9ydHNcIixcclxuICAgIFwiY29uc29sZVwiLFxyXG4gICAgYCR7c291cmNlfVxcbi8vIyBzb3VyY2VVUkw9Y29kZXhwcC10d2VhazovLyR7ZW5jb2RlVVJJQ29tcG9uZW50KHQubWFuaWZlc3QuaWQpfS8ke2VuY29kZVVSSUNvbXBvbmVudCh0LmVudHJ5KX1gLFxyXG4gICk7XHJcbiAgZm4obW9kdWxlLCBleHBvcnRzLCBjb25zb2xlKTtcclxuICBjb25zdCBtb2QgPSBtb2R1bGUuZXhwb3J0cyBhcyB7IGRlZmF1bHQ/OiBUd2VhayB9ICYgVHdlYWs7XHJcbiAgY29uc3QgdHdlYWs6IFR3ZWFrID0gKG1vZCBhcyB7IGRlZmF1bHQ/OiBUd2VhayB9KS5kZWZhdWx0ID8/IChtb2QgYXMgVHdlYWspO1xyXG4gIGlmICh0eXBlb2YgdHdlYWs/LnN0YXJ0ICE9PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgdHdlYWsgJHt0Lm1hbmlmZXN0LmlkfSBoYXMgbm8gc3RhcnQoKWApO1xyXG4gIH1cclxuICBjb25zdCBhcGkgPSBtYWtlUmVuZGVyZXJBcGkodC5tYW5pZmVzdCwgcGF0aHMpO1xyXG4gIGF3YWl0IHR3ZWFrLnN0YXJ0KGFwaSk7XHJcbiAgbG9hZGVkLnNldCh0Lm1hbmlmZXN0LmlkLCB7IHN0b3A6IHR3ZWFrLnN0b3A/LmJpbmQodHdlYWspIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWtlUmVuZGVyZXJBcGkobWFuaWZlc3Q6IFR3ZWFrTWFuaWZlc3QsIHBhdGhzOiBVc2VyUGF0aHMpOiBUd2Vha0FwaSB7XHJcbiAgY29uc3QgaWQgPSBtYW5pZmVzdC5pZDtcclxuICBjb25zdCBsb2cgPSAobGV2ZWw6IFwiZGVidWdcIiB8IFwiaW5mb1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCIsIC4uLmE6IHVua25vd25bXSkgPT4ge1xyXG4gICAgY29uc3QgY29uc29sZUZuID1cclxuICAgICAgbGV2ZWwgPT09IFwiZGVidWdcIiA/IGNvbnNvbGUuZGVidWdcclxuICAgICAgOiBsZXZlbCA9PT0gXCJ3YXJuXCIgPyBjb25zb2xlLndhcm5cclxuICAgICAgOiBsZXZlbCA9PT0gXCJlcnJvclwiID8gY29uc29sZS5lcnJvclxyXG4gICAgICA6IGNvbnNvbGUubG9nO1xyXG4gICAgY29uc29sZUZuKGBbY29kZXgtcGx1c3BsdXNdWyR7aWR9XWAsIC4uLmEpO1xyXG4gICAgLy8gQWxzbyBtaXJyb3IgdG8gbWFpbidzIGxvZyBmaWxlIHNvIHdlIGNhbiBkaWFnbm9zZSB0d2VhayBiZWhhdmlvclxyXG4gICAgLy8gd2l0aG91dCBhdHRhY2hpbmcgRGV2VG9vbHMuIFN0cmluZ2lmeSBlYWNoIGFyZyBkZWZlbnNpdmVseS5cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHBhcnRzID0gYS5tYXAoKHYpID0+IHtcclxuICAgICAgICBpZiAodHlwZW9mIHYgPT09IFwic3RyaW5nXCIpIHJldHVybiB2O1xyXG4gICAgICAgIGlmICh2IGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiBgJHt2Lm5hbWV9OiAke3YubWVzc2FnZX1gO1xyXG4gICAgICAgIHRyeSB7IHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTsgfSBjYXRjaCB7IHJldHVybiBTdHJpbmcodik7IH1cclxuICAgICAgfSk7XHJcbiAgICAgIGlwY1JlbmRlcmVyLnNlbmQoXHJcbiAgICAgICAgXCJjb2RleHBwOnByZWxvYWQtbG9nXCIsXHJcbiAgICAgICAgbGV2ZWwsXHJcbiAgICAgICAgYFt0d2VhayAke2lkfV0gJHtwYXJ0cy5qb2luKFwiIFwiKX1gLFxyXG4gICAgICApO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIC8qIHN3YWxsb3cgXHUyMDE0IG5ldmVyIGxldCBsb2dnaW5nIGJyZWFrIGEgdHdlYWsgKi9cclxuICAgIH1cclxuICB9O1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgbWFuaWZlc3QsXHJcbiAgICBwcm9jZXNzOiBcInJlbmRlcmVyXCIsXHJcbiAgICBsb2c6IHtcclxuICAgICAgZGVidWc6ICguLi5hKSA9PiBsb2coXCJkZWJ1Z1wiLCAuLi5hKSxcclxuICAgICAgaW5mbzogKC4uLmEpID0+IGxvZyhcImluZm9cIiwgLi4uYSksXHJcbiAgICAgIHdhcm46ICguLi5hKSA9PiBsb2coXCJ3YXJuXCIsIC4uLmEpLFxyXG4gICAgICBlcnJvcjogKC4uLmEpID0+IGxvZyhcImVycm9yXCIsIC4uLmEpLFxyXG4gICAgfSxcclxuICAgIHN0b3JhZ2U6IHJlbmRlcmVyU3RvcmFnZShpZCksXHJcbiAgICBzZXR0aW5nczoge1xyXG4gICAgICByZWdpc3RlcjogKHMpID0+IHJlZ2lzdGVyU2VjdGlvbih7IC4uLnMsIGlkOiBgJHtpZH06JHtzLmlkfWAgfSksXHJcbiAgICAgIHJlZ2lzdGVyUGFnZTogKHApID0+XHJcbiAgICAgICAgcmVnaXN0ZXJQYWdlKGlkLCBtYW5pZmVzdCwgeyAuLi5wLCBpZDogYCR7aWR9OiR7cC5pZH1gIH0pLFxyXG4gICAgfSxcclxuICAgIHJlYWN0OiB7XHJcbiAgICAgIGdldEZpYmVyOiAobikgPT4gZmliZXJGb3JOb2RlKG4pIGFzIFJlYWN0RmliZXJOb2RlIHwgbnVsbCxcclxuICAgICAgZmluZE93bmVyQnlOYW1lOiAobiwgbmFtZSkgPT4ge1xyXG4gICAgICAgIGxldCBmID0gZmliZXJGb3JOb2RlKG4pIGFzIFJlYWN0RmliZXJOb2RlIHwgbnVsbDtcclxuICAgICAgICB3aGlsZSAoZikge1xyXG4gICAgICAgICAgY29uc3QgdCA9IGYudHlwZSBhcyB7IGRpc3BsYXlOYW1lPzogc3RyaW5nOyBuYW1lPzogc3RyaW5nIH0gfCBudWxsO1xyXG4gICAgICAgICAgaWYgKHQgJiYgKHQuZGlzcGxheU5hbWUgPT09IG5hbWUgfHwgdC5uYW1lID09PSBuYW1lKSkgcmV0dXJuIGY7XHJcbiAgICAgICAgICBmID0gZi5yZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9LFxyXG4gICAgICB3YWl0Rm9yRWxlbWVudDogKHNlbCwgdGltZW91dE1zID0gNTAwMCkgPT5cclxuICAgICAgICBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBleGlzdGluZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsKTtcclxuICAgICAgICAgIGlmIChleGlzdGluZykgcmV0dXJuIHJlc29sdmUoZXhpc3RpbmcpO1xyXG4gICAgICAgICAgY29uc3QgZGVhZGxpbmUgPSBEYXRlLm5vdygpICsgdGltZW91dE1zO1xyXG4gICAgICAgICAgY29uc3Qgb2JzID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsKTtcclxuICAgICAgICAgICAgaWYgKGVsKSB7XHJcbiAgICAgICAgICAgICAgb2JzLmRpc2Nvbm5lY3QoKTtcclxuICAgICAgICAgICAgICByZXNvbHZlKGVsKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChEYXRlLm5vdygpID4gZGVhZGxpbmUpIHtcclxuICAgICAgICAgICAgICBvYnMuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYHRpbWVvdXQgd2FpdGluZyBmb3IgJHtzZWx9YCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIG9icy5vYnNlcnZlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgeyBjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWUgfSk7XHJcbiAgICAgICAgfSksXHJcbiAgICB9LFxyXG4gICAgaXBjOiB7XHJcbiAgICAgIG9uOiAoYywgaCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHdyYXBwZWQgPSAoX2U6IHVua25vd24sIC4uLmFyZ3M6IHVua25vd25bXSkgPT4gaCguLi5hcmdzKTtcclxuICAgICAgICBpcGNSZW5kZXJlci5vbihgY29kZXhwcDoke2lkfToke2N9YCwgd3JhcHBlZCk7XHJcbiAgICAgICAgcmV0dXJuICgpID0+IGlwY1JlbmRlcmVyLnJlbW92ZUxpc3RlbmVyKGBjb2RleHBwOiR7aWR9OiR7Y31gLCB3cmFwcGVkKTtcclxuICAgICAgfSxcclxuICAgICAgc2VuZDogKGMsIC4uLmFyZ3MpID0+IGlwY1JlbmRlcmVyLnNlbmQoYGNvZGV4cHA6JHtpZH06JHtjfWAsIC4uLmFyZ3MpLFxyXG4gICAgICBpbnZva2U6IDxUPihjOiBzdHJpbmcsIC4uLmFyZ3M6IHVua25vd25bXSkgPT5cclxuICAgICAgICBpcGNSZW5kZXJlci5pbnZva2UoYGNvZGV4cHA6JHtpZH06JHtjfWAsIC4uLmFyZ3MpIGFzIFByb21pc2U8VD4sXHJcbiAgICB9LFxyXG4gICAgZnM6IHJlbmRlcmVyRnMoaWQsIHBhdGhzKSxcclxuICAgIGNvZGV4OiByZW5kZXJlckNvZGV4QXBpKGlkKSxcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJlckNvZGV4QXBpKHR3ZWFrSWQ6IHN0cmluZyk6IE5vbk51bGxhYmxlPFR3ZWFrQXBpW1wiY29kZXhcIl0+IHtcclxuICByZXR1cm4ge1xyXG4gICAgcnVudGltZToge1xyXG4gICAgICBnZXRJbmZvOiBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtcnVudGltZS1pbmZvXCIpIGFzIENvZGV4UnVudGltZUluZm87XHJcbiAgICAgICAgY29uc3QgYnJpZGdlID0gcmVuZGVyZXJFbGVjdHJvbkJyaWRnZSgpO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAuLi5pbmZvLFxyXG4gICAgICAgICAgYnVpbGRGbGF2b3I6IGJyaWRnZT8uZ2V0QnVpbGRGbGF2b3I/LigpID8/IGluZm8uYnVpbGRGbGF2b3IsXHJcbiAgICAgICAgICB1c2VzT3dsQXBwU2hlbGw6IGJyaWRnZT8udXNlc093bEFwcFNoZWxsPy4oKSA/PyBpbmZvLnVzZXNPd2xBcHBTaGVsbCxcclxuICAgICAgICB9O1xyXG4gICAgICB9LFxyXG4gICAgICBnZXRDYXBhYmlsaXRpZXM6ICgpID0+XHJcbiAgICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpjb2RleC1ydW50aW1lLWNhcGFiaWxpdGllc1wiKSBhcyBQcm9taXNlPENvZGV4UnVudGltZUNhcGFiaWxpdGllcz4sXHJcbiAgICB9LFxyXG4gICAgd2luZG93czoge1xyXG4gICAgICBjcmVhdGU6IChvcHRpb25zKSA9PlxyXG4gICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtd2luZG93LWNyZWF0ZVwiLCBvcHRpb25zKSBhcyBQcm9taXNlPENvZGV4V2luZG93UmVmPixcclxuICAgICAgZ2V0UHJpbWFyeTogKCkgPT5cclxuICAgICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXdpbmRvdy1wcmltYXJ5XCIpIGFzIFByb21pc2U8Q29kZXhXaW5kb3dSZWYgfCBudWxsPixcclxuICAgICAgZm9jdXM6ICh3aW5kb3dJZCkgPT5cclxuICAgICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXdpbmRvdy1mb2N1c1wiLCB3aW5kb3dJZCkgYXMgUHJvbWlzZTxib29sZWFuPixcclxuICAgICAgc2hvdzogKHdpbmRvd0lkKSA9PlxyXG4gICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtd2luZG93LXNob3dcIiwgd2luZG93SWQpIGFzIFByb21pc2U8Ym9vbGVhbj4sXHJcbiAgICB9LFxyXG4gICAgdmlld3M6IHtcclxuICAgICAgY3JlYXRlOiBhc3luYyAob3B0aW9ucykgPT4ge1xyXG4gICAgICAgIGNvbnN0IHJlZiA9IGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcclxuICAgICAgICAgIFwiY29kZXhwcDpjb2RleC12aWV3LWNyZWF0ZVwiLFxyXG4gICAgICAgICAgdHdlYWtJZCxcclxuICAgICAgICAgIG9wdGlvbnMsXHJcbiAgICAgICAgKSBhcyB7IGlkOiBzdHJpbmc7IHdlYkNvbnRlbnRzSWQ6IG51bWJlcjsgcGFyZW50V2luZG93SWQ6IG51bWJlciB8IG51bGwgfTtcclxuICAgICAgICByZXR1cm4gcmVuZGVyZXJDb2RleFZpZXdSZWYodHdlYWtJZCwgcmVmLmlkLCByZWYud2ViQ29udGVudHNJZCwgcmVmLnBhcmVudFdpbmRvd0lkKTtcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBjZHA6IHtcclxuICAgICAgZ2V0U3RhdHVzOiAoKSA9PlxyXG4gICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtY2RwLXN0YXR1c1wiKSBhcyBQcm9taXNlPENvZGV4Q2RwU3RhdHVzPixcclxuICAgICAgbGlzdFRhcmdldHM6ICgpID0+XHJcbiAgICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpjb2RleC1jZHAtdGFyZ2V0c1wiKSBhcyBQcm9taXNlPENvZGV4Q2RwVGFyZ2V0W10+LFxyXG4gICAgfSxcclxuICAgIG5hdGl2ZToge1xyXG4gICAgICBsb2FkTW9kdWxlOiBhc3luYyAob3B0aW9ucykgPT4ge1xyXG4gICAgICAgIGNvbnN0IHJlZiA9IGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcclxuICAgICAgICAgIFwiY29kZXhwcDpuYXRpdmUtbG9hZC1tb2R1bGVcIixcclxuICAgICAgICAgIHR3ZWFrSWQsXHJcbiAgICAgICAgICBvcHRpb25zLFxyXG4gICAgICAgICkgYXMgeyBpZDogc3RyaW5nOyBraW5kOiBOYXRpdmVNb2R1bGVLaW5kIH07XHJcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyTmF0aXZlTW9kdWxlUmVmKHR3ZWFrSWQsIHJlZi5pZCwgcmVmLmtpbmQpO1xyXG4gICAgICB9LFxyXG4gICAgICBjcmVhdGVQYW5lbDogYXN5bmMgKG9wdGlvbnMpID0+IHtcclxuICAgICAgICBjb25zdCByZWYgPSBhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXHJcbiAgICAgICAgICBcImNvZGV4cHA6bmF0aXZlLWNyZWF0ZS1wYW5lbFwiLFxyXG4gICAgICAgICAgdHdlYWtJZCxcclxuICAgICAgICAgIG9wdGlvbnMsXHJcbiAgICAgICAgKSBhcyB7IGlkOiBzdHJpbmc7IHdpbmRvd0lkOiBudW1iZXIgfCBudWxsIH07XHJcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyTmF0aXZlUGFuZWxSZWYodHdlYWtJZCwgcmVmLmlkLCByZWYud2luZG93SWQpO1xyXG4gICAgICB9LFxyXG4gICAgICBhdHRhY2hWaWV3OiBhc3luYyAob3B0aW9ucykgPT4ge1xyXG4gICAgICAgIGNvbnN0IHJlZiA9IGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcclxuICAgICAgICAgIFwiY29kZXhwcDpuYXRpdmUtYXR0YWNoLXZpZXdcIixcclxuICAgICAgICAgIHR3ZWFrSWQsXHJcbiAgICAgICAgICBvcHRpb25zLFxyXG4gICAgICAgICkgYXMgeyBpZDogc3RyaW5nIH07XHJcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyTmF0aXZlVmlld1JlZih0d2Vha0lkLCByZWYuaWQpO1xyXG4gICAgICB9LFxyXG4gICAgICBsYXVuY2hIZWxwZXI6IGFzeW5jIChvcHRpb25zKSA9PiB7XHJcbiAgICAgICAgY29uc3QgcmVmID0gYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFxyXG4gICAgICAgICAgXCJjb2RleHBwOm5hdGl2ZS1sYXVuY2gtaGVscGVyXCIsXHJcbiAgICAgICAgICB0d2Vha0lkLFxyXG4gICAgICAgICAgb3B0aW9ucyxcclxuICAgICAgICApIGFzIHsgaWQ6IHN0cmluZzsgcGlkOiBudW1iZXIgfTtcclxuICAgICAgICByZXR1cm4gcmVuZGVyZXJOYXRpdmVIZWxwZXJSZWYodHdlYWtJZCwgcmVmLmlkLCByZWYucGlkKTtcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBjcmVhdGVCcm93c2VyVmlldzogKF9vcHRpb25zKSA9PiB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImFwaS5jb2RleC5jcmVhdGVCcm93c2VyVmlldyBpcyBtYWluLW9ubHk7IHVzZSBhIG1haW4tc2NvcGVkIHR3ZWFrXCIpO1xyXG4gICAgfSxcclxuICAgIGNyZWF0ZVdpbmRvdzogKG9wdGlvbnMpID0+XHJcbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtd2luZG93LWNyZWF0ZVwiLCBvcHRpb25zKSBhcyBQcm9taXNlPENvZGV4V2luZG93UmVmPixcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJlckNvZGV4Vmlld1JlZihcclxuICB0d2Vha0lkOiBzdHJpbmcsXHJcbiAgaWQ6IHN0cmluZyxcclxuICB3ZWJDb250ZW50c0lkOiBudW1iZXIsXHJcbiAgcGFyZW50V2luZG93SWQ6IG51bWJlciB8IG51bGwsXHJcbik6IENvZGV4Vmlld1JlZiB7XHJcbiAgcmV0dXJuIHtcclxuICAgIGlkLFxyXG4gICAgd2ViQ29udGVudHNJZCxcclxuICAgIHBhcmVudFdpbmRvd0lkLFxyXG4gICAgc2V0Qm91bmRzOiAoYm91bmRzKSA9PlxyXG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXZpZXctY2FsbFwiLCB0d2Vha0lkLCBpZCwgXCJzZXRCb3VuZHNcIiwgYm91bmRzKSBhcyBQcm9taXNlPHZvaWQ+LFxyXG4gICAgc2V0VmlzaWJsZTogKHZpc2libGUpID0+XHJcbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtdmlldy1jYWxsXCIsIHR3ZWFrSWQsIGlkLCBcInNldFZpc2libGVcIiwgdmlzaWJsZSkgYXMgUHJvbWlzZTx2b2lkPixcclxuICAgIGJyaW5nVG9Gcm9udDogKCkgPT5cclxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpjb2RleC12aWV3LWNhbGxcIiwgdHdlYWtJZCwgaWQsIFwiYnJpbmdUb0Zyb250XCIpIGFzIFByb21pc2U8dm9pZD4sXHJcbiAgICBsb2FkUm91dGU6IChyb3V0ZSwgaG9zdElkKSA9PlxyXG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXZpZXctY2FsbFwiLCB0d2Vha0lkLCBpZCwgXCJsb2FkUm91dGVcIiwgcm91dGUsIGhvc3RJZCkgYXMgUHJvbWlzZTx2b2lkPixcclxuICAgIGxvYWRVcmw6ICh1cmwpID0+XHJcbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtdmlldy1jYWxsXCIsIHR3ZWFrSWQsIGlkLCBcImxvYWRVcmxcIiwgdXJsKSBhcyBQcm9taXNlPHZvaWQ+LFxyXG4gICAgZGlzcG9zZTogKCkgPT5cclxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpjb2RleC12aWV3LWNhbGxcIiwgdHdlYWtJZCwgaWQsIFwiZGlzcG9zZVwiKSBhcyBQcm9taXNlPHZvaWQ+LFxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlcmVyTmF0aXZlTW9kdWxlUmVmKFxyXG4gIHR3ZWFrSWQ6IHN0cmluZyxcclxuICBpZDogc3RyaW5nLFxyXG4gIGtpbmQ6IE5hdGl2ZU1vZHVsZUtpbmQsXHJcbik6IE5hdGl2ZU1vZHVsZVJlZiB7XHJcbiAgcmV0dXJuIHtcclxuICAgIGlkLFxyXG4gICAga2luZCxcclxuICAgIHJlcXVlc3Q6IChtZXRob2QsIHBheWxvYWQsIHRpbWVvdXRNcykgPT5cclxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFxyXG4gICAgICAgIFwiY29kZXhwcDpuYXRpdmUtbW9kdWxlLXJlcXVlc3RcIixcclxuICAgICAgICB0d2Vha0lkLFxyXG4gICAgICAgIGlkLFxyXG4gICAgICAgIG1ldGhvZCxcclxuICAgICAgICBwYXlsb2FkLFxyXG4gICAgICAgIHRpbWVvdXRNcyxcclxuICAgICAgKSxcclxuICAgIGRpc3Bvc2U6ICgpID0+XHJcbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6bmF0aXZlLW1vZHVsZS1kaXNwb3NlXCIsIHR3ZWFrSWQsIGlkKSBhcyBQcm9taXNlPHZvaWQ+LFxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlcmVyTmF0aXZlUGFuZWxSZWYodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nLCB3aW5kb3dJZDogbnVtYmVyIHwgbnVsbCk6IE5hdGl2ZVBhbmVsUmVmIHtcclxuICByZXR1cm4ge1xyXG4gICAgaWQsXHJcbiAgICB3aW5kb3dJZCxcclxuICAgIHNldEJvdW5kczogKGJvdW5kcykgPT5cclxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpuYXRpdmUtaW5zdGFuY2UtY2FsbFwiLCB0d2Vha0lkLCBcInBhbmVsXCIsIGlkLCBcInNldEJvdW5kc1wiLCBib3VuZHMpIGFzIFByb21pc2U8dm9pZD4sXHJcbiAgICBzaG93OiAoKSA9PlxyXG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm5hdGl2ZS1pbnN0YW5jZS1jYWxsXCIsIHR3ZWFrSWQsIFwicGFuZWxcIiwgaWQsIFwic2hvd1wiKSBhcyBQcm9taXNlPHZvaWQ+LFxyXG4gICAgaGlkZTogKCkgPT5cclxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpuYXRpdmUtaW5zdGFuY2UtY2FsbFwiLCB0d2Vha0lkLCBcInBhbmVsXCIsIGlkLCBcImhpZGVcIikgYXMgUHJvbWlzZTx2b2lkPixcclxuICAgIGRpc3Bvc2U6ICgpID0+XHJcbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6bmF0aXZlLWluc3RhbmNlLWNhbGxcIiwgdHdlYWtJZCwgXCJwYW5lbFwiLCBpZCwgXCJkaXNwb3NlXCIpIGFzIFByb21pc2U8dm9pZD4sXHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyZXJOYXRpdmVWaWV3UmVmKHR3ZWFrSWQ6IHN0cmluZywgaWQ6IHN0cmluZyk6IE5hdGl2ZVZpZXdSZWYge1xyXG4gIHJldHVybiB7XHJcbiAgICBpZCxcclxuICAgIHNldEJvdW5kczogKGJvdW5kcykgPT5cclxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpuYXRpdmUtaW5zdGFuY2UtY2FsbFwiLCB0d2Vha0lkLCBcInZpZXdcIiwgaWQsIFwic2V0Qm91bmRzXCIsIGJvdW5kcykgYXMgUHJvbWlzZTx2b2lkPixcclxuICAgIHNldFZpc2libGU6ICh2aXNpYmxlKSA9PlxyXG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm5hdGl2ZS1pbnN0YW5jZS1jYWxsXCIsIHR3ZWFrSWQsIFwidmlld1wiLCBpZCwgXCJzZXRWaXNpYmxlXCIsIHZpc2libGUpIGFzIFByb21pc2U8dm9pZD4sXHJcbiAgICBkaXNwb3NlOiAoKSA9PlxyXG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm5hdGl2ZS1pbnN0YW5jZS1jYWxsXCIsIHR3ZWFrSWQsIFwidmlld1wiLCBpZCwgXCJkaXNwb3NlXCIpIGFzIFByb21pc2U8dm9pZD4sXHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyZXJOYXRpdmVIZWxwZXJSZWYodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nLCBwaWQ6IG51bWJlcik6IE5hdGl2ZUhlbHBlclJlZiB7XHJcbiAgcmV0dXJuIHtcclxuICAgIGlkLFxyXG4gICAgcGlkLFxyXG4gICAgc2VuZDogKG1lc3NhZ2UpID0+XHJcbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6bmF0aXZlLWhlbHBlci1jYWxsXCIsIHR3ZWFrSWQsIGlkLCBcInNlbmRcIiwgbWVzc2FnZSkgYXMgUHJvbWlzZTx2b2lkPixcclxuICAgIHJlcXVlc3Q6IChtZXNzYWdlLCB0aW1lb3V0TXMpID0+XHJcbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcclxuICAgICAgICBcImNvZGV4cHA6bmF0aXZlLWhlbHBlci1jYWxsXCIsXHJcbiAgICAgICAgdHdlYWtJZCxcclxuICAgICAgICBpZCxcclxuICAgICAgICBcInJlcXVlc3RcIixcclxuICAgICAgICBtZXNzYWdlLFxyXG4gICAgICAgIHRpbWVvdXRNcyxcclxuICAgICAgKSxcclxuICAgIHN0b3A6ICgpID0+XHJcbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6bmF0aXZlLWhlbHBlci1jYWxsXCIsIHR3ZWFrSWQsIGlkLCBcInN0b3BcIikgYXMgUHJvbWlzZTx2b2lkPixcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJlckVsZWN0cm9uQnJpZGdlKCk6IEVsZWN0cm9uQnJpZGdlIHwgbnVsbCB7XHJcbiAgY29uc3QgdmFsdWUgPSAod2luZG93IGFzIHVua25vd24gYXMgeyBlbGVjdHJvbkJyaWRnZT86IHVua25vd24gfSkuZWxlY3Ryb25CcmlkZ2U7XHJcbiAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiA/IHZhbHVlIGFzIEVsZWN0cm9uQnJpZGdlIDogbnVsbDtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyZXJTdG9yYWdlKGlkOiBzdHJpbmcpIHtcclxuICBjb25zdCBrZXkgPSBgY29kZXhwcDpzdG9yYWdlOiR7aWR9YDtcclxuICBjb25zdCByZWFkID0gKCk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkgPz8gXCJ7fVwiKTtcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICByZXR1cm4ge307XHJcbiAgICB9XHJcbiAgfTtcclxuICBjb25zdCB3cml0ZSA9ICh2OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT5cclxuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkodikpO1xyXG4gIHJldHVybiB7XHJcbiAgICBnZXQ6IDxUPihrOiBzdHJpbmcsIGQ/OiBUKSA9PiAoayBpbiByZWFkKCkgPyAocmVhZCgpW2tdIGFzIFQpIDogKGQgYXMgVCkpLFxyXG4gICAgc2V0OiAoazogc3RyaW5nLCB2OiB1bmtub3duKSA9PiB7XHJcbiAgICAgIGNvbnN0IG8gPSByZWFkKCk7XHJcbiAgICAgIG9ba10gPSB2O1xyXG4gICAgICB3cml0ZShvKTtcclxuICAgIH0sXHJcbiAgICBkZWxldGU6IChrOiBzdHJpbmcpID0+IHtcclxuICAgICAgY29uc3QgbyA9IHJlYWQoKTtcclxuICAgICAgZGVsZXRlIG9ba107XHJcbiAgICAgIHdyaXRlKG8pO1xyXG4gICAgfSxcclxuICAgIGFsbDogKCkgPT4gcmVhZCgpLFxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlcmVyRnMoaWQ6IHN0cmluZywgX3BhdGhzOiBVc2VyUGF0aHMpIHtcclxuICAvLyBTYW5kYm94ZWQgcmVuZGVyZXIgY2FuJ3QgdXNlIE5vZGUgZnMgZGlyZWN0bHkgXHUyMDE0IHByb3h5IHRocm91Z2ggbWFpbiBJUEMuXHJcbiAgcmV0dXJuIHtcclxuICAgIGRhdGFEaXI6IGA8cmVtb3RlPi90d2Vhay1kYXRhLyR7aWR9YCxcclxuICAgIHJlYWQ6IChwOiBzdHJpbmcpID0+XHJcbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6dHdlYWstZnNcIiwgXCJyZWFkXCIsIGlkLCBwKSBhcyBQcm9taXNlPHN0cmluZz4sXHJcbiAgICB3cml0ZTogKHA6IHN0cmluZywgYzogc3RyaW5nKSA9PlxyXG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOnR3ZWFrLWZzXCIsIFwid3JpdGVcIiwgaWQsIHAsIGMpIGFzIFByb21pc2U8dm9pZD4sXHJcbiAgICBleGlzdHM6IChwOiBzdHJpbmcpID0+XHJcbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6dHdlYWstZnNcIiwgXCJleGlzdHNcIiwgaWQsIHApIGFzIFByb21pc2U8Ym9vbGVhbj4sXHJcbiAgfTtcclxufVxyXG4iLCAiLyoqXHJcbiAqIEJ1aWx0LWluIFwiVHdlYWsgTWFuYWdlclwiIFx1MjAxNCBhdXRvLWluamVjdGVkIGJ5IHRoZSBydW50aW1lLCBub3QgYSB1c2VyIHR3ZWFrLlxyXG4gKiBMaXN0cyBkaXNjb3ZlcmVkIHR3ZWFrcyB3aXRoIGVuYWJsZSB0b2dnbGVzLCBvcGVucyB0aGUgdHdlYWtzIGRpciwgbGlua3NcclxuICogdG8gbG9ncyBhbmQgY29uZmlnLiBMaXZlcyBpbiB0aGUgcmVuZGVyZXIuXHJcbiAqXHJcbiAqIFRoaXMgaXMgaW52b2tlZCBmcm9tIHByZWxvYWQvaW5kZXgudHMgQUZURVIgdXNlciB0d2Vha3MgYXJlIGxvYWRlZCBzbyBpdFxyXG4gKiBjYW4gc2hvdyB1cC10by1kYXRlIHN0YXR1cy5cclxuICovXHJcbmltcG9ydCB7IGlwY1JlbmRlcmVyIH0gZnJvbSBcImVsZWN0cm9uXCI7XHJcbmltcG9ydCB7IHJlZ2lzdGVyU2VjdGlvbiB9IGZyb20gXCIuL3NldHRpbmdzLWluamVjdG9yXCI7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbW91bnRNYW5hZ2VyKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IHR3ZWFrcyA9IChhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmxpc3QtdHdlYWtzXCIpKSBhcyBBcnJheTx7XHJcbiAgICBtYW5pZmVzdDogeyBpZDogc3RyaW5nOyBuYW1lOiBzdHJpbmc7IHZlcnNpb246IHN0cmluZzsgZGVzY3JpcHRpb24/OiBzdHJpbmcgfTtcclxuICAgIGVudHJ5RXhpc3RzOiBib29sZWFuO1xyXG4gIH0+O1xyXG4gIGNvbnN0IHBhdGhzID0gKGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6dXNlci1wYXRoc1wiKSkgYXMge1xyXG4gICAgdXNlclJvb3Q6IHN0cmluZztcclxuICAgIHR3ZWFrc0Rpcjogc3RyaW5nO1xyXG4gICAgbG9nRGlyOiBzdHJpbmc7XHJcbiAgfTtcclxuXHJcbiAgcmVnaXN0ZXJTZWN0aW9uKHtcclxuICAgIGlkOiBcImNvZGV4LXBsdXNwbHVzOm1hbmFnZXJcIixcclxuICAgIHRpdGxlOiBcIlR3ZWFrIE1hbmFnZXJcIixcclxuICAgIGRlc2NyaXB0aW9uOiBgJHt0d2Vha3MubGVuZ3RofSB0d2VhayhzKSBpbnN0YWxsZWQuIFVzZXIgZGlyOiAke3BhdGhzLnVzZXJSb290fWAsXHJcbiAgICByZW5kZXIocm9vdCkge1xyXG4gICAgICByb290LnN0eWxlLmNzc1RleHQgPSBcImRpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjhweDtcIjtcclxuXHJcbiAgICAgIGNvbnN0IGFjdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICBhY3Rpb25zLnN0eWxlLmNzc1RleHQgPSBcImRpc3BsYXk6ZmxleDtnYXA6OHB4O2ZsZXgtd3JhcDp3cmFwO1wiO1xyXG4gICAgICBhY3Rpb25zLmFwcGVuZENoaWxkKFxyXG4gICAgICAgIGJ1dHRvbihcIk9wZW4gdHdlYWtzIGZvbGRlclwiLCAoKSA9PlxyXG4gICAgICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpyZXZlYWxcIiwgcGF0aHMudHdlYWtzRGlyKS5jYXRjaCgoKSA9PiB7fSksXHJcbiAgICAgICAgKSxcclxuICAgICAgKTtcclxuICAgICAgYWN0aW9ucy5hcHBlbmRDaGlsZChcclxuICAgICAgICBidXR0b24oXCJPcGVuIGxvZ3NcIiwgKCkgPT5cclxuICAgICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6cmV2ZWFsXCIsIHBhdGhzLmxvZ0RpcikuY2F0Y2goKCkgPT4ge30pLFxyXG4gICAgICAgICksXHJcbiAgICAgICk7XHJcbiAgICAgIGFjdGlvbnMuYXBwZW5kQ2hpbGQoXHJcbiAgICAgICAgYnV0dG9uKFwiUmVsb2FkIHdpbmRvd1wiLCAoKSA9PiBsb2NhdGlvbi5yZWxvYWQoKSksXHJcbiAgICAgICk7XHJcbiAgICAgIHJvb3QuYXBwZW5kQ2hpbGQoYWN0aW9ucyk7XHJcblxyXG4gICAgICBpZiAodHdlYWtzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIGNvbnN0IGVtcHR5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInBcIik7XHJcbiAgICAgICAgZW1wdHkuc3R5bGUuY3NzVGV4dCA9IFwiY29sb3I6Izg4ODtmb250OjEzcHggc3lzdGVtLXVpO21hcmdpbjo4cHggMDtcIjtcclxuICAgICAgICBlbXB0eS50ZXh0Q29udGVudCA9XHJcbiAgICAgICAgICBcIk5vIHVzZXIgdHdlYWtzIHlldC4gRHJvcCBhIGZvbGRlciB3aXRoIG1hbmlmZXN0Lmpzb24gKyBpbmRleC5qcyBpbnRvIHRoZSB0d2Vha3MgZGlyLCB0aGVuIHJlbG9hZC5cIjtcclxuICAgICAgICByb290LmFwcGVuZENoaWxkKGVtcHR5KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XHJcbiAgICAgIGxpc3Quc3R5bGUuY3NzVGV4dCA9IFwibGlzdC1zdHlsZTpub25lO21hcmdpbjowO3BhZGRpbmc6MDtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDo2cHg7XCI7XHJcbiAgICAgIGZvciAoY29uc3QgdCBvZiB0d2Vha3MpIHtcclxuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcclxuICAgICAgICBsaS5zdHlsZS5jc3NUZXh0ID1cclxuICAgICAgICAgIFwiZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2VlbjtwYWRkaW5nOjhweCAxMHB4O2JvcmRlcjoxcHggc29saWQgdmFyKC0tYm9yZGVyLCMyYTJhMmEpO2JvcmRlci1yYWRpdXM6NnB4O1wiO1xyXG4gICAgICAgIGNvbnN0IGxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIGxlZnQuaW5uZXJIVE1MID0gYFxyXG4gICAgICAgICAgPGRpdiBzdHlsZT1cImZvbnQ6NjAwIDEzcHggc3lzdGVtLXVpO1wiPiR7ZXNjYXBlKHQubWFuaWZlc3QubmFtZSl9IDxzcGFuIHN0eWxlPVwiY29sb3I6Izg4ODtmb250LXdlaWdodDo0MDA7XCI+diR7ZXNjYXBlKHQubWFuaWZlc3QudmVyc2lvbil9PC9zcGFuPjwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBzdHlsZT1cImNvbG9yOiM4ODg7Zm9udDoxMnB4IHN5c3RlbS11aTtcIj4ke2VzY2FwZSh0Lm1hbmlmZXN0LmRlc2NyaXB0aW9uID8/IHQubWFuaWZlc3QuaWQpfTwvZGl2PlxyXG4gICAgICAgIGA7XHJcbiAgICAgICAgY29uc3QgcmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgIHJpZ2h0LnN0eWxlLmNzc1RleHQgPSBcImNvbG9yOiM4ODg7Zm9udDoxMnB4IHN5c3RlbS11aTtcIjtcclxuICAgICAgICByaWdodC50ZXh0Q29udGVudCA9IHQuZW50cnlFeGlzdHMgPyBcImxvYWRlZFwiIDogXCJtaXNzaW5nIGVudHJ5XCI7XHJcbiAgICAgICAgbGkuYXBwZW5kKGxlZnQsIHJpZ2h0KTtcclxuICAgICAgICBsaXN0LmFwcGVuZChsaSk7XHJcbiAgICAgIH1cclxuICAgICAgcm9vdC5hcHBlbmQobGlzdCk7XHJcbiAgICB9LFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBidXR0b24obGFiZWw6IHN0cmluZywgb25jbGljazogKCkgPT4gdm9pZCk6IEhUTUxCdXR0b25FbGVtZW50IHtcclxuICBjb25zdCBiID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcclxuICBiLnR5cGUgPSBcImJ1dHRvblwiO1xyXG4gIGIudGV4dENvbnRlbnQgPSBsYWJlbDtcclxuICBiLnN0eWxlLmNzc1RleHQgPVxyXG4gICAgXCJwYWRkaW5nOjZweCAxMHB4O2JvcmRlcjoxcHggc29saWQgdmFyKC0tYm9yZGVyLCMzMzMpO2JvcmRlci1yYWRpdXM6NnB4O2JhY2tncm91bmQ6dHJhbnNwYXJlbnQ7Y29sb3I6aW5oZXJpdDtmb250OjEycHggc3lzdGVtLXVpO2N1cnNvcjpwb2ludGVyO1wiO1xyXG4gIGIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uY2xpY2spO1xyXG4gIHJldHVybiBiO1xyXG59XHJcblxyXG5mdW5jdGlvbiBlc2NhcGUoczogc3RyaW5nKTogc3RyaW5nIHtcclxuICByZXR1cm4gcy5yZXBsYWNlKC9bJjw+XCInXS9nLCAoYykgPT5cclxuICAgIGMgPT09IFwiJlwiXHJcbiAgICAgID8gXCImYW1wO1wiXHJcbiAgICAgIDogYyA9PT0gXCI8XCJcclxuICAgICAgICA/IFwiJmx0O1wiXHJcbiAgICAgICAgOiBjID09PSBcIj5cIlxyXG4gICAgICAgICAgPyBcIiZndDtcIlxyXG4gICAgICAgICAgOiBjID09PSAnXCInXHJcbiAgICAgICAgICAgID8gXCImcXVvdDtcIlxyXG4gICAgICAgICAgICA6IFwiJiMzOTtcIixcclxuICApO1xyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7OztBQVdBLElBQUFBLG1CQUE0Qjs7O0FDNkJyQixTQUFTLG1CQUF5QjtBQUN2QyxNQUFJLE9B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QUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQ0YsRUFBRSxJQUFJLDZCQUE2QjtBQUVuQyxJQUFNLG1DQUFtQztBQUFBLEVBQ3ZDO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGLEVBQUUsSUFBSSw2QkFBNkI7QUFFbkMsSUFBTSwrQkFBK0I7QUFBQSxFQUNuQztBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7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QUNYLENBQUM7QUFBQSxJQUNILEtBQUs7QUFDSCxhQUFPLDZCQUFZLE9BQU8sdUNBQXVDLEtBQUssQ0FBQyxDQUFDO0FBQUEsSUFDMUUsS0FBSztBQUNILGFBQU8sNkJBQVksT0FBTywyQkFBMkI7QUFBQSxJQUN2RDtBQUNFLFlBQU0sSUFBSSxNQUFNLDZFQUFvRCxNQUFNLEVBQUU7QUFBQSxFQUNoRjtBQUNGO0FBRUEsU0FBUyxpQ0FDUCxVQUNBLGlCQUNTO0FBQ1QsTUFBSSxDQUFDLHFCQUFxQixLQUFLLFFBQVEsRUFBRyxPQUFNLElBQUksTUFBTSxtQkFBbUI7QUFDN0UsTUFBSSxnQkFBZ0IsSUFBSSxRQUFRLEVBQUcsUUFBTztBQUMxQyxRQUFNLFdBQVcsQ0FBQyxRQUFpQixZQUFxQjtBQUN0RCxpQ0FBWSxLQUFLLDJCQUEyQixVQUFVLE9BQU87QUFBQSxFQUMvRDtBQUNBLGtCQUFnQixJQUFJLFVBQVUsUUFBUTtBQUN0QywrQkFBWSxHQUFHLDRCQUE0QixRQUFRLEdBQUcsUUFBUTtBQUM5RCxTQUFPO0FBQ1Q7QUFFQSxTQUFTLG1DQUNQLFVBQ0EsaUJBQ1M7QUFDVCxRQUFNLFdBQVcsZ0JBQWdCLElBQUksUUFBUTtBQUM3QyxNQUFJLENBQUMsU0FBVSxRQUFPO0FBQ3RCLGtCQUFnQixPQUFPLFFBQVE7QUFDL0IsK0JBQVksZUFBZSw0QkFBNEIsUUFBUSxHQUFHLFFBQVE7QUFDMUUsU0FBTztBQUNUOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfZWxlY3Ryb24iLCAiYnV0dG9uIiwgInJvb3QiLCAiYnV0dG9uIiwgInN0YXRlIiwgImNoZWNrIiwgImJ1dHRvbiIsICJjYXJkIiwgImltcG9ydF9lbGVjdHJvbiIsICJtb2R1bGUiLCAiZXhwb3J0cyIsICJpbXBvcnRfZWxlY3Ryb24iLCAic2FmZVN0cmluZ2lmeSJdCn0K
