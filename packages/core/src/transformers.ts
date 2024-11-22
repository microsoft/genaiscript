import { ChatCompletionHandler, LanguageModel } from "./chat"
import { renderMessageContent } from "./chatrender"
import { MODEL_PROVIDER_TRANSFORMERS } from "./constants"
import type {
    Chat,
    Message,
    TextGenerationOutput,
    TextGenerationPipeline,
} from "@huggingface/transformers"
import { NotSupportedError } from "./error"
import { ChatCompletionMessageParam, ChatCompletionResponse } from "./chattypes"
import { deleteUndefinedValues, dotGenaiscriptPath, logVerbose } from "./util"
import { parseModelIdentifier } from "./models"
import prettyBytes from "pretty-bytes"
import { hash } from "./crypto"
import {
    ChatCompletionRequestCacheKey,
    getChatCompletionCache,
} from "./chatcache"
import { PLimitPromiseQueue } from "./concurrency"

type GeneratorProgress =
    | {
          status: "initiate"
      }
    | {
          status: "progress"
          file: string
          name: string
          progress: number
          loaded: number
          total: number
      }
    | { status: "ready"; task: string; model: string }

function progressBar() {
    const progress: Record<string, number> = {}
    return (cb: GeneratorProgress) => {
        switch (cb.status) {
            case "progress":
                const p = progress[cb.file] || 0
                const cp = Math.floor(cb.progress)
                if (cp > p + 5) {
                    progress[cb.file] = cp
                    logVerbose(`${cb.file}: ${cp}% (${prettyBytes(cb.loaded)})`)
                }
                break
            case "ready": {
                logVerbose(`model ${cb.model} ready`)
                logVerbose(``)
                break
            }
        }
    }
}

const generators: Record<string, Promise<TextGenerationPipeline>> = {}
const generationQueue = new PLimitPromiseQueue(1)

async function loadGenerator(family: string, options: object) {
    const h = await hash({ family, options })
    let p = generators[h]
    if (!p) {
        const { pipeline } = await import("@huggingface/transformers")
        p = generators[h] = pipeline("text-generation", family, {
            ...options,
            cache_dir: dotGenaiscriptPath("cache", "transformers"),
            progress_callback: progressBar(),
        })
    }
    return p
}

export const TransformersCompletion: ChatCompletionHandler = async (
    req,
    cfg,
    options,
    trace
) => {
    const { messages, temperature, top_p, max_tokens } = req
    const { partialCb, inner, cache: cacheOrName, cacheName } = options
    const { model, tag, family } = parseModelIdentifier(req.model)

    trace.itemValue("model", model)

    const cache = !!cacheOrName || !!cacheName
    const cacheStore = getChatCompletionCache(
        typeof cacheOrName === "string" ? cacheOrName : cacheName
    )
    const cachedKey = cache
        ? <ChatCompletionRequestCacheKey>{
              ...req,
              model: req.model,
              temperature: req.temperature,
              top_p: req.top_p,
              max_tokens: req.max_tokens,
              logit_bias: req.logit_bias,
          }
        : undefined
    trace.itemValue(`caching`, cache)
    trace.itemValue(`cache`, cacheStore?.name)
    const { text: cached, finishReason: cachedFinishReason } =
        (await cacheStore.get(cachedKey)) || {}
    if (cached !== undefined) {
        partialCb?.({
            tokensSoFar: 0, // TODO
            responseSoFar: cached,
            responseChunk: cached,
            inner,
        })
        trace.itemValue(`cache hit`, await cacheStore.getKeySHA(cachedKey))
        return { text: cached, finishReason: cachedFinishReason, cached: true }
    }

    const generator = await generationQueue.add(() => loadGenerator(family, {
        dtype: tag,
        device: "cpu",
    }))
    const msgs: Chat = chatMessagesToTranformerMessages(messages)
    trace.detailsFenced("messages", msgs, "yaml")
    const output = (await generator(
        msgs,
        deleteUndefinedValues({
            max_new_tokens: max_tokens || 4000,
            temperature,
            top_p,
            early_stopping: true,
        })
    )) as TextGenerationOutput
    const text = output
        .map((msg) => (msg.generated_text.at(-1) as Message).content)
        .join("")
    trace.fence(text, "markdown")
    partialCb?.({
        responseSoFar: text,
        responseChunk: text,
        tokensSoFar: 0,
        inner,
    })

    const finishReason = "stop"
    if (finishReason === "stop")
        await cacheStore.set(cachedKey, { text, finishReason })

    return {
        text,
        finishReason: "stop",
    } satisfies ChatCompletionResponse
}

// Define the Ollama model with its completion handler and model listing function
export const TransformersModel = Object.freeze<LanguageModel>({
    completer: TransformersCompletion,
    id: MODEL_PROVIDER_TRANSFORMERS,
})

function chatMessagesToTranformerMessages(
    messages: ChatCompletionMessageParam[]
): Chat {
    return messages.map((msg) => {
        switch (msg.role) {
            case "function":
            case "aici":
            case "tool":
                throw new NotSupportedError(`role ${msg.role} not supported`)
            default:
                return {
                    role: msg.role,
                    content: renderMessageContent(msg),
                } satisfies Message
        }
    })
}
