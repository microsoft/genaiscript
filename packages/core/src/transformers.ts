import { ChatCompletionHandler, LanguageModel } from "./chat"
import { renderMessageContent } from "./chatrender"
import { MODEL_PROVIDER_TRANSFORMERS } from "./constants"
import type {
    Chat,
    Message,
    TextGenerationOutput,
    TextGenerationPipeline,
    ProgressCallback,
    ProgressInfo,
} from "@huggingface/transformers"
import { NotSupportedError } from "./error"
import { ChatCompletionMessageParam, ChatCompletionResponse } from "./chattypes"
import { dotGenaiscriptPath, logVerbose } from "./util"
import { parseModelIdentifier } from "./models"
import prettyBytes from "pretty-bytes"
import { hash } from "./crypto"
import { PLimitPromiseQueue } from "./concurrency"
import { deleteUndefinedValues } from "./cleaners"

function progressBar(): ProgressCallback {
    const progress: Record<string, number> = {}
    return (cb: ProgressInfo) => {
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

async function loadGenerator(
    family: string,
    options: object
): Promise<TextGenerationPipeline> {
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
    const { partialCb, inner } = options
    const { model, tag, family } = parseModelIdentifier(req.model)

    trace.itemValue("model", model)

    const device =
        process.env.HUGGINGFACE_TRANSFORMERS_DEVICE ||
        process.env.TRANSFORMERS_DEVICE ||
        "cpu"
    const generator: TextGenerationPipeline = await generationQueue.add(() =>
        loadGenerator(family, {
            dtype: tag,
            device,
        })
    )
    const msgs: Chat = await chatMessagesToTranformerMessages(messages)
    trace.detailsFenced("messages", msgs, "yaml")
    const tokenizer = generator.tokenizer
    const chatTemplate = !!tokenizer.chat_template
    const texts: Chat | string = chatTemplate
        ? msgs
        : msgs.map((msg) => `${msg.role}:\n${msg.content}`).join("\n\n")
    if (chatTemplate) trace.detailsFenced("texts", texts, "markdown")

    const { TextStreamer } = await import("@huggingface/transformers")
    let chatResp = ""
    let tokensSoFar = 0
    const streamer = new TextStreamer(tokenizer, {
        skip_prompt: true,
        callback_function: (text: string) => {
            chatResp += text
            tokensSoFar += tokenizer(text).length
            partialCb?.({
                tokensSoFar,
                responseSoFar: chatResp,
                responseChunk: text,
                responseTokens: [
                    { token: text, logprob: Number.NaN } satisfies Logprob,
                ],
                inner,
            })
        },
    })
    const output = (await generator(
        texts,
        deleteUndefinedValues({
            max_new_tokens: max_tokens || 4000,
            do_sample: false,
            temperature,
            top_p,
            early_stopping: true,
            streamer,
        })
    )) as TextGenerationOutput
    const text = output
        .map((msg) => msg.generated_text)
        .map((msg) =>
            typeof msg === "string" ? msg : (msg.at(-1) as Message).content
        )
        .join("")
    trace.fence(text, "markdown")
    partialCb?.({
        responseSoFar: text,
        responseChunk: text,
        tokensSoFar: tokenizer(chatResp),
        inner,
    })

    const finishReason = "stop"
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

async function chatMessagesToTranformerMessages(
    messages: ChatCompletionMessageParam[]
): Promise<Chat> {
    const res: Chat = []
    for (const msg of messages) {
        switch (msg.role) {
            case "function":
            case "tool":
                throw new NotSupportedError(`role ${msg.role} not supported`)
            default:
                res.push({
                    role: msg.role,
                    content: await renderMessageContent(msg),
                } satisfies Message)
        }
    }
    return res
}
