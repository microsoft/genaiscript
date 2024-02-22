import { parse } from "csv-parse"
import { logInfo } from "./util"

export function CSVTryParse(
    text: string,
    options?: {
        delimiter?: string
    }
) {
    return new Promise<object[][]>((resolve, reject) => {
        parse(
            text,
            {
                autoParse: true,
                castDate: false,
                comment: "#",
                columns: true,
                skipEmptyLines: true,
                skipRecordsWithError: true,
                ...(options || {}),
            },
            (err, records) => {
                if (err) {
                    logInfo(err.message)
                    resolve(undefined)
                } else {
                    resolve(records)
                }
            }
        )
    })
}
