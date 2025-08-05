// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { MODEL_PROVIDER_GITHUB } from "./constants.js";
import { createFetch } from "./fetch.js";
import { OpenAIChatCompletion, OpenAIEmbedder } from "./openai.js";
import { serializeError } from "./error.js";
import { genaiscriptDebug } from "./debug.js";
import { deleteUndefinedValues } from "./cleaners.js";
const dbg = genaiscriptDebug("github");
const listModels = async (cfg, options) => {
    const fetch = await createFetch({ retries: 0, ...options });
    try {
        const modelsRes = await fetch("https://models.github.ai/catalog/models", {
            method: "GET",
            headers: deleteUndefinedValues({
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
                error: serializeError(modelsRes.statusText),
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
        return { ok: false, error: serializeError(e) };
    }
};
export const GitHubModel = Object.freeze({
    id: MODEL_PROVIDER_GITHUB,
    completer: OpenAIChatCompletion,
    listModels,
    embedder: OpenAIEmbedder,
});
//# sourceMappingURL=github.js.map