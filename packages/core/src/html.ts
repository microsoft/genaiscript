// This module provides functions to convert HTML content into different formats such as JSON, plain text, and Markdown.
// It imports necessary libraries for HTML conversion and logging purposes.

import { convert as convertToText } from "html-to-text" // Import the convert function from html-to-text library

import { TraceOptions } from "./trace" // Import TraceOptions for optional logging features

import Turndown from "turndown" // Import Turndown library for HTML to Markdown conversion

import { tabletojson } from "tabletojson" // Import tabletojson for converting HTML tables to JSON

/**
 * Converts HTML tables to JSON objects.
 * 
 * @param html - The HTML content containing tables.
 * @param options - Optional parameters for conversion.
 * @returns A 2D array of objects representing the table data.
 */
export function HTMLTablesToJSON(html: string, options?: {}): object[][] {
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
export function HTMLToText(
    html: string,
    options?: HTMLToTextOptions & TraceOptions
): string {
    if (!html) return "" // Return empty string if no HTML content is provided

    const { trace } = options || {} // Extract trace for logging if available

    try {
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
export function HTMLToMarkdown(html: string, options?: TraceOptions): string {
    if (!html) return html // Return original content if no HTML is provided
    const { trace } = options || {} // Extract trace for logging if available

    try {
        const res = new Turndown().turndown(html) // Use Turndown library to convert HTML to Markdown
        return res
    } catch (e) {
        trace?.error("HTML conversion failed", e) // Log error if conversion fails
        return undefined
    }
}
