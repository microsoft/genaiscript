import replaceExt from "replace-ext"
import { readFile, writeFile } from "node:fs/promises"
import { DOCXTryParse } from "../../core/src/docx"
import { extractFenced } from "../../core/src/fence"
import {
    expandFiles,
    writeText,
    readText,
    tryReadText,
} from "../../core/src/fs"
import { HTMLToMarkdown, HTMLToText } from "../../core/src/html"
import { isJSONLFilename, JSONLTryParse } from "../../core/src/jsonl"
import { parsePdf } from "../../core/src/pdf"
import { estimateTokens } from "../../core/src/tokens"
import { YAMLStringify } from "../../core/src/yaml"
import { resolveTokenEncoder } from "../../core/src/encoders"
import { MD_REGEX, PROMPTY_REGEX } from "../../core/src/constants"
import { promptyParse, promptyToGenAIScript } from "../../core/src/prompty"
import { basename, join } from "node:path"
import { CSVStringify, dataToMarkdownTable } from "../../core/src/csv"
import { INIStringify } from "../../core/src/ini"
import { JSON5Stringify } from "../../core/src/json5"
import { jinjaRender } from "../../core/src/jinja"
import { splitMarkdown } from "../../core/src/frontmatter"
import { parseOptionsVars } from "./vars"
import { dataTryParse } from "../../core/src/data"
import { resolveFileContent } from "../../core/src/file"
import { redactSecrets } from "../../core/src/secretscanner"
import { ellipse, logVerbose } from "../../core/src/util"
import { chunkMarkdown } from "../../core/src/mdchunk"
import { normalizeInt } from "../../core/src/cleaners"
import { prettyBytes } from "../../core/src/pretty"
import { terminalSize } from "../../core/src/terminal"

/**
 * This module provides various parsing utilities for different file types such
 * as PDF, DOCX, HTML, JSONL, and more. It includes functions to extract and
 * convert data, estimate tokens, and transform file formats.
 */

/**
 * Extracts and logs fenced code blocks of a specific language from a file.
 * @param language - The language to filter the fenced blocks by.
 * @param file - The file to parse.
 */
export async function parseFence(language: string, file: string) {
    const res = await resolveFileContent({ filename: file })
    const fences = extractFenced(res.content || "").filter(
        (f) => f.language === language
    )
    // Logs the content of the filtered fenced blocks
    console.log(fences.map((f) => f.content).join("\n\n"))
}

/**
 * Parses the contents of a PDF file and outputs them in text format. 
 * Optionally writes the content and page images to the specified output directory.
 * @param file - The PDF file to parse.
 * @param options - Options to include images and specify the output directory.
 */
export async function parsePDF(
    file: string,
    options: { images: boolean; out: string }
) {
    const { images, out } = options
    const { content, pages } = await parsePdf(file, { renderAsImage: images })
    if (out) {
        const fn = basename(file)
        console.log(`writing ${join(out, fn + ".txt")}`)
        await writeText(join(out, fn + ".txt"), content || "")
        for (const page of pages) {
            if (page.image) {
                const n = join(out, fn + ".page" + page.index + ".png")
                console.log(`writing ${n}`)
                await writeFile(n, page.image)
            }
        }
    } else {
        console.log(content || "")
    }
}

/**
 * Parses the contents of a DOCX file and logs the extracted text.
 * If an error occurs during parsing, it logs the error.
 * @param file - The DOCX file to parse.
 * @param options - Options for parsing the DOCX file.
 */
export async function parseDOCX(file: string, options: DocxParseOptions) {
    // Uses DOCXTryParse to extract text from the DOCX file
    const res = await DOCXTryParse(file, options)
    if (res.error) console.error(res.error)
    else console.log(res.file.content)
}

/**
 * Converts HTML content to text and logs it or writes it to a file.
 * @param fileOrUrl - The HTML file or URL to convert.
 * @param options - Options to specify the output format and file.
 */
export async function parseHTMLToText(
    fileOrUrl: string,
    options: { format?: "markdown" | "text"; out?: string }
) {
    const { format = "markdown", out } = options || {}
    const file: WorkspaceFile = { filename: fileOrUrl }
    await resolveFileContent(file)
    // Converts HTML to plain text
    let text: string
    if (format === "markdown") text = await HTMLToMarkdown(file.content)
    else text = await HTMLToText(file.content)

    if (out) {
        logVerbose(`writing ${out}`)
        await writeText(out, text)
    } else console.log(text)
}

/**
 * Parses a Jinja2 file, substitutes variables, and logs the rendered output.
 * 
 * @param file - The path to the Jinja2 template file to parse.
 * @param options - An object containing the following properties:
 *   - vars: An array of key-value pairs in the format "key=value" to replace variables in the template.
 * 
 * The function reads the template file, processes it based on its type (Prompty or Markdown),
 * substitutes the provided variables, and renders the output. Variable values are converted
 * to numbers if possible.
 */
export async function parseJinja2(
    file: string,
    options: {
        vars: string[]
    }
) {
    let src = await readFile(file, { encoding: "utf-8" })
    if (PROMPTY_REGEX.test(file)) src = promptyParse(file, src).content
    else if (MD_REGEX.test(file)) src = splitMarkdown(src).content

    const vars: Record<string, any> = parseOptionsVars(
        options.vars,
        process.env
    )
    for (const k in vars) {
        const i = parseFloat(vars[k])
        if (!isNaN(i)) vars[k] = i
    }
    const res: string = jinjaRender(src, vars)
    console.log(res)
}

