import { CSVTryParse } from "./csv"
import {
    filenameOrFileToContent,
    filenameOrFileToFilename,
    unfence,
} from "./unwrappers"
import { JSON5TryParse, JSONLLMTryParse } from "./json5"
import { estimateTokens } from "./tokens"
import { TOMLTryParse } from "./toml"
import { TraceOptions } from "./trace"
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
import { CancellationOptions } from "./cancellation"
import { dedent } from "./indent"
import { vttSrtParse } from "./transcription"
import { encodeIDs } from "./cleaners"

/**
 * Asynchronously creates a set of parsers for handling various file formats, data operations, 
 * and transformations.
 *
 * @param options - Configuration options for parser creation.
 *   - model: Specifies the language model to use for token encoding.
 *   - trace: Optional tracing options for logging or debugging.
 *   - cancellationToken: Optional cancellation token to abort operations.
 *
 * @returns An object containing various parser methods:
 *   - JSON5: Parses JSON5 content with an optional default value.
 *   - JSONLLM: Parses JSON extracted for LLM-specific workflows.
 *   - JSONL: Parses JSONL (JSON Lines) content.
 *   - YAML: Parses YAML content with an optional default value.
 *   - XML: Parses XML content with an optional default value and additional options.
 *   - TOML: Parses TOML content.
 *   - frontmatter: Extracts frontmatter content from text.
 *   - CSV: Parses CSV content with optional parsing options.
 *   - XLSX: Parses Excel files asynchronously with optional parsing options.
 *   - dotEnv: Parses .env files.
 *   - INI: Parses INI configuration content with an optional default value.
 *   - transcription: Parses VTT/SRT transcription files.
 *   - unzip: Extracts contents of a ZIP file asynchronously.
 *   - tokens: Estimates token usage for provided content using specified encoders.
 *   - fences: Extracts fenced code blocks from content.
 *   - annotations: Parses annotated text data.
 *   - HTMLToText: Converts HTML content to plain text with optional configurations.
 *   - HTMLToMarkdown: Converts HTML content to Markdown with optional configurations.
 *   - DOCX: Parses DOCX files asynchronously.
 *   - PDF: Parses PDF files asynchronously, extracting pages, images, and file content.
 *   - code: Queries code syntax trees with Tree-sitter using a query string.
 *   - math: Evaluates mathematical expressions with a given scope.
 *   - validateJSON: Validates JSON content against a schema.
 *   - mustache: Renders Mustache templates with provided arguments.
 *   - jinja: Renders Jinja templates with provided data.
 *   - diff: Computes a diff between two inputs and formats it.
 *   - tidyData: Cleans and processes data rows with optional configurations.
 *   - hash: Computes cryptographic hashes for the given input.
 *   - unfence: Removes fencing around content.
 *   - GROQ: Evaluates GROQ (Graph-Relational Object Queries).
 *   - unthink: Performs a reverse-thinking operation on data.
 *   - dedent: Dedents indented text content.
 *   - encodeIDs: Encodes identifiers for use in various operations.
 */
export async function createParsers(
    options: {
        model: string
    } & TraceOptions &
        CancellationOptions
): Promise<Parsers> {
    const { trace, model, cancellationToken } = options
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
            await XLSXTryParse(
                await host.readFile(filenameOrFileToFilename(file)),
                options
            ),
        dotEnv: (text) => dotEnvTryParse(filenameOrFileToContent(text)),
        INI: (text, options) =>
            INITryParse(filenameOrFileToContent(text), options?.defaultValue),
        transcription: (text) => vttSrtParse(filenameOrFileToContent(text)),
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
        DOCX: async (file, options) => await DOCXTryParse(file, options),
        PDF: async (file, options) => {
            if (!file) return { file: undefined, pages: [], data: [] }
            const opts = {
                ...(options || {}),
                trace,
                cancellationToken,
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
        dedent: dedent,
        encodeIDs: encodeIDs,
    })
}
