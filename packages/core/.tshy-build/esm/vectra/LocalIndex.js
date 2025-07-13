// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import * as fs from "fs/promises";
import { v4 } from "uuid";
import { ItemSelector } from "./ItemSelector.js";
import { genaiscriptDebug } from "../debug.js";
import { join } from "path";
const dbg = genaiscriptDebug("vector:index");
/**
 * Local vector index instance.
 * @remarks
 * This class is used to create, update, and query a local vector index.
 * Each index is a folder on disk containing an index.json file and an optional set of metadata files.
 */
export class LocalIndex {
    _folderPath;
    _indexName;
    _data;
    _update;
    /**
     * Creates a new instance of LocalIndex.
     * @param folderPath Path to the index folder.
     * @param indexName Optional name of the index file. Defaults to index.json.
     */
    constructor(folderPath, indexName) {
        this._folderPath = folderPath;
        this._indexName = indexName || "index.json";
    }
    /**
     * Path to the index folder.
     */
    get folderPath() {
        return this._folderPath;
    }
    /**
     * Optional name of the index file.
     */
    get indexName() {
        return this._indexName;
    }
    /**
     * Begins an update to the index.
     * @remarks
     * This method loads the index into memory and prepares it for updates.
     */
    async beginUpdate() {
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
    cancelUpdate() {
        this._update = undefined;
    }
    /**
     * Creates a new index.
     * @remarks
     * This method creates a new folder on disk containing an index.json file.
     * @param config Index configuration.
     */
    async createIndex(config = { version: 1 }) {
        // Delete if exists
        if (await this.isIndexCreated()) {
            if (config.deleteIfExists) {
                await this.deleteIndex();
            }
            else {
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
            await fs.writeFile(join(this._folderPath, this._indexName), JSON.stringify(this._data));
        }
        catch (err) {
            dbg(err);
            await this.deleteIndex();
            throw new Error("Error creating index");
        }
    }
    /**
     * Deletes the index.
     * @remarks
     * This method deletes the index folder from disk.
     */
    deleteIndex() {
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
    async deleteItem(id) {
        if (this._update) {
            const index = this._update.items.findIndex((i) => i.id === id);
            if (index >= 0) {
                this._update.items.splice(index, 1);
            }
        }
        else {
            await this.beginUpdate();
            const index = this._update.items.findIndex((i) => i.id === id);
            if (index >= 0) {
                this._update.items.splice(index, 1);
            }
            await this.endUpdate();
        }
    }
    /**
     * Ends an update to the index.
     * @remarks
     * This method saves the index to disk.
     */
    async endUpdate() {
        if (!this._update) {
            throw new Error("No update in progress");
        }
        try {
            // Save index
            await fs.writeFile(join(this._folderPath, this._indexName), JSON.stringify(this._update));
            this._data = this._update;
            this._update = undefined;
        }
        catch (err) {
            throw new Error(`Error saving index: ${err.toString()}`);
        }
    }
    /**
     * Loads an index from disk and returns its stats.
     * @returns Index stats.
     */
    async getIndexStats() {
        await this.loadIndexData();
        return {
            version: this._data.version,
            metadata_config: this._data.metadata_config,
            items: this._data.items.length,
        };
    }
    /**
     * Returns an item from the index given its ID.
     * @param id ID of the item to retrieve.
     * @returns Item or undefined if not found.
     */
    async getItem(id) {
        await this.loadIndexData();
        return this._data.items.find((i) => i.id === id);
    }
    /**
     * Adds an item to the index.
     * @remarks
     * A new update is started if one is not already in progress. If an item with the same ID
     * already exists, an error will be thrown.
     * @param item Item to insert.
     * @returns Inserted item.
     */
    async insertItem(item) {
        if (this._update) {
            return (await this.addItemToUpdate(item, true));
        }
        else {
            await this.beginUpdate();
            const newItem = await this.addItemToUpdate(item, true);
            await this.endUpdate();
            return newItem;
        }
    }
    /**
     * Returns true if the index exists.
     */
    async isIndexCreated() {
        try {
            await fs.access(join(this._folderPath, this.indexName));
            return true;
        }
        catch (err) {
            dbg(err);
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
    async listItems() {
        await this.loadIndexData();
        return this._data.items.slice();
    }
    /**
     * Returns all items in the index matching the filter.
     * @remarks
     * This method loads the index into memory and returns all its items matching the filter.
     * @param filter Filter to apply.
     * @returns Array of items matching the filter.
     */
    async listItemsByMetadata(filter) {
        await this.loadIndexData();
        return this._data.items.filter((i) => ItemSelector.select(i.metadata, filter));
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
    async queryItems(vector, topK, filter) {
        await this.loadIndexData();
        // Filter items
        let items = this._data.items;
        if (filter) {
            items = items.filter((i) => ItemSelector.select(i.metadata, filter));
        }
        // Calculate distances
        const norm = ItemSelector.normalize(vector);
        const distances = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const distance = ItemSelector.normalizedCosineSimilarity(vector, norm, item.vector, item.norm);
            distances.push({ index: i, distance: distance });
        }
        // Sort by distance DESCENDING
        distances.sort((a, b) => b.distance - a.distance);
        // Find top k
        const top = distances.slice(0, topK).map((d) => {
            return {
                item: Object.assign({}, items[d.index]),
                score: d.distance,
            };
        });
        // Load external metadata
        for (const item of top) {
            if (item.item.metadataFile) {
                const metadataPath = join(this._folderPath, item.item.metadataFile);
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
    async upsertItem(item) {
        if (this._update) {
            return (await this.addItemToUpdate(item, false));
        }
        else {
            await this.beginUpdate();
            const newItem = await this.addItemToUpdate(item, false);
            await this.endUpdate();
            return newItem;
        }
    }
    /**
     * Ensures that the index has been loaded into memory.
     */
    async loadIndexData() {
        if (this._data) {
            return;
        }
        if (!(await this.isIndexCreated())) {
            throw new Error("Index does not exist");
        }
        const data = await fs.readFile(join(this._folderPath, this.indexName));
        this._data = JSON.parse(data.toString());
    }
    async addItemToUpdate(item, unique) {
        // Ensure vector is provided
        if (!item.vector) {
            dbg(`item: %O`, item);
            throw new Error("embeddings vector is required");
        }
        // Ensure unique
        const id = item.id ?? v4();
        if (unique) {
            const existing = this._update.items.find((i) => i.id === id);
            if (existing) {
                throw new Error(`Item with id ${id} already exists`);
            }
        }
        // Check for indexed metadata
        let metadata = {};
        let metadataFile;
        if (this._update.metadata_config.indexed &&
            this._update.metadata_config.indexed.length > 0 &&
            item.metadata) {
            // Copy only indexed metadata
            for (const key of this._update.metadata_config.indexed) {
                if (item.metadata && item.metadata[key]) {
                    metadata[key] = item.metadata[key];
                }
            }
            // Save remaining metadata to disk
            metadataFile = `${v4()}.json`;
            const metadataPath = join(this._folderPath, metadataFile);
            await fs.writeFile(metadataPath, JSON.stringify(item.metadata));
        }
        else if (item.metadata) {
            metadata = item.metadata;
        }
        // Create new item
        const newItem = {
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
            const existing = this._update.items.find((i) => i.id === id);
            if (existing) {
                existing.metadata = newItem.metadata;
                existing.vector = newItem.vector;
                existing.metadataFile = newItem.metadataFile;
                return existing;
            }
            else {
                this._update.items.push(newItem);
                return newItem;
            }
        }
        else {
            this._update.items.push(newItem);
            return newItem;
        }
    }
}
//# sourceMappingURL=LocalIndex.js.map