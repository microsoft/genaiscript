import { DOCXTryParse } from "./docx"
import { readText } from "./fs"
import { lookupMime } from "./mime"
import { isBinaryMimeType } from "./parser"
import { parsePdf } from "./pdf"

export async function resolveFileContent(file: LinkedFile) {
    const { filename } = file
    if (file.content) return file

    if (/\.pdf$/i.test(filename)) {
        const { content } = await parsePdf(filename)
        file.content = content
    } else if (/\.docx$/i.test(filename)) {
        file.content = await DOCXTryParse(filename)
    } else {
        const mime = lookupMime(filename)
        const binary = isBinaryMimeType(mime)
        file.content = binary ? undefined : await readText(filename)
    }

    return file
}
