"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.installGlobals = installGlobals;
exports.installGlobalPromptContext = installGlobalPromptContext;
const debug_1 = __importDefault(require("debug"));
const dbg = (0, debug_1.default)("globals");
// Import various parsing and stringifying utilities
const yaml_js_1 = require("./yaml.js");
const csv_js_1 = require("./csv.js");
const ini_js_1 = require("./ini.js");
const xml_js_1 = require("./xml.js");
const frontmatter_js_1 = require("./frontmatter.js");
const jsonl_js_1 = require("./jsonl.js");
const html_js_1 = require("./html.js");
const error_js_1 = require("./error.js");
const githubclient_js_1 = require("./githubclient.js");
const git_js_1 = require("./git.js");
const tokens_js_1 = require("./tokens.js");
const encoders_js_1 = require("./encoders.js");
const json5_js_1 = require("./json5.js");
const schema_js_1 = require("./schema.js");
const ffmpeg_js_1 = require("./ffmpeg.js");
const parameters_js_1 = require("./parameters.js");
const mdchunk_js_1 = require("./mdchunk.js");
const global_js_1 = require("./global.js");
const mdstringify_js_1 = require("./mdstringify.js");
const diff_js_1 = require("./diff.js");
const parsers_js_1 = require("./parsers.js");
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
function installGlobals() {
    if (_globalsInstalled) {
        dbg("already installed");
        return; // Prevent multiple installations
    }
    _globalsInstalled = true; // Mark globals as installed
    dbg("install");
    const glb = (0, global_js_1.resolveGlobal)(); // Get the global context
    glb.parsers = (0, parsers_js_1.createParsers)();
    // Freeze YAML utilities to prevent modification
    glb.YAML = (0, yaml_js_1.createYAML)();
    // Freeze CSV utilities
    glb.CSV = Object.freeze({
        parse: csv_js_1.CSVParse, // Parse CSV string to objects
        stringify: csv_js_1.CSVStringify, // Convert objects to CSV string
        markdownify: csv_js_1.dataToMarkdownTable, // Convert CSV to Markdown format
        chunk: csv_js_1.CSVChunk,
    });
    // Freeze INI utilities
    glb.INI = Object.freeze({
        parse: ini_js_1.INIParse, // Parse INI string to objects
        stringify: ini_js_1.INIStringify, // Convert objects to INI string
    });
    // Freeze XML utilities
    glb.XML = Object.freeze({
        parse: xml_js_1.XMLParse, // Parse XML string to objects
    });
    // Freeze Markdown utilities with frontmatter operations
    glb.MD = Object.freeze({
        stringify: mdstringify_js_1.markdownStringify,
        frontmatter: (text, format) => (0, frontmatter_js_1.frontmatterTryParse)(text, { format })?.value ?? {}, // Parse frontmatter from markdown
        content: (text) => (0, frontmatter_js_1.splitMarkdown)(text)?.content, // Extract content from markdown
        updateFrontmatter: (text, frontmatter, format) => (0, frontmatter_js_1.updateFrontmatter)(text, frontmatter, { format }), // Update frontmatter in markdown
        chunk: async (text, options) => {
            const encoding = await (0, encoders_js_1.resolveTokenEncoder)(options?.model, {
                disableFallback: false,
            });
            const res = (0, mdchunk_js_1.chunkMarkdown)(text, (text) => encoding.encode(text).length, options);
            return res;
        },
    });
    // Freeze JSONL utilities
    glb.JSONL = (0, jsonl_js_1.createJSONL)();
    glb.JSON5 = Object.freeze({
        parse: json5_js_1.JSON5TryParse,
        stringify: json5_js_1.JSON5Stringify,
    });
    glb.JSONSchema = Object.freeze({
        infer: schema_js_1.JSONSchemaInfer,
        fromParameters: parameters_js_1.promptParametersSchemaToJSONSchema,
    });
    // Freeze HTML utilities
    glb.HTML = Object.freeze({
        convertTablesToJSON: html_js_1.HTMLTablesToJSON, // Convert HTML tables to JSON
        convertToMarkdown: html_js_1.HTMLToMarkdown, // Convert HTML to Markdown
        convertToText: html_js_1.HTMLToText, // Convert HTML to plain text
    });
    /**
     * Function to trigger cancellation with an error.
     * Throws a CancelError with a specified reason or a default message.
     * @param [reason] - Optional reason for cancellation.
     */
    glb.cancel = (reason) => {
        dbg("cancel", reason);
        throw new error_js_1.CancelError(reason || "user cancelled"); // Trigger cancel error
    };
    // Instantiate GitHub client
    glb.github = githubclient_js_1.GitHubClient.default();
    // Instantiate Git client
    glb.git = git_js_1.GitClient.default();
    glb.tokenizers = Object.freeze({
        resolve: encoders_js_1.resolveTokenEncoder,
        count: async (text, options) => {
            const { encode: encoder } = await (0, encoders_js_1.resolveTokenEncoder)(options?.model);
            if (options?.approximate)
                return (0, tokens_js_1.approximateTokens)(text, { encoder });
            const c = await (0, tokens_js_1.estimateTokens)(text, encoder);
            return c;
        },
        truncate: async (text, maxTokens, options) => {
            const { encode: encoder } = await (0, encoders_js_1.resolveTokenEncoder)(options?.model);
            return await (0, tokens_js_1.truncateTextToTokens)(text, maxTokens, encoder, options);
        },
        chunk: encoders_js_1.chunk,
    });
    // ffmpeg
    glb.ffmpeg = new ffmpeg_js_1.FFmepgClient();
    glb.DIFF = Object.freeze({
        parse: diff_js_1.tryDiffParse,
        createPatch: diff_js_1.diffCreatePatch,
        findChunk: diff_js_1.diffFindChunk,
    });
    // Polyfill for Object.groupBy if not available
    // eslint-disable-next-line n/no-unsupported-features/es-builtins, n/no-unsupported-features/es-syntax
    if (!Object.groupBy) {
        // eslint-disable-next-line n/no-unsupported-features/es-builtins, n/no-unsupported-features/es-syntax
        Object.groupBy = function (items, callback) {
            return items.reduce((acc, item, idx, arr) => {
                const key = callback(item, idx, arr);
                if (!acc[key])
                    acc[key] = [];
                acc[key].push(item);
                return acc;
            }, {});
        };
    }
    // these are overridden, ignored
    glb.script = () => { };
    glb.system = () => { };
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
function installGlobalPromptContext(ctx) {
    const glb = (0, global_js_1.resolveGlobal)(); // Get the global context
    for (const field of Object.keys(ctx)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        glb[field] = ctx[field];
    }
}
//# sourceMappingURL=globals.js.map