"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitMarkdownTextImageParts = splitMarkdownTextImageParts;
// This module provides utilities for handling markdown, including prettifying, cleaning,
// generating markdown structures, and parsing trace trees. It supports operations like
// converting annotations to markdown, wrapping text in fences, creating links and details blocks,
// and working with trace trees.
const filebytes_js_1 = require("./filebytes.js");
const cancellation_js_1 = require("./cancellation.js");
const constants_js_1 = require("./constants.js");
const debug_js_1 = require("./debug.js");
const node_path_1 = require("node:path");
const dbg = (0, debug_js_1.genaiscriptDebug)("markdown");
/**
 * Splits a markdown string into an array of parts, where each part is either a text block or an image block.
 * Image blocks are objects of the form { type: "image", alt: string, url: string }. Only local images are supported.
 * Text blocks are objects of the form { type: "text", text: string }.
 * @param markdown The markdown string to split.
 */
async function splitMarkdownTextImageParts(markdown, options) {
    const { dir = "", cancellationToken, allowedDomains, convertToDataUri } = options || {};
    // remove \. for all images
    const regex = /^!\[(?<alt>[^\]]*)\]\((?<imageUrl>\.[^)]+)\)$/gm;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(markdown)) !== null) {
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        if (match.index > lastIndex) {
            const text = markdown.slice(lastIndex, match.index);
            if (text)
                parts.push({ type: "text", text });
        }
        const { alt, imageUrl } = match.groups;
        let data;
        let mimeType;
        const isDataUri = /^datauri:\/\//.test(imageUrl);
        if (isDataUri) {
            // TODO
        }
        else if (constants_js_1.HTTP_OR_S_REGEX.test(imageUrl)) {
            // TODO
        }
        else if (/^\./.test(imageUrl)) {
            dbg(`local image: %s`, imageUrl);
            if (convertToDataUri) {
                const filename = (0, node_path_1.resolve)((0, node_path_1.join)(dir, imageUrl));
                dbg(`local file: %s`, filename);
                try {
                    const res = await (0, filebytes_js_1.resolveFileDataUri)(filename, options);
                    data = res.data;
                    mimeType = res.mimeType;
                }
                catch (err) {
                    dbg(`%O`, err);
                }
            }
        }
        if (data && mimeType) {
            parts.push({ type: "image", data, mimeType });
        }
        else {
            const lastPart = parts.at(-1);
            if (lastPart?.type === "text")
                lastPart.text += match[0];
            else
                parts.push({ type: "text", text: match[0] });
        }
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < markdown.length) {
        const text = markdown.slice(lastIndex);
        if (text)
            parts.push({ type: "text", text });
    }
    return parts;
}
//# sourceMappingURL=markdown.js.map