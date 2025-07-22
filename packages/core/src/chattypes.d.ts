/**
 * This module defines TypeScript types and interfaces for chat completions using the OpenAI API.
 * These types represent structured data for various chat-related functionalities.
 *
 * Tags: TypeScript, OpenAI, Chat, Types, Interfaces
 */
import OpenAI from "openai";
import type { Logprob, PromptCacheControlType, RetryOptions, SerializedError } from "./types.js";
export type ChatModel = OpenAI.Models.Model;
export type ChatModels = {
    object: "list";
    data: Partial<ChatModel>[];
};
export type ChatCompletionToolChoiceOption = OpenAI.Chat.ChatCompletionToolChoiceOption;
export type ChatCompletionNamedToolChoice = OpenAI.Chat.ChatCompletionNamedToolChoice;
export type ChatCompletionReasoningEffort = OpenAI.ReasoningEffort;
export type ChatCompletionUsage = OpenAI.Completions.CompletionUsage & {
    duration?: number;
};
export type ChatCompletionUsageCompletionTokensDetails = OpenAI.Completions.CompletionUsage.CompletionTokensDetails;
export type ChatCompletionUsagePromptTokensDetails = OpenAI.Completions.CompletionUsage.PromptTokensDetails;
export type ImageGenerationResponse = OpenAI.Images.ImagesResponse;
export type ChatCompletionContentPartText = OpenAI.Chat.Completions.ChatCompletionContentPartText;
export type ChatCompletionContentPart = OpenAI.Chat.Completions.ChatCompletionContentPart;
export type ChatCompletionContentPartRefusal = OpenAI.Chat.Completions.ChatCompletionContentPartRefusal;
export type ChatCompletionContentPartInputAudio = OpenAI.Chat.Completions.ChatCompletionContentPartInputAudio;
export type ChatCompletionTool = OpenAI.Chat.Completions.ChatCompletionTool;
export type ChatCompletionChunk = OpenAI.Chat.Completions.ChatCompletionChunk;
export type ChatCompletionChunkChoice = OpenAI.Chat.Completions.ChatCompletionChunk.Choice & {
    delta?: ChatCompletionMessageReasoningContentParam;
};
export type ChatCompletionTokenLogprob = OpenAI.ChatCompletionTokenLogprob;
export type ChatCompletion = OpenAI.Chat.Completions.ChatCompletion;
export type ChatCompletionChoice = OpenAI.Chat.Completions.ChatCompletion.Choice & {
    message: ChatCompletionMessage;
};
export interface ChatCompletionMessageParamCacheControl {
    cacheControl?: PromptCacheControlType;
}
export type ChatCompletionMessage = OpenAI.Chat.Completions.ChatCompletionMessage & ChatCompletionMessageReasoningContentParam;
export type ChatCompletionSystemMessageParam = OpenAI.Chat.Completions.ChatCompletionSystemMessageParam & ChatCompletionMessageParamCacheControl;
export type ChatCompletionToolMessageParam = OpenAI.Chat.Completions.ChatCompletionToolMessageParam & ChatCompletionMessageParamCacheControl;
export type ChatCompletionFunctionMessageParam = OpenAI.Chat.Completions.ChatCompletionFunctionMessageParam & ChatCompletionMessageParamCacheControl;
/**
 * Type representing parameters for chat completion messages.
 */
export type ChatCompletionMessageParam = ChatCompletionSystemMessageParam | ChatCompletionUserMessageParam | ChatCompletionAssistantMessageParam | ChatCompletionToolMessageParam | ChatCompletionFunctionMessageParam;
/**
 * Type representing a request to create a chat completion, extending from OpenAI's
 * streaming parameters minus the 'messages' property.
 */
export type CreateChatCompletionRequest = Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming, "messages"> & {
    /**
     * A list of messages comprising the conversation so far.
     */
    messages: ChatCompletionMessageParam[];
};
export interface ChatCompletionMessageReasoningContentParam {
    reasoning_content?: string;
    signature?: string;
}
export type ChatCompletionAssistantMessageParam = OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam & ChatCompletionMessageParamCacheControl & ChatCompletionMessageReasoningContentParam;
export type ChatCompletionChunkChoiceChoiceDelta = OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta & ChatCompletionMessageReasoningContentParam;
export type ChatCompletionUserMessageParam = OpenAI.Chat.Completions.ChatCompletionUserMessageParam & ChatCompletionMessageParamCacheControl;
export type ChatCompletionContentPartImage = OpenAI.Chat.Completions.ChatCompletionContentPartImage;
export type ChatCompletionMessageToolCall = OpenAI.Chat.Completions.ChatCompletionMessageToolCall;
export type EmbeddingCreateParams = OpenAI.Embeddings.EmbeddingCreateParams;
export type EmbeddingCreateResponse = OpenAI.Embeddings.CreateEmbeddingResponse;
export interface EmbeddingResult {
    data?: number[][];
    model?: string;
    error?: string;
    status: "success" | "error" | "rate_limited" | "cancelled";
}
/**
 * Interface representing a call to a chat completion tool.
 */
export interface ChatCompletionToolCall {
    id: string;
    name: string;
    arguments?: string;
}
/**
 * Interface representing a response from chat completion.
 */
export interface ChatCompletionResponse {
    text?: string;
    reasoning?: string;
    signature?: string;
    cached?: boolean;
    variables?: Record<string, string>;
    toolCalls?: ChatCompletionToolCall[];
    finishReason?: // Reason why the chat completion finished
    "stop" | "length" | "tool_calls" | "content_filter" | "cancel" | "fail";
    usage?: ChatCompletionUsage;
    model?: string;
    error?: SerializedError;
    logprobs?: ChatCompletionTokenLogprob[];
    duration?: number;
}
export type ChatFinishReason = ChatCompletionResponse["finishReason"];
export declare const ModelError: typeof import("openai").APIError;
/**
 * Interface representing a progress report for chat completions.
 */
export interface ChatCompletionsProgressReport {
    tokensSoFar: number;
    responseSoFar: string;
    responseChunk: string;
    responseTokens?: Logprob[];
    reasoningTokens?: Logprob[];
    reasoningSoFar?: string;
    reasoningChunk?: string;
    inner: boolean;
}
/**
 * Interface representing options for chat completions.
 */
export interface ChatCompletionsOptions extends RetryOptions {
    partialCb?: (progress: ChatCompletionsProgressReport) => void;
    requestOptions?: Partial<Omit<RequestInit, "signal">>;
    maxCachedTemperature?: number;
    maxCachedTopP?: number;
    cache?: boolean | string;
    inner: boolean;
}
//# sourceMappingURL=chattypes.d.ts.map