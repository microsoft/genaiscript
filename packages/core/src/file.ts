// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * This module provides functions to handle file content resolution, rendering,
 * and data URI conversion. It includes support for various file formats like
 * PDF, DOCX, XLSX, and CSV.
 */
import { DOCXTryParse } from "./docx.js";
import { readText, tryStat } from "./fs.js";
import { lookupMime } from "./mime.js";
import { isBinaryMimeType } from "./binary.js";
import { createFetch } from "./fetch.js";
import { fileTypeFromBuffer } from "./filetype.js";
import { fromBase64, toBase64 } from "./base64.js";
import { host } from "./host.js";
import { TraceOptions } from "./trace.js";
import { parsePdf } from "./pdf.js";
import { XLSXParse } from "./xlsx.js";
import { dataToMarkdownTable, CSVTryParse } from "./csv.js";
import {
  CSV_REGEX,
  DOCX_MIME_TYPE,
  DOCX_REGEX,
  MAX_FILE_CONTENT_SIZE,
  PDF_MIME_TYPE,
  PDF_REGEX,
  XLSX_MIME_TYPE,
  XLSX_REGEX,
} from "./constants.js";
import { tidyData } from "./tidy.js";
import { CancellationOptions, checkCancelled } from "./cancellation.js";
import { prettyBytes } from "./pretty.js";
import { tryResolveResource } from "./resources.js";
import { genaiscriptDebug } from "./debug.js";
import type { DataFilter, WorkspaceFile, WorkbookSheet } from "./types.js";

const dbg = genaiscriptDebug("file");

/**
 * Resolves the content of a file by decoding, fetching, or parsing it based on its type or source.
 *
 * @param file - The file object containing filename, content, type, and encoding.
 * @param options - Optional parameters:
 *   - trace - Object for logging operations.
 *   - cancellationToken - Token to cancel the operation.
 *   - maxFileSize - Maximum file size for processing. Defaults to MAX_FILE_CONTENT_SIZE.
 * @returns The updated file object with resolved content or metadata. If the file cannot be resolved, it is returned as is.
 */
export async function resolveFileContent(
  file: WorkspaceFile,
  options?: TraceOptions & { maxFileSize?: number } & CancellationOptions,
): Promise<WorkspaceFile> {
  const { trace, cancellationToken, maxFileSize = MAX_FILE_CONTENT_SIZE } = options || {};
  if (!file) return file;

  checkCancelled(cancellationToken);

  const stats = await tryStat(file.filename);
  if (stats && !stats.isFile()) {
    dbg(`skip, not a file`);
    return file; // ignore, this is a directory
  }

  // decode known files
  if (file.encoding === "base64") {
    dbg(`decode base64`);
    const bytes = fromBase64(file.content);
    file.size = bytes.length;
    if (file.type === PDF_MIME_TYPE) {
      dbg(`file type is PDF`);
      const { content } = await parsePdf(bytes, options);
      delete file.encoding;
      file.content = content;
    } else if (file.type === XLSX_MIME_TYPE) {
      dbg(`file type is XLSX`);
      const sheets = await XLSXParse(bytes);
      delete file.encoding;
      file.content = JSON.stringify(sheets, null, 2);
    }
    return file;
  }

  const { filename } = file;
  // If file content is already available or filename is missing, return the file as is.
  if (file.content) {
    return file;
  }
  if (!filename) {
    dbg(`file has no content and no filename`);
    return file;
  }

  dbg(`resolving ${filename}`);
  const res = await tryResolveResource(filename, { trace, cancellationToken });
  // Handle uris files
  if (res) {
    dbg(`resolved file uri`);
    const resFile = res.files[0];
    file.type = resFile.type;
    file.content = resFile.content;
    file.size = resFile.size;
    file.encoding = resFile.encoding;
  }
  // Handle PDF files
  else if (PDF_REGEX.test(filename)) {
    dbg(`file is pdf`);
    const stat = await tryStat(filename);
    const { content } = await parsePdf(filename, options);
    file.type = PDF_MIME_TYPE;
    file.content = content;
    file.size = stat?.size;
  }
  // Handle DOCX files
  else if (DOCX_REGEX.test(filename)) {
    dbg(`file is docx`);
    const stat = await tryStat(filename);
    const res = await DOCXTryParse(filename, options);
    file.type = DOCX_MIME_TYPE;
    file.content = res.file?.content;
    file.size = res.file?.size || stat?.size;
  }
  // Handle XLSX files
  else if (XLSX_REGEX.test(filename)) {
    dbg(`file is xlsx`);
    const stat = await tryStat(filename);
    const bytes = await host.readFile(filename);
    const sheets = await XLSXParse(bytes);
    file.type = XLSX_MIME_TYPE;
    file.content = JSON.stringify(sheets, null, 2);
    file.size = stat?.size;
  }
  // Handle other file types
  else {
    const mime = file.type || lookupMime(filename);
    const isBinary = isBinaryMimeType(mime);
    dbg(`mime %s binary %s`, mime, isBinary);
    file.type = mime;
    const info = await tryStat(filename);
    file.size = info?.size;
    if (!info) {
      dbg(`file not found: ${filename}`);
      return file;
    }
    if (!info.isFile()) {
      dbg(`skip, not a file`);
      return file; // ignore, this is a directory
    }
    if (!isBinary) {
      dbg(`text ${prettyBytes(info.size)}`);
      file.content = await readText(filename);
    } else {
      dbg(`binary ${prettyBytes(info?.size)}`);
      if (!maxFileSize || info.size < maxFileSize) {
        const bytes: Uint8Array = await host.readFile(filename);
        file.encoding = "base64";
        file.content = toBase64(bytes);
        file.size = bytes.length;
      }
    }
  }

  return file;
}

