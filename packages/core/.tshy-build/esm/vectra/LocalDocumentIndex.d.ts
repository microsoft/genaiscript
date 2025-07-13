import { CreateIndexConfig, LocalIndex } from "./LocalIndex.js";
import { MetadataFilter, EmbeddingsModel, MetadataTypes, DocumentChunkMetadata, DocumentCatalogStats } from "./types.js";
import { LocalDocumentResult } from "./LocalDocumentResult.js";
import { LocalDocument } from "./LocalDocument.js";
import { TextSplitterConfig } from "../textsplitter.js";
import { Tokenizer } from "../types.js";
/**
 * Options for querying documents in the index.
 */
export interface DocumentQueryOptions {
    /**
     * Optional. Maximum number of documents to return.
     * @remarks
     * Default is 10.
     */
    maxDocuments?: number;
    /**
     * Maximum number of chunks to return per document.
     * @remarks
     * Default is 50.
     */
    maxChunks?: number;
    /**
     * Optional. Filter to apply to the document metadata.
     */
    filter?: MetadataFilter;
}
/**
 * Configuration settings for a local document index.
 */
export interface LocalDocumentIndexConfig {
    /**
     * Folder path where the index is stored.
     */
    folderPath: string;
    /**
     * Optional. Embeddings model to use for generating document embeddings.
     */
    embeddings?: EmbeddingsModel;
    /**
     * Optional. Tokenizer to use for splitting text into tokens.
     */
    tokenizer?: Tokenizer;
    /**
     * Optional. Configuration settings for splitting text into chunks.
     */
    chunkingConfig?: Partial<TextSplitterConfig>;
}
/**
 * Represents a local index of documents stored on disk.
 */
export declare class LocalDocumentIndex extends LocalIndex<DocumentChunkMetadata> {
    private readonly _embeddings?;
    private readonly _tokenizer;
    private readonly _chunkingConfig?;
    private _catalog?;
    private _newCatalog?;
    /**
     * Creates a new `LocalDocumentIndex` instance.
     * @param config Configuration settings for the document index.
     */
    constructor(config: LocalDocumentIndexConfig);
    /**
     * Returns the embeddings model used by the index (if configured.)
     */
    get embeddings(): EmbeddingsModel | undefined;
    /**
     * Returns the tokenizer used by the index.
     */
    get tokenizer(): Tokenizer;
    /**
     * Returns true if the document catalog exists.
     */
    isCatalogCreated(): Promise<boolean>;
    /**
     * Returns the document ID for the given URI.
     * @param uri URI of the document to lookup.
     * @returns Document ID or undefined if not found.
     */
    getDocumentId(uri: string): Promise<string | undefined>;
    /**
     * Returns the document URI for the given ID.
     * @param documentId ID of the document to lookup.
     * @returns Document URI or undefined if not found.
     */
    getDocumentUri(documentId: string): Promise<string | undefined>;
    /**
     * Loads the document catalog from disk and returns its stats.
     * @returns Catalog stats.
     */
    getCatalogStats(): Promise<DocumentCatalogStats>;
    /**
     * Deletes a document from the index.
     * @param uri URI of the document to delete.
     */
    deleteDocument(uri: string): Promise<void>;
    /**
     * Adds a document to the catalog.
     * @remarks
     * A new update is started if one is not already in progress. If an document with the same uri
     * already exists, it will be replaced.
     * @param uri - Document URI
     * @param text - Document text
     * @param docType - Optional. Document type
     * @param metadata - Optional. Document metadata to index
     * @returns Inserted document
     */
    upsertDocument(uri: string, text: string, docType?: string, metadata?: Record<string, MetadataTypes>): Promise<LocalDocument>;
    /**
     * Returns all documents in the index.
     * @remarks
     * Each document will contain all of the documents indexed chunks.
     * @returns Array of documents.
     */
    listDocuments(): Promise<LocalDocumentResult[]>;
    /**
     * Queries the index for documents similar to the given query.
     * @param query Text to query for.
     * @param options Optional. Query options.
     * @returns Array of document results.
     */
    queryDocuments(query: string, options?: DocumentQueryOptions): Promise<LocalDocumentResult[]>;
    beginUpdate(): Promise<void>;
    cancelUpdate(): void;
    createIndex(config?: CreateIndexConfig): Promise<void>;
    endUpdate(): Promise<void>;
    protected loadIndexData(): Promise<void>;
}
//# sourceMappingURL=LocalDocumentIndex.d.ts.map