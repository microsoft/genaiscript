/**
 * This module provides utility functions to parse and stringify YAML content.
 * It includes functions to safely parse YAML strings with error handling,
 * as well as direct parse and stringify functionalities.
 */

import { parse, stringify } from "yaml"
import { filenameOrFileToContent } from "./unwrappers"
import { dedent } from "./indent"

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
 * Parses a YAML string or workspace file into a JavaScript object.
 * Assumes the input is valid YAML.
 *
 * @param text - The YAML string or workspace file to parse. Must be convertible to content.
 * @returns The parsed JavaScript object.
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

/**
 * Creates a YAML handler with template string support for parsing and stringifying YAML content.
 * Combines the functionality to parse YAML strings, stringify objects to YAML,
 * and process template string inputs into parsed YAML objects.
 *
 * @param strings - An array of template string literals.
 * @param values - Corresponding interpolated values.
 * @returns A parsed object generated from the combined template strings and values.
 */
export function createYAML(): YAML {
    const res = (strings: TemplateStringsArray, ...values: any[]): any => {
        let result = strings[0]
        values.forEach((value, i) => {
            result += String(value) + strings[i + 1]
        })
        const res = YAMLParse(dedent(result))
        return res
    }
    res.parse = YAMLParse
    res.stringify = YAMLStringify
    return Object.freeze<YAML>(res) satisfies YAML
}