/**
 * Parses the input file and converts its data into a specified format.
 * 
 * @param file - Path to the file to be read and parsed.
 * @param options - Configuration options for the output format.
 * @param options.format - The target format for the output. Supported formats include:
 *   - "yaml": Converts data to YAML format.
 *   - "ini": Converts data to INI format.
 *   - "csv": Converts data into a CSV format.
 *   - "md" or "markdown": Converts data into a Markdown table.
 *   - "json5": Converts data into JSON5 format.
 *   - Default: Outputs data as a prettified JSON string.
 * 
 * Logs the converted data to the console.
 * Throws an error if the data format cannot be determined.
 */
export async function parseAnyToJSON(
    file: string,
    options: { format: string }
) {
    const data = await dataTryParse({ filename: file })
    if (!data) throw new Error(`Unknown data format for ${file}`)
    let out: string
    switch (options?.format?.toLowerCase() || "") {
        case "yaml":
            out = YAMLStringify(data)
            break
        case "ini":
            out = INIStringify(data)
            break
        case "csv":
            out = CSVStringify(data, { header: true })
            break
        case "md":
        case "markdown":
            out = dataToMarkdownTable(data)
            break
        case "json5":
            out = JSON5Stringify(data, null, 2)
            break
        default:
            out = JSON.stringify(data, null, 2)
            break
    }

    console.log(out)
}

/**
 * Converts JSONL files to JSON files.
 * Processes an array of files or glob patterns, skipping non-JSONL files,
 * and writes the converted JSON content to new files with a ".json" extension.
 * @param files - An array of files or glob patterns to process.
 */
export async function jsonl2json(files: string[]) {
    for (const file of await expandFiles(files, { applyGitIgnore: false })) {
        if (!isJSONLFilename(file)) {
            // Skips files that are not JSONL
            console.log(`skipping ${file}`)
            continue
        }
        const content = await tryReadText(file)
        const objs = await JSONLTryParse(content, { repair: true })
        const out: string = replaceExt(file, ".json")
        await writeText(out, JSON.stringify(objs, null, 2))
        console.log(`${file} -> ${out}`)
    }
}

/**
 * Estimates the number of tokens in the content of files and logs the results.
 * @param filesGlobs - An array of files or glob patterns to process.
 * @param options - Options for excluding files, specifying the model, and ignoring .gitignore.
 */
export async function parseTokens(
    filesGlobs: string[],
    options: {
        excludedFiles: string[]
        model: string
        ignoreGitIgnore: boolean
    }
) {
    const { model } = options || {}
    const { encode: encoder } = await resolveTokenEncoder(model)

    const files = await expandFiles(filesGlobs, options)
    console.log(`parsing ${files.length} files`)
    let text = ""
    for (const file of files) {
        const content = await readText(file)
        if (content) {
            const tokens = estimateTokens(content, encoder)
            console.log(`${file}, ${tokens}`)
            text += `${file}, ${tokens}\n`
        }
    }
    // Logs the aggregated text with file names and token estimates
    console.log(text)
}

/**
 * Converts "prompty" format files to GenAI script files.
 * @param files - An array of files to process.
 * @param options - Options specifying the output directory.
 * Logs the conversion process and writes the output files to the specified directory.
 */
export async function prompty2genaiscript(
    files: string[],
    options: { out: string }
) {
    const { out } = options
    const fs = await expandFiles(files)
    for (const f of fs) {
        const gf = out
            ? join(out, replaceExt(basename(f), ".genai.mts"))
            : replaceExt(f, ".genai.mts")
        console.log(`${f} -> ${gf}`)
        const content = await readText(f)
        const doc = promptyParse(f, content)
        const script: string = promptyToGenAIScript(doc)
        await writeText(gf, script)
    }
}

/**
 * Scans a list of files for sensitive information or secrets.
 * Logs each file containing secrets and the types of secrets found.
 * Issues a warning if secrets are found in any files.
 *
 * @param files - A list of file paths or glob patterns to scan.
 */
export async function parseSecrets(files: string[]) {
    const fs = await expandFiles(files)
    let n = 0
    for (const f of fs) {
        const content = await readText(f)
        const { found } = redactSecrets(content)
        const entries = Object.entries(found)
        if (entries.length) {
            n++
            console.log(
                `${f}: ${entries.map(([k, v]) => `${k} (${v})`).join(", ")}`
            )
        }
    }
    if (n > 0) console.warn(`found secrets in ${n} of ${fs.length} files`)
}

/**
 * Parses a markdown file, breaks it into chunks based on token limits, and logs a preview of each chunk.
 * 
 * @param filename - The name of the markdown file to parse.
 * @param options - Object containing parsing options.
 *   - model - The model name used for token encoding.
 *   - maxTokens - The maximum number of tokens allowed per chunk.
 */
export async function parseMarkdown(
    filename: string,
    options: { model: string; maxTokens: string }
) {
    const maxTokens = normalizeInt(options.maxTokens) || 1024
    const file: WorkspaceFile = { filename }
    await resolveFileContent(file)
    if (file.size) console.debug(`file: ${prettyBytes(file.size)}`)
    const encoding = await resolveTokenEncoder(options?.model, {
        disableFallback: false,
    })
    const res = await chunkMarkdown(
        file,
        (text) => encoding.encode(text).length,
        {
            maxTokens,
        }
    )

    const cols = terminalSize().columns
    for (const { content, filename, lineStart, lineEnd } of res) {
        const prefix = `${basename(filename)} (${lineStart}-${lineEnd}): `
        console.log(
            `${prefix}${ellipse(content.replace(/\n/g, " "), cols - prefix.length)}`
        )
    }
}
