import { DOCUMENT } from "yaml/dist/parse/cst"
import { extractFenced, parseAnnotations } from "."
import { CSVTryParse } from "./csv"
import { filenameOrFileToContent } from "./fs"
import { JSON5TryParse } from "./json5"
import { PDFPagesToString, PDFTryParse } from "./pdf"
import { estimateTokens } from "./tokens"
import { TOMLTryParse } from "./toml"
import { MarkdownTrace } from "./trace"
import { YAMLTryParse } from "./yaml"
import { DOCXTryParse } from "./docx"

export function createParsers(options: {
    trace: MarkdownTrace
    model: string
}): Parsers {
    const { trace, model } = options
    return {
        JSON5: (text, defaultValue) => JSON5TryParse(filenameOrFileToContent(text)) ?? defaultValue,
        YAML: (text, defaultValue) => YAMLTryParse(filenameOrFileToContent(text)) ?? defaultValue,
        TOML: (text, defaultValue) => TOMLTryParse(filenameOrFileToContent(text)) ?? defaultValue,
        CSV: (text, options) =>
            CSVTryParse(filenameOrFileToContent(text), options),
        tokens: (text) => estimateTokens(model, filenameOrFileToContent(text)),
        fences: (text) => extractFenced(filenameOrFileToContent(text)),
        annotations: (text) => parseAnnotations(filenameOrFileToContent(text)),
        DOCX: async (file) => {
            const filename = typeof file === "string" ? file : file.filename
            const res = await DOCXTryParse(filenameOrFileToContent(file))
            return {
                file: res ? <LinkedFile>{ filename, content: res } : undefined,
            }
        },
        PDF: async (file, options) => {
            if (!file) return { file: undefined, pages: [] }
            const { filter = () => true } = options || {}
            const filename = typeof file === "string" ? file : file.filename
            const pages = (
                await PDFTryParse(filename, undefined, { trace })
            )?.filter((text, index) => filter(index, text))
            return {
                file: pages
                    ? <LinkedFile>{
                          filename,
                          content: PDFPagesToString(pages),
                      }
                    : undefined,
                pages,
            }
        },
    }
}
