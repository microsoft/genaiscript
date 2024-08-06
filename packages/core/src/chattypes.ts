import OpenAI from "openai"

export interface AICIRequest {
    role: "aici"
    content?: string
    error?: unknown
    functionName: string
}

export type ChatCompletionContentPartText =
    OpenAI.Chat.Completions.ChatCompletionContentPartText

export type ChatCompletionContentPart =
    OpenAI.Chat.Completions.ChatCompletionContentPart

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
    messages: ChatCompletionMessageParam[]
}

export type ChatCompletionAssistantMessageParam =
    OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam

export type ChatCompletionUserMessageParam =
    OpenAI.Chat.Completions.ChatCompletionUserMessageParam

export type ChatCompletionContentPartImage =
    OpenAI.Chat.Completions.ChatCompletionContentPartImage

export type EmbeddingCreateParams = OpenAI.Embeddings.EmbeddingCreateParams

export type EmbeddingCreateResponse = OpenAI.Embeddings.CreateEmbeddingResponse

export interface ChatCompletionToolCall {
    id: string
    name: string
    arguments?: string
}

export interface ChatCompletionResponse {
    text?: string
    cached?: boolean
    variables?: Record<string, string>
    toolCalls?: ChatCompletionToolCall[]
    finishReason?:
        | "stop"
        | "length"
        | "tool_calls"
        | "content_filter"
        | "cancel"
        | "fail"
}

export const ModelError = OpenAI.APIError

export interface ChatCompletionsProgressReport {
    tokensSoFar: number
    responseSoFar: string
    responseChunk: string
}

export interface ChatCompletionsOptions {
    partialCb?: (progress: ChatCompletionsProgressReport) => void
    requestOptions?: Partial<Omit<RequestInit, "signal">>
    maxCachedTemperature?: number
    maxCachedTopP?: number
    cache?: boolean
    cacheName?: string
    retry?: number
    retryDelay?: number
    maxDelay?: number
}
