// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * This module provides functionality for creating embeddings using OpenAI's API
 * and performing vector search on documents.
 */

import type { EmbeddingsModel, EmbeddingsResponse } from "./vectra/types.js";
import { LocalDocumentIndex } from "./vectra/LocalDocumentIndex.js";
import { LanguageModelConfiguration } from "./server/messages.js";
import { logVerbose } from "./util.js";
import { TraceOptions } from "./trace.js";
import { CancellationOptions, checkCancelled } from "./cancellation.js";
import { arrayify } from "./cleaners.js";
import { resolveFileContent } from "./file.js";
import { EmbeddingFunction, WorkspaceFileIndexCreator } from "./chat.js";
import { dotGenaiscriptPath } from "./workdir.js";
import { resolveTokenEncoder } from "./encoders.js";

/**
 * Class for creating embeddings using the OpenAI API.
 * Implements the EmbeddingsModel interface.
 */
class OpenAIEmbeddings implements EmbeddingsModel {
  /**
   * Constructs an instance of OpenAIEmbeddings.
   * @param info Connection options for the model.
   * @param configuration Configuration for the language model.
   * @param options Options for tracing.
   */
  public constructor(
    readonly cfg: LanguageModelConfiguration,
    readonly embedder: EmbeddingFunction,
    readonly options?: TraceOptions & CancellationOptions,
  ) {}

  // Maximum number of tokens for embeddings
  maxTokens = 512;

  /**
   * Creates embeddings for the given inputs using the OpenAI API.
   * @param inputs Text inputs to create embeddings for.
   * @returns A `EmbeddingsResponse` with a status and the generated embeddings or a message when an error occurs.
   */
  public async createEmbeddings(inputs: string | string[]): Promise<EmbeddingsResponse> {
    const { error, data } = await this.embedder(arrayify(inputs)[0], this.cfg, this.options);
    if (error) return { status: "error", message: error };
    return {
      status: "success",
      output: data,
    };
  }
}

/**
 * Create a vector index for documents.
 */
export const vectraWorkspaceFileIndex: WorkspaceFileIndexCreator = async (
  indexName: string,
  cfg: LanguageModelConfiguration,
  embedder: EmbeddingFunction,
  options?: VectorIndexOptions & TraceOptions & CancellationOptions,
) => {
  const {
    version = 1,
    deleteIfExists,
    trace,
    cancellationToken,
    chunkSize = 512,
    chunkOverlap = 128,
    vectorSize = 1536,
  } = options || {};

  indexName = indexName?.replace(/[^a-z0-9]/i, "") || "default";
  const folderPath = dotGenaiscriptPath("vectors", indexName);

  logVerbose(
    `vectra search: ${indexName}, embedder ${cfg.provider}:${cfg.model}, ${vectorSize} dimensions`,
  );

  // Import the local document index
  const tokenizer = await resolveTokenEncoder(cfg.model);
  const embeddings = new OpenAIEmbeddings(cfg, embedder, {
    trace,
    cancellationToken,
  });

  // Create a local document index
  const index = new LocalDocumentIndex({
    tokenizer,
    folderPath,
    embeddings,
    chunkingConfig: {
      chunkSize,
      chunkOverlap,
      tokenizer,
    },
  });
  if (!(await index.isIndexCreated())) await index.createIndex({ version, deleteIfExists });
  checkCancelled(cancellationToken);

  return Object.freeze({
    name: indexName,
    insertOrUpdate: async (file) => {
      const files = arrayify(file);
      for (const f of files) {
        await resolveFileContent(f, { trace });
        if (f.content && !f.encoding) await index.upsertDocument(f.filename, f.content);
      }
    },
    search: async (query, options) => {
      const { topK, minScore = 0 } = options || {};
      const docs = (await index.queryDocuments(query, { maxDocuments: topK })).filter(
        (r) => r.score >= minScore,
      );
      const res: WorkspaceFileWithScore[] = [];
      for (const doc of docs) {
        res.push(<WorkspaceFileWithScore>{
          filename: doc.uri,
          content: (await doc.renderAllSections(8000)).map((s) => s.text).join("\n...\n"),
          score: doc.score,
        });
      }
      return res;
    },
  } satisfies WorkspaceFileIndex);
};
