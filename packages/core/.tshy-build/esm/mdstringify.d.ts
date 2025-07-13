/**
 * Converts an object to a markdown string with options for quoting values, limiting heading levels, and customizing indentation.
 * Handles circular references by replacing them with ellipses.
 * Supports rendering arrays, objects, and strings with optional quoting.
 * @param obj - The object to convert.
 * @param options - Optional settings for quoting string values, maximum heading depth, and base heading level.
 * @returns The markdown representation of the object.
 */
export declare function markdownStringify(obj: any, options?: {
    quoteValues?: boolean;
    headings?: number;
    headingLevel?: number;
}): string;
//# sourceMappingURL=mdstringify.d.ts.map