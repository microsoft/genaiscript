import type { MarkdownTrace, TraceOptions } from "./trace.js";
import type { CancellationOptions } from "./cancellation.js";
import type { FetchTextOptions, WorkspaceFile } from "./types.js";
/**
 * Fetches text content from a URL or file.
 *
 * Fetches content from an HTTP(S) URL or reads from the file system for local files.
 * Retries on specific HTTP statuses if configured. Supports tracing and cancellation.
 * Handles binary content using base64 encoding.
 *
 * @param urlOrFile - The URL or file path to fetch from. If a string, it is treated as a filename.
 * @param fetchOptions - Configuration for retries, delays, tracing, cancellation, and fetch settings.
 *   - retries: Number of retry attempts.
 *   - retryDelay: Initial delay between retries.
 *   - retryOn: HTTP status codes to retry on.
 *   - maxDelay: Maximum delay between retries.
 *   - trace: Trace options for logging.
 *   - cancellationToken: Token to cancel the fetch operation.
 * @returns An object containing fetch status, content, metadata, and file details.
 */
export declare function fetchText(urlOrFile: string | WorkspaceFile, fetchOptions?: FetchTextOptions & TraceOptions & CancellationOptions): Promise<{
    ok: boolean;
    status: number;
    statusText: string;
    text: string;
    bytes: Uint8Array<ArrayBufferLike>;
    file: WorkspaceFile;
}>;
/**
 * Logs a POST request for tracing.
 *
 * Constructs an HTTP POST request representation, including headers and body, for tracing purposes.
 * Authorization headers can be optionally masked.
 *
 * @param trace - Trace object for logging details. If not provided, logs the command verbosely.
 * @param url - Target URL for the request.
 * @param headers - Headers to include in the request. Sensitive authorization headers may be masked.
 * @param body - Request body, either as FormData or a raw object. FormData fields include file sizes if applicable.
 * @param options - Configuration for masking authorization headers.
 */
export declare function traceFetchPost(trace: MarkdownTrace, url: string, headers: Record<string, string>, body: FormData | any, options?: {
    showAuthorization?: boolean;
}): void;
//# sourceMappingURL=fetchtext.d.ts.map