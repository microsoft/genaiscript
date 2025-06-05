/**
 * Resolves the token encoder for a specified model identifier.
 * @param modelId - The model identifier to resolve the encoder for. Defaults to a large model alias if not provided.
 * @param options - Optional configuration. Includes a flag to disable fallback mechanisms.
 * @returns A Promise resolving to a Tokenizer object or undefined if fallback is disabled and resolution fails.
 */
export declare function resolveTokenEncoder(
  modelId: string,
  options?: {
    disableFallback?: boolean;
  },
): Promise<Tokenizer>;
/**
 * Splits the content of a file or string into manageable chunks based on the provided configuration.
 *
 * @param file - The content to be chunked; can be a string or a workspace file object.
 *               If a workspace file, its content is resolved and processed.
 * @param options - Optional configuration for chunk generation.
 *                  - model: Model identifier used to resolve the tokenizer.
 *                  - docType: Document type for processing; inferred from the file extension if not provided.
 *                  - lineNumbers: Flag indicating whether to include line numbers in the output.
 *                  - Other properties are passed to the TextSplitter for customization.
 * @returns A Promise resolving to an array of text chunks. Each chunk includes content, filename, and start/end line numbers.
 */
export declare function chunk(
  file: Awaitable<string | WorkspaceFile>,
  options?: TextChunkerConfig,
): Promise<TextChunk[]>;
//# sourceMappingURL=encoders.d.ts.map
