import { DOCXTryParse } from "./docx"
import { PDFPagesToString, PDFTryParse } from "./pdf"

export async function resolveFileContent(file: LinkedFile) {
    const { filename } = file

    if (!file.content && /\.pdf$/i.test(filename)) {
        const pages = await PDFTryParse(filename)
        file.content = PDFPagesToString(pages)
    } else if (!file.content && /\.docx$/i.test(filename)) {
        file.content = await DOCXTryParse(filename)
    }
}