/* eslint-disable curly */

/**
 * This module provides functions for parsing and repairing JSON5 strings,
 * as well as utilities for handling fenced code blocks.
 *
 * Tags: JSON5, Parsing, Repair, Fenced Blocks
 */

// Importing parse and stringify functions from the json5 library.
import { parse, stringify } from "json5"

// Importing jsonrepair function for fixing broken JSON strings.
import { jsonrepair } from "jsonrepair"

// Importing unfence function to handle fenced code blocks.
import { unfence } from "./unwrappers"
import { unthink } from "./think"

/**
 * Determines if the given text represents a JSON object or array.
 * @param text - The input string to evaluate. Removes leading whitespace before checking.
 * @returns True if the string starts with '{' or '[', indicating a JSON object or array.
 */
export function isJSONObjectOrArray(text: string) {
    // Tests if the input string starts with '{' or '[' after removing any leading whitespace.
    return /^\s*[\{\[]/.test(text)
}

/**
 * Attempts to parse the input text as JSON. Returns undefined if parsing fails.
 * @param text - The string to parse as JSON.
 * @returns The parsed object or undefined if an error occurs.
 */
export function JSONTryParse(text: string) {
    try {
        return JSON.parse(text)
    } catch (e) {
        return undefined
    }
}

/**
 * Repairs a potentially broken JSON string using jsonrepair.
 * @param text - The JSON string to repair.
 * @returns The repaired JSON string.
 */
export function JSONrepair(text: string) {
    // Uses jsonrepair to fix any issues in the JSON string.
    const repaired = jsonrepair(text)
    return repaired
}

/**
 * Parses a JSON5 string with optional error handling and repair.
 * @param text - The JSON5 string to parse.
 * @param options - Parsing options including default value, error handling, and repair.
 * @returns The parsed object, default value, or undefined/null based on options.
 */
export function JSON5parse<T = unknown>(
    text: string,
    options?: {
        defaultValue?: T
        errorAsDefaultValue?: boolean
        repair?: boolean
    }
): T | undefined | null {
    try {
        // Remove fencing if present.
        text = unfence(text, "json")
        if (options?.repair) {
            try {
                // Attempt parsing without repairing first.
                const res = parse(text)
                return res as T
            } catch {
                // Repair and parse if initial parsing fails.
                const repaired = JSONrepair(text)
                const res = parse(repaired)
                return (res as T) ?? options?.defaultValue
            }
        } else {
            // Parse without repair if repair option is false.
            const res = parse(text)
            return res as T
        }
    } catch (e) {
        // Return default value if error occurs and errorAsDefaultValue is true.
        if (options?.errorAsDefaultValue) return options?.defaultValue
        throw e
    }
}

/**
 * Tries to parse a JSON5 string and returns a default value if parsing fails.
 * @param text - The JSON5 string to parse.
 * @param defaultValue - The value to return if parsing fails.
 * @returns The parsed object or the default value.
 */
/**
 * Tries to parse a JSON5 string and returns a default value if parsing fails.
 * 
 * @param text - The JSON5 string to parse. Can be undefined or null.
 * @param defaultValue - The value to return if parsing fails.
 * @returns The parsed object, default value, or null/undefined based on input.
 */
export function JSON5TryParse<T = unknown>(
    text: string | undefined | null,
    defaultValue?: T
): T | undefined | null {
    if (text === undefined) return undefined
    if (text === null) return null
    // Uses JSON5parse with repair option and errorAsDefaultValue set to true.
    return JSON5parse<T>(text, {
        defaultValue,
        errorAsDefaultValue: true,
        repair: true,
    })
}

/**
 * Parses a JSON-like string, removes any fencing, and returns the parsed object.
 * If the input is undefined or null, returns it as-is. If the input is an empty string, returns an empty object.
 * @param s - The string to parse.
 * @returns The parsed object, the original string, or an empty object if input is empty.
 */
export function JSONLLMTryParse(s: string): any {
    if (s === undefined || s === null) return s
    if (s === "") return {}
    // Removes any fencing and then tries to parse the string.
    const cleaned = unfence(unthink(s), "json")
    return JSON5TryParse(cleaned)
}

// Export the JSON5 stringify function directly for convenience.
export const JSON5Stringify = stringify
