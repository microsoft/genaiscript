// Import necessary modules and types for handling chat completions and model management
import { LanguageModel, ListModelsFunction, PullModelFunction } from "./chat"
import { MODEL_PROVIDER_OLLAMA, TOOL_ID } from "./constants"
import { serializeError } from "./error"
import { createFetch, iterateBody } from "./fetch"
import { OpenAIChatCompletion, OpenAIEmbedder } from "./openai"
import { logError, logVerbose } from "./util"
import { JSONLTryParse } from "./jsonl"
import { stderr } from "./stdio"

/**
 * Lists available models for the Ollama language model configuration.
 * Fetches model data from a remote endpoint and formats it into a LanguageModelInfo array.
 *
 * @param cfg - The configuration for the language model.
 * @returns A promise that resolves to an array of LanguageModelInfo objects.
 */
const listModels: ListModelsFunction = async (cfg, options) => {
    try {
        // Create a fetch instance to make HTTP requests
        const fetch = await createFetch({ retries: 0, ...options })
        // Fetch the list of models from the remote API
        const res = await fetch(cfg.base.replace("/v1", "/api/tags"), {
            method: "GET",
        })
        if (res.status !== 200)
            return {
                ok: false,
                status: res.status,
                error: serializeError(res.statusText),
            }
        // Parse and format the response into LanguageModelInfo objects
        const { models } = (await res.json()) as {
            models: {
                name: string
                size: number
                details: {
                    parameter_size: string
                    family: string
                }
            }[]
        }
        return {
            ok: true,
            models: models.map(
                (m) =>
                    ({
                        id: m.name,
                        details: `${m.name}, ${m.details.parameter_size}`,
                        url: `https://ollama.com/library/${m.name}`,
                    }) satisfies LanguageModelInfo
            ),
        }
    } catch (e) {
        return { ok: false, error: serializeError(e) }
    }
}

const pullModel: PullModelFunction = async (cfg, options) => {
    const { trace, cancellationToken } = options || {}
    const { provider, model } = cfg
    const fetch = await createFetch({ retries: 0, ...options })
    const base = cfg.base.replace(/\/v1$/i, "")
    try {
        // pull
        logVerbose(`${provider}: pull ${model}`)
        const resPull = await fetch(`${base}/api/pull`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": TOOL_ID,
            },
            body: JSON.stringify({ model }),
        })
        if (!resPull.ok) {
            logError(`${provider}: failed to pull model ${model}`)
            logVerbose(resPull.statusText)
            return { ok: false, status: resPull.status }
        }
        let lastStatus = ""
        for await (const chunk of iterateBody(resPull, { cancellationToken })) {
            const cs = JSONLTryParse(chunk) as {
                status?: string
                error?: string
            }[]
            for (const c of cs) {
                if (c?.error) {
                    return {
                        ok: false,
                        error: serializeError(c.error),
                    }
                }
            }
            stderr.write(".")
        }
        stderr.write("\n")
        logVerbose(`${provider}: pulled ${model}`)
        return { ok: true }
    } catch (e) {
        logError(e)
        trace.error(e)
        return { ok: false, error: serializeError(e) }
    }
}

/**
 * Normalizes Ollama model names for comparison by handling the implicit :latest tag.
 * If a model name has no tag, it's equivalent to having :latest tag.
 * 
 * @param modelName - The model name to normalize
 * @returns The normalized model name
 */
export function normalizeOllamaModelName(modelName: string): string {
    if (!modelName) return modelName
    
    // Check if there's a tag (colon after the last slash, if any)
    const lastSlashIndex = modelName.lastIndexOf('/')
    const relevantPart = lastSlashIndex >= 0 ? modelName.substring(lastSlashIndex + 1) : modelName
    
    // If the relevant part (after last slash) contains a colon, it has a tag
    if (relevantPart.includes(':')) {
        return modelName
    }
    
    // If no tag specified, add :latest
    return `${modelName}:latest`
}

/**
 * Checks if two Ollama model names refer to the same model, considering
 * that missing tags default to :latest.
 * 
 * @param requestedModel - The model name requested by the user
 * @param availableModel - The model name available in Ollama
 * @returns True if the models refer to the same model
 */
export function areOllamaModelsEquivalent(requestedModel: string, availableModel: string): boolean {
    if (!requestedModel || !availableModel) return false
    
    const normalizedRequested = normalizeOllamaModelName(requestedModel)
    const normalizedAvailable = normalizeOllamaModelName(availableModel)
    
    return normalizedRequested === normalizedAvailable
}

// Define the Ollama model with its completion handler and model listing function
export const OllamaModel = Object.freeze<LanguageModel>({
    id: MODEL_PROVIDER_OLLAMA,
    completer: OpenAIChatCompletion,
    listModels,
    pullModel,
    embedder: OpenAIEmbedder,
})
