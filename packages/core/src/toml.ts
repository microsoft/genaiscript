import { parse } from "toml"
import { unfence } from "./fence"

// Function to safely parse TOML formatted text
// Accepts a string `text` and an optional `options` object with a `defaultValue`
// If parsing fails, it returns `defaultValue` instead of throwing an error
export function TOMLTryParse(text: string, options?: { defaultValue?: any }) {
    try {
        // Remove TOML fences from the text
        // `unfence` is assumed to sanitize or format the text for parsing
        const cleaned = unfence(text, "toml")

        // Parse the cleaned TOML string using the `parse` function
        // If parsing succeeds, return the parsed object
        const res = parse(cleaned)
        return res
    } catch (e) {
        // If parsing throws an error, return the `defaultValue` provided in options
        // This provides a fallback mechanism for error scenarios
        return options?.defaultValue
    }
}
