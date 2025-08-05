"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.frontmatterTryParse = frontmatterTryParse;
exports.splitMarkdown = splitMarkdown;
exports.updateFrontmatter = updateFrontmatter;
const unwrappers_js_1 = require("./unwrappers.js");
const json5_js_1 = require("./json5.js");
const toml_js_1 = require("./toml.js");
const yaml_js_1 = require("./yaml.js");
/**
 * Parses the frontmatter section of a text input and attempts to convert it into a structured format.
 *
 * @param text The text or file content to parse. Can either be a raw string or a WorkspaceFile object.
 * @param options Optional parsing options:
 *   - format: Specifies the expected frontmatter format. Supported formats are "yaml", "json", "toml", or "text".
 *
 * @returns An object containing:
 *   - text: The raw frontmatter string.
 *   - value: The parsed frontmatter as a structured object, depending on the specified format.
 *   - endLine: The last line index of the frontmatter, if it exists.
 *   Returns `undefined` if no frontmatter is found.
 */
function frontmatterTryParse(text, options) {
    text = (0, unwrappers_js_1.filenameOrFileToContent)(text);
    const { format = "yaml" } = options || {};
    const { frontmatter, endLine } = splitMarkdown(text);
    if (!frontmatter)
        return undefined;
    let res;
    switch (format) {
        case "text":
            res = frontmatter;
            break;
        case "json":
            res = (0, json5_js_1.JSON5TryParse)(frontmatter);
            break;
        case "toml":
            res = (0, toml_js_1.TOMLTryParse)(frontmatter);
            break;
        default:
            res = (0, yaml_js_1.YAMLTryParse)(frontmatter);
            break;
    }
    return { text: frontmatter, value: res, endLine };
}
/**
 * Splits a Markdown text into its frontmatter and content parts.
 *
 * @param text - The input text or a WorkspaceFile containing Markdown content.
 * @returns An object containing:
 *   - `frontmatter`: The extracted frontmatter as a string, if available.
 *   - `endLine`: The line number where the frontmatter ends, if applicable.
 *   - `content`: The remaining Markdown content after the frontmatter.
 */
function splitMarkdown(text) {
    text = (0, unwrappers_js_1.filenameOrFileToContent)(text);
    if (!text)
        return { content: text };
    const lines = text.split(/\r?\n/g);
    const delimiter = "---";
    if (lines[0] !== delimiter)
        return { content: text };
    let end = 1;
    while (end < lines.length) {
        if (lines[end] === delimiter)
            break;
        end++;
    }
    if (end >= lines.length)
        return { frontmatter: text, content: "" };
    const frontmatter = lines.slice(1, end).join("\n");
    const content = lines.slice(end + 1).join("\n");
    return { frontmatter, content, endLine: end };
}
/**
 * Updates the frontmatter section of a given text and returns the updated content.
 *
 * @param text - The input text containing frontmatter and content.
 * @param newFrontmatter - An object representing the new frontmatter to merge or apply.
 *   Keys with `null` remove corresponding fields, keys with `undefined` are ignored.
 * @param options - Optional configuration for output format:
 *   - `format`: Specifies the frontmatter format ("yaml" or "json"). Defaults to "yaml".
 *
 * @returns The updated text with the modified frontmatter and existing content.
 *
 * @throws An error if the specified format is unsupported.
 */
function updateFrontmatter(text, newFrontmatter, options) {
    const { content = "" } = splitMarkdown(text);
    if (newFrontmatter === null)
        return content;
    const frontmatter = frontmatterTryParse(text, options)?.value ?? {};
    // merge object
    for (const [key, value] of Object.entries(newFrontmatter ?? {})) {
        if (value === null) {
            delete frontmatter[key];
        }
        else if (value !== undefined) {
            frontmatter[key] = value;
        }
    }
    const { format = "yaml" } = options || {};
    let fm;
    switch (format) {
        case "json":
            fm = JSON.stringify(frontmatter, null, 2);
            break;
        case "yaml":
            fm = (0, yaml_js_1.YAMLStringify)(frontmatter);
            break;
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
    return `---\n${fm}\n---\n${content}`;
}
//# sourceMappingURL=frontmatter.js.map