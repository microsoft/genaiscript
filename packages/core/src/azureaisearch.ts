import { CancellationOptions, checkCancelled, toSignal } from "../../core/src/cancellation";
import { EmbeddingFunction, WorkspaceFileIndexCreator } from "../../core/src/chat";
import { arrayify } from "../../core/src/cleaners";
import { runtimeHost } from "../../core/src/host";
import { TraceOptions } from "../../core/src/trace";
import { logVerbose } from "./util";
import type { TokenCredential, KeyCredential } from "@azure/core-auth";
import { resolveFileContent } from "./file";
import { hash } from "./crypto";
import { LanguageModelConfiguration } from "./server/messages";
import { chunk } from "./encoders";
import { genaiscriptDebug } from "./debug";
const dbg = genaiscriptDebug("azureaisearch");

const HASH_LENGTH = 64;
export const azureAISearchIndex: WorkspaceFileIndexCreator = async (
  indexName: string,
  cfg: LanguageModelConfiguration,
  embedder: EmbeddingFunction,
  options?: VectorIndexOptions & TraceOptions & CancellationOptions,
) => {
  // https://learn.microsoft.com/en-us/azure/search/search-security-rbac?tabs=roles-portal-admin%2Croles-portal%2Croles-portal-query%2Ctest-portal%2Ccustom-role-portal
  const {
    trace,
    cancellationToken,
    deleteIfExists,
    chunkOverlap = 128,
    chunkSize = 512,
    vectorSize = 1536,
  } = options || {};
  const abortSignal = toSignal(cancellationToken);
  const { SearchClient, SearchIndexClient, AzureKeyCredential } = await import(
    "@azure/search-documents"
  );

  const endPoint = process.env.AZURE_AI_SEARCH_ENDPOINT;
  if (!endPoint) {
    dbg(`checking if AZURE_AI_SEARCH_ENDPOINT is configured`);
    throw new Error("AZURE_AI_SEARCH_ENDPOINT is not configured.");
  }
  let credential: TokenCredential | KeyCredential;
  const apiKey = process.env.AZURE_AI_SEARCH_API_KEY;
  if (apiKey) {
    dbg(`using AzureKeyCredential with apiKey`);
    credential = new AzureKeyCredential(apiKey);
  } else {
    dbg(`fetching Azure token credential`);
    const { token } = await runtimeHost.azureToken.token("default", {
      cancellationToken,
    });
    checkCancelled(cancellationToken);
    if (!token) {
      dbg(`validating Azure token`);
      throw new Error("Azure AI Search requires a valid Azure token credential.");
    }
    credential = token.credential;
  }

  logVerbose(
    `azure ai search: ${indexName}, embedder ${cfg.provider}:${cfg.model}, ${vectorSize} dimensions`,
  );
  const indexClient = new SearchIndexClient(endPoint, credential, {});
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

  type TextChunkEntry = TextChunk & { id: string; contentVector: number[] };
  const client = new SearchClient<TextChunkEntry>(endPoint, indexName, credential, {});

  const chunkId = async (chunk: TextChunk) =>
    await hash([chunk.filename ?? chunk.content, chunk.lineEnd, chunk.lineEnd], {
      length: HASH_LENGTH,
    });

  return Object.freeze({
    name: indexName,
    insertOrUpdate: async (file: ElementOrArray<WorkspaceFile>) => {
      const files = arrayify(file);
      const outdated: TextChunkEntry[] = [];
      const docs: TextChunkEntry[] = [];
      for (const file of files) {
        dbg(`resolving file content for ${file.filename}`);
        await resolveFileContent(file, { cancellationToken });
        if (file.encoding) {
          continue;
        }

        dbg(`chunking file ${file.filename}`);
        const newChunks = await chunk(file, {
          chunkSize,
          chunkOverlap,
        });
        const oldChunks = await client.search(undefined, {
          filter: `filename eq '${file.filename}'`,
        });
        for await (const result of oldChunks.results) {
          const oldChunk = result.document;
          const index = newChunks.findIndex(
            (c) =>
              c.lineStart === oldChunk.lineStart &&
              c.lineEnd === oldChunk.lineEnd &&
              c.content === oldChunk.content,
          );
          if (index > -1) {
            newChunks.splice(index, 1);
          } else {
            dbg(`adding outdated chunk`);
            outdated.push(oldChunk);
          }
        }

        // new chunks
        for (const chunk of newChunks) {
          dbg(`embedding new chunk content`);
          const vector = await embedder(chunk.content, cfg, options);
          checkCancelled(cancellationToken);
          dbg(`validating embedding vector status`);
          if (vector.status !== "success") {
            throw new Error(vector.error || vector.status);
          }
          docs.push({
            id: await chunkId(chunk),
            ...chunk,
            contentVector: vector.data[0],
          });
        }
      }

      logVerbose(
        `azure ai search: ${indexName} index ${outdated.length} outdated, ${docs.length} updated`,
      );
      if (outdated.length) {
        dbg(`deleting outdated documents`);
        const res = await client.deleteDocuments(outdated, {
          abortSignal,
          throwOnAnyFailure: false,
        });
        for (const r of res.results) {
          if (!r.succeeded) {
            logVerbose(`  ${r.key} ${r.errorMessage} (${r.statusCode})`);
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
          logVerbose(`  ${r.key} ${r.errorMessage} (${r.statusCode})`);
        }
      }
    },
    search: async (query: string, options?: VectorSearchOptions) => {
      dbg(`embedding search query`);
      const { topK, minScore = 0 } = options || {};

      const vector = await embedder(query, cfg, {
        trace,
        cancellationToken,
      });
      checkCancelled(cancellationToken);
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
      const res: WorkspaceFileWithScore[] = [];
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
  } satisfies WorkspaceFileIndex);
};
