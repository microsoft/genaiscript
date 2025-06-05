import { CancellationOptions } from "./cancellation.js";
import { TraceOptions } from "./trace.js";
/**
 * Converts HTML tables to JSON objects.
 *
 * @param html - The HTML content containing tables.
 * @param options - Optional parameters for conversion.
 * @returns A 2D array of objects representing the table data.
 */
export declare function HTMLTablesToJSON(html: string, options?: {}): Promise<object[][]>;
/**
 * Converts HTML content to plain text.
 *
 * @param html - The HTML content to convert.
 * @param options - Optional parameters including tracing options.
 * @returns The plain text representation of the HTML.
 */
export declare function HTMLToText(
  html: string,
  options?: HTMLToTextOptions & TraceOptions & CancellationOptions,
): Promise<string>;
/**
 * Converts HTML content to Markdown format.
 *
 * @param html - The HTML content to convert. If no HTML is provided, the original content is returned.
 * @param options - Optional parameters including tracing, GFM support, and elements to remove. GFM can be disabled using disableGfm.
 * @returns The Markdown representation of the HTML.
 */
export declare function HTMLToMarkdown(
  html: string,
  options?: HTMLToMarkdownOptions & TraceOptions & CancellationOptions,
): Promise<string>;
//# sourceMappingURL=html.d.ts.map
