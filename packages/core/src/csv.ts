import { parse } from "csv-parse/sync"
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
): object[] | undefined {
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
    const res: string[] = [
        `|${headers.join("|")}|`,
        `|${headers.map(() => "---").join("|")}|`,
        ...csv.map(
            (row) =>
                `|${headers
                    .map((key) => {
                        const v = (row as any)[key]
                        const s = v === undefined || v === null ? "" : "" + v
                        return s
                            .replace(/\s+$/, "")
                            .replace(/[\\`*_{}[\]()#+\-.!]/g, (m) => "\\" + m)
                            .replace(/</g, "lt;")
                            .replace(/>/g, "gt;")
                            .replace(/\r?\n/g, "<br>")
                    })
                    .join("|")}|`
        ),
    ]
    return res.join("\n")
}
