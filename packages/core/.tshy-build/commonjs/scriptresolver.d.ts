import type { CancellationOptions } from "./cancellation.js";
import type { TraceOptions } from "./trace.js";
/**
 * Attempts to resolve a script from the provided URL and manages caching.
 *
 * @param url - The URL of the resource to resolve.
 * @param options - Optional tracing and cancellation options.
 *   - TraceOptions: Includes trace-level details for debugging purposes.
 *   - CancellationOptions: Optionally permits cancellation during the process.
 * @returns The filename of the resolved script or undefined if resolution fails.
 *
 * If the resource is found, it checks for cached content. If cached, it computes a hash
 * and resolves the resource file within a managed `.genaiscript/resources` directory.
 * If no cached content is found, it returns the filename of the first file in the resource.
 */
export declare function tryResolveScript(url: string, options?: TraceOptions & CancellationOptions): Promise<string>;
//# sourceMappingURL=scriptresolver.d.ts.map