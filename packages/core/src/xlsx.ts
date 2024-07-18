import { logInfo } from "./util"

export async function XLSXParse(
    data: Uint8Array,
    options?: ParseXLSXOptions
): Promise<WorkbookSheet[]> {
    const { sheet, ...rest } = options || {}
    const { read, utils } = await import("xlsx")
    const workbook = read(data, { type: "array" })
    return workbook.SheetNames.filter((n) => !sheet || n === sheet).map(
        (name) => {
            const worksheet = workbook.Sheets[name]
            const rows = utils.sheet_to_json(worksheet, rest) as object[]
            return <WorkbookSheet>{ name, rows }
        }
    )
}

export async function XLSXTryParse(
    data: Uint8Array,
    options?: ParseXLSXOptions
): Promise<WorkbookSheet[]> {
    try {
        return await XLSXParse(data, options)
    } catch (e) {
        logInfo(e)
        return []
    }
}
