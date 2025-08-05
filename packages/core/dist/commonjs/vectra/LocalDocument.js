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
exports.LocalDocument = void 0;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
/**
 * Represents an indexed document stored on disk.
 */
class LocalDocument {
    _index;
    _id;
    _uri;
    _metadata;
    _text;
    /**
     * Creates a new `LocalDocument` instance.
     * @param index Parent index that contains the document.
     * @param id ID of the document.
     * @param uri URI of the document.
     */
    constructor(index, id, uri) {
        this._index = index;
        this._id = id;
        this._uri = uri;
    }
    /**
     * Returns the folder path where the document is stored.
     */
    get folderPath() {
        return this._index.folderPath;
    }
    /**
     * Returns the ID of the document.
     */
    get id() {
        return this._id;
    }
    /**
     * Returns the URI of the document.
     */
    get uri() {
        return this._uri;
    }
    /**
     * Returns the length of the document in tokens.
     * @remarks
     * This value will be estimated for documents longer then 40k bytes.
     * @returns Length of the document in tokens.
     */
    async getLength() {
        const text = await this.loadText();
        if (text.length <= 40000) {
            return this._index.tokenizer.encode(text).length;
        }
        else {
            return Math.ceil(text.length / 4);
        }
    }
    /**
     * Determines if the document has additional metadata storred on disk.
     * @returns True if the document has metadata; otherwise, false.
     */
    async hasMetadata() {
        try {
            await fs.access(path.join(this.folderPath, `${this.id}.json`));
            return true;
        }
        catch (err) {
            return false;
        }
    }
    /**
     * Loads the metadata for the document from disk.
     * @returns Metadata for the document.
     */
    async loadMetadata() {
        if (this._metadata == undefined) {
            let json;
            try {
                json = (await fs.readFile(path.join(this.folderPath, `${this.id}.json`))).toString();
            }
            catch (err) {
                throw new Error(`Error reading metadata for document "${this.uri}": ${err.toString()}`);
            }
            try {
                this._metadata = JSON.parse(json);
            }
            catch (err) {
                throw new Error(`Error parsing metadata for document "${this.uri}": ${err.toString()}`);
            }
        }
        return this._metadata;
    }
    /**
     * Loads the text for the document from disk.
     * @returns Text for the document.
     */
    async loadText() {
        if (this._text == undefined) {
            try {
                this._text = (await fs.readFile(path.join(this.folderPath, `${this.id}.txt`))).toString();
            }
            catch (err) {
                throw new Error(`Error reading text file for document "${this.uri}": ${err.toString()}`);
            }
        }
        return this._text;
    }
}
exports.LocalDocument = LocalDocument;
//# sourceMappingURL=LocalDocument.js.map