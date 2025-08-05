import type { TraceOptions } from "./trace.js";
import type { CancellationOptions } from "./cancellation.js";
import type { ContentSafety } from "./types.js";
/**
 * Determines if the Azure Content Safety client is configured by checking for the presence of a valid endpoint.
 *
 * @returns {boolean} - Returns true if the Azure Content Safety API endpoint is configured, false otherwise.
 *
 * Environment Variables:
 * - AZURE_CONTENT_SAFETY_ENDPOINT: The base endpoint for the Azure Content Safety API, if provided.
 * - AZURE_CONTENT_SAFETY_API_ENDPOINT: Alternative variable for the base endpoint, if the primary variable is not set.
 *
 * The function trims trailing slashes from the endpoint before validation.
 */
export declare function isAzureContentSafetyClientConfigured(): boolean;
/**
 * Creates an Azure Content Safety client to detect harmful content and prompt injection in text or documents.
 *
 * @param options - Configuration options for the client.
 * - Includes properties for tracing operations, cancellation signals, and additional configurations.
 * - `signal` - Optional AbortSignal for request cancellation.
 *
 * @returns An object implementing ContentSafety, with methods:
 * - `detectHarmfulContent`: Analyzes text or documents for harmful content.
 * - `detectPromptInjection`: Analyzes text or documents for prompt injection attacks.
 */
export declare function createAzureContentSafetyClient(options: CancellationOptions & TraceOptions): ContentSafety;
//# sourceMappingURL=azurecontentsafety.d.ts.map