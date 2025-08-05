"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.azureAISearchIndex = void 0;
const cancellation_js_1 = require("./cancellation.js");
const cleaners_js_1 = require("./cleaners.js");
const host_js_1 = require("./host.js");
const util_js_1 = require("./util.js");
const file_js_1 = require("./file.js");
const crypto_js_1 = require("./crypto.js");
const encoders_js_1 = require("./encoders.js");
const debug_js_1 = require("./debug.js");
const search_documents_1 = require("@azure/search-documents");
const dbg = (0, debug_js_1.genaiscriptDebug)("azureaisearch");
const HASH_LENGTH = 64;
const azureAISearchIndex = async (indexName, cfg, embedder, options) => {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    // https://learn.microsoft.com/en-us/azure/search/search-security-rbac?tabs=roles-portal-admin%2Croles-portal%2Croles-portal-query%2Ctest-portal%2Ccustom-role-portal
    const { trace, cancellationToken, deleteIfExists, chunkOverlap = 128, chunkSize = 512, vectorSize = 1536, } = options || {};
    const abortSignal = (0, cancellation_js_1.toSignal)(cancellationToken);
    const endPoint = process.env.AZURE_AI_SEARCH_ENDPOINT;
    if (!endPoint) {
        dbg(`checking if AZURE_AI_SEARCH_ENDPOINT is configured`);
        throw new Error("AZURE_AI_SEARCH_ENDPOINT is not configured.");
    }
    let credential;
    const apiKey = process.env.AZURE_AI_SEARCH_API_KEY;
    if (apiKey) {
        dbg(`using AzureKeyCredential with apiKey`);
        credential = new search_documents_1.AzureKeyCredential(apiKey);
    }
    else {
        dbg(`fetching Azure token credential`);
        const { token } = await runtimeHost.azureToken.token("default", {
            cancellationToken,
        });
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        if (!token) {
            dbg(`validating Azure token`);
            throw new Error("Azure AI Search requires a valid Azure token credential.");
        }
        credential = token.credential;
    }
    (0, util_js_1.logVerbose)(`azure ai search: ${indexName}, embedder ${cfg.provider}:${cfg.model}, ${vectorSize} dimensions`);
    const indexClient = new search_documents_1.SearchIndexClient(endPoint, credential, {});
    if (deleteIfExists) {
        dbg(`deleting existing index ${indexName}`);
        await indexClient.deleteIndex(indexName, { abortSignal });
    }
    dbg(`creating or updating index ${indexName}`);
    const created = await indexClient.createOrUpdateIndex({
        name: indexName,
        fields: [
            { name: "id", type: "Edm.String", key: true },
            {
                name: "filename",
                type: "Edm.String",
                searchable: true,
                filterable: true,
                sortable: true,
            },
            { name: "lineStart", type: "Edm.Int32", filterable: true },
            { name: "lineEnd", type: "Edm.Int32", filterable: true },
            { name: "content", type: "Edm.String", searchable: true },
            {
                name: "contentVector",
                type: "Collection(Edm.Single)",
                searchable: true,
                vectorSearchDimensions: vectorSize,
                vectorSearchProfileName: "content-vector-profile",
            },
        ],
        vectorSearch: {
            profiles: [
                {
                    name: "content-vector-profile",
                    algorithmConfigurationName: "content-vector-algorithm",
                },
            ],
            algorithms: [
                {
                    name: "content-vector-algorithm",
                    kind: "hnsw",
                    parameters: {
                        m: 4,
                        efConstruction: 400,
                        efSearch: 500,
                        metric: "cosine",
                    },
                },
            ],
        },
    });
    dbg(`tracing details of created index`);
    trace?.detailsFenced(`azure ai search ${indexName}`, created, "json");
    const client = new search_documents_1.SearchClient(endPoint, indexName, credential, {});
    const chunkId = async (textChunk) => await (0, crypto_js_1.hash)([textChunk.filename ?? textChunk.content, textChunk.lineEnd, textChunk.lineEnd], {
        length: HASH_LENGTH,
    });
    return Object.freeze({
        name: indexName,
        insertOrUpdate: async (file) => {
            const files = (0, cleaners_js_1.arrayify)(file);
            const outdated = [];
            const docs = [];
            for (const currentFile of files) {
                dbg(`resolving file content for ${currentFile.filename}`);
                await (0, file_js_1.resolveFileContent)(currentFile, { cancellationToken });
                if (currentFile.encoding) {
                    continue;
                }
                dbg(`chunking file ${currentFile.filename}`);
                const newChunks = await (0, encoders_js_1.chunk)(currentFile, {
                    chunkSize,
                    chunkOverlap,
                });
                const oldChunks = await client.search(undefined, {
                    filter: `filename eq '${currentFile.filename}'`,
                });
                for await (const result of oldChunks.results) {
                    const oldChunk = result.document;
                    const index = newChunks.findIndex((c) => c.lineStart === oldChunk.lineStart &&
                        c.lineEnd === oldChunk.lineEnd &&
                        c.content === oldChunk.content);
                    if (index > -1) {
                        newChunks.splice(index, 1);
                    }
                    else {
                        dbg(`adding outdated chunk`);
                        outdated.push(oldChunk);
                    }
                }
                // new chunks
                for (const textChunk of newChunks) {
                    dbg(`embedding new chunk content`);
                    const vector = await embedder(textChunk.content, cfg, options);
                    (0, cancellation_js_1.checkCancelled)(cancellationToken);
                    dbg(`validating embedding vector status`);
                    if (vector.status !== "success") {
                        throw new Error(vector.error || vector.status);
                    }
                    docs.push({
                        id: await chunkId(textChunk),
                        ...textChunk,
                        contentVector: vector.data[0],
                    });
                }
            }
            (0, util_js_1.logVerbose)(`azure ai search: ${indexName} index ${outdated.length} outdated, ${docs.length} updated`);
            if (outdated.length) {
                dbg(`deleting outdated documents`);
                const res = await client.deleteDocuments(outdated, {
                    abortSignal,
                    throwOnAnyFailure: false,
                });
                for (const r of res.results) {
                    if (!r.succeeded) {
                        (0, util_js_1.logVerbose)(`  ${r.key} ${r.errorMessage} (${r.statusCode})`);
                    }
                }
            }
            dbg(`checking if there are no new documents`);
            if (!docs.length) {
                return;
            }
            dbg(`merging or uploading new documents`);
            const res = await client.mergeOrUploadDocuments(docs, {
                abortSignal,
                throwOnAnyFailure: false,
            });
            for (const r of res.results) {
                if (!r.succeeded) {
                    (0, util_js_1.logVerbose)(`  ${r.key} ${r.errorMessage} (${r.statusCode})`);
                }
            }
        },
        search: async (query, searchOptions) => {
            dbg(`embedding search query`);
            const { topK, minScore = 0 } = searchOptions || {};
            const vector = await embedder(query, cfg, {
                trace,
                cancellationToken,
            });
            (0, cancellation_js_1.checkCancelled)(cancellationToken);
            dbg(`validating embedding vector status`);
            if (vector.status !== "success") {
                throw new Error(vector.error || vector.status);
            }
            dbg(`searching documents with query ${query}`);
            const docs = await client.search(query, {
                searchMode: "all",
                vectorSearchOptions: {
                    queries: [
                        {
                            kind: "vector",
                            vector: vector.data[0],
                            fields: ["contentVector"],
                            kNearestNeighborsCount: 3,
                        },
                    ],
                },
            });
            const res = [];
            dbg(`iterating over search results`);
            for await (const doc of docs.results) {
                if (doc.score < minScore) {
                    continue;
                }
                res.push({ ...doc.document, score: doc.score });
                dbg(`checking if result length exceeds topK`);
                if (res.length >= topK) {
                    break;
                }
            }
            return res;
        },
    });
};
exports.azureAISearchIndex = azureAISearchIndex;
//# sourceMappingURL=azureaisearch.js.map