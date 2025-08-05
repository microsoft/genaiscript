"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readStdIn = readStdIn;
const file_type_1 = require("file-type");
const pretty_bytes_1 = __importDefault(require("pretty-bytes"));
const binary_js_1 = require("./binary.js");
const cleaners_js_1 = require("./cleaners.js");
const constants_js_1 = require("./constants.js");
const util_js_1 = require("./util.js");
const base64_js_1 = require("./base64.js");
function readStdinOrTimeout() {
    return new Promise((resolve, reject) => {
        const res = [];
        const { stdin } = process;
        if (!stdin || stdin.isTTY) {
            resolve(undefined);
            return;
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            resolve(undefined); // Resolve without data when timed out
        }, constants_js_1.STDIN_READ_TIMEOUT);
        const dataHandler = (data) => {
            clearTimeout(timeoutId);
            res.push(data);
        };
        const errorHandler = (err) => {
            clearTimeout(timeoutId);
            reject(err);
        };
        stdin.on("data", dataHandler);
        stdin.once("error", errorHandler);
        stdin.once("end", () => {
            clearTimeout(timeoutId);
            resolve(Buffer.concat(res));
        });
        if (controller.signal.aborted) {
            stdin.removeListener("data", dataHandler);
            stdin.removeListener("error", errorHandler);
        }
    });
}
/**
 * Reads data from standard input with a timeout mechanism and returns it wrapped in a `WorkspaceFile` object.
 * The function determines the MIME type of the input and processes it accordingly as binary or text data.
 *
 * If the input is binary, it encodes the content in base64. If the input is text, it converts the content to a UTF-8 string.
 *
 * @returns A `WorkspaceFile` object containing the parsed input data, or undefined if there is no data or if a timeout occurs.
 */
async function readStdIn() {
    const data = await readStdinOrTimeout();
    if (!data?.length)
        return undefined;
    const mime = await (0, file_type_1.fileTypeFromBuffer)(data);
    const res = (0, binary_js_1.isBinaryMimeType)(mime?.mime)
        ? {
            filename: `stdin.${mime?.ext || "bin"}`,
            content: (0, base64_js_1.toBase64)(data),
            encoding: "base64",
            size: data.length,
            type: mime?.mime,
        }
        : {
            filename: `stdin.${mime?.ext || "md"}`,
            content: data.toString("utf-8"),
            size: data.length,
            type: mime?.mime,
        };
    (0, util_js_1.logVerbose)(`stdin: ${res.filename} (${(0, pretty_bytes_1.default)(res.size)})`);
    return (0, cleaners_js_1.deleteUndefinedValues)(res);
}
//# sourceMappingURL=stdin.js.map