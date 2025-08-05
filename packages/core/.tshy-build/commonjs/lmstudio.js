"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.LMStudioModel = void 0;
const constants_js_1 = require("./constants.js");
const openai_js_1 = require("./openai.js");
const util_js_1 = require("./util.js");
const host_js_1 = require("./host.js");
const pullModel = async (cfg, _options) => {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const model = cfg.model;
    (0, util_js_1.logVerbose)(`lms get ${model} --yes`);
    const res = await runtimeHost.exec(undefined, `lms`, [`get`, model, `--yes`], _options);
    return {
        ok: res.exitCode === constants_js_1.SUCCESS_ERROR_CODE,
    };
};
// Define the Ollama model with its completion handler and model listing function
exports.LMStudioModel = Object.freeze({
    id: constants_js_1.MODEL_PROVIDER_LMSTUDIO,
    completer: openai_js_1.OpenAIChatCompletion,
    listModels: openai_js_1.OpenAIListModels,
    pullModel,
    embedder: openai_js_1.OpenAIEmbedder,
});
//# sourceMappingURL=lmstudio.js.map