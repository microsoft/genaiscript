// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

interface GenAIScriptViewOptions {
  apiKey?: string;
  base?: string;
}
interface GenAIScriptHost {
  genaiscript?: GenAIScriptViewOptions;
}

const urlParams = new URLSearchParams(window.location.search);
const config = (self as GenAIScriptHost)?.genaiscript;
if (config) delete (self as GenAIScriptHost).genaiscript;
const hosted = !!config;
const viewMode = (hosted ? "results" : urlParams.get("view")) as "results" | undefined;
const diagnostics = urlParams.get("dbg") === "1";
const hashParams = new URLSearchParams(window.location.hash.slice(1));
const base = config?.base || "";
const apiKeyName = "genaiscript.apikey";
const apiKey =
  hashParams.get("api-key") || config?.apiKey || localStorage.getItem(apiKeyName) || "";
if (hashParams.get("api-key")) {
  localStorage.setItem(apiKeyName, hashParams.get("api-key"));
  hashParams.delete("api-key");
  window.location.hash = hashParams.toString();
}
if (!hosted) import("@vscode-elements/webview-playground");

export { hosted, viewMode, diagnostics, base, apiKey, urlParams };
