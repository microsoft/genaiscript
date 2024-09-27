// This module provides functions to convert HTML content into different formats such as JSON, plain text, and Markdown.
// It imports necessary libraries for HTML conversion and logging purposes.

import { TraceOptions } from "./trace" // Import TraceOptions for optional logging features

/**
 * Converts HTML tables to JSON objects.
 *
 * @param html - The HTML content containing tables.
 * @param options - Optional parameters for conversion.
 * @returns A 2D array of objects representing the table data.
 */
export async function HTMLTablesToJSON(
    html: string,
    options?: {}
): Promise<object[][]> {
    const { tabletojson } = await import("tabletojson") // Import tabletojson for converting HTML tables to JSON
    const res = tabletojson.convert(html, options) // Convert HTML tables to JSON using tabletojson library
    return res
}

/**
 * Converts HTML content to plain text.
 *
 * @param html - The HTML content to convert.
 * @param options - Optional parameters including tracing options.
 * @returns The plain text representation of the HTML.
 */
export async function HTMLToText(
    html: string,
    options?: HTMLToTextOptions & TraceOptions
): Promise<string> {
    if (!html) return "" // Return empty string if no HTML content is provided

    const { trace } = options || {} // Extract trace for logging if available

    try {
        const { convert: convertToText } = await import("html-to-text") // Import the convert function from html-to-text library
        const text = convertToText(html, options) // Perform conversion to plain text
        return text
    } catch (e) {
        trace?.error("HTML conversion failed", e) // Log error if conversion fails
        return undefined
    }
}

/**
 * Converts HTML content to Markdown format.
 *
 * @param html - The HTML content to convert.
 * @param options - Optional tracing parameters.
 * @returns The Markdown representation of the HTML.
 */
export async function HTMLToMarkdown(
    html: string,
    options?: TraceOptions
): Promise<string> {
    if (!html) return html // Return original content if no HTML is provided
    const { trace } = options || {} // Extract trace for logging if available

    try {
        const Turndown = (await import("turndown")).default // Import Turndown library for HTML to Markdown conversion
        const res = new Turndown().turndown(html) // Use Turndown library to convert HTML to Markdown
        return res
    } catch (e) {
        trace?.error("HTML conversion failed", e) // Log error if conversion fails
        return undefined
    }
}
