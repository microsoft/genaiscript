import { DOCXTryParse } from "./docx"
import { readText } from "./fs"
import { lookupMime } from "./mime"
import { isBinaryMimeType } from "./parser"
import { PDFPagesToString, PDFTryParse } from "./pdf"

export async function resolveFileContent(file: LinkedFile) {
    const { filename } = file

    if (!file.content && /\.pdf$/i.test(filename)) {
        const pages = await PDFTryParse(filename)
        file.content = PDFPagesToString(pages)
    } else if (!file.content && /\.docx$/i.test(filename)) {
        file.content = await DOCXTryParse(filename)
    } else {
        const mime = lookupMime(filename)
        const binary = isBinaryMimeType(mime)
        file.content = binary ? undefined : await readText(filename)
    }
}
