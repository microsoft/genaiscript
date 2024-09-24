/**
 * This module provides functions to handle file content resolution, rendering,
 * and data URI conversion. It includes support for various file formats like
 * PDF, DOCX, XLSX, and CSV.
 */

import { DOCXTryParse } from "./docx"
import { readText } from "./fs"
import { lookupMime } from "./mime"
import { isBinaryMimeType } from "./parser"
import { createFetch } from "./fetch"
import { fileTypeFromBuffer } from "file-type"
import { toBase64 } from "./util"
import { host } from "./host"
import { TraceOptions } from "./trace"
import { parsePdf } from "./pdf"
import { XLSXParse } from "./xlsx"
import { CSVToMarkdown, CSVTryParse } from "./csv"
import {
    CSV_REGEX,
    DOCX_REGEX,
    HTTPS_REGEX,
    PDF_REGEX,
    XLSX_REGEX,
} from "./constants"
import { UrlAdapter, defaultUrlAdapters } from "./urlAdapters"
import { tidyData } from "./tidy"

/**
 * Resolves the content of a given file, attempting to fetch or parse it based on its type.
 * @param file - The WorkspaceFile containing the file information.
 * @param options - Optional TraceOptions for logging and tracing.
 * @returns The updated WorkspaceFile with the resolved content.
 */
export async function resolveFileContent(
    file: WorkspaceFile,
    options?: TraceOptions
) {
    const { trace } = options || {}
    const { filename } = file

    // If file content is already available or filename is missing, return the file as is.
    if (file.content) return file
    if (!filename) return file

    // Handle URL files
    if (HTTPS_REGEX.test(filename)) {
        let url = filename
        let adapter: UrlAdapter = undefined

        // Use URL adapters to modify the URL if needed
        for (const a of defaultUrlAdapters) {
            const newUrl = a.matcher(url)
            if (newUrl) {
                url = newUrl
                adapter = a
                break
            }
        }

        trace?.item(`fetch ${url}`)
        const fetch = await createFetch()
        const resp = await fetch(url, {
            headers: {
                "Content-Type": adapter?.contentType ?? "text/plain",
            },
        })
        trace?.itemValue(`status`, `${resp.status}, ${resp.statusText}`)

        // Set file content based on response and adapter type
        if (resp.ok)
            file.content =
                adapter?.contentType === "application/json"
                    ? adapter.adapter(await resp.json())
                    : await resp.text()
    } 
    // Handle PDF files
    else if (PDF_REGEX.test(filename)) {
        const { content } = await parsePdf(filename, options)
        file.content = content
    } 
    // Handle DOCX files
    else if (DOCX_REGEX.test(filename)) {
        file.content = await DOCXTryParse(filename, options)
    } 
    // Handle XLSX files
    else if (XLSX_REGEX.test(filename)) {
        const bytes = await host.readFile(filename)
        const sheets = await XLSXParse(bytes)
        file.content = JSON.stringify(sheets, null, 2)
    } 
    // Handle other file types
    else {
        const mime = lookupMime(filename)
        const isBinary = isBinaryMimeType(mime)
        if (!isBinary) file.content = await readText(filename)
    }

    return file
}

/**
 * Converts a string or WorkspaceFile into a consistent WorkspaceFile structure.
 * @param fileOrFilename - The input which could be a filename string or a WorkspaceFile object.
 * @returns A WorkspaceFile object.
 */
export function toWorkspaceFile(fileOrFilename: string | WorkspaceFile) {
    return typeof fileOrFilename === "string"
        ? { filename: fileOrFilename }
        : fileOrFilename
}

/**
 * Resolves the contents of multiple files asynchronously.
 * @param files - An array of WorkspaceFiles to process.
 */
export async function resolveFileContents(files: WorkspaceFile[]) {
    for (const file of files) {
        await resolveFileContent(file)
    }
}

/**
 * Renders the content of a file into a markdown format if applicable (e.g., CSV or XLSX).
 * @param file - The WorkspaceFile containing the file data.
 * @param options - Options for tracing and data filtering.
 * @returns An object with the filename and rendered content.
 */
export async function renderFileContent(
    file: WorkspaceFile,
    options: TraceOptions & DataFilter
) {
    const { filename, content } = file

    // Render CSV content
    if (content && CSV_REGEX.test(filename)) {
        let csv = CSVTryParse(content, options)
        if (csv) {
            csv = tidyData(csv, options)
            return { filename, content: CSVToMarkdown(csv, options) }
        }
    } 
    // Render XLSX content
    else if (content && XLSX_REGEX.test(filename)) {
        const sheets = JSON.parse(content) as WorkbookSheet[]
        const trimmed = sheets.length
            ? sheets
                .map(
                    ({ name, rows }) => `## ${name}
${CSVToMarkdown(tidyData(rows, options))}
`
                )
                .join("\n")
            : CSVToMarkdown(tidyData(sheets[0].rows, options))
        return { filename, content: trimmed }
    }
    return { ...file }
}

/**
 * Converts a file into a Data URI format.
 * @param filename - The file name or URL to convert.
 * @param options - Optional TraceOptions for fetching.
 * @returns The Data URI string or undefined if the MIME type cannot be determined.
 */
export async function resolveFileDataUri(
    filename: string,
    options?: TraceOptions
) {
    let bytes: Uint8Array

    // Fetch file from URL
    if (/^https?:\/\//i.test(filename)) {
        const fetch = await createFetch(options)
        const resp = await fetch(filename)
        const buffer = await resp.arrayBuffer()
        bytes = new Uint8Array(buffer)
    } 
    // Read file from local storage
    else {
        bytes = new Uint8Array(await host.readFile(filename))
    }

    const mime = (await fileTypeFromBuffer(bytes))?.mime
    if (!mime) return undefined

    const b64 = toBase64(bytes)
    return `data:${mime};base64,${b64}`
}
