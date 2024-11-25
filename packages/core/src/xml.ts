// Import XMLParser from the fast-xml-parser package
import { XMLParser } from "fast-xml-parser"

// Import a utility function for logging errors
import { logError } from "./util"

// Import a function to remove certain markers from XML strings
import { unfence } from "./fence"
import { filenameOrFileToContent, filePathOrUrlToWorkspaceFile } from "./fs"

/**
 * Attempts to parse an XML string, returning a default value on failure.
 *
 * @param text - The XML string to parse
 * @param defaultValue - The value to return if parsing fails
 * @param options - Optional configuration for the XML parser
 * @returns The parsed XML object or defaultValue if an error occurs
 */
export function XMLTryParse(
    text: string | WorkspaceFile,
    defaultValue?: any,
    options?: XMLParseOptions
) {
    try {
        // Try parsing the text and return the result or defaultValue
        return XMLParse(text, options) ?? defaultValue
    } catch (e) {
        // Return the default value if parsing fails
        return defaultValue
    }
}

/**
 * Parses an XML string into an object.
 *
 * @param text - The XML string to parse
 * @param options - Optional configuration for the XML parser
 * @returns The parsed XML object
 */
export function XMLParse(
    text: string | WorkspaceFile,
    options?: XMLParseOptions
) {
    text = filenameOrFileToContent(text)
    // Remove specific markers from the XML string for cleaner processing
    const cleaned = unfence(text, "xml")

    // Create a new XMLParser instance with the specified options
    const parser = new XMLParser({
        ignoreAttributes: false, // Do not ignore XML attributes
        attributeNamePrefix: "@_", // Prefix for attribute names
        allowBooleanAttributes: true, // Allow boolean attributes
        ignoreDeclaration: true, // Ignore the XML declaration
        parseAttributeValue: true, // Parse attribute values
        ...(options || {}), // Merge user-provided options with defaults
    })

    // Parse the cleaned XML string and return the result
    return parser.parse(cleaned)
}
