import { IndexItem, IndexStats, MetadataFilter, MetadataTypes, QueryResult } from "./types.js";
export interface CreateIndexConfig {
  version: number;
  deleteIfExists?: boolean;
  metadata_config?: {
    indexed?: string[];
  };
}
/**
 * Local vector index instance.
 * @remarks
 * This class is used to create, update, and query a local vector index.
 * Each index is a folder on disk containing an index.json file and an optional set of metadata files.
 */
export declare class LocalIndex<
  TMetadata extends Record<string, MetadataTypes> = Record<string, MetadataTypes>,
> {
  private readonly _folderPath;
  private readonly _indexName;
  private _data?;
  private _update?;
  /**
   * Creates a new instance of LocalIndex.
   * @param folderPath Path to the index folder.
   * @param indexName Optional name of the index file. Defaults to index.json.
   */
  constructor(folderPath: string, indexName?: string);
  /**
   * Path to the index folder.
   */
  get folderPath(): string;
  /**
   * Optional name of the index file.
   */
  get indexName(): string;
  /**
   * Begins an update to the index.
   * @remarks
   * This method loads the index into memory and prepares it for updates.
   */
  beginUpdate(): Promise<void>;
  /**
   * Cancels an update to the index.
   * @remarks
   * This method discards any changes made to the index since the update began.
   */
  cancelUpdate(): void;
  /**
   * Creates a new index.
   * @remarks
   * This method creates a new folder on disk containing an index.json file.
   * @param config Index configuration.
   */
  createIndex(config?: CreateIndexConfig): Promise<void>;
  /**
   * Deletes the index.
   * @remarks
   * This method deletes the index folder from disk.
   */
  deleteIndex(): Promise<void>;
  /**
   * Deletes an item from the index.
   * @param id ID of item to delete.
   */
  deleteItem(id: string): Promise<void>;
  /**
   * Ends an update to the index.
   * @remarks
   * This method saves the index to disk.
   */
  endUpdate(): Promise<void>;
  /**
   * Loads an index from disk and returns its stats.
   * @returns Index stats.
   */
  getIndexStats(): Promise<IndexStats>;
  /**
   * Returns an item from the index given its ID.
   * @param id ID of the item to retrieve.
   * @returns Item or undefined if not found.
   */
  getItem<TItemMetadata extends TMetadata = TMetadata>(
    id: string,
  ): Promise<IndexItem<TItemMetadata> | undefined>;
  /**
   * Adds an item to the index.
   * @remarks
   * A new update is started if one is not already in progress. If an item with the same ID
   * already exists, an error will be thrown.
   * @param item Item to insert.
   * @returns Inserted item.
   */
  insertItem<TItemMetadata extends TMetadata = TMetadata>(
    item: Partial<IndexItem<TItemMetadata>>,
  ): Promise<IndexItem<TItemMetadata>>;
  /**
   * Returns true if the index exists.
   */
  isIndexCreated(): Promise<boolean>;
  /**
   * Returns all items in the index.
   * @remarks
   * This method loads the index into memory and returns all its items. A copy of the items
   * array is returned so no modifications should be made to the array.
   * @returns Array of all items in the index.
   */
  listItems<TItemMetadata extends TMetadata = TMetadata>(): Promise<IndexItem<TItemMetadata>[]>;
  /**
   * Returns all items in the index matching the filter.
   * @remarks
   * This method loads the index into memory and returns all its items matching the filter.
   * @param filter Filter to apply.
   * @returns Array of items matching the filter.
   */
  listItemsByMetadata<TItemMetadata extends TMetadata = TMetadata>(
    filter: MetadataFilter,
  ): Promise<IndexItem<TItemMetadata>[]>;
  /**
   * Finds the top k items in the index that are most similar to the vector.
   * @remarks
   * This method loads the index into memory and returns the top k items that are most similar.
   * An optional filter can be applied to the metadata of the items.
   * @param vector Vector to query against.
   * @param topK Number of items to return.
   * @param filter Optional. Filter to apply.
   * @returns Similar items to the vector that matche the supplied filter.
   */
  queryItems<TItemMetadata extends TMetadata = TMetadata>(
    vector: number[],
    topK: number,
    filter?: MetadataFilter,
  ): Promise<QueryResult<TItemMetadata>[]>;
  /**
   * Adds or replaces an item in the index.
   * @remarks
   * A new update is started if one is not already in progress. If an item with the same ID
   * already exists, it will be replaced.
   * @param item Item to insert or replace.
   * @returns Upserted item.
   */
  upsertItem<TItemMetadata extends TMetadata = TMetadata>(
    item: Partial<IndexItem<TItemMetadata>>,
  ): Promise<IndexItem<TItemMetadata>>;
  /**
   * Ensures that the index has been loaded into memory.
   */
  protected loadIndexData(): Promise<void>;
  private addItemToUpdate;
}
//# sourceMappingURL=LocalIndex.d.ts.map
