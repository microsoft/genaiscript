import { parse } from "csv-parse/sync"
import { markdownTable } from "markdown-table"
import { logInfo } from "./util"

export function CSVTryParse(
    text: string,
    options?: {
        delimiter?: string
    }
): object[] {
    try {
        return parse(text, {
            autoParse: true,
            castDate: false,
            comment: "#",
            columns: true,
            skipEmptyLines: true,
            skipRecordsWithError: true,
            ...(options || {}),
        })
    } catch (e) {
        logInfo(e)
        return undefined
    }
}

export function CSVToMarkdown(csv: object[], headers?: string[]) {
    if (!csv?.length) return ""

    headers = headers || Object.keys(csv[0])
    const table: string[][] = [
        headers,
        ...csv.map((row) => headers.map((v) => "" + (row as any)[v])),
    ]
    return markdownTable(table, {
        align: "left",
        stringLength: (str) => str.length,
    })
}
