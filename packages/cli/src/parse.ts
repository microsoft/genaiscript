import {
    DOCXTryParse,
    YAMLStringify,
    expandFiles,
    extractFenced,
    isJSONLFilename,
    readJSONL,
    writeText,
    parsePdf,
} from "genaiscript-core"
import { createProgressSpinner } from "./spinner"
import replaceExt from "replace-ext"
import getStdin from "get-stdin"

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
}
