/**
 * This module provides utility functions to parse and stringify YAML content.
 * It includes functions to safely parse YAML strings with error handling,
 * as well as direct parse and stringify functionalities.
 */

import { parse, stringify } from "yaml"
import { filenameOrFileToContent } from "./fs"

/**
 * Safely attempts to parse a YAML string into a JavaScript object.
 * Tries to parse the input YAML string, and returns a default value
 * in case of failure or specific conditions.
 *
 * @template T - The expected type of the parsed result.
 * @param text - The YAML string to parse.
 * @param defaultValue - A default value to return if parsing fails or if
 *                       `ignoreLiterals` is true and the result is a literal.
 * @param options - Optional settings for parsing.
 * @param options.ignoreLiterals - If true, returns the defaultValue when the
 *                                 parsed result is a primitive type (number,
 *                                 boolean, string).
 * @returns The parsed object, or the defaultValue if parsing fails or
 *          conditions are met.
 */
export function YAMLTryParse<T = any>(
    text: string | WorkspaceFile,
    defaultValue?: T,
    options?: { ignoreLiterals?: boolean }
): T {
    const { ignoreLiterals } = options || {}
    text = filenameOrFileToContent(text)
    try {
        const res = parse(text)
        // Check if parsed result is a primitive and ignoreLiterals is true
        if (
            ignoreLiterals &&
            ["number", "boolean", "string"].includes(typeof res)
        )
            return defaultValue
        return res ?? defaultValue
    } catch (e) {
        // Return defaultValue in case of a parsing error
        return defaultValue
    }
}

/**
 * Parses a YAML string into a JavaScript object.
 * This function assumes the input string is valid YAML.
 *
 * @param text - The YAML string to parse.
 * @returns The parsed object.
 */
export function YAMLParse(text: string | WorkspaceFile): any {
    text = filenameOrFileToContent(text)
    return parse(text)
}

/**
 * Converts a JavaScript object into a YAML string.
 * This function provides a YAML representation of the input object.
 *
 * @param obj - The object to convert to YAML.
 * @returns The YAML string representation of the object.
 */
export function YAMLStringify(obj: any): string {
    return stringify(obj, undefined, 2)
}
