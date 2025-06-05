import { LocalDocument } from "./LocalDocument.js";
import { LocalDocumentIndex } from "./LocalDocumentIndex.js";
import { QueryResult, DocumentChunkMetadata, DocumentTextSection } from "./types.js";
/**
 * Represents a search result for a document stored on disk.
 */
export declare class LocalDocumentResult extends LocalDocument {
  private readonly _chunks;
  private readonly _tokenizer;
  private readonly _score;
  /**
   * @private
   * Internal constructor for `LocalDocumentResult` instances.
   */
  constructor(
    index: LocalDocumentIndex,
    id: string,
    uri: string,
    chunks: QueryResult<DocumentChunkMetadata>[],
    tokenizer: Tokenizer,
  );
  /**
   * Returns the chunks of the document that matched the query.
   */
  get chunks(): QueryResult<DocumentChunkMetadata>[];
  /**
   * Returns the average score of the document result.
   */
  get score(): number;
  /**
   * Renders all of the results chunks as spans of text (sections.)
   * @remarks
   * The returned sections will be sorted by document order and limited to maxTokens in length.
   * @param maxTokens Maximum number of tokens per section.
   * @returns Array of rendered text sections.
   */
  renderAllSections(maxTokens: number): Promise<DocumentTextSection[]>;
  /**
   * Renders the top spans of text (sections) of the document based on the query result.
   * @remarks
   * The returned sections will be sorted by relevance and limited to the top `maxSections`.
   * @param maxTokens Maximum number of tokens per section.
   * @param maxSections Maximum number of sections to return.
   * @param overlappingChunks Optional. If true, overlapping chunks of text will be added to each section until the maxTokens is reached.
   * @returns Array of rendered text sections.
   */
  renderSections(
    maxTokens: number,
    maxSections: number,
    overlappingChunks?: boolean,
  ): Promise<DocumentTextSection[]>;
  private encodeBeforeText;
  private encodeAfterText;
}
//# sourceMappingURL=LocalDocumentResult.d.ts.map
