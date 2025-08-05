"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.vectraWorkspaceFileIndex = void 0;
const LocalDocumentIndex_js_1 = require("./vectra/LocalDocumentIndex.js");
const util_js_1 = require("./util.js");
const cancellation_js_1 = require("./cancellation.js");
const cleaners_js_1 = require("./cleaners.js");
const file_js_1 = require("./file.js");
const workdir_js_1 = require("./workdir.js");
const encoders_js_1 = require("./encoders.js");
const debug_js_1 = require("./debug.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("vector:api");
/**
 * Class for creating embeddings using the OpenAI API.
 * Implements the EmbeddingsModel interface.
 */
class OpenAIEmbeddings {
    cfg;
    embedder;
    options;
    /**
     * Constructs an instance of OpenAIEmbeddings.
     * @param info Connection options for the model.
     * @param configuration Configuration for the language model.
     * @param options Options for tracing.
     */
    constructor(cfg, embedder, options) {
        this.cfg = cfg;
        this.embedder = embedder;
        this.options = options;
        this.maxTokens = options?.maxTokens || 7000;
    }
    // Maximum number of tokens for embeddings
    maxTokens;
    /**
     * Creates embeddings for the given inputs using the OpenAI API.
     * @param inputs Text inputs to create embeddings for.
     * @returns A `EmbeddingsResponse` with a status and the generated embeddings or a message when an error occurs.
     */
    async createEmbeddings(inputs) {
        if (!inputs.length)
            return { status: "error", message: "No input provided" };
        const inputArray = (0, cleaners_js_1.arrayify)(inputs);
        dbg(`embed vectors: %d`, inputArray.length);
        const { error, data } = await this.embedder(inputArray, this.cfg, this.options);
        if (error)
            return { status: "error", message: error };
        return {
            status: "success",
            output: data,
        };
    }
}
/**
 * Create a vector index for documents.
 */
const vectraWorkspaceFileIndex = async (indexName, cfg, embedder, options) => {
    const { version = 1, deleteIfExists, trace, cancellationToken, maxTokens, chunkSize = 512, chunkOverlap = 128, vectorSize = 1536, } = options || {};
    indexName = indexName?.replace(/[^a-z0-9]/i, "") || "default";
    const folderPath = (0, workdir_js_1.dotGenaiscriptPath)("vectors", indexName);
    (0, util_js_1.logVerbose)(`vectra search: ${indexName}, embedder ${cfg.provider}:${cfg.model}, ${vectorSize} dimensions`);
    // Import the local document index
    const tokenizer = await (0, encoders_js_1.resolveTokenEncoder)(cfg.model);
    const embeddings = new OpenAIEmbeddings(cfg, embedder, {
        trace,
        cancellationToken,
        maxTokens,
    });
    // Create a local document index
    const index = new LocalDocumentIndex_js_1.LocalDocumentIndex({
        tokenizer,
        folderPath,
        embeddings,
        chunkingConfig: {
            chunkSize,
            chunkOverlap,
            tokenizer,
        },
    });
    if (!(await index.isIndexCreated()))
        await index.createIndex({ version, deleteIfExists });
    (0, cancellation_js_1.checkCancelled)(cancellationToken);
    return Object.freeze({
        name: indexName,
        insertOrUpdate: async (file) => {
            const files = (0, cleaners_js_1.arrayify)(file);
            for (const f of files) {
                await (0, file_js_1.resolveFileContent)(f, { trace });
                if (f.content && !f.encoding)
                    await index.upsertDocument(f.filename, f.content);
            }
        },
        search: async (query, options) => {
            const { topK, minScore = 0 } = options || {};
            dbg(`vectra search: %s`, query);
            const unfilteredDocs = await index.queryDocuments(query, { maxDocuments: topK });
            dbg(`vectra search: %d docs (min score: %)`, unfilteredDocs.length, minScore);
            dbg(`%O`, unfilteredDocs.map((d) => ({ uri: d.uri, score: d.score })));
            const docs = unfilteredDocs.filter((r) => isNaN(minScore) || r.score >= minScore);
            const res = [];
            for (const doc of docs) {
                res.push({
                    filename: doc.uri,
                    content: (await doc.renderAllSections(8000)).map((s) => s.text).join("\n...\n"),
                    score: doc.score,
                });
            }
            return res;
        },
    });
};
exports.vectraWorkspaceFileIndex = vectraWorkspaceFileIndex;
//# sourceMappingURL=vectra.js.map