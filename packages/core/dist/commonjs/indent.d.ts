/**
 * Indents each line of a given text by a specified indentation string.
 *
 * @param text - The input text to be indented. Returns the original text if it is undefined, null, or empty.
 * @param indentation - The string to prepend to each line of the input text.
 * @returns The indented text or the original input if it is undefined, null, or empty.
 */
export declare function indent(text: string, indentation: string): string;
/**
 * Unindents a string.
 *
 * @param templ - Template or string to unindent.
 * @param values - Values to interpolate into the template.
 */
export declare function dedent(templ: TemplateStringsArray | string, ...values: unknown[]): string;
//# sourceMappingURL=indent.d.ts.map
