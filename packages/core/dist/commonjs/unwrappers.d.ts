/**
 * Remove code fences from a fenced block for the specified language.
 * @param text - The text containing the fenced block.
 * @param language - The language or array of languages used in the fence. Use "*" to match any language. Null or undefined values in the array are ignored.
 * @returns The text without fences, or the original text if no fences are found.
 */
export declare function unfence(text: string, language?: "*" | ElementOrArray<string>): string;
/**
 * Remove quotes from the beginning and end of a string if they exist and match.
 * @param s - The string to unquote.
 * @returns The unquoted string, or the original string if no matching quotes are found.
 */
export declare function unquote(s: string): string;
/**
 * Converts a file or its content into a string representation of the content.
 *
 * @param fileOrContent - Either the file content as a string or a file object containing `content` property.
 * @returns The content of the file as a string.
 */
export declare function filenameOrFileToContent(fileOrContent: string | WorkspaceFile): string;
/**
 * Extracts the filename from a string or a workspace file object.
 *
 * @param fileOrContent - Either a string representing a filename or a WorkspaceFile object containing filename and content.
 * @returns The extracted filename as a string.
 */
export declare function filenameOrFileToFilename(fileOrContent: string | WorkspaceFile): string;
/**
 * Removes leading and trailing newline characters from a string.
 *
 * @param s - The string to process. If null or undefined, it is returned as is.
 * @returns The string without leading or trailing newlines.
 */
export declare function trimNewlines(s: string): string;
//# sourceMappingURL=unwrappers.d.ts.map
