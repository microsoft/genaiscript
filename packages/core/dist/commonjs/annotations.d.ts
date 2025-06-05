/**
 * Parses annotations from TypeScript, GitHub Actions, and Azure DevOps.
 *
 * @param text Input text containing annotations to parse.
 * Extracts details such as file, line, endLine, severity, code, and message from annotations.
 * @returns Array of unique Diagnostic objects extracted from the input text.
 */
export declare function parseAnnotations(text: string): Diagnostic[];
/**
 * Removes all recognized annotations from the input text.
 *
 * Scans the input text for patterns matching TypeScript, GitHub Actions,
 * and Azure DevOps annotations, and removes them entirely.
 *
 * @param text Input text containing annotations to be removed.
 * @returns A new string with all annotations stripped from the input text.
 */
export declare function eraseAnnotations(text: string): string;
/**
 * Transforms all annotations found in the input text into formatted items.
 *
 * Iterates through all regular expressions in the annotations list to identify
 * matches, extracts data from the matches, constructs Diagnostic objects, and
 * formats them into string representations using the `convertAnnotationToItem` function.
 *
 * Replaces matched annotation patterns in the input text with their corresponding
 * formatted item strings.
 *
 * @param text Input text containing annotations to be transformed.
 * @returns A string where matched annotations are replaced with formatted items.
 */
export declare function convertAnnotationsToItems(text: string): string;
export declare function convertGithubMarkdownAnnotationsToItems(text: string): string;
/**
 * Formats a diagnostic annotation into a string representation suitable for display.
 *
 * Constructs a list item with an emoji indicating severity, the message,
 * and an optional filename with line reference.
 * If the file or line is unavailable, includes only the message.
 *
 * Maps severity levels to emojis using SEV_EMOJI_MAP. Defaults to "info" if severity is unknown.
 *
 * @param d The Diagnostic object containing details such as severity, message, filename, code, and range.
 * @returns A formatted string representing the Diagnostic as a list item.
 */
export declare function convertAnnotationToItem(d: Diagnostic): string;
/**
 * Converts a Diagnostic object to a GitHub Action command string.
 *
 * @param d The Diagnostic object containing severity, filename, range, and message.
 * Maps "info" severity to "notice" for GitHub Actions. If severity is not mapped, uses the original severity.
 * @returns A formatted GitHub Action command string including severity, filename, line, endLine, and message.
 */
export declare function convertDiagnosticToGitHubActionCommand(d: Diagnostic): string;
/**
 * Converts a Diagnostic object to an Azure DevOps log issue command string.
 *
 * @param d Diagnostic object containing severity, message, filename, and range.
 * @returns Formatted Azure DevOps command string for warnings and errors. For "info" severity, returns a debug message with filename and message.
 */
export declare function convertDiagnosticToAzureDevOpsCommand(d: Diagnostic): string;
export declare function diagnosticToGitHubMarkdown(
  info: {
    owner: string;
    repo: string;
    commitSha?: string;
  },
  d: Diagnostic,
): string;
/**
 * Converts annotations in text to a Markdown representation with severity-based admonitions.
 *
 * @param text Input text containing annotations to convert. Must include GitHub or Azure DevOps annotations.
 * Extracts severity, file, line, and optional code to format as Markdown.
 * Replaces annotations with formatted Markdown strings.
 * @returns Formatted Markdown string with severity levels mapped to admonitions, including file, line references, and optional codes.
 */
export declare function convertAnnotationsToMarkdown(text: string): string;
//# sourceMappingURL=annotations.d.ts.map
