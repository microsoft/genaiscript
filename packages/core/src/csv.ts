import { parse } from "csv-parse/sync"
import { markdownTable } from "markdown-table"
import { TraceOptions } from "./trace"

export function CSVParse(
    text: string,
    options?: {
        delimiter?: string
        headers?: string[]
    }
): object[] {
    const { delimiter, headers } = options || {}
    return parse(text, {
        autoParse: true,
        castDate: false,
        comment: "#",
        columns: headers || true,
        skipEmptyLines: true,
        skipRecordsWithError: true,
        delimiter,
    })
}

export function CSVTryParse(
    text: string,
    options?: {
        delimiter?: string
        headers?: string[]
    } & TraceOptions
): object[] {
    const { trace } = options || {}
    try {
        return CSVParse(text, options)
    } catch (e) {
        trace?.error("reading csv", e)
        return undefined
    }
}

export function CSVToMarkdown(csv: object[], options?: { headers?: string[] }) {
    if (!csv?.length) return ""

    const { headers = Object.keys(csv[0]) } = options || {}
    const table: string[][] = [
        headers,
        ...csv.map((row) =>
            headers.map((v) => {
                const rv = (row as any)[v]
                return rv === undefined ? "" : "" + rv
            })
        ),
    ]
    const md = markdownTable(table, {
        align: "left",
        stringLength: (str) => str.length,
    })
    // improves LLM performance
    const mdcompact = md.replace(/[\t ]+/g, " ")
    return mdcompact
}
