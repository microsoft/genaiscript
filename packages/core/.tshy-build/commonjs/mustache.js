"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mustacheRender = void 0;
exports.interpolateVariables = interpolateVariables;
const frontmatter_js_1 = require("./frontmatter.js");
const mustache_1 = __importDefault(require("mustache"));
const jinja_js_1 = require("./jinja.js");
/**
 * Processes a markdown string by applying Mustache or Jinja templating.
 * Removes frontmatter, prompty roles, and XML tags before interpolation.
 * @param md The markdown string to process.
 * @param data The data for variable interpolation.
 * @param options Configuration for templating format, e.g., Mustache or Jinja.
 * @returns The processed markdown string with interpolated variables.
 */
async function interpolateVariables(md, data, options) {
    if (!md || !data)
        return md;
    const { format } = options || {};
    // remove frontmatter
    let { content } = (0, frontmatter_js_1.splitMarkdown)(md);
    // remove prompty roles
    // https://github.com/microsoft/prompty/blob/main/runtime/prompty/prompty/parsers.py#L113C21-L113C77
    content = content.replace(/^\s*(system|user|assistant)\s*:\s*$/gim, "\n");
    if (content) {
        // remove xml tags
        // https://humanloop.com/docs/prompt-file-format
        if (format === "jinja")
            content = (0, jinja_js_1.jinjaRender)(content, data ?? {});
        else
            content = mustache_1.default.render(content, data ?? {});
    }
    return content;
}
exports.mustacheRender = mustache_1.default.render;
//# sourceMappingURL=mustache.js.map