import OpenAI from "openai"
import { Cache } from "./cache"
import { MarkdownTrace } from "./trace"
import { PromptImage } from "./promptdom"
import { AICIRequest } from "./aici"
import { OAIToken } from "./host"

export type ChatCompletionTool = OpenAI.Chat.Completions.ChatCompletionTool

export type ChatCompletionChunk = OpenAI.Chat.Completions.ChatCompletionChunk

export type ChatCompletionSystemMessageParam =
    OpenAI.Chat.Completions.ChatCompletionSystemMessageParam

export type ChatCompletionMessageParam =
    | OpenAI.Chat.Completions.ChatCompletionMessageParam
    | AICIRequest

export type CreateChatCompletionRequest = Omit<
    OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming,
    "messages"
> & {
    /**
     * A list of messages comprising the conversation so far.
     * [Example Python code](https://cookbook.openai.com/examples/how_to_format_inputs_to_chatgpt_models).
     */
    //  messages: Array<ChatCompletionMessageParam>;
    messages: Array<ChatCompletionMessageParam>
}

export type ChatCompletionAssistantMessageParam =
    OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam

export type ChatCompletionContentPartImage =
    OpenAI.Chat.Completions.ChatCompletionContentPartImage

export interface ChatCompletionToolCall {
    id: string
    name: string
    arguments?: string
}

export interface ChatCompletionResponse {
    text?: string
    toolCalls?: ChatCompletionToolCall[]
    finishReason?:
        | "stop"
        | "length"
        | "tool_calls"
        | "content_filter"
        | "cancel"
}

export const ModelError = OpenAI.APIError

export function getChatCompletionCache() {
    return Cache.byName<CreateChatCompletionRequest, string>("openai")
}

export interface ChatCompletionsProgressReport {
    tokensSoFar: number
    responseSoFar: string
    responseChunk: string
}

export interface ChatCompletionsOptions {
    partialCb?: (progres: ChatCompletionsProgressReport) => void
    requestOptions?: Partial<RequestInit>
    maxCachedTemperature?: number
    maxCachedTopP?: number
    cache?: boolean
    retry?: number
    retryDelay?: number
    maxDelay?: number
}

export class RequestError extends Error {
    constructor(
        public readonly status: number,
        public readonly statusText: string,
        public readonly body: any,
        public readonly bodyText: string,
        readonly retryAfter: number
    ) {
        super(
            `OpenAI error: ${
                body?.message ? body?.message : `${statusText} (${status})`
            }`
        )
    }
}

export function toChatCompletionUserMessage(
    expanded: string,
    images?: PromptImage[]
) {
    return <OpenAI.Chat.Completions.ChatCompletionUserMessageParam>{
        role: "user",
        content: [
            {
                type: "text",
                text: expanded,
            },
            ...(images || []).map(
                ({ url, detail }) =>
                    <ChatCompletionContentPartImage>{
                        type: "image_url",
                        image_url: {
                            url,
                            detail,
                        },
                    }
            ),
        ],
    }
}

function encodeMessagesForLlama(req: CreateChatCompletionRequest) {
    return (
        req.messages
            .map((msg) => {
                switch (msg.role) {
                    case "user":
                        return `[INST]\n${msg.content}\n[/INST]`
                    case "system":
                        return `[INST] <<SYS>>\n${msg.content}\n<</SYS>>\n[/INST]`
                    case "assistant":
                        return msg.content
                    case "function":
                        return "???function"
                    default:
                        return "???role " + msg.role
                }
            })
            .join("\n")
            .replace(/\[\/INST\]\n\[INST\]/g, "\n") + "\n"
    )
}

export type ChatCompletionHandler = (
    req: CreateChatCompletionRequest,
    connection: OAIToken,
    options: ChatCompletionsOptions & { trace: MarkdownTrace }
) => Promise<ChatCompletionResponse>

export interface LanguageModel {
    id: string
    completer: ChatCompletionHandler
}
