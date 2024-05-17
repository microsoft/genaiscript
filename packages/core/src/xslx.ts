import { read, utils } from "xlsx"
import { host } from "./host"
import { logInfo } from "./util"

export function XSLXParse(
    filename: string,
    options?: { worksheet?: string }
): object[] {
    const { worksheet } = options || {}
    const bytes = host.readFile(filename)
    const workbook = read(bytes, { type: "array" })
    const sheetName = worksheet || workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) throw new Error(`Sheet not found: ${sheetName}`)

    const res = utils.sheet_to_json(workbook)
    return res as object[]
}

export function XSLXTryParse(
    filename: string,
    options?: { worksheet?: string }
): object[] {
    try {
        return XSLXParse(filename, options)
    } catch (e) {
        logInfo(e)
        return []
    }
}
