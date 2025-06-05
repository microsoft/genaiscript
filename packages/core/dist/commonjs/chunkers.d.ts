/**
 * Splits a string into chunks of specified size.
 * Parameters:
 * - s: Input string to split. Must be non-null and non-empty.
 * - n: Maximum size of each chunk. Defaults to 2 << 14.
 * Returns:
 * - Array of string chunks. Each chunk's length is <= n.
 */
export declare function chunkString(s: string, n?: number): string[];
/**
 * Splits a string into chunks of lines, ensuring each chunk's size does not exceed the specified limit.
 *
 * @param s - Input string to split. Must be non-null and non-empty.
 * @param n - Maximum size of each chunk in characters. Defaults to 2 << 14.
 * @returns Array of string chunks, where each chunk consists of complete lines and has a size <= n.
 */
export declare function chunkLines(s: string, n?: number): string[];
//# sourceMappingURL=chunkers.d.ts.map
