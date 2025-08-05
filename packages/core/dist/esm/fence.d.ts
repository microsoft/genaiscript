import type { Fenced } from "./types.js";
/**
 * Parses a key-value pair from a string, where the key and value are separated by '=' or ':'.
 * Returns an object with the extracted and unquoted key-value pair.
 * If no separator is found, returns an empty object.
 *
 * @param text - The input string containing a key-value pair.
 */
export declare function parseKeyValuePair(text: string): Record<string, string>;
/**
 * Parse key-value pairs from input text.
 * @param text - Input containing key-value pairs separated by spaces or line breaks. Keys and values must be separated by "=" or ":".
 *   - Supports single or multiple strings.
 * @returns An object with parsed key-value pairs as immutable data.
 */
export declare function parseKeyValuePairs(text: string | string[]): Readonly<Record<string, string>>;
/**
 * Parse text to extract fenced code blocks and their metadata.
 * @param text - The input text containing fenced code blocks.
 *   - Each block starts and ends with a code fence (e.g., ```).
 *   - May include metadata such as labels, languages, and arguments.
 * @returns An array of objects representing fenced code blocks, including:
 *   - label: The label or identifier for the block.
 *   - content: The content within the fenced block.
 *   - language: The programming language or type of the block.
 *   - args: Parsed key-value arguments from the fence.
 */
export declare function extractFenced(text: string): Fenced[];
/**
 * Finds the first fenced block containing YAML or JSON content and parses it.
 * @param fences - Array of fenced objects to search. Each object must include content, label, and language.
 * @returns Parsed content if a valid YAML or JSON block is found, otherwise undefined.
 */
export declare function findFirstDataFence(fences: Fenced[]): any;
/**
 * Parse an array of strings into key-value pairs and return them as an immutable object.
 * @param vars - Array of strings, each containing key-value pairs separated by "=" or ":".
 * @returns An object with parsed key-value pairs, or undefined if the input array is empty or null.
 */
export declare function parseVars(vars: string[]): Readonly<Record<string, string>>;
/**
 * Render an array of fenced code blocks into a formatted string.
 * Each block includes its label, content, language, validation results, and schema errors if present.
 * @param vars - Array of fenced objects. Each object should include:
 *   - label: The label or identifier for the block.
 *   - content: The content within the fenced block.
 *   - language: The programming language or type of the block.
 *   - validation: Validation results, including schema errors and path validity.
 *   - args: Parsed key-value arguments from the fence.
 * @returns A formatted string representation of the fenced blocks.
 */
export declare function renderFencedVariables(vars: Fenced[]): string;
//# sourceMappingURL=fence.d.ts.map