import { CSVToMarkdown, CSVTryParse } from "./csv"
import { resolveFileContent } from "./file"
import { addLineNumbers } from "./liner"
import { fenceMD } from "./markdown"
import { createTextNode } from "./promptdom"
import { YAMLStringify } from "./yaml"

export function createDefNode(
    name: string,
    file: LinkedFile,
    env: ExpansionVariables,
    options: DefOptions
) {
    name = name ?? ""
    const { language, lineNumbers, schema } = options || {}
    const fence =
        language === "markdown" || language === "mdx"
            ? env.markdownFence
            : env.fence
    const norm = (s: string, f: string) => {
        s = (s || "").replace(/\n*$/, "")
        if (s && lineNumbers) s = addLineNumbers(s)
        if (s) s += "\n"
        if (f && s.includes(f)) throw new Error("source contains fence")
        return s
    }

    const render = async () => {
        await resolveFileContent(file)

        let dfence =
            /\.mdx?$/i.test(file.filename) || file.content?.includes(fence)
                ? env.markdownFence
                : fence
        const dtype = language || /\.([^\.]+)$/i.exec(file.filename)?.[1] || ""
        let body = file.content
        if (/^(c|t)sv$/i.test(dtype)) {
            const parsed = CSVTryParse(file.content)
            if (parsed) {
                body = CSVToMarkdown(parsed)
                dfence = ""
            }
        }
        body = norm(body, dfence)
        const res =
            (name ? name + ":\n" : "") +
            dfence +
            dtype +
            (file.filename ? ` file="${file.filename}"` : "") +
            "\n" +
            body +
            (schema ? ` schema=${schema}` : "") +
            dfence +
            "\n"

        return res
    }

    return createTextNode(render())
}

export function createDefDataNode(
    name: string,
    data: object | object[],
    env: ExpansionVariables,
    options?: DefDataOptions
) {
    if (data === undefined) return undefined

    let { format, headers } = options || {}
    if (!format && headers && Array.isArray(data)) format = "csv"
    else if (!format) format = "yaml"

    let text: string
    let lang: string
    if (Array.isArray(data) && format === "csv") {
        text = CSVToMarkdown(data, { headers })
    } else if (format === "json") {
        text = JSON.stringify(data)
        lang = "json"
    } else {
        text = YAMLStringify(data)
        lang = "yaml"
    }

    return createTextNode(`${name}:
${lang ? fenceMD(text, lang) : text}`)
}
