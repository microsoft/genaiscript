import type { MarkdownTrace, TraceOptions } from "./trace.js";
import type { PromptImage, PromptPrediction } from "./promptdom.js";
import type { GenerationOptions } from "./generation.js";
import type { CancellationOptions, CancellationToken } from "./cancellation.js";
import type { ChatCompletionMessageParam, ChatCompletionResponse, ChatCompletionsOptions, CreateChatCompletionRequest, EmbeddingResult } from "./chattypes.js";
import type { LanguageModelConfiguration, ResponseStatus } from "./server/messages.js";
import type { ContextExpansionOptions, ChatParticipant, EmbeddingsModelOptions, FileMergeHandler, FileOutput, JSONSchema, LanguageModelInfo, ModelOptions, PromptOutputProcessorHandler, RetryOptions, RunPromptResult, SerializedError, ToolCallback, TranscriptionOptions, TranscriptionResult, VectorIndexOptions, WorkspaceFileIndex, BufferLike } from "./types.js";
export type ChatCompletionHandler = (req: CreateChatCompletionRequest, connection: LanguageModelConfiguration, options: ChatCompletionsOptions & CancellationOptions & RetryOptions, trace: MarkdownTrace) => Promise<ChatCompletionResponse>;
export type ListModelsFunction = (cfg: LanguageModelConfiguration, options: TraceOptions & CancellationOptions & RetryOptions) => Promise<ResponseStatus & {
    models?: LanguageModelInfo[];
}>;
export type PullModelFunction = (cfg: LanguageModelConfiguration, options: TraceOptions & CancellationOptions & RetryOptions) => Promise<ResponseStatus>;
export type CreateTranscriptionRequest = {
    file: Blob;
    model: string;
} & TranscriptionOptions;
export type TranscribeFunction = (req: CreateTranscriptionRequest, cfg: LanguageModelConfiguration, options: TraceOptions & CancellationOptions & RetryOptions) => Promise<TranscriptionResult>;
export type CreateSpeechRequest = {
    input: string;
    model: string;
    voice?: string;
    instructions?: string;
};
export type CreateSpeechResult = {
    audio: Uint8Array;
    error?: SerializedError;
};
export type SpeechFunction = (req: CreateSpeechRequest, cfg: LanguageModelConfiguration, options: TraceOptions & CancellationOptions & RetryOptions) => Promise<CreateSpeechResult>;
export type CreateImageRequest = {
    model: string;
    prompt: string;
    quality?: string;
    size?: string;
    style?: string;
    outputFormat?: "png" | "jpeg" | "webp";
    mode?: "generate" | "edit";
    image?: BufferLike;
    mask?: BufferLike;
};
export interface ImageGenerationUsage {
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    input_tokens_details?: {
        text_tokens: number;
        image_tokens: number;
    };
}
export interface CreateImageResult {
    image: Uint8Array;
    error?: SerializedError;
    revisedPrompt?: string;
    usage?: ImageGenerationUsage;
}
export type ImageGenerationFunction = (req: CreateImageRequest, cfg: LanguageModelConfiguration, options: TraceOptions & CancellationOptions & RetryOptions) => Promise<CreateImageResult>;
export type EmbeddingFunction = (input: string | string[], cfg: LanguageModelConfiguration, options: TraceOptions & CancellationOptions & RetryOptions) => Promise<EmbeddingResult>;
export type WorkspaceFileIndexCreator = (indexName: string, cfg: LanguageModelConfiguration, embedder: EmbeddingFunction, options?: VectorIndexOptions & TraceOptions & CancellationOptions) => Promise<WorkspaceFileIndex>;
export interface LanguageModel {
    id: string;
    completer?: ChatCompletionHandler;
    listModels?: ListModelsFunction;
    pullModel?: PullModelFunction;
    transcriber?: TranscribeFunction;
    speaker?: SpeechFunction;
    imageGenerator?: ImageGenerationFunction;
    embedder?: EmbeddingFunction;
}
/**
 * Merges two sets of generation options, prioritizing values specified in the second parameter
 * while falling back to defaults from the first parameter and runtime configurations.
 *
 * @param options - A base set of generation options containing default values.
 * @param runOptions - A set of custom generation options that override the base values.
 * @returns A merged set of generation options with priority given to `runOptions` values.
 *
 * The merging process includes:
 * - `model`: Prioritized from `runOptions`, then `options`, and finally the runtime host's default large model.
 * - `temperature`: Taken from `runOptions` if present, otherwise from the runtime host's default large model settings.
 * - `fallbackTools`: Taken from `runOptions` if present, otherwise from the runtime host's default large model settings.
 * - `reasoningEffort`: Taken from `runOptions` if present, otherwise from the runtime host's default large model settings.
 * - `embeddingsModel`: Resolved from `runOptions` if defined or falls back to `options`.
 */
