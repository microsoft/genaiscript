"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureOpenAIModel = void 0;
const debug_1 = __importDefault(require("debug"));
const dbg = (0, debug_1.default)("genaiscript:azureopenai");
const constants_js_1 = require("./constants.js");
const error_js_1 = require("./error.js");
const fetch_js_1 = require("./fetch.js");
const openai_js_1 = require("./openai.js");
const host_js_1 = require("./host.js");
const azureManagementListModels = async (cfg, options) => {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    try {
        // Create a fetch instance to make HTTP requests
        const { base } = cfg;
        const subscriptionId = process.env.AZURE_OPENAI_SUBSCRIPTION_ID;
        let resourceGroupName = process.env.AZURE_OPENAI_RESOURCE_GROUP;
        const accountName = /^https:\/\/([^.]+)\./.exec(base)[1];
        if (!subscriptionId || !accountName) {
            dbg("subscriptionId or accountName is missing, returning an empty model list");
            return { ok: true, models: [] };
        }
        const token = await runtimeHost.azureManagementToken.token("default", options);
        if (!token)
            throw new Error("Azure management token is missing");
        if (token.error) {
            dbg("error occurred while fetching Azure management token: %s", token.error);
            throw new Error((0, error_js_1.errorMessage)(token.error));
        }
        const fetch = await (0, fetch_js_1.createFetch)({ retries: 0, ...options });
        const get = async (url) => {
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token.token.token}`,
                },
            });
            if (res.status !== 200) {
                return {
                    ok: false,
                    status: res.status,
                    error: (0, error_js_1.serializeError)(res.statusText),
                };
            }
            return await res.json();
        };
        if (!resourceGroupName) {
            dbg("resourceGroupName is missing, fetching resource details");
            const resources = await get(`https://management.azure.com/subscriptions/${subscriptionId}/resources?api-version=2021-04-01`);
            const resource = resources.value.find((r) => r.name === accountName);
            resourceGroupName = /\/resourceGroups\/([^/]+)\/providers\//.exec(resource?.id)[1];
            if (!resourceGroupName) {
                dbg("unable to extract resource group name from resource id");
                throw new Error("Resource group not found");
            }
        }
        // https://learn.microsoft.com/en-us/rest/api/aiservices/accountmanagement/deployments/list-skus?view=rest-aiservices-accountmanagement-2024-10-01&tabs=HTTP
        const deployments = await get(`https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.CognitiveServices/accounts/${accountName}/deployments/?api-version=${constants_js_1.AZURE_MANAGEMENT_API_VERSION}`);
        return {
            ok: true,
            models: deployments.value.map((model) => ({
                id: model.name,
                family: model.properties.model.name,
                details: `${model.properties.model.format} ${model.properties.model.name}`,
                url: `https://ai.azure.com/resource/deployments/${encodeURIComponent(model.id)}`,
                version: model.properties.model.version,
            })),
        };
    }
    catch (e) {
        return { ok: false, error: (0, error_js_1.serializeError)(e) };
    }
};
const azureManagementOrOpenAIListModels = async (cfg, options) => {
    const modelsApi = process.env.AZURE_OPENAI_API_MODELS_TYPE;
    if (modelsApi === "openai") {
        dbg("using OpenAI API for model listing");
        return await (0, openai_js_1.OpenAIListModels)(cfg, options);
    }
    else {
        dbg("using Azure Management API for model listing");
        return await azureManagementListModels(cfg, options);
    }
};
// Define the Ollama model with its completion handler and model listing function
exports.AzureOpenAIModel = Object.freeze({
    id: constants_js_1.MODEL_PROVIDER_AZURE_OPENAI,
    completer: openai_js_1.OpenAIChatCompletion,
    listModels: azureManagementOrOpenAIListModels,
    transcriber: openai_js_1.OpenAITranscribe,
    speaker: openai_js_1.OpenAISpeech,
    imageGenerator: openai_js_1.OpenAIImageGeneration,
    embedder: openai_js_1.OpenAIEmbedder,
});
//# sourceMappingURL=azureopenai.js.map