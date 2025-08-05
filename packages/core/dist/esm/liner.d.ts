/**
 * Adds 1-based line numbers to each line of the input text.
 * If the language is "diff" or the text is detected as a diff, processes it using llmifyDiff.
 *
 * @param text - The input text to process.
 * @param options - Optional parameters:
 *   - language: Specifies the language format (e.g., "diff").
 *   - startLine: The starting line number for numbering (default is 1).
 * @returns The text with line numbers added, the original text if it is too small, or processed diff text if applicable.
 */
export declare function addLineNumbers(text: string, options?: {
    language?: string;
    startLine?: number;
}): string;
/**
 * Removes line numbers from each line of a given text.
 * Assumes line numbers are in the format "[number] ".
 *
 * @param text - The text from which line numbers will be removed.
 * @returns The text without line numbers, or the original text if no line numbers are found.
 */
export declare function removeLineNumbers(text: string): string;
/**
 * Extracts a line range from the text using 1-based inclusive line numbers.
 *
 * @param text - The input text from which to extract the range.
 * @param options - An object specifying the line range.
 *   - lineStart: The 1-based starting line number of the range.
 *   - lineEnd: The 1-based ending line number of the range.
 * @returns The extracted range of text or the original text if no valid range is provided.
 */
export declare function extractRange(text: string, options?: {
    lineStart?: number;
    lineEnd?: number;
}): string;
/**
 * Converts a string position index to a line number.
 * @param text - The text in which to find the line number.
 * @param index - The position index within the text.
 * @returns The line number corresponding to the position index, starting from 1.
 */
export declare function indexToLineNumber(text: string, index: number): number;
//# sourceMappingURL=liner.d.ts.map