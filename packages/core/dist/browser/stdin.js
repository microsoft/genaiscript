// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { fileTypeFromBuffer } from "file-type";
import prettyBytes from "pretty-bytes";
import { isBinaryMimeType } from "./binary.js";
import { deleteUndefinedValues } from "./cleaners.js";
import { STDIN_READ_TIMEOUT } from "./constants.js";
import { logVerbose } from "./util.js";
import { toBase64 } from "./base64.js";
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
        }, STDIN_READ_TIMEOUT);
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
export async function readStdIn() {
    const data = await readStdinOrTimeout();
    if (!data?.length)
        return undefined;
    const mime = await fileTypeFromBuffer(data);
    const res = isBinaryMimeType(mime?.mime)
        ? {
            filename: `stdin.${mime?.ext || "bin"}`,
            content: toBase64(data),
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
    logVerbose(`stdin: ${res.filename} (${prettyBytes(res.size)})`);
    return deleteUndefinedValues(res);
}
//# sourceMappingURL=stdin.js.map