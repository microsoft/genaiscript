import { ChatCompletionHandler, LanguageModel } from "./chat"
import { renderMessageContent } from "./chatrender"
import { MODEL_PROVIDER_TRANSFORMERS } from "./constants"
import type {
    Chat,
    Message,
    TextGenerationOutput,
} from "@huggingface/transformers"
import { NotSupportedError } from "./error"
import { ChatCompletionMessageParam, ChatCompletionResponse } from "./chattypes"
import { deleteUndefinedValues, dotGenaiscriptPath, logVerbose } from "./util"
import { parseModelIdentifier } from "./models"
import prettyBytes from "pretty-bytes"

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

function progressBar() {
    const progress: Record<string, number> = {}
    return (cb: GeneratorProgress) => {
        if (cb.status !== "progress") return
        const p = progress[cb.file] || 0
        const cp = Math.floor(cb.progress)
        if (cp > p) {
            progress[cb.file] = cp
            logVerbose(`${cb.file}: ${cp}% (${prettyBytes(cb.loaded)})`)
        }
    }
}

export const TransformersCompletion: ChatCompletionHandler = async (
    req,
    cfg,
    options,
    trace
) => {
    const { messages, temperature, top_p, max_tokens } = req
    const { partialCb, inner } = options
    const { model, tag, family } = parseModelIdentifier(req.model)
    try {
        trace.startDetails(`transformer`)
        trace.itemValue("model", model)

        const { pipeline } = await import("@huggingface/transformers")
        // Create a text generation pipeline
        const generator = await pipeline("text-generation", family, {
            dtype: tag as any,
            cache_dir: dotGenaiscriptPath("cache", "transformers"),
            progress_callback: progressBar(),
            device: "cpu",
        })
        logVerbose(`transformers model ${model} loaded`)
        logVerbose(``)
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
            .join("\n")
        trace.fence(text, "markdown")
        partialCb?.({
            responseSoFar: text,
            responseChunk: text,
            tokensSoFar: 0,
            inner,
        })
        return {
            text,
            finishReason: "stop",
        } satisfies ChatCompletionResponse
    } catch (e) {
        logVerbose(e)
        throw e
    } finally {
        trace.endDetails()
    }
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
