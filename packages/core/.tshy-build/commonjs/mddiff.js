"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.markdownDiff = markdownDiff;
const diff_1 = require("diff");
const mkmd_js_1 = require("./mkmd.js");
/**
 * Generates a markdown-styled diff between two strings.
 *
 * @param oldStr - The original string to compare from. If undefined, the new string will be fenced as is.
 * @param newStr - The updated string to compare against the original.
 * @param options - Optional configuration object.
 * @param options.lang - Specifies the language for the fenced code block.
 * @param options.ignoreWhitespace - If true, ignores whitespace differences during the diff computation.
 * @returns A fenced markdown string representing the diff or the new string if oldStr is undefined.
 */
function markdownDiff(oldStr, newStr, options) {
    const { lang, ...rest } = options || {};
    if (oldStr === undefined)
        return (0, mkmd_js_1.fenceMD)(newStr, lang);
    const changes = (0, diff_1.diffLines)(oldStr || "", newStr || "", rest);
    const source = changes.map((c) => `${c.added ? "+" : c.removed ? "-" : " "}${c.value}`).join("");
    return (0, mkmd_js_1.fenceMD)(source, "diff");
}
//# sourceMappingURL=mddiff.js.map