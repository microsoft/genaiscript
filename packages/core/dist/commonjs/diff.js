"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffParse = diffParse;
exports.diffResolve = diffResolve;
exports.tryDiffParse = tryDiffParse;
exports.diffCreatePatch = diffCreatePatch;
exports.diffFindChunk = diffFindChunk;
const parse_diff_1 = __importDefault(require("parse-diff"));
const cleaners_js_1 = require("./cleaners.js");
const debug_1 = __importDefault(require("debug"));
const error_js_1 = require("./error.js");
const diff_1 = require("diff");
const node_path_1 = require("node:path");
const dbg = (0, debug_1.default)("genaiscript:diff");
/**
 * Parses a diff string into a structured format.
 *
 * @param input - The diff string to parse. Should be in a valid diff format.
 * @returns An array of parsed file objects. If the input is empty or invalid, returns an empty array.
 */
function diffParse(input) {
    if ((0, cleaners_js_1.isEmptyString)(input))
        return [];
    const files = (0, parse_diff_1.default)(input);
    return files;
}
/**
 * Resolves the input into an array of DiffFile objects.
 *
 * @param input - The input to resolve. Can be a diff string in valid format or an ElementOrArray of DiffFile objects.
 * @returns An array of DiffFile objects. If the input is a string, it is parsed into DiffFile objects using diffParse. If the input is already an ElementOrArray of DiffFile objects, it is converted to an array using arrayify.
 */
function diffResolve(input) {
    if (typeof input === "string")
        return diffParse(input);
    else
        return (0, cleaners_js_1.arrayify)(input);
}
/**
 * Attempts to parse a diff string into a structured format.
 * If parsing fails, logs the error message and returns an empty array.
 *
 * @param diff - The diff string to parse.
 * @returns An array of parsed file objects if successful, or an empty array if parsing fails. Logs an error message if parsing fails.
 */
function tryDiffParse(diff) {
    try {
        return diffParse(diff);
    }
    catch (e) {
        dbg(`diff parsing failed: ${(0, error_js_1.errorMessage)(e)}`);
        return [];
    }
}
/**
 * Creates a unified diff between two workspace files.
 * If the input is a string, it is wrapped in a WorkspaceFile object with a default filename.
 * If the input is an object, it should contain a filename and content.
 *
 * @param left - The original workspace file or its content. If a string, it is wrapped in a WorkspaceFile object with the filename "left".
 * @param right - The modified workspace file or its content. If a string, it is wrapped in a WorkspaceFile object with the filename "right".
 * @param options - Optional parameters, such as the number of context lines, case sensitivity, and whitespace handling. Defaults to ignoring case and whitespace. Additional options can be provided.
 * @returns The diff as a string, with redundant headers removed. The diff is generated using createTwoFilesPatch.
 */
function diffCreatePatch(left, right, options) {
    if (typeof left === "string")
        left = { filename: "left", content: left };
    if (typeof right === "string")
        right = { filename: "right", content: right };
    const res = (0, diff_1.createTwoFilesPatch)(left?.filename || "", right?.filename || "", left?.content || "", right?.content || "", undefined, undefined, {
        ignoreCase: true,
        ignoreWhitespace: true,
        ...(options ?? {}),
    });
    return res.replace(/^[^=]*={10,}\n/, "");
}
/**
 * Determines if two number ranges overlap.
 *
 * @param start1 - Start of first range.
 * @param end1 - End of first range (inclusive).
 * @param start2 - Start of second range.
 * @param end2 - End of second range (inclusive).
 * @returns True if the ranges overlap, false otherwise.
 */
function rangesOverlap(start1, end1, start2, end2) {
    return Math.max(start1, start2) <= Math.min(end1, end2);
}
/**
 * Finds a chunk in a diff corresponding to a specified file and line number.
 *
 * @param file - The file path to search for in the diff. Can be empty to search all files.
 * @param range - The line number or numbers (zero-based) to locate in the specified file's diff.
 * @param diff - The diff data, containing an array of file diffs. Can be a single diff file or an array of diff files.
 * @returns An object containing the matching file and the chunk if found, or an object with only the file if no chunk matches. Returns undefined if no file matches.
 */
function diffFindChunk(file, range, diff) {
    // line is zero-based!
    const fn = file ? (0, node_path_1.resolve)(file) : undefined;
    const df = (0, cleaners_js_1.arrayify)(diff).find((f) => (!file && !f.to) || (0, node_path_1.resolve)(f.to) === fn);
    if (!df)
        return undefined; // file not found in diff
    const { chunks } = df;
    const lines = (0, cleaners_js_1.arrayify)(range);
    if (lines.length === 0)
        return { file: df }; // no lines to search for
    if (lines.length === 1)
        lines[1] = lines[0]; // if only one line, make it a range
    if (lines[0] > lines[1]) {
        // if the range is inverted, swap it
        const tmp = lines[0];
        lines[0] = lines[1];
        lines[1] = tmp;
    }
    for (const chunk of chunks) {
        if (rangesOverlap(lines[0], lines[1], chunk.newStart, chunk.newStart + chunk.newLines))
            return { file: df, chunk };
    }
    return { file: df };
}
//# sourceMappingURL=diff.js.map