/**
 * Chunks markdown into sections based on headings while maintaining subtrees.
 * Handles WorkspaceFile objects and plain markdown strings.
 * Does not reliably handle code sections containing markdown.
 * @param markdown - The markdown content as a string or a WorkspaceFile object. If a WorkspaceFile, its content is used. Throws if encoding is base64.
 * @param approximateTokens - Function to estimate token count of text. Used to calculate chunk sizes.
 * @param options - Optional configuration including maxTokens (default 4096) and pageSeparator (default "======").
 * @returns Array of TextChunk objects representing the chunks, including metadata such as filename and line range.
 */
export declare function chunkMarkdown(
  markdown: string | WorkspaceFile,
  approximateTokens: (text: string) => number,
  options?: {
    maxTokens?: number;
    pageSeparator?: string;
  },
): Promise<TextChunk[]>;
//# sourceMappingURL=mdchunk.d.ts.map
