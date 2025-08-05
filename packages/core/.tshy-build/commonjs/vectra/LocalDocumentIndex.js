"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalDocumentIndex = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const LocalIndex_js_1 = require("./LocalIndex.js");
const LocalDocumentResult_js_1 = require("./LocalDocumentResult.js");
const LocalDocument_js_1 = require("./LocalDocument.js");
const textsplitter_js_1 = require("../textsplitter.js");
const error_js_1 = require("../error.js");
const debug_js_1 = require("../debug.js");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const console_1 = require("console");
const dbg = (0, debug_js_1.genaiscriptDebug)("vector:db");
/**
 * Represents a local index of documents stored on disk.
 */
class LocalDocumentIndex extends LocalIndex_js_1.LocalIndex {
    _embeddings;
    _tokenizer;
    _chunkingConfig;
    _catalog;
    _newCatalog;
    /**
     * Creates a new `LocalDocumentIndex` instance.
     * @param config Configuration settings for the document index.
     */
    constructor(config) {
        super(config.folderPath);
        this._embeddings = config.embeddings;
        this._chunkingConfig = Object.assign({
            keepSeparators: true,
            chunkSize: 512,
            chunkOverlap: 0,
        }, config.chunkingConfig);
        this._tokenizer = config.tokenizer ?? this._chunkingConfig.tokenizer;
        this._chunkingConfig.tokenizer = this._tokenizer;
    }
    /**
     * Returns the embeddings model used by the index (if configured.)
     */
    get embeddings() {
        return this._embeddings;
    }
    /**
     * Returns the tokenizer used by the index.
     */
    get tokenizer() {
        return this._tokenizer;
    }
    /**
     * Returns true if the document catalog exists.
     */
    async isCatalogCreated() {
        try {
            const fn = (0, path_1.join)(this.folderPath, "catalog.json");
            dbg(`create catalog %s`, fn);
            await fs.access(fn);
            return true;
        }
        catch (err) {
            return false;
        }
    }
    /**
     * Returns the document ID for the given URI.
     * @param uri URI of the document to lookup.
     * @returns Document ID or undefined if not found.
     */
    async getDocumentId(uri) {
        await this.loadIndexData();
        return this._catalog?.uriToId[uri];
    }
    /**
     * Returns the document URI for the given ID.
     * @param documentId ID of the document to lookup.
     * @returns Document URI or undefined if not found.
     */
    async getDocumentUri(documentId) {
        await this.loadIndexData();
        return this._catalog?.idToUri[documentId];
    }
    /**
     * Loads the document catalog from disk and returns its stats.
     * @returns Catalog stats.
     */
    async getCatalogStats() {
        const stats = await this.getIndexStats();
        return {
            version: this._catalog.version,
            documents: this._catalog.count,
            chunks: stats.items,
            metadata_config: stats.metadata_config,
        };
    }
    /**
     * Deletes a document from the index.
     * @param uri URI of the document to delete.
     */
    async deleteDocument(uri) {
        dbg(`delete %s`, uri);
        // Lookup document ID
        const documentId = await this.getDocumentId(uri);
        if (documentId == undefined) {
            return;
        }
        // Delete document chunks from index and remove from catalog
        await this.beginUpdate();
        try {
            // Get list of chunks for document
            const chunks = await this.listItemsByMetadata({ documentId });
            dbg(`delete chunks: %d`, chunks.length);
            // Delete chunks
            for (const chunk of chunks) {
                await this.deleteItem(chunk.id);
            }
            // Remove entry from catalog
            delete this._newCatalog.uriToId[uri];
            delete this._newCatalog.idToUri[documentId];
            this._newCatalog.count--;
            // Commit changes
            await this.endUpdate();
        }
        catch (err) {
            // Cancel update and raise error
            this.cancelUpdate();
            throw new Error(`Error deleting document "${uri}": ${(0, error_js_1.errorMessage)(err)}`);
        }
        // Delete text file from disk
        try {
            await fs.unlink(path.join(this.folderPath, `${documentId}.txt`));
        }
        catch (err) {
            throw new Error(`Error removing text file for document "${uri}" from disk: ${(0, error_js_1.errorMessage)(err)}`);
        }
        // Delete metadata file from disk
        try {
            await fs.unlink(path.join(this.folderPath, `${documentId}.json`));
        }
        catch {
            // Ignore error
        }
    }
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
    async upsertDocument(uri, text, docType, metadata) {
        // Ensure embeddings configured
        if (!this._embeddings) {
            throw new Error(`Embeddings model not configured.`);
        }
        dbg(`upsert %s, %dc`, uri, text.length);
        // Check for existing document ID
        let documentId = await this.getDocumentId(uri);
        if (documentId != undefined) {
            // Delete existing document
            await this.deleteDocument(uri);
        }
        else {
            // Generate new document ID
            documentId = (0, uuid_1.v4)();
        }
        // Initialize text splitter settings
        const config = Object.assign({ docType }, this._chunkingConfig);
        if (config.docType == undefined) {
            // Populate docType based on extension
            const pos = uri.lastIndexOf(".");
            if (pos >= 0) {
                const ext = uri.substring(pos + 1).toLowerCase();
                config.docType = ext;
            }
        }
        // Split text into chunks
        const splitter = new textsplitter_js_1.TextSplitter(config);
        const chunks = splitter.split(text);
        dbg(`chunks: %d`, chunks.length);
        (0, console_1.assert)(!chunks.some((c) => c.text === undefined), `TextSplitter returned empty chunk.`);
        (0, console_1.assert)(!chunks.some((c) => !c.tokens?.length), `TextSplitter returned chunk with no tokens.`);
        // Break chunks into batches for embedding generation
        let totalTokens = 0;
        const chunkBatches = [];
        let currentBatch = [];
        for (const chunk of chunks) {
            totalTokens += chunk.tokens.length;
            if (totalTokens > this._embeddings.maxTokens) {
                if (currentBatch.length > 0)
                    chunkBatches.push(currentBatch);
                currentBatch = [];
                totalTokens = chunk.tokens.length;
            }
            currentBatch.push(chunk.text.replace(/\n/g, " "));
        }
        if (currentBatch.length > 0) {
            chunkBatches.push(currentBatch);
        }
        dbg(`chunk batches: %d`, chunkBatches.length);
        // Generate embeddings for chunks
        const embeddings = [];
        for (const batch of chunkBatches) {
            let response;
            try {
                dbg(`batch: %O`, batch);
                response = await this._embeddings.createEmbeddings(batch);
            }
            catch (err) {
                throw new Error(`Error generating embeddings: ${(0, error_js_1.errorMessage)(err)}`);
            }
            // Check for error
            if (response.status != "success") {
                throw new Error(`Error generating embeddings: ${response.message}`);
            }
            if (response.output.length != batch.length)
                throw new Error(`Error generating embedding batches: expected ${batch.length} embeddings, got ${response.output.length}`);
            // Add embeddings to output
            for (const embedding of response.output) {
                embeddings.push(embedding);
            }
        }
        dbg(`embeddings: %d`, embeddings.length);
        if (embeddings.length != chunks.length) {
            throw new Error(`Error generating embeddings: expected ${chunks.length} embeddings, got ${embeddings.length}`);
        }
        // Add document chunks to index
        await this.beginUpdate();
        try {
            // Add chunks to index
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const embedding = embeddings[i];
                const chunkMetadata = Object.assign({
                    documentId,
                    startPos: chunk.startPos,
                    endPos: chunk.endPos,
                }, metadata);
                await this.insertItem({
                    id: (0, uuid_1.v4)(),
                    metadata: chunkMetadata,
                    vector: embedding,
                });
            }
            // Save metadata file to disk
            if (metadata != undefined) {
                await fs.writeFile(path.join(this.folderPath, `${documentId}.json`), JSON.stringify(metadata));
            }
            // Save text file to disk
            await fs.writeFile(path.join(this.folderPath, `${documentId}.txt`), text);
            // Add entry to catalog
            this._newCatalog.uriToId[uri] = documentId;
            this._newCatalog.idToUri[documentId] = uri;
            this._newCatalog.count++;
            // Commit changes
            await this.endUpdate();
        }
        catch (err) {
            // Cancel update and raise error
            this.cancelUpdate();
            throw new Error(`Error adding document "${uri}": ${(0, error_js_1.errorMessage)(err)}`);
        }
        // Return document
        return new LocalDocument_js_1.LocalDocument(this, documentId, uri);
    }
    /**
     * Returns all documents in the index.
     * @remarks
     * Each document will contain all of the documents indexed chunks.
     * @returns Array of documents.
     */
    async listDocuments() {
        // Sort chunks by document ID
        const docs = {};
        const chunks = await this.listItems();
        chunks.forEach((chunk) => {
            const metadata = chunk.metadata;
            if (docs[metadata.documentId] == undefined) {
                docs[metadata.documentId] = [];
            }
            docs[metadata.documentId].push({ item: chunk, score: 1.0 });
        });
        // Create document results
        const results = [];
        for (const documentId in docs) {
            const uri = (await this.getDocumentUri(documentId));
            const documentResult = new LocalDocumentResult_js_1.LocalDocumentResult(this, documentId, uri, docs[documentId], this._tokenizer);
            results.push(documentResult);
        }
        return results;
    }
    /**
     * Queries the index for documents similar to the given query.
     * @param query Text to query for.
     * @param options Optional. Query options.
     * @returns Array of document results.
     */
    async queryDocuments(query, options) {
        // Ensure embeddings configured
        if (!this._embeddings) {
            throw new Error(`Embeddings model not configured.`);
        }
        // Ensure options are defined
        options = Object.assign({
            maxDocuments: 10,
            maxChunks: 50,
        }, options);
        // Generate embeddings for query
        let embeddings;
        try {
            embeddings = await this._embeddings.createEmbeddings(query.replace(/\n/g, " "));
        }
        catch (err) {
            throw new Error(`Error generating embeddings for query: ${(0, error_js_1.errorMessage)(err)}`);
        }
        // Check for error
        if (embeddings.status != "success") {
            throw new Error(`Error generating embeddings for query: ${embeddings.message}`);
        }
        // Query index for chunks
        const results = await this.queryItems(embeddings.output[0], options.maxChunks, options.filter);
        // Group chunks by document
        const documentChunks = {};
        for (const result of results) {
            const metadata = result.item.metadata;
            if (documentChunks[metadata.documentId] == undefined) {
                documentChunks[metadata.documentId] = [];
            }
            documentChunks[metadata.documentId].push(result);
        }
        // Create a document result for each document
        const documentResults = [];
        for (const documentId in documentChunks) {
            const chunks = documentChunks[documentId];
            const uri = (await this.getDocumentUri(documentId));
            const documentResult = new LocalDocumentResult_js_1.LocalDocumentResult(this, documentId, uri, chunks, this._tokenizer);
            documentResults.push(documentResult);
        }
        // Sort document results by score and return top results
        return documentResults.sort((a, b) => b.score - a.score).slice(0, options.maxDocuments);
    }
    // Overrides
    async beginUpdate() {
        await super.beginUpdate();
        this._newCatalog = Object.assign({}, this._catalog);
    }
    cancelUpdate() {
        super.cancelUpdate();
        this._newCatalog = undefined;
    }
    async createIndex(config) {
        await super.createIndex(config);
        await this.loadIndexData();
    }
    async endUpdate() {
        await super.endUpdate();
        try {
            // Save catalog
            await fs.writeFile(path.join(this.folderPath, "catalog.json"), JSON.stringify(this._newCatalog));
            this._catalog = this._newCatalog;
            this._newCatalog = undefined;
        }
        catch (err) {
            throw new Error(`Error saving document catalog: ${(0, error_js_1.errorMessage)(err)}`);
        }
    }
    async loadIndexData() {
        await super.loadIndexData();
        if (this._catalog) {
            return;
        }
        const catalogPath = path.join(this.folderPath, "catalog.json");
        dbg(`load catalog %s`, catalogPath);
        if (await this.isCatalogCreated()) {
            // Load catalog
            const buffer = await (0, promises_1.readFile)(catalogPath, { encoding: "utf8" });
            this._catalog = JSON.parse(buffer);
        }
        else {
            try {
                // Initialize catalog
                this._catalog = {
                    version: 1,
                    count: 0,
                    uriToId: {},
                    idToUri: {},
                };
                await fs.writeFile(catalogPath, JSON.stringify(this._catalog));
            }
            catch (err) {
                throw new Error(`Error creating document catalog: ${(0, error_js_1.errorMessage)(err)}`);
            }
        }
    }
}
exports.LocalDocumentIndex = LocalDocumentIndex;
//# sourceMappingURL=LocalDocumentIndex.js.map