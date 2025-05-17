import { MODEL_PROVIDER_GITHUB } from "./constants"
import { createFetch } from "./fetch"
import { LanguageModel, ListModelsFunction } from "./chat"
import { OpenAIChatCompletion, OpenAIEmbedder } from "./openai"
import { serializeError } from "./error"
import { genaiscriptDebug } from "./debug"
import { deleteUndefinedValues } from "./cleaners"
const dbg = genaiscriptDebug("github")

interface GitHubMarketplaceModel {
    id: string
    name: string
    publisher: string
    summary: string
    rate_limit_tier: string
    supported_input_modalities: ("text" | "image" | "audio")[]
    supported_output_modalities: ("text" | "image" | "audio")[]
    tags: string[]
}

const listModels: ListModelsFunction = async (cfg, options) => {
    const fetch = await createFetch({ retries: 0, ...options })
    try {
        const modelsRes = await fetch(
            "https://models.github.ai/catalog/models",
            {
                method: "GET",
                headers: deleteUndefinedValues({
                    Accept: "application/vnd.github+json",
                    Authorization: cfg.token
                        ? `Bearer ${cfg.token}`
                        : undefined,
                    "X-GitHub-Api-Version": "2022-11-28",
                }),
            }
        )
        if (!modelsRes.ok) {
            dbg(`failed to fetch models, status: ${modelsRes.status}`)
            return {
                ok: false,
                status: modelsRes.status,
                error: serializeError(modelsRes.statusText),
            }
        }

        const models = (await modelsRes.json()) as GitHubMarketplaceModel[]
        return {
            ok: true,
            models: models.map(
                (m) =>
                    ({
                        id: m.id,
                        details: `${m.name} - ${m.summary}`,
                        //    url: `https://github.com/marketplace/models/${m.registryName}/${m.name}`,
                    }) satisfies LanguageModelInfo
            ),
        }
    } catch (e) {
        return { ok: false, error: serializeError(e) }
    }
}

export const GitHubModel = Object.freeze<LanguageModel>({
    id: MODEL_PROVIDER_GITHUB,
    completer: OpenAIChatCompletion,
    listModels,
    embedder: OpenAIEmbedder,
})
