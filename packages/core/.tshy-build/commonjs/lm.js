"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLanguageModel = resolveLanguageModel;
const anthropic_js_1 = require("./anthropic.js");
const constants_js_1 = require("./constants.js");
const host_js_1 = require("./host.js");
const ollama_js_1 = require("./ollama.js");
const openai_js_1 = require("./openai.js");
const github_js_1 = require("./github.js");
const lmstudio_js_1 = require("./lmstudio.js");
const whisperasr_js_1 = require("./whisperasr.js");
const azureopenai_js_1 = require("./azureopenai.js");
const echomodel_js_1 = require("./echomodel.js");
const nonemodel_js_1 = require("./nonemodel.js");
const azureaiinference_js_1 = require("./azureaiinference.js");
const features_js_1 = require("./features.js");
/**
 * Resolves and returns a language model based on the provided model provider identifier.
 *
 * @param provider - The identifier of the model provider. It determines which language model to return.
 *                   Supported providers include predefined constants from "./constants".
 *
 * @returns The resolved language model instance corresponding to the specified provider.
 *
 * @throws An error if the provider is MODEL_PROVIDER_GITHUB_COPILOT_CHAT and no client language model is available.
 *         If the provider does not match any predefined constant, a LocalOpenAICompatibleModel is returned with
 *         features derived from the MODEL_PROVIDERS configuration.
 */
function resolveLanguageModel(provider) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    if (provider === constants_js_1.MODEL_PROVIDER_GITHUB_COPILOT_CHAT) {
        const m = runtimeHost.clientLanguageModel;
        if (!m)
            throw new Error("Github Copilot Chat Models not available");
        return m;
    }
    if (provider === constants_js_1.MODEL_PROVIDER_MCP) {
        const m = runtimeHost.clientLanguageModel;
        if (!m)
            throw new Error("MCP Client Sampling not available");
        return m;
    }
    if (provider === constants_js_1.MODEL_PROVIDER_AZURE_OPENAI)
        return azureopenai_js_1.AzureOpenAIModel;
    if (provider === constants_js_1.MODEL_PROVIDER_AZURE_AI_INFERENCE)
        return azureaiinference_js_1.AzureAIInferenceModel;
    if (provider === constants_js_1.MODEL_PROVIDER_GITHUB)
        return github_js_1.GitHubModel;
    if (provider === constants_js_1.MODEL_PROVIDER_OLLAMA)
        return ollama_js_1.OllamaModel;
    if (provider === constants_js_1.MODEL_PROVIDER_ANTHROPIC)
        return anthropic_js_1.AnthropicModel;
    if (provider === constants_js_1.MODEL_PROVIDER_ANTHROPIC_BEDROCK)
        return anthropic_js_1.AnthropicBedrockModel;
    if (provider === constants_js_1.MODEL_PROVIDER_LMSTUDIO)
        return lmstudio_js_1.LMStudioModel;
    if (provider === constants_js_1.MODEL_PROVIDER_WHISPERASR)
        return whisperasr_js_1.WhisperAsrModel;
    if (provider === constants_js_1.MODEL_PROVIDER_ECHO)
        return echomodel_js_1.EchoModel;
    if (provider === constants_js_1.MODEL_PROVIDER_NONE)
        return nonemodel_js_1.NoneModel;
    const features = (0, features_js_1.providerFeatures)(provider);
    return (0, openai_js_1.LocalOpenAICompatibleModel)(provider, {
        listModels: features?.listModels !== false,
        transcribe: features?.transcribe,
        speech: features?.speech,
        imageGeneration: features?.imageGeneration,
    });
}
//# sourceMappingURL=lm.js.map