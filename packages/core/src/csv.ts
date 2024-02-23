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
    const table: string[][] = [
        headers || Object.keys(csv[0]),
        ...csv.map((row) => Object.values(row).map((v) => "" + v)),
    ]
    return markdownTable(table, {
        align: "left",
        stringLength: (str) => str.length,
    })
}
