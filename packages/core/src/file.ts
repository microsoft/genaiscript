import { DOCXTryParse } from "./docx"
import { readText } from "./fs"
import { lookupMime } from "./mime"
import { isBinaryMimeType } from "./parser"
import { PDFPagesToString, PDFTryParse } from "./pdf"
import { TraceOptions } from "./trace"

export async function resolveFileContent(file: LinkedFile, options?: TraceOptions) {
    const { filename } = file
    if (file.content) return file

    if (/\.pdf$/i.test(filename)) {
        const pages = await PDFTryParse(filename, undefined, options)
        file.content = PDFPagesToString(pages)
    } else if (/\.docx$/i.test(filename)) {
        file.content = await DOCXTryParse(filename, options)
    } else {
        const mime = lookupMime(filename)
        const binary = isBinaryMimeType(mime)
        file.content = binary ? undefined : await readText(filename)
    }

    return file
}
