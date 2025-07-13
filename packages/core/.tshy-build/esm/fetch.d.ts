import { TraceOptions } from "./trace.js";
import { CancellationOptions } from "./cancellation.js";
import type { FetchOptions, RetryOptions } from "./types.js";
/**
 * Parses the retry-after header value.
 *
 * @param retryAfterHeader - The retry-after header value
 * @returns The number of seconds to wait, or null if parsing failed
 */
export declare function parseRetryAfter(retryAfterHeader: string): number | null;
export type FetchType = (input: string | URL | globalThis.Request, options?: FetchOptions & TraceOptions) => Promise<Response>;
/**
 * Creates a fetch function with retry logic.
 *
 * Wraps `crossFetch` with retry capabilities based on the provided options.
 * Configures the number of retries, delay between retries, HTTP status codes to retry on,
 * and supports cancellation and proxy configuration.
 *
 * @param options - Configuration for retries, delays, HTTP status codes, cancellation token, and tracing.
 *   - retryOn: HTTP status codes to retry on.
 *   - retries: Number of retry attempts.
 *   - retryDelay: Initial delay between retries.
 *   - maxDelay: Maximum delay between retries.
 *   - cancellationToken: Token to cancel the fetch.
 *   - trace: Trace options for logging.
 * @returns A fetch function with retry and cancellation support.
 */
export declare function createFetch(options?: TraceOptions & CancellationOptions & RetryOptions): Promise<FetchType>;
/**
 * Executes an HTTP(S) request with optional retry logic.
 *
 * Wraps the input request with retry capabilities and additional configurations.
 * Leverages `createFetch` to handle retry conditions and builds a final fetch function.
 *
 * @param input - The input to the fetch request. Can be a string URL, URL object, or Request object.
 * @param options - Configuration options for the fetch operation.
 *   - retryOn: Array of HTTP status codes to retry on.
 *   - retries: Number of retry attempts.
 *   - retryDelay: Initial delay between retries in milliseconds.
 *   - maxDelay: Maximum allowable delay between retries in milliseconds.
 *   - trace: Trace options for logging the fetch operation.
 *   - ...rest: Additional options passed to the fetch request.
 * @returns A Promise resolving with the HTTP Response.
 */
export declare function fetch(input: string | URL | globalThis.Request, options?: FetchOptions & TraceOptions): Promise<Response>;
/**
 * Converts the HTTP response status and status text into a list of strings.
 *
 * Extracts the status and status text from the response object for logging and debugging.
 *
 * @param res - The HTTP response object. Includes optional status and statusText fields.
 * @returns A list of strings containing the status and status text if provided.
 */
export declare function statusToMessage(res?: {
    status?: number;
    statusText?: string;
}): string;
export declare function tryReadText(res: Response, defaultValue?: string): Promise<string>;
export declare function iterateBody(r: Response, options?: CancellationOptions): AsyncGenerator<string>;
//# sourceMappingURL=fetch.d.ts.map