import { CancellationOptions } from "./cancellation.js";
/**
 * Prettifies markdown content by converting annotations to markdown, processing "think" blocks, and collapsing excessive newlines.
 * @param md - The markdown string to prettify.
 * @returns The cleaned and formatted markdown string.
 */
export declare function prettifyMarkdown(md: string): string;
/**
 * Converts an object to a markdown string with options for quoting values, limiting heading levels, and customizing indentation.
 * Handles circular references by replacing them with ellipses.
 * Supports rendering arrays, objects, and strings with optional quoting.
 * @param obj - The object to convert.
 * @param options - Optional settings for quoting string values, maximum heading depth, and base heading level.
 * @returns The markdown representation of the object.
 */
export declare function MarkdownStringify(
  obj: any,
  options?: {
    quoteValues?: boolean;
    headings?: number;
    headingLevel?: number;
  },
): string;
/**
 * Splits a markdown string into an array of parts, where each part is either a text block or an image block.
 * Image blocks are objects of the form { type: "image", alt: string, url: string }. Only local images are supported.
 * Text blocks are objects of the form { type: "text", text: string }.
 * @param markdown The markdown string to split.
 */
export declare function splitMarkdownTextImageParts(
  markdown: string,
  options?: CancellationOptions & {
    dir?: string;
    allowedDomains?: string[];
    convertToDataUri?: boolean;
  },
): Promise<
  (
    | {
        type: "text";
        text: string;
      }
    | {
        type: "image";
        data: string;
        mimeType: string;
      }
  )[]
>;
//# sourceMappingURL=markdown.d.ts.map
