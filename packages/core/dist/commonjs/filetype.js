"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileTypeFromBuffer = fileTypeFromBuffer;
const file_type_1 = require("file-type");
/**
 * Determines the file type of a given buffer.
 *
 * @param buffer - The input data to analyze. Must be a Uint8Array or ArrayBuffer.
 *                 If undefined, the function returns undefined.
 * @returns The detected file type object, or undefined if no buffer is provided or type cannot be determined.
 */
async function fileTypeFromBuffer(buffer) {
    if (buffer === undefined)
        return undefined;
    return (0, file_type_1.fileTypeFromBuffer)(buffer);
}
//# sourceMappingURL=filetype.js.map