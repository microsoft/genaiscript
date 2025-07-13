// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import debug from "debug";
const dbg = debug("globals");
// Import various parsing and stringifying utilities
import { createYAML } from "./yaml.js";
import { CSVParse, dataToMarkdownTable, CSVStringify, CSVChunk } from "./csv.js";
import { INIParse, INIStringify } from "./ini.js";
import { XMLParse } from "./xml.js";
import { frontmatterTryParse, splitMarkdown, updateFrontmatter } from "./frontmatter.js";
import { createJSONL } from "./jsonl.js";
import { HTMLTablesToJSON, HTMLToMarkdown, HTMLToText } from "./html.js";
import { CancelError } from "./error.js";
import { GitHubClient } from "./githubclient.js";
import { GitClient } from "./git.js";
import { approximateTokens, estimateTokens, truncateTextToTokens } from "./tokens.js";
import { chunk, resolveTokenEncoder } from "./encoders.js";
import { JSON5Stringify, JSON5TryParse } from "./json5.js";
import { JSONSchemaInfer } from "./schema.js";
import { FFmepgClient } from "./ffmpeg.js";
import { promptParametersSchemaToJSONSchema } from "./parameters.js";
import { chunkMarkdown } from "./mdchunk.js";
import { resolveGlobal } from "./global.js";
import { markdownStringify } from "./mdstringify.js";
import { diffCreatePatch, diffFindChunk, tryDiffParse } from "./diff.js";
import type {
  CSVObject,
  DIFFObject,
  HTMLObject,
  INIObject,
  JSON5Object,
  JSONLObject,
  JSONSchemaUtilities,
  MDObject,
  PromptContext,
  Tokenizers,
  XMLObject,
} from "./types.js";
import { createParsers } from "./parsers.js";

let _globalsInstalled = false;
/**
 * Installs global utilities for various data formats and operations.
 * Sets up global objects with frozen utilities for parsing, stringifying, and manipulating
 * different data formats, handling tokenization, Git operations, HTML conversion, and more.
 *
 * Parameters:
 * - None.
 *
 * Throws:
 * - CancelError if cancellation is triggered.
 *
 * Notes:
 * - Includes utilities for YAML, CSV, INI, XML, Markdown, JSONL, JSON5, HTML, and more.
 * - Provides tokenization-related utilities such as counting, truncating, and chunking text.
 * - Instantiates Git and GitHub clients.
 * - Includes a fetchText function for retrieving text from URLs or files.
 * - Includes an ffmpeg client for multimedia operations.
 */
export function installGlobals() {
  if (_globalsInstalled) {
    dbg("already installed");
    return; // Prevent multiple installations
  }
  _globalsInstalled = true; // Mark globals as installed
  dbg("install");
  const glb = resolveGlobal(); // Get the global context

  glb.parsers = createParsers();

  // Freeze YAML utilities to prevent modification
  glb.YAML = createYAML();

  // Freeze CSV utilities
  glb.CSV = Object.freeze<CSVObject>({
    parse: CSVParse, // Parse CSV string to objects
    stringify: CSVStringify, // Convert objects to CSV string
    markdownify: dataToMarkdownTable, // Convert CSV to Markdown format
    chunk: CSVChunk,
  });

  // Freeze INI utilities
  glb.INI = Object.freeze<INIObject>({
    parse: INIParse, // Parse INI string to objects
    stringify: INIStringify, // Convert objects to INI string
  });

  // Freeze XML utilities
  glb.XML = Object.freeze<XMLObject>({
    parse: XMLParse, // Parse XML string to objects
  });

  // Freeze Markdown utilities with frontmatter operations
  glb.MD = Object.freeze<MDObject>({
    stringify: markdownStringify,
    frontmatter: (text, format) => frontmatterTryParse(text, { format })?.value ?? {}, // Parse frontmatter from markdown
    content: (text) => splitMarkdown(text)?.content, // Extract content from markdown
    updateFrontmatter: (text, frontmatter, format): string =>
      updateFrontmatter(text, frontmatter, { format }), // Update frontmatter in markdown
    chunk: async (text, options) => {
      const encoding = await resolveTokenEncoder(options?.model, {
        disableFallback: false,
      });
      const res = chunkMarkdown(text, (text) => encoding.encode(text).length, options);
      return res;
    },
  });

  // Freeze JSONL utilities
  glb.JSONL = createJSONL();
  glb.JSON5 = Object.freeze<JSON5Object>({
    parse: JSON5TryParse,
    stringify: JSON5Stringify,
  });

  glb.JSONSchema = Object.freeze<JSONSchemaUtilities>({
    infer: JSONSchemaInfer,
    fromParameters: promptParametersSchemaToJSONSchema,
  });

  // Freeze HTML utilities
  glb.HTML = Object.freeze<HTMLObject>({
    convertTablesToJSON: HTMLTablesToJSON, // Convert HTML tables to JSON
    convertToMarkdown: HTMLToMarkdown, // Convert HTML to Markdown
    convertToText: HTMLToText, // Convert HTML to plain text
  });

  /**
   * Function to trigger cancellation with an error.
   * Throws a CancelError with a specified reason or a default message.
   * @param [reason] - Optional reason for cancellation.
   */
  glb.cancel = (reason?: string) => {
    dbg("cancel", reason);
    throw new CancelError(reason || "user cancelled"); // Trigger cancel error
  };

  // Instantiate GitHub client
  glb.github = GitHubClient.default();

  // Instantiate Git client
  glb.git = GitClient.default();

  glb.tokenizers = Object.freeze<Tokenizers>({
    resolve: resolveTokenEncoder,
    count: async (text, options) => {
      const { encode: encoder } = await resolveTokenEncoder(options?.model);
      if (options?.approximate) return approximateTokens(text, { encoder });
      const c = await estimateTokens(text, encoder);
      return c;
    },
    truncate: async (text, maxTokens, options) => {
      const { encode: encoder } = await resolveTokenEncoder(options?.model);
      return await truncateTextToTokens(text, maxTokens, encoder, options);
    },
    chunk: chunk,
  });

  // ffmpeg
  glb.ffmpeg = new FFmepgClient();

  glb.DIFF = Object.freeze<DIFFObject>({
    parse: tryDiffParse,
    createPatch: diffCreatePatch,
    findChunk: diffFindChunk,
  });

  // Polyfill for Object.groupBy if not available
  if (!Object.groupBy) {
    Object.groupBy = function <T, K extends string | number | symbol>(
      items: T[],
      callback: (item: T, index: number, array: T[]) => K,
    ): Record<K, T[]> {
      return items.reduce(
        (acc, item, idx, arr) => {
          const key = callback(item, idx, arr);
          if (!acc[key]) acc[key] = [];
          acc[key].push(item);
          return acc;
        },
        {} as Record<K, T[]>,
      );
    };
  }

  // these are overridden, ignored
  glb.script = () => {};
  glb.system = () => {};
}

/**
 * Installs fields from the provided context into the global context.
 * Overrides existing global properties if fields in the context share the same name.
 *
 * Parameters:
 * - ctx: A context object containing properties to be added or overridden in the global context.
 *
 * Notes:
 * - Uses `resolveGlobal` to access the global context.
 * - Iterates over the keys of the provided context, mapping them into the global context.
 */
export function installGlobalPromptContext(ctx: PromptContext) {
  const glb = resolveGlobal(); // Get the global context

  for (const field of Object.keys(ctx)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    glb[field] = (ctx as any)[field];
  }
}
