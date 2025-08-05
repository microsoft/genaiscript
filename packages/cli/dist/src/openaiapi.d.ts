import { IncomingMessage, ServerResponse } from "http";
import type { CancellationOptions, TraceOptions } from "@genaiscript/core";
/**
 * Handles incoming chat completion requests for the OpenAI-like API.
 *
 * @param req - The HTTP incoming request object.
 * @param res - The HTTP server response object.
 * @param options - Optional tracing and cancellation options.
 *
 * Processes the incoming request, validating the body and ensuring a valid model configuration is resolved.
 * Rejects requests with streaming enabled or missing a valid configuration. Communicates with a language model
 * to generate a chat completion. Returns the generated response or an appropriate error status in case of failures.
 * Handles cases where the request is canceled or fails, returning appropriate error codes.
 * Generates a fake OpenAI-like response with the chat completion results.
 */
export declare function openaiApiChatCompletions(req: IncomingMessage, res: ServerResponse<IncomingMessage>, options?: TraceOptions & CancellationOptions): Promise<void>;
/**
 * Handles the "models" API endpoint to list available language models from providers.
 *
 * @param req - The incoming HTTP request object.
 * @param res - The HTTP response object used to return the results.
 * @param options - Optional additional configurations for tracing and cancellation tokens.
 *   - cancellationToken - Token to cancel the operation if needed.
 *
 * Fetches language model configurations from available providers, filters models with at least one entry,
 * and returns a list of these models with their identifiers and owning providers in the response.
 *
 * Responds with:
 * - 200: A JSON object containing the list of models.
 * - 500: An internal server error message if an exception occurs.
 */
export declare function openaiApiModels(req: IncomingMessage, res: ServerResponse<IncomingMessage>, options?: TraceOptions & CancellationOptions): Promise<void>;
//# sourceMappingURL=openaiapi.d.ts.map