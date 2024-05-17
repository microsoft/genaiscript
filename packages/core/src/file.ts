import { DOCXTryParse } from "./docx"
import { readText } from "./fs"
import { lookupMime } from "./mime"
import { XLSX_MIME_TYPE, isBinaryMimeType } from "./parser"
import { createFetch } from "./fetch"
import { fileTypeFromBuffer } from "file-type"
import { toBase64 } from "./util"
import { host } from "./host"
import { TraceOptions } from "./trace"
import { parsePdf } from "./pdf"

export async function resolveFileContent(
    file: WorkspaceFile,
    options?: TraceOptions
) {
    const { filename } = file
    if (file.content) return file

    if (/\.pdf$/i.test(filename)) {
        const { content } = await parsePdf(filename, options)
        file.content = content
    } else if (/\.docx$/i.test(filename)) {
        file.content = await DOCXTryParse(filename, options)
    } else {
        const mime = lookupMime(filename)
        const isBinary = isBinaryMimeType(mime)
        if (!isBinary) file.content = await readText(filename)
    }
    return file
}

export async function resolveFileDataUri(
    file: WorkspaceFile,
    options?: TraceOptions
) {
    let bytes: Uint8Array
    if (/^https?:\/\//i.test(file.filename)) {
        const fetch = await createFetch(options)
        const resp = await fetch(file.filename)
        const buffer = await resp.arrayBuffer()
        bytes = new Uint8Array(buffer)
    } else {
        bytes = new Uint8Array(await host.readFile(file.filename))
    }
    const mime = (await fileTypeFromBuffer(bytes))?.mime
    if (!mime) return undefined
    const b64 = toBase64(bytes)
    return `data:${mime};base64,${b64}`
}
