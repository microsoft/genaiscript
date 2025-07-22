import { CancellationOptions } from "./cancellation.js";
/**
 * Splits a markdown string into an array of parts, where each part is either a text block or an image block.
 * Image blocks are objects of the form { type: "image", alt: string, url: string }. Only local images are supported.
 * Text blocks are objects of the form { type: "text", text: string }.
 * @param markdown The markdown string to split.
 */
export declare function splitMarkdownTextImageParts(markdown: string, options?: CancellationOptions & {
    dir?: string;
    allowedDomains?: string[];
    convertToDataUri?: boolean;
}): Promise<({
    type: "text";
    text: string;
} | {
    type: "image";
    data: string;
    mimeType: string;
})[]>;
//# sourceMappingURL=markdown.d.ts.map