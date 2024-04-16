import { CSVToMarkdown, CSVTryParse } from "./csv"
import { resolveFileContent } from "./file"
import { addLineNumbers } from "./liner"
import { fenceMD } from "./markdown"
import { createTextNode } from "./promptdom"
import { TraceOptions } from "./trace"
import { YAMLStringify } from "./yaml"

export function createDefNode(
    name: string,
    file: LinkedFile,
    env: ExpansionVariables,
    options: DefOptions & TraceOptions
) {
    name = name ?? ""
    const { language, lineNumbers, schema, priority, maxTokens } = options || {}
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
        await resolveFileContent(file, options)

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

    const value = render()
    return createTextNode(value, { priority, maxTokens })
}

export function createDefDataNode(
    name: string,
    data: object | object[],
    env: ExpansionVariables,
    options?: DefDataOptions
) {
    if (data === undefined) return undefined

    let { format, headers, priority, maxTokens } = options || {}
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

    const value = `${name}:
    ${lang ? fenceMD(text, lang) : text}`
    return createTextNode(value, { priority, maxTokens })
}
