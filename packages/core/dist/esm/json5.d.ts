/**
 * This module provides functions for parsing and repairing JSON5 strings,
 * as well as utilities for handling fenced code blocks.
 *
 * Tags: JSON5, Parsing, Repair, Fenced Blocks
 */
import { stringify } from "json5";
/**
 * Checks if the input text starts with '{' or '[', indicating a JSON object or array.
 * Removes leading whitespace before evaluation.
 * @param text - The input string to check.
 * @returns True if the string starts with '{' or '[', false otherwise.
 */
export declare function isJSONObjectOrArray(text: string): boolean;
/**
 * Parses the input text as JSON. Returns undefined if parsing fails.
 * @param text - The input string to parse as JSON.
 * @returns The parsed object or undefined if parsing fails.
 */
export declare function JSONTryParse(text: string): any;
/**
 * Repairs a potentially broken JSON string using jsonrepair.
 * @param text - The JSON string to repair.
 * @returns The repaired JSON string.
 */
export declare function JSONrepair(text: string): string;
/**
 * Parses a JSON5 string with optional error handling and repair.
 * Removes fencing if present.
 * @param text - The JSON5 string to parse.
 * @param options - An object containing:
 *   - defaultValue: The value to return if parsing fails.
 *   - errorAsDefaultValue: Whether to return the default value on error.
 *   - repair: Whether to attempt repairing the input before parsing.
 * @returns The parsed object, the default value, or undefined/null based on options.
 */
export declare function JSON5parse<T = unknown>(
  text: string,
  options?: {
    defaultValue?: T;
    errorAsDefaultValue?: boolean;
    repair?: boolean;
  },
): T | undefined | null;
/**
 * Tries to parse a JSON5 string and returns a default value if parsing fails.
 * @param text - The JSON5 string to parse.
 * @param defaultValue - The value to return if parsing fails.
 * @returns The parsed object or the default value.
 */
/**
 * Tries to parse a JSON5 string and returns a default value if parsing fails.
 *
 * @param text - The JSON5 string to parse. Can be undefined, null, or empty.
 * @param defaultValue - The value to return if parsing fails or if the input is empty.
 * @returns The parsed object, default value, or null/undefined based on input.
 */
export declare function JSON5TryParse<T = unknown>(
  text: string | undefined | null,
  defaultValue?: T,
): T | undefined | null;
/**
 * Parses a JSON-like string, removes fencing and unnecessary formatting, and returns the parsed object.
 * If the input is undefined or null, returns it as-is. If the input is an empty string, returns an empty object.
 * Removes fencing and applies additional cleaning before parsing.
 * @param s - The JSON-like string to parse. Can be undefined, null, or empty. Fencing and unnecessary formatting are removed.
 * @returns The parsed object, the original input, or an empty object if input is empty.
 */
export declare function JSONLLMTryParse(s: string): any;
export declare const JSON5Stringify: typeof stringify;
//# sourceMappingURL=json5.d.ts.map
