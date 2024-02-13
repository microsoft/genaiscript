import "pdfjs-dist"
import { readPdfPages } from "pdf-text-reader"

declare global {
    export type SVGGraphics = any;
}

export async function PDFTryParse(fileOrUrl: string): Promise<string[]> {
    try {
        const url = /^https?:\/\//.test(fileOrUrl) ? fileOrUrl : undefined
        const filePath = url ? undefined : fileOrUrl
        const pages = /^https?:\/\//.test(fileOrUrl)
            ? await readPdfPages({ url })
            : await readPdfPages({ filePath })
        const res = pages?.map(({ lines }) => lines.join("\n"))
        return res
    } catch (error) {
        console.error(error)
        return undefined
    }
}
