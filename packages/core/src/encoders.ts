// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import debug from "debug";
const dbg = debug("genaiscript:encoders");

// Import the function to parse model identifiers
import { parseModelIdentifier } from "./models.js";
import { runtimeHost } from "./host.js";
import path from "node:path";
import { addLineNumbers, indexToLineNumber } from "./liner.js";
import { resolveFileContent } from "./file.js";
import type { EncodeOptions } from "gpt-tokenizer/GptEncoding";
import { assert } from "./assert.js";
import { TextSplitter } from "./textsplitter.js";
import type { Awaitable, TextChunk, TextChunkerConfig, Tokenizer, WorkspaceFile } from "./types.js";
import api, { encode, decode } from "gpt-tokenizer/model/gpt-4o";

/**
 * Resolves the token encoder for a specified model identifier.
 * @param modelId - The model identifier to resolve the encoder for. Defaults to a large model alias if not provided.
 * @param options - Optional configuration. Includes a flag to disable fallback mechanisms.
 * @returns A Promise resolving to a Tokenizer object or undefined if fallback is disabled and resolution fails.
 */
export async function resolveTokenEncoder(
  modelId: string,
  options?: { disableFallback?: boolean },
): Promise<Tokenizer> {
  const { disableFallback } = options || {};

  // Parse the model identifier to extract the model information
  if (!modelId) {
    dbg(`modelId is empty, using default model alias`);
    modelId = runtimeHost.modelAliases.large.model;
  }
  let { model } = parseModelIdentifier(modelId);
  if (/^gpt-4.1/i.test(model)) model = "gpt-4o"; // same encoding
  const module = model.toLowerCase(); // Assign model to module for dynamic import path

  const { modelEncodings } = runtimeHost?.config || {};
  const encoding = modelEncodings?.[modelId] || module;

  const encoderOptions = {
    disallowedSpecial: new Set<string>(),
  } satisfies EncodeOptions;
  try {
    // Attempt to dynamically import the encoder module for the specified model
    const { encode, decode, default: api } = await import(`gpt-tokenizer/model/${encoding}`);
    assert(!!encode);
    const { modelName } = api;
    const size =
      api.bytePairEncodingCoreProcessor?.mergeableBytePairRankCount +
      (api.bytePairEncodingCoreProcessor?.specialTokenMapping?.size || 0);
    return Object.freeze<Tokenizer>({
      model: modelName,
      size,
      encode: (line) => encode(line, encoderOptions), // Return the default encoder function
      decode,
    });
  } catch {
    if (disableFallback) {
      dbg(`encoder fallback disabled for ${encoding}`);
      return undefined;
    }

    assert(!!encode);
    const { modelName, vocabularySize } = api;
    dbg(`fallback ${encoding} to gpt-4o encoder`);
    return Object.freeze<Tokenizer>({
      model: modelName,
      size: vocabularySize,
      encode: (line) => encode(line, encoderOptions), // Return the default encoder function
      decode,
    });
  }
}

/**
 * Splits the content of a file or string into manageable chunks based on the provided configuration.
 *
 * @param file - The content to be chunked; can be a string or a workspace file object.
 *               If a workspace file, its content is resolved and processed.
 * @param options - Optional configuration for chunk generation.
 *                  - model: Model identifier used to resolve the tokenizer.
 *                  - docType: Document type for processing; inferred from the file extension if not provided.
 *                  - lineNumbers: Flag indicating whether to include line numbers in the output.
 *                  - Other properties are passed to the TextSplitter for customization.
 * @returns A Promise resolving to an array of text chunks. Each chunk includes content, filename, and start/end line numbers.
 */
export async function chunk(
  file: Awaitable<string | WorkspaceFile>,
  options?: TextChunkerConfig,
): Promise<TextChunk[]> {
  const f = await file;
  let filename: string;
  let content: string;
  if (typeof f === "string") {
    content = f;
  } else if (typeof f === "object") {
    await resolveFileContent(f);
    if (f.encoding) {
      dbg(`binary file detected, skip`);
      return [];
    } // binary file bail out
    filename = f.filename;
    content = f.content;
  } else {
    return [];
  }

  const { model, docType: optionsDocType, lineNumbers, ...rest } = options || {};
  const docType = (optionsDocType || (filename ? path.extname(filename) : undefined))
    ?.toLowerCase()
    ?.replace(/^\./, "");
  const tokenizer = await resolveTokenEncoder(model);
  const ts = new TextSplitter({
    ...rest,
    docType,
    tokenizer,
    keepSeparators: true,
  });
  const chunksRaw = ts.split(content);
  const chunks = chunksRaw.map(({ text, startPos, endPos }) => {
    const lineStart = indexToLineNumber(content, startPos);
    const lineEnd = indexToLineNumber(content, endPos);
    if (lineNumbers) {
      text = addLineNumbers(text, { startLine: lineStart });
    }
    return {
      content: text,
      filename,
      lineStart,
      lineEnd,
    } satisfies TextChunk;
  });
  dbg(`chunks ${chunks.length}`);
  return chunks;
}
