import type { ChatCompletionHandler, CreateImageRequest, CreateImageResult, CreateSpeechRequest, CreateSpeechResult, CreateTranscriptionRequest, LanguageModel, ListModelsFunction } from "./chat.js";
import type { EmbeddingResult } from "./chattypes.js";
import type { CancellationOptions } from "./cancellation.js";
import type { TraceOptions } from "./trace.js";
import type { LanguageModelConfiguration } from "./server/messages.js";
import type { RetryOptions, TranscriptionResult } from "./types.js";
export declare const OpenAIChatCompletion: ChatCompletionHandler;
export declare const OpenAIListModels: ListModelsFunction;
/**
 * Transcribes an audio file using the specified language model configuration.
 * Can also perform translation if requested.
 *
 * @param req - Contains the transcription or translation details including:
 *              - `file`: The audio file to be transcribed.
 *              - `model`: The model to be used for transcription or translation.
 *              - `translate`: Optional, specifies if the operation is a translation.
 *              - `temperature`: Optional, adjusts the creativity of the transcription (if supported).
 *              - `language`: Optional, specifies the language of the audio.
 * @param cfg - Language model configuration, includes:
 *              - `base`: The base API URL for the model.
 *              - `provider`: The identifier of the model provider.
 *              - `model`: The specific model to use for transcription.
 * @param options - Options affecting the behavior of the function, including:
 *                  - `trace`: Trace logging object for debugging and monitoring.
 *                  - `cancellationToken`: Optional, allows cancellation of the operation.
 * @returns A promise that resolves to a transcription result, including:
 *          - `text`: The transcribed text, or undefined if an error occurs.
 *          - `error`: Details of any error encountered.
 */
export declare function OpenAITranscribe(req: CreateTranscriptionRequest, cfg: LanguageModelConfiguration, options: TraceOptions & CancellationOptions & RetryOptions): Promise<TranscriptionResult>;
/**
 * Generates speech audio from provided text input using the specified configuration and options.
 *
 * @param req - The request payload containing details for generating speech, including:
 *   - model: The model to use for generating speech.
 *   - input: The text input to convert to speech.
 *   - voice: The voice profile to use for speech synthesis (default is "alloy").
 *   - Additional optional parameters for speech customization.
 * @param cfg - The configuration for the language model, including:
 *   - base: Base URL of the API.
 *   - model: Model identifier.
 *   - provider: The provider of the model.
 * @param options - Supplementary options for the request, such as:
 *   - trace: Trace object for logging and debugging.
 *   - cancellationToken: Token to handle cancellation of the operation.
 * @returns A promise that resolves to an object containing:
 *   - audio: The generated speech audio as a Uint8Array, or undefined if an error occurred.
 *   - error: Information about any error that occurred, or undefined if successful.
 */
export declare function OpenAISpeech(req: CreateSpeechRequest, cfg: LanguageModelConfiguration, options: TraceOptions & CancellationOptions & RetryOptions): Promise<CreateSpeechResult>;
/**
 * Generates an image using the specified model and prompt.
 *
 * @param req - An object containing the image generation request, including:
 *              - model: The name of the model to use for image generation.
 *              - prompt: The text prompt to generate the image.
 *              - size: Optional; dimensions of the image in "widthxheight" format or keywords like "portrait", "landscape", "square", or "auto". Defaults to "1024x1024".
 *              - quality: Optional; image quality setting ("auto", "high", "hd").
 *              - style: Optional; style attributes for image generation.
 *              - Additional parameters required for the request.
 * @param cfg - The configuration for the language model, including:
 *              - base: Base URL of the API endpoint.
 *              - provider: The provider of the model (e.g., Azure, OpenAI).
 *              - type: The API type being used (e.g., azure, openai).
 *              - model: The model identifier, if required by the provider.
 *              - version: Optional; API version for Azure OpenAI.
 * @param options - Additional options including:
 *                  - trace: Optional; tracing information for debugging/logging.
 *                  - cancellationToken: Optional; token to handle request cancellation.
 * @returns - A result containing either the generated image as a Uint8Array, the revised prompt, usage information, or an error message.
 */
export declare function OpenAIImageGeneration(req: CreateImageRequest, cfg: LanguageModelConfiguration, options: TraceOptions & CancellationOptions & RetryOptions): Promise<CreateImageResult>;
/**
 * Executes an embedding request using the specified language model configuration.
 *
 * @param input - The text input to generate embeddings for.
 * @param cfg - Configuration for the language model, including base URL, provider, type, and model details.
 * @param options - Optional parameters including trace for debugging and cancellationToken for request cancellation.
 * @returns An EmbeddingResult object containing the embeddings or error details if the operation fails.
 *
 * This function determines the proper API route based on the model provider type. It constructs a POST request to retrieve embeddings
 * for the given input. Handles response parsing, error checking, and supports cancellation.
 */
export declare function OpenAIEmbedder(input: string | string[], cfg: LanguageModelConfiguration, options: TraceOptions & CancellationOptions & RetryOptions): Promise<EmbeddingResult>;
/**
 * Creates a language model configuration compatible with OpenAI-like APIs.
 *
 * @param providerId - Identifier of the model provider.
 * @param options - Optional configuration object.
 * @param options.listModels - Enables listing of available models if true.
 * @param options.transcribe - Enables transcription capabilities if true.
 * @param options.speech - Enables speech synthesis capabilities if true.
 * @param options.imageGeneration - Enables image generation capabilities if true.
 *
 * @returns A frozen object defining the language model with specified capabilities.
 */
export declare function LocalOpenAICompatibleModel(providerId: string, options: {
    listModels?: boolean;
    transcribe?: boolean;
    speech?: boolean;
    imageGeneration?: boolean;
}): Readonly<LanguageModel>;
//# sourceMappingURL=openai.d.ts.map