import {
    DOCXTryParse,
    YAMLStringify,
    expandFiles,
    extractFenced,
    isJSONLFilename,
    readJSONL,
    writeText,
    parsePdf,
    HTMLToText,
    estimateTokens,
    readText,
} from "genaiscript-core"
import { createProgressSpinner } from "./spinner"
import replaceExt from "replace-ext"
import getStdin from "get-stdin"
import { readFile } from "node:fs/promises"

export async function parseFence(language: string) {
    const stdin = await getStdin()
    const fences = extractFenced(stdin || "").filter(
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
    const html = file
        ? await readFile(file, { encoding: "utf-8" })
        : await getStdin()
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

    const files = await expandFiles(filesGlobs, options?.excludedFiles)
    const progress = createProgressSpinner(`parsing ${files.length} files`)
    let text = ""
    for (const file of files) {
        const content = await readText(file)
        if (content) {
            const tokens = estimateTokens(model, content)
            progress.report({
                message: `${file}, ${tokens}`,
            })
            text += `${file}, ${tokens}\n`
        }
    }
    progress.stop()
    console.log(text)
}
