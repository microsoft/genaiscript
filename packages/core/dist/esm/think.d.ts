/**
 * Converts custom "think" tags within a string to Markdown format with collapsible HTML elements.
 *
 * @param md - The input string containing "think" tags to be converted.
 * @returns The string with "think" tags replaced by collapsible Markdown syntax. If the input is empty, returns the input as is.
 */
export declare function convertThinkToMarkdown(md: string): string;
/**
 * Removes all occurrences of THINK_REGEX matches from the given string.
 *
 * @param md - The string from which THINK_REGEX matches will be removed.
 *             If the input is null or empty, it is returned as is.
 * @returns The modified string with THINK_REGEX matches removed, or the original string if no matches are found.
 */
export declare function unthink(md: string): string;
/**
 * /**
 *  * Parses input text to separate main content and reasoning enclosed within `
 */
export declare function splitThink(text: string): {
  content: string;
  reasoning: string;
};
//# sourceMappingURL=think.d.ts.map
