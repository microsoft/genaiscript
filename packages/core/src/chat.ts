import OpenAI from "openai"
import { Cache } from "./cache"
import { MarkdownTrace } from "./trace"
import { ChatCompletionUserMessageParam } from "openai/resources"
import { PromptImage } from "./promptdom"

export type CreateChatCompletionRequest =
    OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming

export type ChatCompletionRequestMessage =
    OpenAI.Chat.Completions.ChatCompletionMessageParam

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
    return <ChatCompletionUserMessageParam>{
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
    options: ChatCompletionsOptions & { trace: MarkdownTrace }
) => Promise<ChatCompletionResponse>
