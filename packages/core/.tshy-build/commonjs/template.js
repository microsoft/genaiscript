"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateIdFromFileName = templateIdFromFileName;
exports.parsePromptScriptMeta = parsePromptScriptMeta;
exports.parsePromptScript = parsePromptScript;
/**
 * This module provides functions for parsing and validating prompt scripts
 * within a project. It includes a Checker class for validation of various
 * data types and formats.
 */
const constants_js_1 = require("./constants.js");
const json5_js_1 = require("./json5.js");
const inflection_js_1 = require("./inflection.js");
const metadata_js_1 = require("./metadata.js");
const cleaners_js_1 = require("./cleaners.js");
const markdownscript_js_1 = require("./markdownscript.js");
const node_path_1 = require("node:path");
/**
 * Extracts a template ID from the given filename by removing specific extensions
 * and directories.
 *
 * @param filename - The filename to extract the template ID from.
 * @returns The extracted template ID.
 */
function templateIdFromFileName(filename) {
    return filename
        .replace(/\.(mjs|ts|js|mts|prompty|md)$/i, "")
        .replace(/\.genai$/i, "")
        .replace(/.*[/\\]/, "");
}
/**
 * Parses metadata from the provided JavaScript source code. Determines the script type
 * (e.g., "system" or "script"), extracts metadata, and identifies tools defined in the script.
 *
 * @param jsSource - The JavaScript source code to analyze.
 * @returns An object containing extracted metadata, tool definitions, and system-specific properties.
 */
function parsePromptScriptMeta(jsSource) {
    const m = /\b(?<kind>system|script)\(\s*(?<meta>\{.*?\})\s*\)/s.exec(jsSource);
    const meta = (0, json5_js_1.JSON5TryParse)(m?.groups?.meta) ?? {};
    if (m?.groups?.kind === "system") {
        meta.unlisted = true;
        meta.isSystem = true;
        meta.group = meta.group || "system";
    }
    meta.defTools = parsePromptScriptTools(jsSource);
    meta.metadata = (0, metadata_js_1.metadataValidate)(meta.metadata);
    return (0, cleaners_js_1.deleteUndefinedValues)(meta);
}
function parsePromptScriptTools(jsSource) {
    const tools = [];
    jsSource.replace(/def(?<kind>Tool|Agent)\s*\(\s*"(?<id>[^"]+?)"\s*,\s*"(?<description>[^"]+?)"/g, (m, kind, id, description) => {
        tools.push({
            id: kind === "Agent" ? "agent_" + id : id,
            description,
            kind: kind.toLocaleLowerCase(),
        });
        return "";
    });
    return tools;
}
/**
 * Core function to parse a prompt template and validate its contents.
 *
 * @param filename - The filename of the template.
 * @param content - The content of the template.
 * @returns The parsed PromptScript or undefined in case of errors.
 */
async function parsePromptTemplateCore(filename, content) {
    // Check if this is a markdown script file
    let jsSource;
    let meta;
    if (constants_js_1.GENAI_MD_REGEX.test(filename)) {
        const res = await (0, markdownscript_js_1.markdownScriptParse)(content);
        meta = res.meta;
        jsSource = res.jsSource;
    }
    else {
        // Use content as-is for JavaScript/TypeScript files
        jsSource = content;
        meta = parsePromptScriptMeta(jsSource);
    }
    const r = {
        id: templateIdFromFileName(filename),
        title: (0, inflection_js_1.humanize)((0, node_path_1.basename)(filename).replace(constants_js_1.GENAI_ANY_REGEX, "")),
        jsSource,
        ...meta,
    };
    r.filename = (0, node_path_1.resolve)(filename);
    return r;
}
/**
 * Parses a prompt script file, validating its structure and content.
 *
 * @param filename - The filename of the script.
 * @param content - The content of the script.
 * @returns The parsed PromptScript or undefined in case of errors.
 */
async function parsePromptScript(filename, content) {
    const script = await parsePromptTemplateCore(filename, content);
    return script;
}
//# sourceMappingURL=template.js.map