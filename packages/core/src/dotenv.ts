// This module provides utilities for parsing and stringifying dotenv-style files.
// It includes functions to handle parsing errors gracefully and formatting key-value pairs properly.
// Tags: dotenv, parsing, error handling

// Import the 'parse' function from the 'dotenv' library to parse dotenv files
import { parse } from "dotenv"

// Import a local utility function 'logError' for logging errors
import { logError } from "./util"

/**
 * Safely parses a dotenv-style string into a key-value object.
 * If parsing fails, logs the error and returns an empty object.
 *
 * @param text - The dotenv file content as a string
 * @returns A record with key-value pairs from the dotenv file
 */
export function dotEnvTryParse(text: string): Record<string, string> {
    try {
        // Try parsing the text using the 'parse' function
        return parse(text)
    } catch (e) {
        // Log any parsing error encountered
        logError(e)
        // Return an empty object to indicate parsing failure
        return {}
    }
}

// Export the 'parse' function directly so it can be used externally
export const dotEnvParse = parse

/**
 * Converts a key-value record into a dotenv-style string.
 * If values contain newlines or quotes, they are enclosed in double quotes and escaped.
 *
 * @param record - An object representing key-value pairs
 * @returns A dotenv-formatted string
 */
export function dotEnvStringify(record: Record<string, string>): string {
    return (
        Object.entries(record || {})
            .map(([key, value]) => {
                // Ensure null or undefined values are treated as empty strings
                if (value === undefined || value === null) value = ""

                // Enclose in quotes if the value contains newlines or quotes, and escape quotes
                if (value.includes("\n") || value.includes('"')) {
                    value = value.replace(/"/g, '\\"') // Escape existing quotes
                    return `${key}="${value}"`
                }

                // Default key-value format without quotes
                return `${key}=${value}`
            })
            // Join all key-value pairs with newline characters for dotenv format
            .join("\n")
    )
}
