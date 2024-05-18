import { read, utils } from "xlsx"
import { logInfo } from "./util"

export function XLSXParseAll(data: Uint8Array): Record<string, object[]> {
    const workbook = read(data, { type: "array" })
    const res: Record<string, object[]> = {}
    return workbook.SheetNames.reduce((acc, sheetName) => {
        const worksheet = workbook.Sheets[sheetName]
        const rows = utils.sheet_to_json(worksheet) as object[]
        acc[sheetName] = rows
        return acc
    }, res)
}

export function XLSXParse(
    data: Uint8Array,
    options?: ParseXLSXOptions
): object[] {
    const { sheet, ...rest } = options || {}
    const workbook = read(data, { type: "array" })
    const sheetName = sheet || workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet) throw new Error(`Sheet not found: ${sheetName}`)

    const res = utils.sheet_to_json(worksheet, rest)
    return res as object[]
}

export function XLSXTryParse(
    data: Uint8Array,
    options?: ParseXLSXOptions
): object[] {
    try {
        return XLSXParse(data, options)
    } catch (e) {
        logInfo(e)
        return []
    }
}
