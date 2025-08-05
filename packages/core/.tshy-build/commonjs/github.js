"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubModel = void 0;
const constants_js_1 = require("./constants.js");
const fetch_js_1 = require("./fetch.js");
const openai_js_1 = require("./openai.js");
const error_js_1 = require("./error.js");
const debug_js_1 = require("./debug.js");
const cleaners_js_1 = require("./cleaners.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("github");
const listModels = async (cfg, options) => {
    const fetch = await (0, fetch_js_1.createFetch)({ retries: 0, ...options });
    try {
        const modelsRes = await fetch("https://models.github.ai/catalog/models", {
            method: "GET",
            headers: (0, cleaners_js_1.deleteUndefinedValues)({
                Accept: "application/vnd.github+json",
                Authorization: cfg.token ? `Bearer ${cfg.token}` : undefined,
                "X-GitHub-Api-Version": "2022-11-28",
            }),
        });
        if (!modelsRes.ok) {
            dbg(`failed to fetch models, status: ${modelsRes.status}`);
            return {
                ok: false,
                status: modelsRes.status,
                error: (0, error_js_1.serializeError)(modelsRes.statusText),
            };
        }
        const models = (await modelsRes.json());
        return {
            ok: true,
            models: models.map((m) => ({
                id: m.id,
                details: `${m.name} - ${m.summary}`,
                //    url: `https://github.com/marketplace/models/${m.registryName}/${m.name}`,
            })),
        };
    }
    catch (e) {
        return { ok: false, error: (0, error_js_1.serializeError)(e) };
    }
};
exports.GitHubModel = Object.freeze({
    id: constants_js_1.MODEL_PROVIDER_GITHUB,
    completer: openai_js_1.OpenAIChatCompletion,
    listModels,
    embedder: openai_js_1.OpenAIEmbedder,
});
//# sourceMappingURL=github.js.map