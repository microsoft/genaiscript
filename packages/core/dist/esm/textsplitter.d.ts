export interface TextSplitterConfig {
  separators: string[];
  keepSeparators: boolean;
  chunkSize: number;
  chunkOverlap: number;
  tokenizer: Tokenizer;
  docType?: string;
}
export interface TextChunk {
  text: string;
  tokens: number[];
  startPos: number;
  endPos: number;
  startOverlap: number[];
  endOverlap: number[];
}
/**
 * Rebuilds the original text from an array of text chunks.
 *
 * @param text - The original text that was split into chunks.
 * @param chunks - An array of text chunks containing information about the segmented portions of the text.
 *
 * @returns The reconstructed text built by combining all text chunks and their respective positions.
 */
export declare function unchunk(text: string, chunks: TextChunk[]): string;
export declare class TextSplitter {
  private readonly _config;
  constructor(config?: Partial<TextSplitterConfig>);
  split(text: string): TextChunk[];
  private recursiveSplit;
  private combineChunks;
  private containsAlphanumeric;
  private splitBySpaces;
  private getSeparators;
}
//# sourceMappingURL=textsplitter.d.ts.map
