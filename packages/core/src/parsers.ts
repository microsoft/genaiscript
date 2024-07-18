import { CSVTryParse } from "./csv"
import { filenameOrFileToContent } from "./fs"
import { JSON5TryParse } from "./json5"
import { estimateTokens } from "./tokens"
import { TOMLTryParse } from "./toml"
import { MarkdownTrace } from "./trace"
import { YAMLTryParse } from "./yaml"
import { DOCXTryParse } from "./docx"
import { frontmatterTryParse } from "./frontmatter"
import { extractFenced } from "./fence"
import { parseAnnotations } from "./annotations"
import { dotEnvTryParse } from "./dotenv"
import { INITryParse } from "./ini"
import { XMLTryParse } from "./xml"
import { treeSitterQuery } from "./treesitter"
import { parsePdf } from "./pdf"
import { HTMLToText } from "./html"
import { MathTryEvaluate } from "./math"
import { validateJSONWithSchema } from "./schema"
import { XLSXTryParse } from "./xlsx"
import { host } from "./host"
import { unzip } from "./zip"
import { JSONLTryParse } from "./jsonl"
import { resolveFileContent } from "./file"

export function createParsers(options: {
    trace: MarkdownTrace
    model: string
}): Parsers {
    const { trace, model } = options
    return Object.freeze<Parsers>({
        JSON5: (text, options) =>
            JSON5TryParse(filenameOrFileToContent(text), options?.defaultValue),
        JSONL: (text) => JSONLTryParse(filenameOrFileToContent(text)),
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
            frontmatterTryParse(filenameOrFileToContent(text), options)?.value,
        CSV: (text, options) =>
            CSVTryParse(filenameOrFileToContent(text), options),
        XLSX: async (file, options) =>
            await XLSXTryParse(await host.readFile(file?.filename), options),
        dotEnv: (text) => dotEnvTryParse(filenameOrFileToContent(text)),
        INI: (text, options) =>
            INITryParse(filenameOrFileToContent(text), options?.defaultValue),
        unzip: async (file, options) =>
            await unzip(await host.readFile(file.filename), options),
        tokens: (text) => estimateTokens(filenameOrFileToContent(text), { model}),
        fences: (text) => extractFenced(filenameOrFileToContent(text)),
        annotations: (text) => parseAnnotations(filenameOrFileToContent(text)),
        HTMLToText: (text, options) =>
            HTMLToText(filenameOrFileToContent(text), {
                ...(options || {}),
                trace,
            }),
        DOCX: async (file) => {
            const filename = typeof file === "string" ? file : file.filename
            const res = await DOCXTryParse(filenameOrFileToContent(file))
            return {
                file: res
                    ? <WorkspaceFile>{ filename, content: res }
                    : undefined,
            }
        },
        PDF: async (file, options) => {
            if (!file) return { file: undefined, pages: [] }
            const opts = {
                ...(options || {}),
                trace,
            }
            const filename = typeof file === "string" ? file : file.filename
            const { pages, content } = (await parsePdf(filename, opts)) || {}
            return {
                file: pages
                    ? <WorkspaceFile>{
                          filename,
                          content,
                      }
                    : undefined,
                pages,
            }
        },
        code: async (file, query) => {
            await resolveFileContent(file, { trace })
            return await treeSitterQuery(file, query, { trace })
        },
        math: (expression) => MathTryEvaluate(expression, { trace }),
        validateJSON: (schema, content) =>
            validateJSONWithSchema(content, schema, { trace }),
    })
}
