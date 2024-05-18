import { read, utils } from "xlsx"
import { logInfo } from "./util"

export function XLSXParse(
    data: Uint8Array,
    options?: ParseXLSXOptions
): WorkbookSheet[] {
    const { sheet, ...rest } = options || {}
    const workbook = read(data, { type: "array" })
    return workbook.SheetNames.filter((n) => !sheet || n === sheet).map(
        (name) => {
            const worksheet = workbook.Sheets[name]
            const rows = utils.sheet_to_json(worksheet, rest) as object[]
            return <WorkbookSheet>{ name, rows }
        }
    )
}

export function XLSXTryParse(
    data: Uint8Array,
    options?: ParseXLSXOptions
): WorkbookSheet[] {
    try {
        return XLSXParse(data, options)
    } catch (e) {
        logInfo(e)
        return []
    }
}
