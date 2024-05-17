import { read, utils } from "xlsx"
import { host } from "./host"
import { logInfo } from "./util"

export interface XSLXParseOptions {
    // specific worksheet name
    worksheet?: string
    // Use specified range (A1-style bounded range string)
    range?: string
}

export function XSLXParse(
    data: Uint8Array,
    options?: XSLXParseOptions
): object[] {
    const { worksheet, ...rest } = options || {}
    const workbook = read(data, { type: "array" })
    const sheetName = worksheet || workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) throw new Error(`Sheet not found: ${sheetName}`)

    const res = utils.sheet_to_json(sheet, rest)
    return res as object[]
}

export function XSLXTryParse(
    data: Uint8Array,
    options?: XSLXParseOptions
): object[] {
    try {
        return XSLXParse(data, options)
    } catch (e) {
        logInfo(e)
        return []
    }
}
