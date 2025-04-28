import { MODEL_PROVIDER_GITHUB } from "./constants"
import { createFetch } from "./fetch"
import { LanguageModel, ListModelsFunction } from "./chat"
import { OpenAIChatCompletion, OpenAIEmbedder } from "./openai"
import { serializeError } from "./error"
import { genaiscriptDebug } from "./debug"
const dbg = genaiscriptDebug("github")

interface GitHubMarketplaceModel {
    name: string
    displayName: string
    version: string
    publisher: string
    registryName: string
    license: string
    inferenceTasks: string[]
    description?: string
    summary: string
}

const listModels: ListModelsFunction = async (cfg, options) => {
    const fetch = await createFetch({ retries: 0, ...options })
    try {
        const modelsRes = await fetch(
            "https://api.catalog.azureml.ms/asset-gallery/v1.0/models",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    filters: [
                        {
                            field: "freePlayground",
                            values: ["true"],
                            operator: "eq",
                        },
                        { field: "labels", values: ["latest"], operator: "eq" },
                    ],
                    order: [{ field: "displayName", direction: "Asc" }],
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

        const models = (await modelsRes.json())
            .summaries as GitHubMarketplaceModel[]
        return {
            ok: true,
            models: models.map(
                (m) =>
                    ({
                        id: m.name,
                        details: m.summary,
                        url: `https://github.com/marketplace/models/${m.registryName}/${m.name}`,
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
