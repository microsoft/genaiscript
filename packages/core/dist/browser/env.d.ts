import type { LanguageModelConfiguration } from "./server/messages.js";
import type { TraceOptions } from "./trace.js";
import type { CancellationOptions } from "./cancellation.js";
/**
 * Parses the OLLAMA host environment variable and returns a standardized URL.
 *
 * @param env - The environment variables object to extract OLLAMA-related settings.
 * @returns The resolved OLLAMA host URL.
 *
 * The function prioritizes the following environment variables to determine the host:
 * - OLLAMA_HOST
 * - OLLAMA_API_BASE
 * - Fallback to the constant OLLAMA_API_BASE.
 *
 * If the resolved value matches an IP address or "localhost" with an optional port,
 * it constructs a URL with the default port if not provided. Otherwise, it validates
 * and returns a complete URL. Throws an error if the URL is invalid.
 */
export declare function ollamaParseHostVariable(env: Record<string, string>): string;
/**
 * Finds an environment variable based on provided prefixes and names.
 *
 * @param env - The environment variables as key-value pairs.
 * @param prefixes - A string or array of strings representing the possible prefixes for the variable name.
 * @param names - An array of variable names to match against the prefixes.
 * @returns An object containing the matched variable name and its value, or undefined if no match is found.
 */
export declare function findEnvVar(env: Record<string, string>, prefixes: string | string[], names: string[]): {
    name: string;
    value: string;
};
/**
 * Parses default configuration values from the provided environment variables.
 *
 * This function extracts default model configurations and temperature settings
 * based on environment variable values and sets them as runtime model aliases.
 * Legacy and new configurations are supported.
 *
 * @param env - An object representing environment variables with keys and values.
 *   - GENAISCRIPT_DEFAULT_MODEL: Specifies the default model for the "large" alias.
 *   - GENAISCRIPT_DEFAULT_TEMPERATURE: Sets the default temperature for the model, if defined.
 *   - GENAISCRIPT_DEFAULT_[ID]_MODEL or GENAISCRIPT_MODEL_[ID]: Configures aliases for specific model IDs.
 */
export declare function parseDefaultsFromEnv(env: Record<string, string>): Promise<void>;
/**
 * Parses the environment variables to retrieve the necessary token, base URL, and configuration details
 * for a specified model identifier based on its provider.
 *
 * @param env - A record of environment variables, serving as the source for token and API configuration.
 * @param modelId - The identifier of the model for which the token and configuration details are to be parsed.
 * @param options - Additional options for tracing, cancellation, and token resolution.
 *
 * @returns A promise that resolves to a configuration object containing the provider, model, token, base URL,
 *          type, version, and source, or undefined if no matching configuration is found.
 *
 * Notes:
 * - Handles several model providers, including OpenAI, Azure OpenAI, Azure Serverless OpenAI, Azure AI Inference, Azure Serverless Models, Anthropic, Google, HuggingFace, and more.
 * - Throws errors if mandatory variables like API keys or bases are not configured.
 * - Includes validation checks for URL formats and supported provider types.
 */
export declare function parseTokenFromEnv(env: Record<string, string>, modelId: string, options: TraceOptions & CancellationOptions & {
    resolveToken?: boolean;
}): Promise<LanguageModelConfiguration>;
//# sourceMappingURL=env.d.ts.map