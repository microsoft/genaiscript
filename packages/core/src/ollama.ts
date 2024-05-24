import { ChatCompletionHandler, LanguageModel } from "./chat"
import { MODEL_PROVIDER_OLLAMA } from "./constants"
import { isRequestError } from "./error"
import { createFetch } from "./fetch"
import { parseModelIdentifier } from "./models"
import { OpenAIChatCompletion } from "./openai"
import { host } from "./host"

export const OllamaCompletion: ChatCompletionHandler = async (
    req,
    cfg,
    options,
    trace
) => {
    try {
        return await OpenAIChatCompletion(req, cfg, options, trace)
    } catch (e) {
        if (isRequestError(e)) {
            const { modelId } = parseModelIdentifier(req.model)
            if (
                e.status === 404 &&
                e.body?.type === "api_error" &&
                e.body?.message?.includes(`model '${modelId}' not found`)
            ) {
                trace.log(`model ${modelId} not found, trying to pull it`)
                // model not installed locally
                // trim v1
                const fetch = await createFetch({ trace })
                const res = await fetch(cfg.base.replace("/v1", "/api/pull"), {
                    method: "POST",
                    body: JSON.stringify({ name: modelId, stream: false }),
                })
                if (!res.ok) {
                    throw new Error(
                        `Failed to pull model ${modelId}: ${res.status} ${res.statusText}`
                    )
                }
                trace.log(`model pulled`)
                return await OpenAIChatCompletion(req, cfg, options, trace)
            }
        }

        throw e
    }
}

export const OllamaModel = Object.freeze<LanguageModel>({
    completer: OllamaCompletion,
    id: MODEL_PROVIDER_OLLAMA,
})

export async function listLocalModels() {
    const cfg = await host.getSecretToken("ollama:*")
    if (!cfg) return []

    const fetch = await createFetch()
    const res = await fetch(cfg.base.replace("/v1", "/api/tags"), {
        method: "GET",
    })
    const { models } = await res.json()
    return models as {
        name: string
        size: number
        details: {
            parameter_size: string
            family: string
        }
    }[]
}
