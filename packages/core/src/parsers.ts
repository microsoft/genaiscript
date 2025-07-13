// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CSVTryParse } from "./csv.js";
import { filenameOrFileToContent, filenameOrFileToFilename, unfence } from "./unwrappers.js";
import { JSON5TryParse, JSONLLMTryParse } from "./json5.js";
import { TOMLTryParse } from "./toml.js";
import { YAMLTryParse } from "./yaml.js";
import { DOCXTryParse } from "./docx.js";
import { frontmatterTryParse } from "./frontmatter.js";
import { extractFenced } from "./fence.js";
import { parseAnnotations } from "./annotations.js";
import { dotEnvTryParse } from "./dotenv.js";
import { INITryParse } from "./ini.js";
import { XMLTryParse } from "./xml.js";
import { parsePdf } from "./pdf.js";
import { HTMLToMarkdown, HTMLToText } from "./html.js";
import { MathTryEvaluate } from "./math.js";
import { tryValidateJSONWithSchema, validateJSONWithSchema } from "./schema.js";
import { XLSXTryParse } from "./xlsx.js";
import { host } from "./host.js";
import { unzip } from "./zip.js";
import { JSONLTryParse } from "./jsonl.js";
import { resolveFileContent } from "./file.js";
import { mustacheRender } from "./mustache.js";
import { jinjaRender } from "./jinja.js";
import { llmifyDiff } from "./llmdiff.js";
import { tidyData } from "./tidy.js";
import { hash } from "./crypto.js";
import { GROQEvaluate } from "./groq.js";
import { unthink } from "./think.js";
import { dedent } from "./indent.js";
import { vttSrtParse } from "./transcription.js";
import { encodeIDs } from "./cleaners.js";
import { diffCreatePatch } from "./diff.js";
import { promptyParse } from "./prompty.js";
import type { Parsers, WorkspaceFile } from "./types.js";
import { levenshteinDistance } from "./levenshtein.js";
import { createIgnorer } from "./gitignore.js";

/**
 * Asynchronously creates a set of parsers for handling various file formats, data operations,
 * and transformations.
 *
 * @param options - Configuration options for parser creation.
 *   - model: Specifies the language model to use for token encoding.
 *   - trace: Optional tracing options for logging or debugging.
 *   - cancellationToken: Optional cancellation token to abort operations.
 *
 * @returns An object containing various parser methods:
 *   - JSON5: Parses JSON5 content with an optional default value.
 *   - JSONLLM: Parses JSON extracted for LLM-specific workflows.
 *   - JSONL: Parses JSONL (JSON Lines) content.
 *   - YAML: Parses YAML content with an optional default value.
 *   - XML: Parses XML content with an optional default value and additional options.
 *   - TOML: Parses TOML content.
 *   - frontmatter: Extracts frontmatter content from text.
 *   - CSV: Parses CSV content with optional parsing options.
 *   - XLSX: Parses Excel files asynchronously with optional parsing options.
 *   - dotEnv: Parses .env files.
 *   - INI: Parses INI configuration content with an optional default value.
 *   - transcription: Parses VTT/SRT transcription files.
 *   - unzip: Extracts contents of a ZIP file asynchronously.
 *   - tokens: Estimates token usage for provided content using specified encoders.
 *   - fences: Extracts fenced code blocks from content.
 *   - annotations: Parses annotated text data.
 *   - HTMLToText: Converts HTML content to plain text with optional configurations.
 *   - HTMLToMarkdown: Converts HTML content to Markdown with optional configurations.
 *   - DOCX: Parses DOCX files asynchronously.
 *   - PDF: Parses PDF files asynchronously, extracting pages, images, and file content.
 *   - math: Evaluates mathematical expressions with a given scope.
 *   - validateJSON: Validates JSON content against a schema.
 *   - mustache: Renders Mustache templates with provided arguments.
 *   - jinja: Renders Jinja templates with provided data.
 *   - diff: Computes a diff between two inputs and formats it.
 *   - tidyData: Cleans and processes data rows with optional configurations.
 *   - hash: Computes cryptographic hashes for the given input.
 *   - unfence: Removes fencing around content.
 *   - GROQ: Evaluates GROQ (Graph-Relational Object Queries).
 *   - unthink: Performs a reverse-thinking operation on data.
 *   - dedent: Dedents indented text content.
 *   - encodeIDs: Encodes identifiers for use in various operations.
 */
