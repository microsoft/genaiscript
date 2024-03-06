import { CSVToMarkdown, CSVTryParse } from "./csv"
import { addLineNumbers } from "./liner"
import { PDFPagesToString, PDFTryParse } from "./pdf"
import { createTextNode } from "./promptdom"

export function createDefNode(
    name: string,
    file: LinkedFile,
    env: ExpansionVariables,
    options: DefOptions
) {
    name = name ?? ""
    const { language, lineNumbers, schema } = options || {}
    const fence = language === "markdown" ? env.markdownFence : env.fence
    const norm = (s: string, f: string) => {
        s = (s || "").replace(/\n*$/, "")
        if (s && lineNumbers) s = addLineNumbers(s)
        if (s) s += "\n"
        if (f && s.includes(f)) throw new Error("source contains fence")
        return s
    }

    const render = async () => {
        if (!file.content && /\.pdf$/i.test(file.filename)) {
            const pages = await PDFTryParse(file.filename)
            file.content = PDFPagesToString(pages)
        }

        let dfence =
            /\.md$/i.test(file.filename) || file.content?.includes(fence)
                ? env.markdownFence
                : fence
        const dtype = /\.([^\.]+)$/i.exec(file.filename)?.[1] || ""
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
