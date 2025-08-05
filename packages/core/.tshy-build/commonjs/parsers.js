"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createParsers = createParsers;
const csv_js_1 = require("./csv.js");
const unwrappers_js_1 = require("./unwrappers.js");
const json5_js_1 = require("./json5.js");
const toml_js_1 = require("./toml.js");
const yaml_js_1 = require("./yaml.js");
const docx_js_1 = require("./docx.js");
const frontmatter_js_1 = require("./frontmatter.js");
const fence_js_1 = require("./fence.js");
const annotations_js_1 = require("./annotations.js");
const dotenv_js_1 = require("./dotenv.js");
const ini_js_1 = require("./ini.js");
const xml_js_1 = require("./xml.js");
const pdf_js_1 = require("./pdf.js");
const html_js_1 = require("./html.js");
const math_js_1 = require("./math.js");
const schema_js_1 = require("./schema.js");
const xlsx_js_1 = require("./xlsx.js");
const host_js_1 = require("./host.js");
const zip_js_1 = require("./zip.js");
const jsonl_js_1 = require("./jsonl.js");
const file_js_1 = require("./file.js");
const mustache_js_1 = require("./mustache.js");
const jinja_js_1 = require("./jinja.js");
const llmdiff_js_1 = require("./llmdiff.js");
const tidy_js_1 = require("./tidy.js");
const crypto_js_1 = require("./crypto.js");
const groq_js_1 = require("./groq.js");
const think_js_1 = require("./think.js");
const indent_js_1 = require("./indent.js");
const transcription_js_1 = require("./transcription.js");
const cleaners_js_1 = require("./cleaners.js");
const diff_js_1 = require("./diff.js");
const prompty_js_1 = require("./prompty.js");
const levenshtein_js_1 = require("./levenshtein.js");
const gitignore_js_1 = require("./gitignore.js");
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
function createParsers() {
    return Object.freeze({
        JSON5: (text, options) => (0, schema_js_1.tryValidateJSONWithSchema)((0, json5_js_1.JSON5TryParse)((0, unwrappers_js_1.filenameOrFileToContent)(text), options?.defaultValue), options),
        JSONLLM: (text) => (0, json5_js_1.JSONLLMTryParse)(text),
        JSONL: (text) => (0, jsonl_js_1.JSONLTryParse)((0, unwrappers_js_1.filenameOrFileToContent)(text)),
        YAML: (text, options) => (0, schema_js_1.tryValidateJSONWithSchema)((0, yaml_js_1.YAMLTryParse)((0, unwrappers_js_1.filenameOrFileToContent)(text), options?.defaultValue), options),
        XML: async (text, options) => {
            const { defaultValue, ...rest } = options || {};
            return (0, schema_js_1.tryValidateJSONWithSchema)(await (0, xml_js_1.XMLTryParse)((0, unwrappers_js_1.filenameOrFileToContent)(text), defaultValue, rest), options);
        },
        TOML: (text, options) => (0, schema_js_1.tryValidateJSONWithSchema)((0, toml_js_1.TOMLTryParse)((0, unwrappers_js_1.filenameOrFileToContent)(text), options), options),
        frontmatter: (text, options) => (0, schema_js_1.tryValidateJSONWithSchema)((0, frontmatter_js_1.frontmatterTryParse)((0, unwrappers_js_1.filenameOrFileToContent)(text), options)?.value, options),
        CSV: (text, options) => (0, schema_js_1.tryValidateJSONWithSchema)((0, csv_js_1.CSVTryParse)((0, unwrappers_js_1.filenameOrFileToContent)(text), options), options),
        XLSX: async (file, options) => {
            const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
            return (0, xlsx_js_1.XLSXTryParse)(await runtimeHost.readFile((0, unwrappers_js_1.filenameOrFileToFilename)(file)), options);
        },
        dotEnv: (text) => (0, dotenv_js_1.dotEnvTryParse)((0, unwrappers_js_1.filenameOrFileToContent)(text)),
        INI: (text, options) => (0, schema_js_1.tryValidateJSONWithSchema)((0, ini_js_1.INITryParse)((0, unwrappers_js_1.filenameOrFileToContent)(text), options?.defaultValue), options),
        transcription: (text) => (0, transcription_js_1.vttSrtParse)((0, unwrappers_js_1.filenameOrFileToContent)(text)),
        unzip: async (file, options) => {
            const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
            return (0, zip_js_1.unzip)(await runtimeHost.readFile(file.filename), options);
        },
        fences: (text) => (0, fence_js_1.extractFenced)((0, unwrappers_js_1.filenameOrFileToContent)(text)),
        annotations: (text) => (0, annotations_js_1.parseAnnotations)((0, unwrappers_js_1.filenameOrFileToContent)(text)),
        HTMLToText: (text, options) => (0, html_js_1.HTMLToText)((0, unwrappers_js_1.filenameOrFileToContent)(text), options),
        HTMLToMarkdown: (text, options) => (0, html_js_1.HTMLToMarkdown)((0, unwrappers_js_1.filenameOrFileToContent)(text), options),
        DOCX: async (file, options) => await (0, docx_js_1.DOCXTryParse)(file, options),
        PDF: async (file, options) => {
            if (!file)
                return { file: undefined, pages: [], data: [] };
            const filename = typeof file === "string" ? file : file.filename;
            const { pages, content } = (await (0, pdf_js_1.parsePdf)(filename, options)) || {};
            return {
                file: {
                    filename,
                    content,
                },
                pages: pages?.map((p) => p.content),
                images: pages?.map((p) => p.image),
                data: pages,
            };
        },
        math: async (expression, scope) => await (0, math_js_1.MathTryEvaluate)(expression, { scope }),
        validateJSON: (schema, content) => (0, schema_js_1.validateJSONWithSchema)(content, schema),
        mustache: (file, args) => {
            const f = (0, unwrappers_js_1.filenameOrFileToContent)(file);
            return (0, mustache_js_1.mustacheRender)(f, args);
        },
        jinja: (file, data) => {
            const f = (0, unwrappers_js_1.filenameOrFileToContent)(file);
            return (0, jinja_js_1.jinjaRender)(f, data);
        },
        diff: (f1, f2) => (0, llmdiff_js_1.llmifyDiff)((0, diff_js_1.diffCreatePatch)(f1, f2)),
        tidyData: (rows, options) => (0, tidy_js_1.tidyData)(rows, options),
        hash: async (text, options) => await (0, crypto_js_1.hash)(text, options),
        unfence: unwrappers_js_1.unfence,
        GROQ: groq_js_1.GROQEvaluate,
        unthink: think_js_1.unthink,
        dedent: indent_js_1.dedent,
        encodeIDs: cleaners_js_1.encodeIDs,
        prompty: async (file) => {
            await (0, file_js_1.resolveFileContent)(file);
            return (0, prompty_js_1.promptyParse)(file.filename, file.content);
        },
        levenshtein: (a, b) => (0, levenshtein_js_1.levenshteinDistance)((0, unwrappers_js_1.filenameOrFileToContent)(a), (0, unwrappers_js_1.filenameOrFileToContent)(b)),
        ignore: async (...files) => (0, gitignore_js_1.createIgnorer)(files),
    });
}
//# sourceMappingURL=parsers.js.map