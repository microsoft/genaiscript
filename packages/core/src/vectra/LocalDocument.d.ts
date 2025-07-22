import { MetadataTypes } from "./types.js";
import { LocalDocumentIndex } from "./LocalDocumentIndex.js";
/**
 * Represents an indexed document stored on disk.
 */
export declare class LocalDocument {
    private readonly _index;
    private readonly _id;
    private readonly _uri;
    private _metadata;
    private _text;
    /**
     * Creates a new `LocalDocument` instance.
     * @param index Parent index that contains the document.
     * @param id ID of the document.
     * @param uri URI of the document.
     */
    constructor(index: LocalDocumentIndex, id: string, uri: string);
    /**
     * Returns the folder path where the document is stored.
     */
    get folderPath(): string;
    /**
     * Returns the ID of the document.
     */
    get id(): string;
    /**
     * Returns the URI of the document.
     */
    get uri(): string;
    /**
     * Returns the length of the document in tokens.
     * @remarks
     * This value will be estimated for documents longer then 40k bytes.
     * @returns Length of the document in tokens.
     */
    getLength(): Promise<number>;
    /**
     * Determines if the document has additional metadata storred on disk.
     * @returns True if the document has metadata; otherwise, false.
     */
    hasMetadata(): Promise<boolean>;
    /**
     * Loads the metadata for the document from disk.
     * @returns Metadata for the document.
     */
    loadMetadata(): Promise<Record<string, MetadataTypes>>;
    /**
     * Loads the text for the document from disk.
     * @returns Text for the document.
     */
    loadText(): Promise<string>;
}
//# sourceMappingURL=LocalDocument.d.ts.map