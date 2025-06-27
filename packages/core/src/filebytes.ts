// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * This module provides functions to handle file content resolution, rendering,
 * and data URI conversion. It includes support for various file formats like
 * PDF, DOCX, XLSX, and CSV.
 */
import { createFetch } from "./fetch.js";
import { host } from "./host.js";
import type { TraceOptions } from "./trace.js";
import { CancellationOptions, checkCancelled } from "./cancellation.js";
import { genaiscriptDebug } from "./debug.js";
import type { WorkspaceFile } from "./types.js";
import { fromBase64, toBase64 } from "./base64.js";
import { fileTypeFromBuffer } from "file-type";
import { lookupMime } from "./mime.js";

const dbg = genaiscriptDebug("file:bytes");

/**
 * Converts a data URI into a binary buffer.
 *
 * @param filename - The string to be inspected and potentially decoded. If the string is a valid data URI, its content will be converted to a binary buffer.
 * @returns A binary buffer containing the decoded content of the data URI. Returns undefined if the input is not a valid data URI.
 * @throws Will throw an error if the data URI format is invalid.
 */
export function dataUriToBuffer(filename: string) {
  if (/^data:/i.test(filename)) {
    dbg(`converting data URI to buffer`);
    const matches = filename.match(/^data:[^;]+;base64,(.*)$/i);
    if (!matches) {
      dbg(`invalid data URI format`);
      throw new Error("Invalid data URI format");
    }
    return fromBase64(matches[1]);
  }
  return undefined;
}

/**
 * Resolves and returns the file content as bytes.
 * @param filename - The file name, URL, data URI, or WorkspaceFile object to resolve. If a WorkspaceFile object, uses its encoding and content if available. If a string, resolves the file from the provided path, URL, or data URI. Supports both local files and remote URLs.
 * @param options - Optional parameters for tracing operations and fetch configuration. Used for logging operations or canceling the process.
 * @returns A Uint8Array containing the file content as bytes.
 */
export async function resolveFileBytes(
  filename: string | WorkspaceFile,
  options?: TraceOptions & CancellationOptions,
): Promise<Uint8Array> {
  if (typeof filename === "object") {
    if (filename.encoding && filename.content) {
      dbg(`resolving file bytes`);
      return new Uint8Array(Buffer.from(filename.content, filename.encoding));
    }
    filename = filename.filename;
  }

  const i = dataUriToBuffer(filename);
  if (i) {
    return i;
  }

  // Fetch file from URL or data-uri
  if (/^https?:\/\//i.test(filename)) {
    dbg(`fetching file from URL: ${filename}`);
    const fetch = await createFetch(options);
    const resp = await fetch(filename);
    const buffer = await resp.arrayBuffer();
    return new Uint8Array(buffer);
  }
  // Read file from local storage
  else {
    dbg(`reading file %s`, filename);
    const stat = await host.statFile(filename);
    if (stat?.type !== "file") return undefined;
    const buf = await host.readFile(filename);
    return new Uint8Array(buf);
  }
}

/**
 * Converts a file to a Data URI format.
 * @param filename - The file name, URL, or data URI to convert. Supports local files, remote URLs, and data URIs. If a WorkspaceFile object, its content and encoding are used.
 * @param options - Optional parameters for tracing operations and fetch configuration.
 * @returns A Data URI string if the MIME type is determined, otherwise undefined.
 */
export async function resolveFileDataUri(
  filename: string,
  options?: TraceOptions & CancellationOptions & { mime?: string },
) {
  const { cancellationToken, mime } = options || {};
  const bytes = await resolveFileBytes(filename, options);
  checkCancelled(cancellationToken);
  const uriMime = mime || (await fileTypeFromBuffer(bytes))?.mime || lookupMime(filename);
  if (!uriMime) {
    dbg(`no mime type found for ${filename}`);
    return undefined;
  }
  const b64 = toBase64(bytes);
  return {
    uri: `data:${uriMime};base64,${b64}`,
    mimeType: uriMime,
    data: b64,
  };
}
