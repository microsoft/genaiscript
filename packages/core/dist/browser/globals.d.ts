import type { PromptContext } from "./types.js";
/**
 * Installs global utilities for various data formats and operations.
 * Sets up global objects with frozen utilities for parsing, stringifying, and manipulating
 * different data formats, handling tokenization, Git operations, HTML conversion, and more.
 *
 * Parameters:
 * - None.
 *
 * Throws:
 * - CancelError if cancellation is triggered.
 *
 * Notes:
 * - Includes utilities for YAML, CSV, INI, XML, Markdown, JSONL, JSON5, HTML, and more.
 * - Provides tokenization-related utilities such as counting, truncating, and chunking text.
 * - Instantiates Git and GitHub clients.
 * - Includes a fetchText function for retrieving text from URLs or files.
 * - Includes an ffmpeg client for multimedia operations.
 */
export declare function installGlobals(): void;
/**
 * Installs fields from the provided context into the global context.
 * Overrides existing global properties if fields in the context share the same name.
 *
 * Parameters:
 * - ctx: A context object containing properties to be added or overridden in the global context.
 *
 * Notes:
 * - Uses `resolveGlobal` to access the global context.
 * - Iterates over the keys of the provided context, mapping them into the global context.
 */
export declare function installGlobalPromptContext(ctx: PromptContext): void;
//# sourceMappingURL=globals.d.ts.map