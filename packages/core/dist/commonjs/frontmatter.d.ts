/**
 * Parses the frontmatter section of a text input and attempts to convert it into a structured format.
 *
 * @param text The text or file content to parse. Can either be a raw string or a WorkspaceFile object.
 * @param options Optional parsing options:
 *   - format: Specifies the expected frontmatter format. Supported formats are "yaml", "json", "toml", or "text".
 *
 * @returns An object containing:
 *   - text: The raw frontmatter string.
 *   - value: The parsed frontmatter as a structured object, depending on the specified format.
 *   - endLine: The last line index of the frontmatter, if it exists.
 *   Returns `undefined` if no frontmatter is found.
 */
export declare function frontmatterTryParse(
  text: string | WorkspaceFile,
  options?: {
    format: "yaml" | "json" | "toml" | "text";
  },
):
  | {
      text: string;
      value: any;
      endLine?: number;
    }
  | undefined;
/**
 * Splits a Markdown text into its frontmatter and content parts.
 *
 * @param text - The input text or a WorkspaceFile containing Markdown content.
 * @returns An object containing:
 *   - `frontmatter`: The extracted frontmatter as a string, if available.
 *   - `endLine`: The line number where the frontmatter ends, if applicable.
 *   - `content`: The remaining Markdown content after the frontmatter.
 */
export declare function splitMarkdown(text: string | WorkspaceFile): {
  frontmatter?: string;
  endLine?: number;
  content: string;
};
/**
 * Updates the frontmatter section of a given text and returns the updated content.
 *
 * @param text - The input text containing frontmatter and content.
 * @param newFrontmatter - An object representing the new frontmatter to merge or apply.
 *   Keys with `null` remove corresponding fields, keys with `undefined` are ignored.
 * @param options - Optional configuration for output format:
 *   - `format`: Specifies the frontmatter format ("yaml" or "json"). Defaults to "yaml".
 *
 * @returns The updated text with the modified frontmatter and existing content.
 *
 * @throws An error if the specified format is unsupported.
 */
export declare function updateFrontmatter(
  text: string,
  newFrontmatter: any,
  options?: {
    format: "yaml" | "json";
  },
): string;
//# sourceMappingURL=frontmatter.d.ts.map
