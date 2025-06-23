// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// This module provides functions to convert HTML content into different formats such as JSON, plain text, and Markdown.
/// <reference path="./html-escaper.d.ts" />
/// <reference path="./turndown-plugin-gfm.d.ts" />

import { CancellationOptions, checkCancelled } from "./cancellation.js";
import { TraceOptions } from "./trace.js"; // Import TraceOptions for optional logging features
import type { HTMLToMarkdownOptions, HTMLToTextOptions } from "./types.js"; // Import HTMLToTextOptions for configuring HTML to text conversion
import { tabletojson } from "tabletojson";
import { convert as convertToText } from "html-to-text"; // Import the convert function from html-to-text library
import Turndown from "turndown"; // Import Turndown library for HTML to Markdown conversion
import * as GFMPlugin from "turndown-plugin-gfm";

/**
 * Converts HTML tables to JSON objects.
 *
 * @param html - The HTML content containing tables.
 * @param options - Optional parameters for conversion.
 * @returns A 2D array of objects representing the table data.
 */
export async function HTMLTablesToJSON(html: string, options?: {}): Promise<object[][]> {
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
      turndown.use(GFMPlugin.gfm); // Use GFM plugin for GitHub Flavored Markdown
    }
    const res = turndown.turndown(html); // Use Turndown library to convert HTML to Markdown
    return res;
  } catch (e) {
    trace?.error("HTML conversion failed", e); // Log error if conversion fails
    return undefined;
  }
}
