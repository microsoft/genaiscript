"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveFileContent = resolveFileContent;
exports.toWorkspaceFile = toWorkspaceFile;
exports.resolveFileContents = resolveFileContents;
exports.renderFileContent = renderFileContent;
/**
 * This module provides functions to handle file content resolution, rendering,
 * and data URI conversion. It includes support for various file formats like
 * PDF, DOCX, XLSX, and CSV.
 */
const docx_js_1 = require("./docx.js");
const fs_js_1 = require("./fs.js");
const mime_js_1 = require("./mime.js");
const binary_js_1 = require("./binary.js");
const base64_js_1 = require("./base64.js");
const host_js_1 = require("./host.js");
const pdf_js_1 = require("./pdf.js");
const xlsx_js_1 = require("./xlsx.js");
const csv_js_1 = require("./csv.js");
const constants_js_1 = require("./constants.js");
const tidy_js_1 = require("./tidy.js");
const cancellation_js_1 = require("./cancellation.js");
const pretty_js_1 = require("./pretty.js");
const resources_js_1 = require("./resources.js");
const debug_js_1 = require("./debug.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("file");
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
async function resolveFileContent(file, options) {
    const { trace, cancellationToken, maxFileSize = constants_js_1.MAX_FILE_CONTENT_SIZE } = options || {};
    if (!file)
        return file;
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    (0, cancellation_js_1.checkCancelled)(cancellationToken);
    const stats = await (0, fs_js_1.tryStat)(file.filename);
    if (stats && !stats.isFile()) {
        dbg(`skip, not a file`);
        return file; // ignore, this is a directory
    }
    // decode known files
    if (file.encoding === "base64") {
        dbg(`decode base64`);
        const bytes = (0, base64_js_1.fromBase64)(file.content);
        file.size = bytes.length;
        if (file.type === constants_js_1.PDF_MIME_TYPE) {
            dbg(`file type is PDF`);
            const { content } = await (0, pdf_js_1.parsePdf)(bytes, options);
            delete file.encoding;
            file.content = content;
        }
        else if (file.type === constants_js_1.XLSX_MIME_TYPE) {
            dbg(`file type is XLSX`);
            const sheets = await (0, xlsx_js_1.XLSXParse)(bytes);
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
    const res = await (0, resources_js_1.tryResolveResource)(filename, { trace, cancellationToken });
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
    else if (constants_js_1.PDF_REGEX.test(filename)) {
        dbg(`file is pdf`);
        const stat = await (0, fs_js_1.tryStat)(filename);
        const { content } = await (0, pdf_js_1.parsePdf)(filename, options);
        file.type = constants_js_1.PDF_MIME_TYPE;
        file.content = content;
        file.size = stat?.size;
    }
    // Handle DOCX files
    else if (constants_js_1.DOCX_REGEX.test(filename)) {
        dbg(`file is docx`);
        const stat = await (0, fs_js_1.tryStat)(filename);
        const res = await (0, docx_js_1.DOCXTryParse)(filename, options);
        file.type = constants_js_1.DOCX_MIME_TYPE;
        file.content = res.file?.content;
        file.size = res.file?.size || stat?.size;
    }
    // Handle XLSX files
    else if (constants_js_1.XLSX_REGEX.test(filename)) {
        dbg(`file is xlsx`);
        const stat = await (0, fs_js_1.tryStat)(filename);
        const bytes = await runtimeHost.readFile(filename);
        const sheets = await (0, xlsx_js_1.XLSXParse)(bytes);
        file.type = constants_js_1.XLSX_MIME_TYPE;
        file.content = JSON.stringify(sheets, null, 2);
        file.size = stat?.size;
    }
    // Handle other file types
    else {
        const mime = file.type || (0, mime_js_1.lookupMime)(filename);
        const isBinary = (0, binary_js_1.isBinaryMimeType)(mime);
        dbg(`mime %s binary %s`, mime, isBinary);
        file.type = mime;
        const info = await (0, fs_js_1.tryStat)(filename);
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
            dbg(`text ${(0, pretty_js_1.prettyBytes)(info.size)}`);
            file.content = await (0, fs_js_1.readText)(filename);
        }
        else {
            dbg(`binary ${(0, pretty_js_1.prettyBytes)(info?.size)}`);
            if (!maxFileSize || info.size < maxFileSize) {
                const bytes = await runtimeHost.readFile(filename);
                file.encoding = "base64";
                file.content = (0, base64_js_1.toBase64)(bytes);
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
function toWorkspaceFile(fileOrFilename) {
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
async function resolveFileContents(files, options) {
    const { cancellationToken } = options || {};
    for (const file of files) {
        await resolveFileContent(file, options);
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
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
async function renderFileContent(file, options) {
    const { filename, content } = file;
    // Render CSV content
    if (content && constants_js_1.CSV_REGEX.test(filename)) {
        dbg(`rendering CSV content`);
        let csv = (0, csv_js_1.CSVTryParse)(content, options);
        if (csv) {
            csv = (0, tidy_js_1.tidyData)(csv, options);
            return { filename, content: (0, csv_js_1.dataToMarkdownTable)(csv, options) };
        }
    }
    // Render XLSX content
    else if (content && constants_js_1.XLSX_REGEX.test(filename)) {
        dbg(`rendering XLSX content`);
        const sheets = JSON.parse(content);
        const trimmed = sheets.length
            ? sheets
                .map(({ name, rows }) => `## ${name}
${(0, csv_js_1.dataToMarkdownTable)((0, tidy_js_1.tidyData)(rows, options))}
`)
                .join("\n")
            : (0, csv_js_1.dataToMarkdownTable)((0, tidy_js_1.tidyData)(sheets[0].rows, options));
        return { filename, content: trimmed };
    }
    return { ...file };
}
//# sourceMappingURL=file.js.map