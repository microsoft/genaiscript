import { CSVTryParse } from "./csv"
import {
    filenameOrFileToContent,
    filenameOrFileToFilename,
    unfence,
} from "./unwrappers"
import { JSON5TryParse, JSONLLMTryParse } from "./json5"
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
import { HTMLToMarkdown, HTMLToText } from "./html"
import { MathTryEvaluate } from "./math"
import { validateJSONWithSchema } from "./schema"
import { XLSXTryParse } from "./xlsx"
import { host } from "./host"
import { unzip } from "./zip"
import { JSONLTryParse } from "./jsonl"
import { resolveFileContent } from "./file"
import { resolveTokenEncoder } from "./encoders"
import { mustacheRender } from "./mustache"
import { jinjaRender } from "./jinja"
import { createDiff, llmifyDiff } from "./diff"
import { tidyData } from "./tidy"
import { hash } from "./crypto"
import { GROQEvaluate } from "./groq"
import { unthink } from "./think"

export async function createParsers(options: {
    trace: MarkdownTrace
    model: string
}): Promise<Parsers> {
    const { trace, model } = options
    const { encode: encoder } = await resolveTokenEncoder(model)
    return Object.freeze<Parsers>({
        JSON5: (text, options) =>
            JSON5TryParse(filenameOrFileToContent(text), options?.defaultValue),
        JSONLLM: (text) => JSONLLMTryParse(text),
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
        tokens: (text) =>
            estimateTokens(filenameOrFileToContent(text), encoder),
        fences: (text) => extractFenced(filenameOrFileToContent(text)),
        annotations: (text) => parseAnnotations(filenameOrFileToContent(text)),
        HTMLToText: (text, options) =>
            HTMLToText(filenameOrFileToContent(text), {
                ...(options || {}),
                trace,
            }),
        HTMLToMarkdown: (text, options) =>
            HTMLToMarkdown(filenameOrFileToContent(text), {
                ...(options || {}),
                trace,
            }),
        DOCX: async (file, options) => {
            const filename = typeof file === "string" ? file : file.filename
            const res = await DOCXTryParse(filename, options)
            return {
                file: res
                    ? <WorkspaceFile>{ filename, content: res }
                    : undefined,
            }
        },
        PDF: async (file, options) => {
            if (!file) return { file: undefined, pages: [], data: [] }
            const opts = {
                ...(options || {}),
                trace,
            }
            const filename = typeof file === "string" ? file : file.filename
            const { pages, content } = (await parsePdf(filename, opts)) || {}
            return {
                file: <WorkspaceFile>{
                    filename,
                    content,
                },
                pages: pages?.map((p) => p.content),
                images: pages?.map((p) => p.image),
                data: pages,
            }
        },
        code: async (file, query) => {
            await resolveFileContent(file, { trace })
            return await treeSitterQuery(file, query, { trace })
        },
        math: async (expression, scope) =>
            await MathTryEvaluate(expression, { scope, trace }),
        validateJSON: (schema, content) =>
            validateJSONWithSchema(content, schema, { trace }),
        mustache: (file, args) => {
            const f = filenameOrFileToContent(file)
            return mustacheRender(f, args)
        },
        jinja: (file, data) => {
            const f = filenameOrFileToContent(file)
            return jinjaRender(f, data)
        },
        diff: (f1, f2) => llmifyDiff(createDiff(f1, f2)),
        tidyData: (rows, options) => tidyData(rows, options),
        hash: async (text, options) => await hash(text, options),
        unfence: unfence,
        GROQ: GROQEvaluate,
        unthink: unthink,
    })
}
