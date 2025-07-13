import { MarkdownTrace } from "./trace.js";
/**
 * Sets up trace writing to a specified file by handling trace events.
 *
 * @param trace - The trace object to listen to for events.
 * @param name - A name identifier for logging purposes.
 * @param filename - The file path where trace data will be written.
 * @param options - Optional configuration object.
 * @param options.ignoreInner - If true, skips processing of "inner" trace chunks.
 *
 * @returns The filename where trace data is written.
 *
 * This function ensures the target directory exists and initializes an empty file.
 * It listens for TRACE_CHUNK events to append trace chunks to the file using a
 * buffered write stream. TRACE_DETAILS events flush the write stream (if open) and write
 * the entire content to the file.
 */
export declare function setupTraceWriting(trace: MarkdownTrace, name: string, filename: string, options?: {
    ignoreInner?: boolean;
}): Promise<string>;
//# sourceMappingURL=tracefile.d.ts.map