export function createParsers(): Parsers {
  return Object.freeze<Parsers>({
    JSON5: (text, options) =>
      tryValidateJSONWithSchema(
        JSON5TryParse(filenameOrFileToContent(text), options?.defaultValue),
        options,
      ),
    JSONLLM: (text) => JSONLLMTryParse(text),
    JSONL: (text) => JSONLTryParse(filenameOrFileToContent(text)),
    YAML: (text, options) =>
      tryValidateJSONWithSchema(
        YAMLTryParse(filenameOrFileToContent(text), options?.defaultValue),
        options,
      ),
    XML: async (text, options) => {
      const { defaultValue, ...rest } = options || {};
      return tryValidateJSONWithSchema(
        await XMLTryParse(filenameOrFileToContent(text), defaultValue, rest),
        options,
      );
    },
    TOML: (text, options) =>
      tryValidateJSONWithSchema(TOMLTryParse(filenameOrFileToContent(text), options), options),
    frontmatter: (text, options) =>
      tryValidateJSONWithSchema(
        frontmatterTryParse(filenameOrFileToContent(text), options)?.value,
        options,
      ),
    CSV: (text, options) =>
      tryValidateJSONWithSchema(CSVTryParse(filenameOrFileToContent(text), options), options),
    XLSX: async (file, options) =>
      await XLSXTryParse(await host.readFile(filenameOrFileToFilename(file)), options),
    dotEnv: (text) => dotEnvTryParse(filenameOrFileToContent(text)),
    INI: (text, options) =>
      tryValidateJSONWithSchema(
        INITryParse(filenameOrFileToContent(text), options?.defaultValue),
        options,
      ),
    transcription: (text) => vttSrtParse(filenameOrFileToContent(text)),
    unzip: async (file, options) => await unzip(await host.readFile(file.filename), options),
    fences: (text) => extractFenced(filenameOrFileToContent(text)),
    annotations: (text) => parseAnnotations(filenameOrFileToContent(text)),
    HTMLToText: (text, options) => HTMLToText(filenameOrFileToContent(text), options),
    HTMLToMarkdown: (text, options) => HTMLToMarkdown(filenameOrFileToContent(text), options),
    DOCX: async (file, options) => await DOCXTryParse(file, options),
    PDF: async (file, options) => {
      if (!file) return { file: undefined, pages: [], data: [] };
      const filename = typeof file === "string" ? file : file.filename;
      const { pages, content } = (await parsePdf(filename, options)) || {};
      return {
        file: <WorkspaceFile>{
          filename,
          content,
        },
        pages: pages?.map((p) => p.content),
        images: pages?.map((p) => p.image),
        data: pages,
      };
    },
    math: async (expression, scope) => await MathTryEvaluate(expression, { scope }),
    validateJSON: (schema, content) => validateJSONWithSchema(content, schema),
    mustache: (file, args) => {
      const f = filenameOrFileToContent(file);
      return mustacheRender(f, args);
    },
    jinja: (file, data) => {
      const f = filenameOrFileToContent(file);
      return jinjaRender(f, data);
    },
    diff: (f1, f2) => llmifyDiff(diffCreatePatch(f1, f2)),
    tidyData: (rows, options) => tidyData(rows, options),
    hash: async (text, options) => await hash(text, options),
    unfence: unfence,
    GROQ: GROQEvaluate,
    unthink: unthink,
    dedent: dedent,
    encodeIDs: encodeIDs,
    prompty: async (file) => {
      await resolveFileContent(file);
      return promptyParse(file.filename, file.content);
    },
    levenshtein: (a, b) =>
      levenshteinDistance(filenameOrFileToContent(a), filenameOrFileToContent(b)),
    ignore: async (...files) => createIgnorer(files),
  });
}
