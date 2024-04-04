import { DOCXTryParse } from "./docx"
import { readText } from "./fs"
import { lookupMime } from "./mime"
import { isBinaryMimeType } from "./parser"
import { PDFPagesToString, PDFTryParse } from "./pdf"
import { createFetch } from "./fetch"
import { fileTypeFromBuffer } from "file-type"
import { toBase64 } from "./util"
import { host } from "./host"
import { MarkdownTrace } from "./trace"

export async function resolveFileContent(file: LinkedFile, options?: { binary?: boolean }) {
    const { filename } = file
    if (file.content) return file

    if (/\.pdf$/i.test(filename)) {
        const pages = await PDFTryParse(filename)
        file.content = PDFPagesToString(pages)
    } else if (/\.docx$/i.test(filename)) {
        file.content = await DOCXTryParse(filename)
    } else {
        const mime = lookupMime(filename)
        const isBinary = isBinaryMimeType(mime)
        if (!isBinary)
            file.content = await readText(filename)
    }
    return file
}

export async function resolveFileDataUri(file: LinkedFile) {
    let bytes: Uint8Array
    if (/^https?:\/\//i.test(file.filename)) {
        const fetch = await createFetch()
        const resp = await fetch(file.filename)
        const buffer = await resp.arrayBuffer()
        bytes = new Uint8Array(buffer)
    } else {
        bytes = new Uint8Array(
            await host.readFile(file.filename)
        )
    }
    const mime = (await fileTypeFromBuffer(bytes))?.mime
    if (!mime)
        return undefined
    const b64 = toBase64(bytes)
    return `data:${mime};base64,${b64}`
}