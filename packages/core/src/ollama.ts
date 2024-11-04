// Import necessary modules and types for handling chat completions and model management
import { ChatCompletionHandler, LanguageModel, LanguageModelInfo } from "./chat"
import {
    MODEL_PROVIDER_OLLAMA,
    OLLAMA_API_BASE,
    OLLAMA_DEFAUT_PORT,
} from "./constants"
import { isRequestError } from "./error"
import { createFetch } from "./fetch"
import { parseModelIdentifier } from "./models"
import { OpenAIChatCompletion } from "./openai"
import { LanguageModelConfiguration } from "./host"
import { URL } from "url"
import { Ollama, Message } from "ollama"
import { ChatCompletionMessageParam } from "./chattypes"
import { TraceOptions } from "./trace"

async function messagesToOllamaMessages(
    messages: ChatCompletionMessageParam[],
    options?: TraceOptions
): Promise<Message[]> {
    const renderMessageContent = async (
        msg: ChatCompletionMessageParam
    ): Promise<Message> => {
        const { role, content } = msg
        // Return the content directly if it's a simple string.
        if (typeof content === "string") return { role, content }
        // If the content is an array, process each element based on its type.
        else if (Array.isArray(content)) {
            let images: string[] = []
            let text = ""
            for (const c of content) {
                switch (c.type) {
                    case "text":
                        text += c.text
                        break
                    case "image_url": {
                        const fetch = await createFetch(options)
                        const imgRes = await fetch(c.image_url.url)
                        const buf = Buffer.from(await imgRes.arrayBuffer())
                        images.push(buf.toString("base64"))
                        break
                    }
                    default:
                        text += `unknown message type ${c.type}`
                }
            }
            return {
                role,
                content: text,
                images: images?.length ? images : undefined,
            }
        }
        throw new Error("unknown message")
    }
    const res: Message[] = []
    for (const msg of messages) {
        res.push(await renderMessageContent(msg))
    }
    return res
}

/**
 * Handles chat completion requests using the Ollama model.
 * Tries to complete the request using the OpenAIChatCompletion function.
 * If the model is not found locally, it attempts to pull the model from a remote source.
 *
 * @param req - The request object containing model information.
 * @param cfg - The configuration for the language model.
 * @param options - Additional options for the request.
 * @param trace - A trace object for logging purposes.
 * @returns The result of the chat completion.
 * @throws Will throw an error if the model cannot be pulled or any other request error occurs.
 */
export const OllamaCompletion: ChatCompletionHandler = async (
    req,
    cfg,
    options,
    trace
) => {
    const { model } = parseModelIdentifier(req.model)
    const { tools, messages } = req
    const stream: boolean = !tools?.length
    try {
        const ollamaMessages = await messagesToOllamaMessages(messages, {
            trace,
        })
        const fetch = await createFetch({ trace })
        const client = new Ollama({
            host: cfg.base,
            fetch,
        })
        if (stream) {
            const response = await client.chat({
                model,
                messages: [{ role: "user", content: "Why is the sky blue?" }],
                stream: true,
            })
            for await (const part of response) {
            }
        } else {
            const response = await client.chat({
                model,
                messages: [{ role: "user", content: "Why is the sky blue?" }],
                stream: false,
                tools,
            })
        }
    } catch (e) {
        if (isRequestError(e)) {
            // If model is not found, try pulling it from the remote source
            if (
                e.status === 404 &&
                e.body?.type === "api_error" &&
                e.body?.message?.includes(`model '${model}' not found`)
            ) {
                trace.log(`model ${model} not found, trying to pull it`)

                // Model not installed locally, initiate fetch to pull model
                const fetch = await createFetch({ trace })
                const res = await fetch(cfg.base.replace("/v1", "/api/pull"), {
                    method: "POST",
                    body: JSON.stringify({ name: model, stream: false }),
                })
                if (!res.ok) {
                    throw new Error(
                        `Failed to pull model ${model}: ${res.status} ${res.statusText}`
                    )
                }
                trace.log(`model pulled`)
                // Retry the completion request after pulling the model
                return await OpenAIChatCompletion(req, cfg, options, trace)
            }
        }

        // Rethrow any other errors encountered
        throw e
    }
}

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
    const fetch = await createFetch()
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

// Define the Ollama model with its completion handler and model listing function
export const OllamaModel = Object.freeze<LanguageModel>({
    completer: OllamaCompletion,
    id: MODEL_PROVIDER_OLLAMA,
    listModels,
})

export function parseHostVariable(env: Record<string, string>) {
    const s = (
        env.OLLAMA_HOST ||
        env.OLLAMA_API_BASE ||
        OLLAMA_API_BASE
    )?.trim()
    const ipm =
        /^(?<address>(localhost|\d+\.\d+\.\d+\.\d+))(:(?<port>\d+))?$/i.exec(s)
    if (ipm)
        return `http://${ipm.groups.address}:${ipm.groups.port || OLLAMA_DEFAUT_PORT}`
    const url = new URL(s)
    return url.href
}
