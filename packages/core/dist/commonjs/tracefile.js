"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTraceWriting = setupTraceWriting;
const node_path_1 = require("node:path");
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const constants_js_1 = require("./constants.js");
const performance_js_1 = require("./performance.js");
const util_js_1 = require("./util.js");
const fs_js_1 = require("./fs.js");
/**
 * Sets up trace writing to a specified file by handling trace events.
 *
 * @param trace - The trace object to listen to for events.
 * @param name - A name identifier for logging purposes.
 * @param filename - The file path where trace data will be written.
 * @param options - Optional configuration object.
 * @param options.ignoreInner - If true, skips processing of "inner" trace chunks.
 *
 * @returns The filename where trace data is written.
 *
 * This function ensures the target directory exists and initializes an empty file.
 * It listens for TRACE_CHUNK events to append trace chunks to the file using a
 * buffered write stream. TRACE_DETAILS events flush the write stream (if open) and write
 * the entire content to the file.
 */
async function setupTraceWriting(trace, name, filename, options) {
    const { ignoreInner } = options || {};
    (0, util_js_1.logVerbose)(`${name}: ${filename}`);
    await (0, fs_js_1.ensureDir)((0, node_path_1.dirname)(filename));
    await (0, promises_1.writeFile)(filename, "", { encoding: "utf-8" });
    // Create a write stream for efficient buffered writes
    let writeStream;
    trace.addEventListener(constants_js_1.TRACE_CHUNK, (ev) => {
        const tev = ev;
        if (ignoreInner && tev.inner)
            return;
        const m = (0, performance_js_1.measure)("trace.chunk");
        if (!writeStream)
            writeStream = (0, node_fs_1.createWriteStream)(filename, {
                flags: "a", // 'a' for append mode
                encoding: "utf8",
            });
        writeStream.write(tev.chunk); // Non-blocking buffered write
        m(`${tev.chunk.length} chars`);
    }, false);
    trace.addEventListener(constants_js_1.TRACE_DETAILS, () => {
        const m = (0, performance_js_1.measure)("trace.details");
        const content = trace.content;
        // End the write stream to ensure all data is flushed
        if (writeStream) {
            writeStream.end();
            writeStream = undefined;
        }
        // Write the full content
        (0, node_fs_1.writeFileSync)(filename, content, { encoding: "utf-8" });
        m(`${content.length} chars`);
    });
    return filename;
}
//# sourceMappingURL=tracefile.js.map