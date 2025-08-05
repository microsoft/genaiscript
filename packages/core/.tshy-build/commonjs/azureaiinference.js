"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureAIInferenceModel = void 0;
const constants_js_1 = require("./constants.js");
const openai_js_1 = require("./openai.js");
exports.AzureAIInferenceModel = Object.freeze({
    id: constants_js_1.MODEL_PROVIDER_AZURE_AI_INFERENCE,
    completer: openai_js_1.OpenAIChatCompletion,
    embedder: openai_js_1.OpenAIEmbedder,
    listModels: async () => {
        return {
            ok: true,
            models: [
                {
                    id: "o3",
                },
                {
                    id: "o3-mini",
                },
                {
                    id: "o4-mini",
                },
                {
                    id: "gpt-4.1",
                },
                {
                    id: "gpt-4.1-mini",
                },
                {
                    id: "gpt-4.1-nano",
                },
                {
                    id: "gpt-4o",
                },
                {
                    id: "gpt-4o-mini",
                },
                {
                    id: "o1",
                },
                {
                    id: "o1-preview",
                },
                {
                    id: "o3-mini",
                },
            ],
        };
    },
});
//# sourceMappingURL=azureaiinference.js.map