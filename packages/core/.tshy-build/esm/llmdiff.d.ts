/**
 * Represents a chunk of changes in a diff.
 */
export interface Chunk {
    state: "existing" | "deleted" | "added";
    lines: string[];
    lineNumbers: number[];
}
/**
 * Parses a text in the LLMD diff format into an array of chunks.
 * Each chunk represents a segment of existing, added, or deleted lines.
 * Adjusts line numbers, removes duplicate lines without actual changes,
 * ensures proper chunk segmentation, and handles trailing empty lines.
 *
 * @param text - The LLMD diff text to parse. Must be a newline-separated string.
 * @returns An array of chunks representing the parsed diff, with each chunk containing its state, lines, and line numbers.
 */
export declare function parseLLMDiffs(text: string): Chunk[];
/**
 * Applies a series of LLMDiff chunks to a source string.
 *
 * @param source - The original source content to which changes will be applied.
 * @param chunks - The list of chunks representing changes, including existing, deleted, and added lines. Chunks must be in sequential order. Each chunk must have valid state and line data.
 * @returns The modified source content after applying the changes, or the original content if no chunks are provided.
 * @throws Error if the chunk sequence is invalid, unexpected states are encountered, or if chunk alignment fails.
 */
export declare function applyLLMDiff(source: string, chunks: Chunk[]): string;
/**
 * Custom error class for handling diff-related errors.
 */
export declare class DiffError extends Error {
    constructor(message: string);
}
/**
 * Applies a series of LLMDiff chunks to a source string using line numbers.
 * Processes modified and deleted chunks, then inserts added chunks in sequence.
 * Ensures valid line numbers and updates the source content accordingly.
 *
 * @param source - The original source content to modify.
 * @param chunks - The list of chunks representing changes, including added, deleted, and existing lines. Chunks must be in sequence and contain valid line numbers.
 * @returns The updated source content after applying the changes. Filters out undefined lines resulting from deletions.
 * @throws DiffError if invalid or missing line numbers are encountered.
 */
export declare function applyLLMPatch(source: string, chunks: Chunk[]): string;
/**
 * Converts a diff string into the LLMDiff format.
 * Parses the input diff string using the parse-diff library, processes it into a structured format, and converts it back to a unified diff format with LLMDiff annotations.
 * Updates line numbers for changes and includes them in the output.
 * Returns the LLMDiff formatted string or undefined if parsing fails.
 *
 * @param diff - The diff string to process. Must be in a supported diff format.
 * @returns The LLMDiff formatted string or undefined if parsing fails.
 */
export declare function llmifyDiff(diff: string): string;
//# sourceMappingURL=llmdiff.d.ts.map