/**
 * Converts input into a WorkspaceFile structure.
 * @param fileOrFilename - A filename string or an object representing a WorkspaceFile.
 * @returns A WorkspaceFile object with the provided filename or the original WorkspaceFile object.
 */
export function toWorkspaceFile(fileOrFilename: string | WorkspaceFile) {
  return typeof fileOrFilename === "string" ? { filename: fileOrFilename } : fileOrFilename;
}

/**
 * Resolves the contents of multiple files asynchronously.
 * Processes each file to resolve its content based on type or source.
 * @param files - List of files to process and resolve.
 * @param options - Optional parameters:
 *   - cancellationToken - Token to cancel the operation if needed.
 *   - trace - Object for logging and tracing operations.
 */
export async function resolveFileContents(
  files: WorkspaceFile[],
  options?: CancellationOptions & TraceOptions,
) {
  const { cancellationToken } = options || {};
  for (const file of files) {
    await resolveFileContent(file, options);
    checkCancelled(cancellationToken);
  }
}

/**
 * Renders the content of a file into a markdown format if applicable.
 * Supports rendering for CSV and XLSX file types by converting their contents into readable markdown tables.
 *
 * @param file - The file object containing filename and content. If the content matches a supported format, it will be rendered.
 * @param options - Options for tracing operations and filtering the file data during rendering. Includes data transformation, markdown table generation, and optional sheet trimming for XLSX files.
 * @returns An object containing the filename and rendered content, or the original file object if rendering is not applicable.
 */
export async function renderFileContent(file: WorkspaceFile, options: TraceOptions & DataFilter) {
  const { filename, content } = file;

  // Render CSV content
  if (content && CSV_REGEX.test(filename)) {
    dbg(`rendering CSV content`);
    let csv = CSVTryParse(content, options);
    if (csv) {
      csv = tidyData(csv, options);
      return { filename, content: dataToMarkdownTable(csv, options) };
    }
  }
  // Render XLSX content
  else if (content && XLSX_REGEX.test(filename)) {
    dbg(`rendering XLSX content`);
    const sheets = JSON.parse(content) as WorkbookSheet[];
    const trimmed = sheets.length
      ? sheets
          .map(
            ({ name, rows }) => `## ${name}
${dataToMarkdownTable(tidyData(rows, options))}
`,
          )
          .join("\n")
      : dataToMarkdownTable(tidyData(sheets[0].rows, options));
    return { filename, content: trimmed };
  }
  return { ...file };
}
