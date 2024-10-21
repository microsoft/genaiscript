/**
 * This module defines TypeScript types and interfaces for chat completions using the OpenAI API.
 * These types represent structured data for various chat-related functionalities.
 *
 * Tags: TypeScript, OpenAI, Chat, Types, Interfaces
 */

import OpenAI from "openai"

/**
 * Interface representing a custom AI Chat Interface request.
 */
export interface AICIRequest {
    role: "aici" // The role for this type of request
    content?: string // Optional content of the request
    error?: unknown // Optional error information
    functionName: string // Name of the function being requested
}

// Aliases for OpenAI chat completion types
export type ChatCompletionUsage = OpenAI.Completions.CompletionUsage
export type ChatCompletionUsageCompletionTokensDetails =
    OpenAI.Completions.CompletionUsage.CompletionTokensDetails
export type ChatCompletionUsagePromptTokensDetails =
    OpenAI.Completions.CompletionUsage.PromptTokensDetails

// Text content part of a chat completion
export type ChatCompletionContentPartText =
    OpenAI.Chat.Completions.ChatCompletionContentPartText

// General content part of a chat completion
export type ChatCompletionContentPart =
    OpenAI.Chat.Completions.ChatCompletionContentPart

// Tool used in a chat completion
export type ChatCompletionTool = OpenAI.Chat.Completions.ChatCompletionTool

// Chunk of a chat completion response
export type ChatCompletionChunk = OpenAI.Chat.Completions.ChatCompletionChunk

// Parameters for a system message in a chat completion
export type ChatCompletionSystemMessageParam =
    OpenAI.Chat.Completions.ChatCompletionSystemMessageParam

// Parameters for a tool message in a chat completion
export type ChatCompletionToolMessageParam =
    OpenAI.Chat.Completions.ChatCompletionToolMessageParam

/**
 * Type representing parameters for chat completion messages, including custom AICIRequest.
 */
export type ChatCompletionMessageParam =
    | OpenAI.Chat.Completions.ChatCompletionMessageParam
    | AICIRequest

/**
 * Type representing a request to create a chat completion, extending from OpenAI's
 * streaming parameters minus the 'messages' property.
 */
export type CreateChatCompletionRequest = Omit<
    OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming,
    "messages"
> & {
    /**
     * A list of messages comprising the conversation so far.
     */
    messages: ChatCompletionMessageParam[]
}

// Parameters for an assistant message in a chat completion
export type ChatCompletionAssistantMessageParam =
    OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam

// Parameters for a user message in a chat completion
export type ChatCompletionUserMessageParam =
    OpenAI.Chat.Completions.ChatCompletionUserMessageParam

// Image content part of a chat completion
export type ChatCompletionContentPartImage =
    OpenAI.Chat.Completions.ChatCompletionContentPartImage

// Parameters for creating embeddings
export type EmbeddingCreateParams = OpenAI.Embeddings.EmbeddingCreateParams

// Response type for creating embeddings
export type EmbeddingCreateResponse = OpenAI.Embeddings.CreateEmbeddingResponse

/**
 * Interface representing a call to a chat completion tool.
 */
export interface ChatCompletionToolCall {
    id: string // Unique identifier for the tool call
    name: string // Tool name being called
    arguments?: string // Optional arguments for the tool
}

/**
 * Interface representing a response from chat completion.
 */
export interface ChatCompletionResponse {
    text?: string // Optional text response
    cached?: boolean // Indicates if the response was cached
    variables?: Record<string, string> // Optional variables associated with the response
    toolCalls?: ChatCompletionToolCall[] // List of tool calls made during the response
    finishReason?: // Reason why the chat completion finished
    "stop" | "length" | "tool_calls" | "content_filter" | "cancel" | "fail"
    usage?: ChatCompletionUsage // Usage information for the completion
    model?: string // Model used for the completion
}

export type ChatFinishReason = ChatCompletionResponse["finishReason"]

// Alias for OpenAI's API error type
export const ModelError = OpenAI.APIError

/**
 * Interface representing a progress report for chat completions.
 */
export interface ChatCompletionsProgressReport {
    tokensSoFar: number // Number of tokens processed so far
    responseSoFar: string // Partial response generated so far
    responseChunk: string // Current chunk of response being processed
    responseTokens?: string[] // Tokens in the current response chunk
    inner: boolean // Indicates if this is an inner report
}

/**
 * Interface representing options for chat completions.
 */
export interface ChatCompletionsOptions {
    partialCb?: (progress: ChatCompletionsProgressReport) => void // Callback for partial responses
    requestOptions?: Partial<Omit<RequestInit, "signal">> // Custom request options
    maxCachedTemperature?: number // Max temperature for caching responses
    maxCachedTopP?: number // Max top-p for caching responses
    cache?: boolean | string // Cache setting or cache name
    cacheName?: string // Name of the cache to use
    retry?: number // Number of retries for failed requests
    retryDelay?: number // Delay between retries
    maxDelay?: number // Maximum delay for retry attempts
    inner: boolean // Indicates if the option is for inner processing
}
