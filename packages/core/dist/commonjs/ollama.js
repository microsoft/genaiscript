"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaModel = void 0;
const constants_js_1 = require("./constants.js");
const error_js_1 = require("./error.js");
const fetch_js_1 = require("./fetch.js");
const openai_js_1 = require("./openai.js");
const util_js_1 = require("./util.js");
const jsonl_js_1 = require("./jsonl.js");
const stdio_js_1 = require("./stdio.js");
/**
 * Lists available models for the Ollama language model configuration.
 * Fetches model data from a remote endpoint and formats it into a LanguageModelInfo array.
 *
 * @param cfg - The configuration for the language model.
 * @returns A promise that resolves to an array of LanguageModelInfo objects.
 */
const listModels = async (cfg, options) => {
    try {
        // Create a fetch instance to make HTTP requests
        const fetch = await (0, fetch_js_1.createFetch)({ retries: 0, ...options });
        // Fetch the list of models from the remote API
        const res = await fetch(cfg.base.replace("/v1", "/api/tags"), {
            method: "GET",
        });
        if (res.status !== 200)
            return {
                ok: false,
                status: res.status,
                error: (0, error_js_1.serializeError)(res.statusText),
            };
        // Parse and format the response into LanguageModelInfo objects
        const { models } = (await res.json());
        return {
            ok: true,
            models: models.map((m) => ({
                id: m.name,
                details: `${m.name}, ${m.details.parameter_size}`,
                url: `https://ollama.com/library/${m.name}`,
            })),
        };
    }
    catch (e) {
        return { ok: false, error: (0, error_js_1.serializeError)(e) };
    }
};
const pullModel = async (cfg, options) => {
    const { cancellationToken } = options || {};
    const { provider, model } = cfg;
    const fetch = await (0, fetch_js_1.createFetch)({ retries: 0, ...options });
    const base = cfg.base.replace(/\/v1$/i, "");
    try {
        // pull
        (0, util_js_1.logVerbose)(`${provider}: pull ${model}`);
        const resPull = await fetch(`${base}/api/pull`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": constants_js_1.TOOL_ID,
            },
            body: JSON.stringify({ model }),
        });
        if (!resPull.ok) {
            (0, util_js_1.logError)(`${provider}: failed to pull model ${model}`);
            (0, util_js_1.logVerbose)(resPull.statusText);
            return { ok: false, status: resPull.status };
        }
        for await (const chunk of (0, fetch_js_1.iterateBody)(resPull, { cancellationToken })) {
            const cs = (0, jsonl_js_1.JSONLTryParse)(chunk);
            for (const c of cs) {
                if (c?.error) {
                    return {
                        ok: false,
                        error: (0, error_js_1.serializeError)(c.error),
                    };
                }
            }
            stdio_js_1.stderr.write(".");
        }
        stdio_js_1.stderr.write("\n");
        (0, util_js_1.logVerbose)(`${provider}: pulled ${model}`);
        return { ok: true };
    }
    catch (e) {
        (0, util_js_1.logError)(e);
        return { ok: false, error: (0, error_js_1.serializeError)(e) };
    }
};
// Define the Ollama model with its completion handler and model listing function
exports.OllamaModel = Object.freeze({
    id: constants_js_1.MODEL_PROVIDER_OLLAMA,
    completer: openai_js_1.OpenAIChatCompletion,
    listModels,
    pullModel,
    embedder: openai_js_1.OpenAIEmbedder,
});
//# sourceMappingURL=ollama.js.map