// Import necessary modules and types for handling chat completions and model management
import { LanguageModel, LanguageModelInfo, PullModelFunction } from "./chat"
import { MODEL_PROVIDER_OLLAMA, TOOL_ID } from "./constants"
import { serializeError } from "./error"
import { createFetch } from "./fetch"
import { parseModelIdentifier } from "./models"
import { OpenAIChatCompletion } from "./openai"
import { LanguageModelConfiguration } from "./host"
import { host } from "./host"
import { logError, logVerbose } from "./util"
import { checkCancelled } from "./cancellation"

/**
 * Lists available models for the Ollama language model configuration.
 * Fetches model data from a remote endpoint and formats it into a LanguageModelInfo array.
 *
 * @param cfg - The configuration for the language model.
 * @returns A promise that resolves to an array of LanguageModelInfo objects.
 */
async function listModels(
    cfg: LanguageModelConfiguration
): Promise<LanguageModelInfo[]> {
    // Create a fetch instance to make HTTP requests
    const fetch = await createFetch({ retries: 0 })
    // Fetch the list of models from the remote API
    const res = await fetch(cfg.base.replace("/v1", "/api/tags"), {
        method: "GET",
    })
    if (res.status !== 200) return []
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
    return models.map(
        (m) =>
            <LanguageModelInfo>{
                id: m.name,
                details: `${m.name}, ${m.details.parameter_size}`,
                url: `https://ollama.com/library/${m.name}`,
            }
    )
}

const pullModel: PullModelFunction = async (modelId, options) => {
    const { trace, cancellationToken } = options || {}
    const { provider, model } = parseModelIdentifier(modelId)
    const fetch = await createFetch({ retries: 0, ...options })
    const conn = await host.getLanguageModelConfiguration(modelId, {
        token: true,
        cancellationToken,
        trace,
    })
    conn.base = conn.base.replace(/\/v1$/i, "")
    try {
        // test if model is present
        const resTags = await fetch(`${conn.base}/api/tags`, {
            retries: 0,
            method: "GET",
            headers: {
                "User-Agent": TOOL_ID,
                "Content-Type": "application/json",
            },
        })
        if (resTags.ok) {
            const { models }: { models: { model: string }[] } =
                await resTags.json()
            if (models.find((m) => m.model === model)) return { ok: true }
        }

        // pull
        logVerbose(`${provider}: pull ${model}`)
        const resPull = await fetch(`${conn.base}/api/pull`, {
            retries: 0,
            method: "POST",
            headers: {
                "User-Agent": TOOL_ID,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: model, stream: true }, null, 2),
        })
        if (!resPull.ok) {
            logError(`${provider}: failed to pull model ${model}`)
            return { ok: false, status: resPull.status }
        }
        const reader = resPull.body.getReader()
        const decoder = host.createUTF8Decoder()
        let done = false
        while (!done) {
            checkCancelled(cancellationToken)
            const { value, done: readerDone } = await reader.read()
            done = readerDone
            if (value) {
                const chunk = JSON.parse(
                    decoder.decode(value, { stream: true })
                )
                process.stderr.write(".")
            }
        }
        return { ok: true }
    } catch (e) {
        logError(`${provider}: failed to pull model ${model}`)
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