export declare function mergeGenerationOptions(options: GenerationOptions, runOptions: ModelOptions & EmbeddingsModelOptions): GenerationOptions;
/**
 * Executes a chat session by interacting with a language model, processing messages,
 * handling tool integrations, and managing responses.
 *
 * @param connectionToken - Configuration for connecting to the language model, excluding the token.
 * @param cancellationToken - Token to support cancellation of the chat session.
 * @param messages - List of chat messages exchanged during the session.
 * @param toolDefinitions - Definitions of tools that can be invoked during the session.
 * @param schemas - JSON schemas for validating response content.
 * @param fileOutputs - Files to be generated or modified during the session.
 * @param outputProcessors - Handlers for post-processing generated outputs.
 * @param fileMerges - Handlers for merging file outputs.
 * @param prediction - Prediction metadata to guide the response generation.
 * @param completer - Function that sends requests to the language model and returns the response.
 * @param chatParticipants - List of participants involved in the chat session.
 * @param disposables - Objects that require cleanup after the session ends.
 * @param genOptions - Options to customize the session execution, such as model configuration, behavior, and caching.
 *
 * @returns - The final structured result of the chat session.
 */
export declare function executeChatSession(connectionToken: LanguageModelConfiguration, cancellationToken: CancellationToken, messages: ChatCompletionMessageParam[], toolDefinitions: ToolCallback[], schemas: Record<string, JSONSchema>, fileOutputs: FileOutput[], outputProcessors: PromptOutputProcessorHandler[], fileMerges: FileMergeHandler[], prediction: PromptPrediction, completer: ChatCompletionHandler, chatParticipants: ChatParticipant[], disposables: AsyncDisposable[], genOptions: GenerationOptions): Promise<RunPromptResult>;
/**
 * Logs detailed information about a prompt result, including reasoning and output, in a structured format.
 *
 * @param trace - A trace instance used to record detailed logs and events during the prompt execution.
 * @param resp - The response object containing optional text and reasoning fields from the prompt result.
 *
 * If 'reasoning' is present in the response, it is logged in a dedicated "reasoning" section with markdown formatting.
 * If 'text' is present, the function determines its format (e.g., JSON, XML, Markdown, or plain text) and logs it in a corresponding section.
 * Outputs in Markdown format are further prettified for improved readability in the logs and appended as escaped HTML content.
 */
export declare function tracePromptResult(trace: MarkdownTrace, resp: {
    text?: string;
    reasoning?: string;
}): void;
/**
 * Appends a user message to a chat history.
 *
 * @param messages - The current chat message array.
 * @param content - The content of the user message. Can be a string or an image.
 * @param options - Optional parameters for modifying behavior.
 * @param options.cacheControl - Cache control value for the message.
 *
 * Notes:
 * - If the last message in the array is not a user message or has different cache control,
 *   a new user message is added.
 * - String content is appended to the existing user's message text. If the content is an image,
 *   it is added as a chat completion image.
 * - If the last message content is a string, it is converted to an array when adding an image.
 */
export declare function appendUserMessage(messages: ChatCompletionMessageParam[], content: string | PromptImage, options?: ContextExpansionOptions): void;
/**
 * Appends a message from the assistant to the list of chat messages.
 *
 * Adds the content to the last assistant message if it matches the role
 * and cache control context; otherwise, creates a new assistant message entry.
 *
 * If the last assistant message already has content, appends the new content
 * to it. Supports both string and structured content formats.
 *
 * @param messages - The list of chat messages to update.
 * @param content - The content of the assistant message. Ignored if empty.
 * @param options - Optional context settings for the message, such as cache control.
 */
export declare function appendAssistantMessage(messages: ChatCompletionMessageParam[], content: string, options?: ContextExpansionOptions): void;
/**
 * Appends a system-level message to the beginning of the given messages array.
 *
 * @param messages - The list of chat messages to which the system message will be added.
 *                   The system message is prepended to the array.
 * @param content - The content of the message to be appended. If content is empty, the function exits.
 * @param options - Optional parameters for additional message context. Includes:
 *                  - cacheControl: A control directive for caching behavior.
 *
 * If the first message in the array is not a system message or does not match the provided cacheControl, a new system
 * message object is created and added at the start of the array. Otherwise, the content is appended to the existing
 * system message.
 * If the existing system message content is a string, SYSTEM_FENCE is used as a separator before appending the new
 * content. For non-string content, a text object is added to the content array.
 * If the system message content is empty, the new content is directly assigned.
 */
export declare function appendSystemMessage(messages: ChatCompletionMessageParam[], content: string, options?: ContextExpansionOptions): void;
/**
 * Adds tool definitions to the system messages of a chat conversation.
 *
 * The function inserts a system message containing the serialized tool definitions,
 * formatted as YAML and wrapped in `<tools>` tags, into the provided list of chat messages.
 *
 * @param messages - The array of chat messages to which the tool definitions will be added.
 * @param tools - An array of tool callback objects whose specifications will be serialized
 *                and included in the system message.
 */
export declare function addToolDefinitionsMessage(messages: ChatCompletionMessageParam[], tools: ToolCallback[]): void;
//# sourceMappingURL=chat.d.ts.map