// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { unzipSync } from "fflate";
import { lookupMime } from "./mime.js";
import { isBinaryMimeType } from "./binary.js";
import { host } from "./host.js";
import { isGlobMatch } from "./glob.js";
import { toBase64 } from "./base64.js";
import type { ParseZipOptions, WorkspaceFile } from "./types.js";

/**
 * Unzips a given byte array representing a ZIP file and extracts its contents into WorkspaceFile objects.
 *
 * @param data - A byte array containing the ZIP file data to be unzipped.
 * @param options - Optional parsing options. Supports a `glob` parameter to filter files by name using glob patterns.
 *                  If no options are provided, all files are extracted.
 * @returns A promise that resolves to an array of WorkspaceFile objects containing the extracted file data.
 */
export async function unzip(data: Uint8Array, options?: ParseZipOptions): Promise<WorkspaceFile[]> {
  const { glob } = options || {};
  if (!data) return [];
  const res = unzipSync(data, {
    filter: (file: { name: string; originalSize: number }) => {
      if (glob) return isGlobMatch(file.name, glob);
      return true;
    },
  });
  const decoder = host.createUTF8Decoder();
  return Object.entries(res).map(([filename, data]) => {
    const mime = lookupMime(filename);
    if (isBinaryMimeType(mime))
      return <WorkspaceFile>{
        filename,
        encoding: "base64",
        content: toBase64(data),
      };
    // bytes support
    else return <WorkspaceFile>{ filename, content: decoder.decode(data) };
  });
}
