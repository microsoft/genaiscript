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

export async function resolveFileContent(
    file: WorkspaceFile,
    options?: TraceOptions
) {
    const { trace } = options || {}
    const { filename } = file
    if (file.content) return file
    if (!filename) return file
    if (HTTPS_REGEX.test(filename)) {
        let url = filename
        let adapter: UrlAdapter = undefined
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
        if (resp.ok)
            file.content =
                adapter?.contentType === "application/json"
                    ? adapter.adapter(await resp.json())
                    : await resp.text()
    } else if (PDF_REGEX.test(filename)) {
        const { content } = await parsePdf(filename, options)
        file.content = content
    } else if (DOCX_REGEX.test(filename)) {
        file.content = await DOCXTryParse(filename, options)
    } else if (XLSX_REGEX.test(filename)) {
        const bytes = await host.readFile(filename)
        const sheets = await XLSXParse(bytes)
        file.content = JSON.stringify(sheets, null, 2)
    } else {
        const mime = lookupMime(filename)
        const isBinary = isBinaryMimeType(mime)
        if (!isBinary) file.content = await readText(filename)
    }

    return file
}

export function toWorkspaceFile(fileOrFilename: string | WorkspaceFile) {
    return typeof fileOrFilename === "string"
        ? { filename: fileOrFilename }
        : fileOrFilename
}

export async function resolveFileContents(files: WorkspaceFile[]) {
    for (const file of files) {
        await resolveFileContent(file)
    }
}

export async function renderFileContent(
    file: WorkspaceFile,
    options: TraceOptions & DataFilter
) {
    const { filename, content } = file
    if (content && CSV_REGEX.test(filename)) {
        let csv = CSVTryParse(content, options)
        if (csv) {
            csv = tidyData(csv, options)
            return { filename, content: CSVToMarkdown(csv, options) }
        }
    } else if (content && XLSX_REGEX.test(filename)) {
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

export async function resolveFileDataUri(
    filename: string,
    options?: TraceOptions
) {
    let bytes: Uint8Array
    if (/^https?:\/\//i.test(filename)) {
        const fetch = await createFetch(options)
        const resp = await fetch(filename)
        const buffer = await resp.arrayBuffer()
        bytes = new Uint8Array(buffer)
    } else {
        bytes = new Uint8Array(await host.readFile(filename))
    }
    const mime = (await fileTypeFromBuffer(bytes))?.mime
    if (!mime) return undefined
    const b64 = toBase64(bytes)
    return `data:${mime};base64,${b64}`
}
