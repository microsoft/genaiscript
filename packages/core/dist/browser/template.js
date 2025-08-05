// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * This module provides functions for parsing and validating prompt scripts
 * within a project. It includes a Checker class for validation of various
 * data types and formats.
 */
import { GENAI_ANY_REGEX, GENAI_MD_REGEX } from "./constants.js";
import { JSON5TryParse } from "./json5.js";
import { humanize } from "./inflection.js";
import { metadataValidate } from "./metadata.js";
import { deleteUndefinedValues } from "./cleaners.js";
import { markdownScriptParse } from "./markdownscript.js";
import { basename, resolve } from "node:path";
/**
 * Extracts a template ID from the given filename by removing specific extensions
 * and directories.
 *
 * @param filename - The filename to extract the template ID from.
 * @returns The extracted template ID.
 */
export function templateIdFromFileName(filename) {
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
export function parsePromptScriptMeta(jsSource) {
    const m = /\b(?<kind>system|script)\(\s*(?<meta>\{.*?\})\s*\)/s.exec(jsSource);
    const meta = JSON5TryParse(m?.groups?.meta) ?? {};
    if (m?.groups?.kind === "system") {
        meta.unlisted = true;
        meta.isSystem = true;
        meta.group = meta.group || "system";
    }
    meta.defTools = parsePromptScriptTools(jsSource);
    meta.metadata = metadataValidate(meta.metadata);
    return deleteUndefinedValues(meta);
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
    if (GENAI_MD_REGEX.test(filename)) {
        const res = await markdownScriptParse(content);
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
        title: humanize(basename(filename).replace(GENAI_ANY_REGEX, "")),
        jsSource,
        ...meta,
    };
    r.filename = resolve(filename);
    return r;
}
/**
 * Parses a prompt script file, validating its structure and content.
 *
 * @param filename - The filename of the script.
 * @param content - The content of the script.
 * @returns The parsed PromptScript or undefined in case of errors.
 */
export async function parsePromptScript(filename, content) {
    const script = await parsePromptTemplateCore(filename, content);
    return script;
}
//# sourceMappingURL=template.js.map