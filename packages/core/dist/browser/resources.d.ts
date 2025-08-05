import type { CancellationOptions } from "./cancellation.js";
import type { TraceOptions } from "./trace.js";
import { URL } from "node:url";
import type { WorkspaceFile } from "./types.js";
/**
 * Attempts to resolve a given URL to its associated resources or files.
 *
 * @param url The input URL to resolve.
 * @param options Optional tracing and cancellation options to control the operation.
 *     - cancellationToken: Allows monitoring and cancellation of the operation.
 *
 * @returns A promise that resolves to an object containing:
 *     - uri: The parsed valid URL object.
 *     - files: An array of resolved files associated with the resource.
 * Returns undefined if the URL cannot be resolved or if no associated files are found.
 *
 * - Uses `applyUrlAdapters` to modify the URL if needed.
 * - Validates and parses the URL.
 * - Determines the scheme/protocol of the URL and invokes the appropriate resolver from `uriResolvers`.
 * - Resolves resources by downloading or fetching content based on the URL scheme.
 * - Handles both text and binary content.
 * - Reports errors or unsupported protocols.
 * - Cancels the process if the cancellation token is triggered.
 * - Logs debug information about the resolution process and resolved files.
 * - Throws an error if the cancellation token is triggered during the operation.
 */
export declare function tryResolveResource(url: string, options?: TraceOptions & CancellationOptions): Promise<{
    uri: URL;
    files: WorkspaceFile[];
} | undefined>;
//# sourceMappingURL=resources.d.ts.map