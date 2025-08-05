"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.unzip = unzip;
const fflate_1 = require("fflate");
const mime_js_1 = require("./mime.js");
const binary_js_1 = require("./binary.js");
const glob_js_1 = require("./glob.js");
const base64_js_1 = require("./base64.js");
const utf8_js_1 = require("./utf8.js");
/**
 * Unzips a given byte array representing a ZIP file and extracts its contents into WorkspaceFile objects.
 *
 * @param data - A byte array containing the ZIP file data to be unzipped.
 * @param options - Optional parsing options. Supports a `glob` parameter to filter files by name using glob patterns.
 *                  If no options are provided, all files are extracted.
 * @returns A promise that resolves to an array of WorkspaceFile objects containing the extracted file data.
 */
async function unzip(data, options) {
    const { glob } = options || {};
    if (!data)
        return [];
    const res = (0, fflate_1.unzipSync)(data, {
        filter: (file) => {
            if (glob)
                return (0, glob_js_1.isGlobMatch)(file.name, glob);
            return true;
        },
    });
    const decoder = (0, utf8_js_1.createUTF8Decoder)();
    return Object.entries(res).map(([filename, data]) => {
        const mime = (0, mime_js_1.lookupMime)(filename);
        if ((0, binary_js_1.isBinaryMimeType)(mime))
            return {
                filename,
                encoding: "base64",
                content: (0, base64_js_1.toBase64)(data),
            };
        // bytes support
        else
            return { filename, content: decoder.decode(data) };
    });
}
//# sourceMappingURL=zip.js.map