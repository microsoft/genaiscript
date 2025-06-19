// This module provides functions to convert HTML content into different formats such as JSON, plain text, and Markdown.
// It imports necessary libraries for HTML conversion and logging purposes.
/// <reference path="./html-escaper.d.ts" />

import { CancellationOptions, checkCancelled } from "./cancellation";
import { TraceOptions } from "./trace"; // Import TraceOptions for optional logging features

/**
 * Converts HTML tables to JSON objects.
 *
 * @param html - The HTML content containing tables.
 * @param options - Optional parameters for conversion.
 * @returns A 2D array of objects representing the table data.
 */
export async function HTMLTablesToJSON(html: string, options?: {}): Promise<object[][]> {
  const { tabletojson } = await import("tabletojson"); // Import tabletojson for converting HTML tables to JSON
  const res = tabletojson.convert(html, options); // Convert HTML tables to JSON using tabletojson library
  return res;
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
  options?: HTMLToTextOptions & TraceOptions & CancellationOptions,
): Promise<string> {
  if (!html) return ""; // Return empty string if no HTML content is provided

  const { trace, cancellationToken } = options || {}; // Extract trace for logging if available

  try {
    const { convert: convertToText } = await import("html-to-text"); // Import the convert function from html-to-text library
    checkCancelled(cancellationToken); // Check for cancellation token
    const text = convertToText(html, options); // Perform conversion to plain text
    return text;
  } catch (e) {
    trace?.error("HTML conversion failed", e); // Log error if conversion fails
    return undefined;
  }
}

/**
 * Converts HTML content to Markdown format.
 *
 * @param html - The HTML content to convert. If no HTML is provided, the original content is returned.
 * @param options - Optional parameters including tracing, GFM support, and elements to remove. GFM can be disabled using disableGfm.
 * @returns The Markdown representation of the HTML.
 */
export async function HTMLToMarkdown(
  html: string,
  options?: HTMLToMarkdownOptions & TraceOptions & CancellationOptions,
): Promise<string> {
  if (!html) return html; // Return original content if no HTML is provided
  const { disableGfm, trace, cancellationToken } = options || {}; // Extract trace for logging if available

  try {
    const Turndown = (await import("turndown")).default; // Import Turndown library for HTML to Markdown conversion
    checkCancelled(cancellationToken); // Check for cancellation token
    const turndown = new Turndown();
    turndown.remove("script");
    turndown.remove("style");
    turndown.remove("meta");
    turndown.remove("link");
    turndown.remove("head");
    turndown.remove("title");
    turndown.remove("noscript");
    if (!disableGfm) {
      const GFMPlugin: any = require("turndown-plugin-gfm");
      turndown.use(GFMPlugin.gfm); // Use GFM plugin for GitHub Flavored Markdown
    }
    const res = turndown.turndown(html); // Use Turndown library to convert HTML to Markdown
    return res;
  } catch (e) {
    trace?.error("HTML conversion failed", e); // Log error if conversion fails
    return undefined;
  }
}
