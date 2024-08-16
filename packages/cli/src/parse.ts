import { createProgressSpinner } from "./spinner"
import replaceExt from "replace-ext"
import { readFile } from "node:fs/promises"
import { DOCXTryParse } from "../../core/src/docx"
import { extractFenced } from "../../core/src/fence"
import { expandFiles, writeText, readText } from "../../core/src/fs"
import { HTMLToText } from "../../core/src/html"
import { isJSONLFilename, readJSONL } from "../../core/src/jsonl"
import { parsePdf } from "../../core/src/pdf"
import { estimateTokens } from "../../core/src/tokens"
import { YAMLStringify } from "../../core/src/yaml"
import { resolveTokenEncoder } from "../../core/src/encoders"

export async function parseFence(language: string, file: string) {
    const res = await parsePdf(file)
    const fences = extractFenced(res.content || "").filter(
        (f) => f.language === language
    )
    console.log(fences.map((f) => f.content).join("\n\n"))
}

export async function parsePDF(file: string) {
    const res = await parsePdf(file)
    const out = YAMLStringify(res)
    console.log(out)
}

export async function parseDOCX(file: string) {
    const text = await DOCXTryParse(file)
    console.log(text)
}

export async function parseHTMLToText(file: string) {
    const html = await readFile(file, { encoding: "utf-8" })
    const text = HTMLToText(html)
    console.log(text)
}

export async function jsonl2json(files: string[]) {
    const spinner = createProgressSpinner(`converting...`)
    for (const file of await expandFiles(files)) {
        spinner.report({ message: file })
        if (!isJSONLFilename(file)) {
            spinner.report({ succeeded: false })
            continue
        }
        const objs = await readJSONL(file)
        const out = replaceExt(file, ".json")
        await writeText(out, JSON.stringify(objs, null, 2))
        spinner.report({ succeeded: true })
    }
    spinner.stop()
}

export async function parseTokens(
    filesGlobs: string[],
    options: { excludedFiles: string[]; model: string }
) {
    const { model = "gpt4" } = options || {}
    const encoder = await resolveTokenEncoder(model)

    const files = await expandFiles(filesGlobs, options?.excludedFiles)
    const progress = createProgressSpinner(`parsing ${files.length} files`)
    let text = ""
    for (const file of files) {
        const content = await readText(file)
        if (content) {
            const tokens = estimateTokens(content, encoder)
            progress.report({
                message: `${file}, ${tokens}`,
            })
            text += `${file}, ${tokens}\n`
        }
    }
    progress.stop()
    console.log(text)
}
