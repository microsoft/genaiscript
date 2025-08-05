"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.isJSONLFilename = isJSONLFilename;
exports.JSONLTryParse = JSONLTryParse;
exports.JSONLStringify = JSONLStringify;
exports.writeJSONL = writeJSONL;
exports.appendJSONL = appendJSONL;
exports.createJSONL = createJSONL;
const host_js_1 = require("./host.js");
const json5_js_1 = require("./json5.js");
const util_js_1 = require("./util.js");
const cleaners_js_1 = require("./cleaners.js");
const utf8_js_1 = require("./utf8.js");
function tryReadFile(fn) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    return runtimeHost.readFile(fn).then((r) => r, (_) => null);
}
/**
 * Determines if a given filename has a JSONL-compatible extension.
 *
 * @param fn - The filename to evaluate.
 * @returns True if the filename ends with .jsonl, .mdjson, or .ldjson (case-insensitive), otherwise false.
 */
function isJSONLFilename(fn) {
    return /\.(jsonl|mdjson|ldjson)$/i.test(fn);
}
/**
 * Parses a JSONL (JSON Lines) formatted string into an array of objects.
 *
 * @param text - The string containing JSONL data. If empty, an empty array is returned.
 * @param options - Optional. Contains parsing configuration:
 *   - repair: If true, attempts to repair invalid JSON during parsing.
 *
 * @returns An array of parsed objects. Lines that fail parsing or are empty are skipped.
 */
function JSONLTryParse(text, options) {
    if (!text)
        return [];
    const res = [];
    const lines = text.split("\n");
    for (const line of lines.filter((l) => !!l.trim())) {
        const obj = (0, json5_js_1.JSON5TryParse)(line, options);
        if (obj !== undefined && obj !== null)
            res.push(obj);
    }
    return res;
}
/**
 * Converts an array of objects into a JSON Lines (JSONL) formatted string.
 *
 * @param objs - The array of objects to be serialized. Objects that are undefined or null are excluded from the output.
 * @returns A string where each object in the array is serialized as a JSON string and separated by newlines. Returns an empty string if the input array is empty or null.
 */
function JSONLStringify(objs) {
    if (!objs?.length)
        return "";
    const acc = [];
    for (const o of objs.filter((o) => o !== undefined && o !== null)) {
        const s = JSON.stringify(o);
        acc.push(s);
    }
    return acc.join("\n") + "\n";
}
function serialize(objs) {
    const acc = JSONLStringify(objs);
    const buf = (0, utf8_js_1.createUTF8Encoder)().encode(acc);
    return buf;
}
async function writeJSONLCore(fn, objs, append) {
    let buf = serialize(objs);
    if (append) {
        const curr = await tryReadFile(fn);
        if (curr)
            buf = (0, util_js_1.concatBuffers)(curr, buf);
    }
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    await runtimeHost.writeFile(fn, buf);
}
/**
 * Writes a JSON Lines (JSONL) file. Overwrites the file if it already exists.
 *
 * @param fn - The name of the file to write.
 * @param objs - An array of objects to serialize and write to the file.
 */
async function writeJSONL(fn, objs) {
    await writeJSONLCore(fn, objs, false);
}
/**
 * Appends objects to a JSON Lines (JSONL) file. If metadata is provided, it will be added to each object before appending.
 *
 * @param name - The name of the JSONL file to append to.
 * @param objs - The objects to be appended to the file.
 * @param meta - Optional metadata to include in each appended object under the `__meta` key.
 */
async function appendJSONL(name, objs, meta) {
    const row = (0, cleaners_js_1.arrayify)(objs);
    if (meta)
        await writeJSONLCore(name, row.map((obj) => ({ ...obj, __meta: meta })), true);
    else
        await writeJSONLCore(name, row, true);
}
function createJSONL() {
    return Object.freeze({
        parse: JSONLTryParse,
        stringify: JSONLStringify,
        append: appendJSONL,
    });
}
//# sourceMappingURL=jsonl.js.map