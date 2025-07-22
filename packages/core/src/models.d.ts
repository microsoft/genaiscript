import type { ModelConfiguration } from "./host.js";
import type { MarkdownTrace, TraceOptions } from "./trace.js";
import type { CancellationOptions } from "./cancellation.js";
import type { LanguageModelConfiguration } from "./server/messages.js";
import type { ChatCompletionReasoningEffort } from "./chattypes.js";
import type { ModelConnectionOptions, ModelOptions } from "./types.js";
export interface ParsedModelType {
    provider: string;
    family: string;
    model: string;
    tag?: string;
    reasoningEffort?: ChatCompletionReasoningEffort;
}
/**
 * Parses a model identifier string in the format:
 * - `provider:model`
 * - `provider:model:tag`
 * - Optionally, `model:tag` can include `:reasoningEffort` (e.g., high, medium, low).
 *
 * Parameters:
 * - id: The model identifier string to parse. Must not be empty.
 *
 * Returns:
 * - An object containing provider, family, model, optional tag, and optional reasoningEffort.
 *
 * Throws:
 * - Error if the model identifier is not specified.
 */
export declare function parseModelIdentifier(id: string): {
    provider: string;
    family: string;
    model: string;
    tag?: string;
    reasoningEffort?: ChatCompletionReasoningEffort;
};
export declare function normalizeModelIdentifier(id: string): string;
export declare function areModelsSame(l: string, r: string): boolean;
export interface ModelConnectionInfo extends ModelConnectionOptions, Partial<LanguageModelConfiguration> {
    error?: string;
    model: string;
}
/**
 * Creates a detailed trace log for a language model connection.
 *
 * @param trace - The MarkdownTrace instance used for documenting details.
 * @param options - Configuration options for the model connection:
 *   - `model`: The model identifier.
 *   - `temperature`: Sampling temperature for the model.
 *   - `reasoningEffort`: Effort level for reasoning tasks (e.g., high, medium, low).
 *   - `fallbackTools`: Tools used for fallback handling.
 *   - `topP`: Probability mass for nucleus sampling.
 *   - `maxTokens`: Maximum token limit for the response.
 *   - `seed`: Seed value for deterministic outputs.
 *   - `cache`: Whether to use cache during this connection.
 *   - `logprobs`: Number of log probabilities to include.
 *   - `topLogprobs`: Statistics on the top probabilities.
 *   - `responseType`: Type of response expected (e.g., text, JSON schema).
 *   - `responseSchema`: JSON schema for structuring the response.
 *   - `fenceFormat`: Syntax for formatting fenced responses.
 *   - `choices`: Potential candidate options for sampling from the model.
 * @param connectionToken - Metadata related to the model provider:
 *   - `base`: Base configuration identifier.
 *   - `type`: Type specification of the model.
 *   - `version`: Version of the model.
 *   - `source`: Origin of the model configuration.
 *   - `provider`: The associated service provider.
 *
 * Documents data about the model configuration and its behavior, including choices, aliases,
 * and configuration metadata from the runtime environment. Ensures detailed logs for better traceability.
 */
export declare function traceLanguageModelConnection(trace: MarkdownTrace, options: ModelOptions, connectionToken: LanguageModelConfiguration): void;
/**
 * Determines if the provided model identifier is an alias.
 *
 * @param model - The model identifier to check.
 *
 * @returns True if the given model identifier is an alias, otherwise false.
 */
export declare function isModelAlias(model: string): boolean;
/**
 * Resolves the final model configuration by following a chain of model aliases.
 *
 * Parameters:
 * - model: The model identifier or alias to resolve. Must not be empty.
 *
 * Throws:
 * - Error if the model parameter is not specified.
 * - Error if a circular alias reference is detected.
 *
 * Returns:
 * - The fully resolved ModelConfiguration object, containing the final model identifier and its source.
 */
export declare function resolveModelAlias(model: string): ModelConfiguration;
/**
 * Resolves model connection information, including configuration and token.
 *
 * @param conn - The connection options for the model.
 * @param options - An optional object containing:
 *   - model: A specific model identifier to resolve.
 *   - defaultModel: A default model identifier if none is provided.
 *   - token: A boolean indicating whether to include the token in the resolved settings.
 *   - trace: An optional trace object for logging details.
 *   - cancellationToken: An optional token to cancel the operation.
 *
 * @returns An object containing:
 *   - info: Connection information for the resolved model.
 *   - configuration: Optional configuration details for the resolved model.
 *
 * Resolves the model identifier against aliases and retrieves configuration from the host.
 * If candidates are supported, it tries to resolve each candidate until successful.
 * Includes fallback handling for missing or invalid model configurations.
 */
export declare function resolveModelConnectionInfo(conn: ModelConnectionOptions, options?: {
    model?: string;
    defaultModel?: string;
    token?: boolean;
} & TraceOptions & CancellationOptions): Promise<{
    info: ModelConnectionInfo;
    configuration?: LanguageModelConfiguration;
}>;
//# sourceMappingURL=models.d.ts.map