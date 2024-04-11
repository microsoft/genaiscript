import { CSVTryParse } from "./csv"
import { filenameOrFileToContent } from "./fs"
import { JSON5TryParse } from "./json5"
import { estimateTokens } from "./tokens"
import { TOMLTryParse } from "./toml"
import { MarkdownTrace } from "./trace"
import { YAMLTryParse } from "./yaml"
import { DOCXTryParse } from "./docx"
import { frontmatterTryParse } from "./frontmatter"
import { extractFenced } from "./template"
import { parseAnnotations } from "./annotations"
import { dotEnvTryParse } from "./dotenv"
import { INITryParse } from "./ini"
import { XMLTryParse } from "./xml"
import { treeSitterQuery } from "./treesitter"
import { parsePdf } from "./pdf"

export function createParsers(options: {
    trace: MarkdownTrace
    model: string
}): Parsers {
    const { trace, model } = options
    return Object.freeze<Parsers>({
        JSON5: (text, options) =>
            JSON5TryParse(filenameOrFileToContent(text), options?.defaultValue),
        YAML: (text, options) =>
            YAMLTryParse(filenameOrFileToContent(text), options?.defaultValue),
        XML: (text, options) => {
            const { defaultValue, ...rest } = options || {}
            return XMLTryParse(
                filenameOrFileToContent(text),
                defaultValue,
                rest
            )
        },
        TOML: (text, options) =>
            TOMLTryParse(filenameOrFileToContent(text), options),
        frontmatter: (text, options) =>
            frontmatterTryParse(filenameOrFileToContent(text), options),
        CSV: (text, options) =>
            CSVTryParse(filenameOrFileToContent(text), options),
        dotEnv: (text) => dotEnvTryParse(filenameOrFileToContent(text)),
        INI: (text, options) =>
            INITryParse(filenameOrFileToContent(text), options?.defaultValue),
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
            const filename = typeof file === "string" ? file : file.filename
            const { pages, content } = await parsePdf(filename, options) || {}
            return {
                file: pages
                    ? <LinkedFile>{
                        filename,
                        content
                    }
                    : undefined,
                pages,
            }
        },
        code: async (file, query) => await treeSitterQuery(file, query, { trace }),
    })
}
