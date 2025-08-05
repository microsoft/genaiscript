import type { ChatCompletionHandler } from "./chat.js";
import type { LanguageModelConfiguration } from "./server/messages.js";
/**
 * Generates configuration headers for API requests based on the provided configuration object.
 *
 * @param cfg - The configuration object containing details for API access.
 *   - token: Authentication token for the API.
 *   - type: The type of model (e.g., azure_serverless_models, openai, etc.).
 *   - base: Base URL of the API.
 *   - provider: Identifier for the model provider.
 * @returns A record of key-value pairs representing the headers, including:
 *   - Authorization: The formatted authorization header if applicable.
 *   - api-key: API key if Bearer authentication is not used.
 *   - User-Agent: A constant user agent identifier for the tool.
 */
export declare function getConfigHeaders(cfg: LanguageModelConfiguration): Record<string, string>;
export declare const OpenAIv1ChatCompletion: ChatCompletionHandler;
//# sourceMappingURL=openai-chatcompletion.d.ts.map