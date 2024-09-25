import replaceExt from "replace-ext"
import { readFile } from "node:fs/promises"
import { DOCXTryParse } from "../../core/src/docx"
import { extractFenced } from "../../core/src/fence"
import {
    expandFiles,
    writeText,
    readText,
    tryReadText,
} from "../../core/src/fs"
import { HTMLToText } from "../../core/src/html"
import { isJSONLFilename, JSONLTryParse } from "../../core/src/jsonl"
import { parsePdf } from "../../core/src/pdf"
import { estimateTokens } from "../../core/src/tokens"
import { YAMLStringify } from "../../core/src/yaml"
import { resolveTokenEncoder } from "../../core/src/encoders"
import { DEFAULT_MODEL } from "../../core/src/constants"
import { promptyParse, promptyToGenAIScript } from "../../core/src/prompty"
import { basename, join } from "node:path"
import { JSONLLMTryParse } from "../../core/src/json5"

/**
 * This module provides various parsing utilities for different file types such
 * as PDF, DOCX, HTML, JSONL, and more. It includes functions to extract and
 * convert data, estimate tokens, and transform file formats.
 */

/**
 * Parses fenced code blocks of a specific language from a PDF file.
 * @param language - The language to filter the fenced blocks by.
 * @param file - The PDF file to parse.
 */
export async function parseFence(language: string, file: string) {
    const res = await parsePdf(file)
    const fences = extractFenced(res.content || "").filter(
        (f) => f.language === language
    )
    // Logs the content of the filtered fenced blocks
    console.log(fences.map((f) => f.content).join("\n\n"))
}

/**
 * Parses the contents of a PDF file and outputs them in YAML format.
 * @param file - The PDF file to parse.
 */
export async function parsePDF(file: string) {
    const res = await parsePdf(file)
    const out = YAMLStringify(res)
    // Logs the parsed content in YAML format
    console.log(out)
}

/**
 * Parses the contents of a DOCX file and logs the text.
 * @param file - The DOCX file to parse.
 */
export async function parseDOCX(file: string) {
    // Uses DOCXTryParse to extract text from the DOCX file
    const text = await DOCXTryParse(file)
    console.log(text)
}

/**
 * Converts HTML content to text and logs it.
 * @param file - The HTML file to convert.
 */
export async function parseHTMLToText(file: string) {
    const html = await readFile(file, { encoding: "utf-8" })
    // Converts HTML to plain text
    const text = HTMLToText(html)
    console.log(text)
}

/**
 * Converts JSONL files to JSON files.
 * @param files - An array of files or glob patterns to process.
 */
export async function jsonl2json(files: string[]) {
    for (const file of await expandFiles(files)) {
        if (!isJSONLFilename(file)) {
            // Skips files that are not JSONL
            console.log(`skipping ${file}`)
            continue
        }
        const content = await tryReadText(file)
        const objs = await JSONLTryParse(content, { repair: true })
        const out = replaceExt(file, ".json")
        await writeText(out, JSON.stringify(objs, null, 2))
        console.log(`${file} -> ${out}`)
    }
}

/**
 * Estimates tokens from files and logs them.
 * @param filesGlobs - An array of files or glob patterns to process.
 * @param options - Options for excluding files and specifying the model.
 */
export async function parseTokens(
    filesGlobs: string[],
    options: { excludedFiles: string[]; model: string }
) {
    const { model = DEFAULT_MODEL } = options || {}
    const encoder = await resolveTokenEncoder(model)

    const files = await expandFiles(filesGlobs, options?.excludedFiles)
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
        const doc = promptyParse(content)
        const script = promptyToGenAIScript(doc)
        await writeText(gf, script)
    }
}
