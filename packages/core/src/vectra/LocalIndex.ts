import * as fs from "fs/promises";
import * as path from "path";
import { v4 } from "uuid";
import { ItemSelector } from "./ItemSelector";
import { IndexItem, IndexStats, MetadataFilter, MetadataTypes, QueryResult } from "./types";

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
export class LocalIndex<
  TMetadata extends Record<string, MetadataTypes> = Record<string, MetadataTypes>,
> {
  private readonly _folderPath: string;
  private readonly _indexName: string;

  private _data?: IndexData;
  private _update?: IndexData;

  /**
   * Creates a new instance of LocalIndex.
   * @param folderPath Path to the index folder.
   * @param indexName Optional name of the index file. Defaults to index.json.
   */
  public constructor(folderPath: string, indexName?: string) {
    this._folderPath = folderPath;
    this._indexName = indexName || "index.json";
  }

  /**
   * Path to the index folder.
   */
  public get folderPath(): string {
    return this._folderPath;
  }

  /**
   * Optional name of the index file.
   */
  public get indexName(): string {
    return this._indexName;
  }

  /**
   * Begins an update to the index.
   * @remarks
   * This method loads the index into memory and prepares it for updates.
   */
  public async beginUpdate(): Promise<void> {
    if (this._update) {
      throw new Error("Update already in progress");
    }

    await this.loadIndexData();
    this._update = Object.assign({}, this._data);
  }

  /**
   * Cancels an update to the index.
   * @remarks
   * This method discards any changes made to the index since the update began.
   */
  public cancelUpdate(): void {
    this._update = undefined;
  }

  /**
   * Creates a new index.
   * @remarks
   * This method creates a new folder on disk containing an index.json file.
   * @param config Index configuration.
   */
  public async createIndex(config: CreateIndexConfig = { version: 1 }): Promise<void> {
    // Delete if exists
    if (await this.isIndexCreated()) {
      if (config.deleteIfExists) {
        await this.deleteIndex();
      } else {
        throw new Error("Index already exists");
      }
    }

    try {
      // Create folder for index
      await fs.mkdir(this._folderPath, { recursive: true });

      // Initialize index.json file
      this._data = {
        version: config.version,
        metadata_config: config.metadata_config ?? {},
        items: [],
      };

      await fs.writeFile(path.join(this._folderPath, this._indexName), JSON.stringify(this._data));
    } catch (err: unknown) {
      await this.deleteIndex();
      throw new Error("Error creating index");
    }
  }

  /**
   * Deletes the index.
   * @remarks
   * This method deletes the index folder from disk.
   */
  public deleteIndex(): Promise<void> {
    this._data = undefined;
    return fs.rm(this._folderPath, {
      recursive: true,
      maxRetries: 3,
    });
  }

  /**
   * Deletes an item from the index.
   * @param id ID of item to delete.
   */
  public async deleteItem(id: string): Promise<void> {
    if (this._update) {
      const index = this._update.items.findIndex((i) => i.id === id);
      if (index >= 0) {
        this._update.items.splice(index, 1);
      }
    } else {
      await this.beginUpdate();
      const index = this._update!.items.findIndex((i) => i.id === id);
      if (index >= 0) {
        this._update!.items.splice(index, 1);
      }
      await this.endUpdate();
    }
  }

  /**
   * Ends an update to the index.
   * @remarks
   * This method saves the index to disk.
   */
  public async endUpdate(): Promise<void> {
    if (!this._update) {
      throw new Error("No update in progress");
    }

    try {
      // Save index
      await fs.writeFile(
        path.join(this._folderPath, this._indexName),
        JSON.stringify(this._update),
      );
      this._data = this._update;
      this._update = undefined;
    } catch (err: unknown) {
      throw new Error(`Error saving index: ${(err as any).toString()}`);
    }
  }

  /**
   * Loads an index from disk and returns its stats.
   * @returns Index stats.
   */
  public async getIndexStats(): Promise<IndexStats> {
    await this.loadIndexData();
    return {
      version: this._data!.version,
      metadata_config: this._data!.metadata_config,
      items: this._data!.items.length,
    };
  }

  /**
   * Returns an item from the index given its ID.
   * @param id ID of the item to retrieve.
   * @returns Item or undefined if not found.
   */
  public async getItem<TItemMetadata extends TMetadata = TMetadata>(
    id: string,
  ): Promise<IndexItem<TItemMetadata> | undefined> {
    await this.loadIndexData();
    return this._data!.items.find((i) => i.id === id) as any | undefined;
  }

  /**
   * Adds an item to the index.
   * @remarks
   * A new update is started if one is not already in progress. If an item with the same ID
   * already exists, an error will be thrown.
   * @param item Item to insert.
   * @returns Inserted item.
   */
  public async insertItem<TItemMetadata extends TMetadata = TMetadata>(
    item: Partial<IndexItem<TItemMetadata>>,
  ): Promise<IndexItem<TItemMetadata>> {
    if (this._update) {
      return (await this.addItemToUpdate(item, true)) as any;
    } else {
      await this.beginUpdate();
      const newItem = await this.addItemToUpdate(item, true);
      await this.endUpdate();
      return newItem as any;
    }
  }

  /**
   * Returns true if the index exists.
   */
  public async isIndexCreated(): Promise<boolean> {
    try {
      await fs.access(path.join(this._folderPath, this.indexName));
      return true;
    } catch (err: unknown) {
      return false;
    }
  }

  /**
   * Returns all items in the index.
   * @remarks
   * This method loads the index into memory and returns all its items. A copy of the items
   * array is returned so no modifications should be made to the array.
   * @returns Array of all items in the index.
   */
  public async listItems<TItemMetadata extends TMetadata = TMetadata>(): Promise<
    IndexItem<TItemMetadata>[]
  > {
    await this.loadIndexData();
    return this._data!.items.slice() as any;
  }

  /**
   * Returns all items in the index matching the filter.
   * @remarks
   * This method loads the index into memory and returns all its items matching the filter.
   * @param filter Filter to apply.
   * @returns Array of items matching the filter.
   */
  public async listItemsByMetadata<TItemMetadata extends TMetadata = TMetadata>(
    filter: MetadataFilter,
  ): Promise<IndexItem<TItemMetadata>[]> {
    await this.loadIndexData();
    return this._data!.items.filter((i) => ItemSelector.select(i.metadata, filter)) as any;
  }

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
  public async queryItems<TItemMetadata extends TMetadata = TMetadata>(
    vector: number[],
    topK: number,
    filter?: MetadataFilter,
  ): Promise<QueryResult<TItemMetadata>[]> {
    await this.loadIndexData();

    // Filter items
    let items = this._data!.items;
    if (filter) {
      items = items.filter((i) => ItemSelector.select(i.metadata, filter));
    }

    // Calculate distances
    const norm = ItemSelector.normalize(vector);
    const distances: { index: number; distance: number }[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const distance = ItemSelector.normalizedCosineSimilarity(
        vector,
        norm,
        item.vector,
        item.norm,
      );
      distances.push({ index: i, distance: distance });
    }

    // Sort by distance DESCENDING
    distances.sort((a, b) => b.distance - a.distance);

    // Find top k
    const top: QueryResult<TItemMetadata>[] = distances.slice(0, topK).map((d) => {
      return {
        item: Object.assign({}, items[d.index]) as any,
        score: d.distance,
      };
    });

    // Load external metadata
    for (const item of top) {
      if (item.item.metadataFile) {
        const metadataPath = path.join(this._folderPath, item.item.metadataFile);
        const metadata = await fs.readFile(metadataPath);
        item.item.metadata = JSON.parse(metadata.toString());
      }
    }

    return top;
  }

  /**
   * Adds or replaces an item in the index.
   * @remarks
   * A new update is started if one is not already in progress. If an item with the same ID
   * already exists, it will be replaced.
   * @param item Item to insert or replace.
   * @returns Upserted item.
   */
  public async upsertItem<TItemMetadata extends TMetadata = TMetadata>(
    item: Partial<IndexItem<TItemMetadata>>,
  ): Promise<IndexItem<TItemMetadata>> {
    if (this._update) {
      return (await this.addItemToUpdate(item, false)) as any;
    } else {
      await this.beginUpdate();
      const newItem = await this.addItemToUpdate(item, false);
      await this.endUpdate();
      return newItem as any;
    }
  }

  /**
   * Ensures that the index has been loaded into memory.
   */
  protected async loadIndexData(): Promise<void> {
    if (this._data) {
      return;
    }

    if (!(await this.isIndexCreated())) {
      throw new Error("Index does not exist");
    }

    const data = await fs.readFile(path.join(this._folderPath, this.indexName));
    this._data = JSON.parse(data.toString());
  }

  private async addItemToUpdate(
    item: Partial<IndexItem<any>>,
    unique: boolean,
  ): Promise<IndexItem> {
    // Ensure vector is provided
    if (!item.vector) {
      throw new Error("Vector is required");
    }

    // Ensure unique
    const id = item.id ?? v4();
    if (unique) {
      const existing = this._update!.items.find((i) => i.id === id);
      if (existing) {
        throw new Error(`Item with id ${id} already exists`);
      }
    }

    // Check for indexed metadata
    let metadata: Record<string, any> = {};
    let metadataFile: string | undefined;
    if (
      this._update!.metadata_config.indexed &&
      this._update!.metadata_config.indexed.length > 0 &&
      item.metadata
    ) {
      // Copy only indexed metadata
      for (const key of this._update!.metadata_config.indexed) {
        if (item.metadata && item.metadata[key]) {
          metadata[key] = item.metadata[key];
        }
      }

      // Save remaining metadata to disk
      metadataFile = `${v4()}.json`;
      const metadataPath = path.join(this._folderPath, metadataFile);
      await fs.writeFile(metadataPath, JSON.stringify(item.metadata));
    } else if (item.metadata) {
      metadata = item.metadata;
    }

    // Create new item
    const newItem: IndexItem = {
      id: id,
      metadata: metadata,
      vector: item.vector,
      norm: ItemSelector.normalize(item.vector),
    };
    if (metadataFile) {
      newItem.metadataFile = metadataFile;
    }

    // Add item to index
    if (!unique) {
      const existing = this._update!.items.find((i) => i.id === id);
      if (existing) {
        existing.metadata = newItem.metadata;
        existing.vector = newItem.vector;
        existing.metadataFile = newItem.metadataFile;
        return existing;
      } else {
        this._update!.items.push(newItem);
        return newItem;
      }
    } else {
      this._update!.items.push(newItem);
      return newItem;
    }
  }
}

interface IndexData {
  version: number;
  metadata_config: {
    indexed?: string[];
  };
  items: IndexItem[];
}
