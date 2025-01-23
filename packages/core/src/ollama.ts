// Import necessary modules and types for handling chat completions and model management
import { LanguageModel, ListModelsFunction, PullModelFunction } from "./chat"
import { MODEL_PROVIDER_OLLAMA, TOOL_ID } from "./constants"
import { serializeError } from "./error"
import { createFetch, iterateBody } from "./fetch"
import { OpenAIChatCompletion } from "./openai"
import { logError, logVerbose } from "./util"
import { LanguageModelInfo } from "./server/messages"
import { JSONLTryParse } from "./jsonl"

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
            process.stderr.write(".")
        }
        process.stderr.write("\n")
        logVerbose(`${provider}: pulled ${model}`)
        return { ok: true }
    } catch (e) {
        logError(e)
        trace.error(e)
        return { ok: false, error: serializeError(e) }
    }
}

// Define the Ollama model with its completion handler and model listing function
export const OllamaModel = Object.freeze<LanguageModel>({
    id: MODEL_PROVIDER_OLLAMA,
    completer: OpenAIChatCompletion,
    listModels,
    pullModel,
})
