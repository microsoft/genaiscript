// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { unzipSync } from "fflate";
import { lookupMime } from "./mime.js";
import { isBinaryMimeType } from "./binary.js";
import { isGlobMatch } from "./glob.js";
import { toBase64 } from "./base64.js";
import { createUTF8Decoder } from "./utf8.js";
/**
 * Unzips a given byte array representing a ZIP file and extracts its contents into WorkspaceFile objects.
 *
 * @param data - A byte array containing the ZIP file data to be unzipped.
 * @param options - Optional parsing options. Supports a `glob` parameter to filter files by name using glob patterns.
 *                  If no options are provided, all files are extracted.
 * @returns A promise that resolves to an array of WorkspaceFile objects containing the extracted file data.
 */
export async function unzip(data, options) {
    const { glob } = options || {};
    if (!data)
        return [];
    const res = unzipSync(data, {
        filter: (file) => {
            if (glob)
                return isGlobMatch(file.name, glob);
            return true;
        },
    });
    const decoder = createUTF8Decoder();
    return Object.entries(res).map(([filename, data]) => {
        const mime = lookupMime(filename);
        if (isBinaryMimeType(mime))
            return {
                filename,
                encoding: "base64",
                content: toBase64(data),
            };
        // bytes support
        else
            return { filename, content: decoder.decode(data) };
    });
}
//# sourceMappingURL=zip.js.map