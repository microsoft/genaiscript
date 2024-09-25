// Import the logInfo function for logging purposes
import { logInfo } from "./util"

/**
 * Parses XLSX data into an array of workbook sheets.
 *
 * @param data - The XLSX data as a Uint8Array.
 * @param options - Optional parsing options including a specific sheet name.
 * @returns A promise that resolves to an array of WorkbookSheet objects.
 */
export async function XLSXParse(
    data: Uint8Array,
    options?: ParseXLSXOptions
): Promise<WorkbookSheet[]> {
    // Destructure options to separate sheet-specific option
    const { sheet, ...rest } = options || {}
    // Dynamically import 'xlsx' library's read and utils modules
    const { read, utils } = await import("xlsx")
    // Read the workbook from the data with 'array' type
    const workbook = read(data, { type: "array" })
    // Filter and map the sheet names to WorkbookSheet objects
    return workbook.SheetNames.filter((n) => !sheet || n === sheet).map(
        (name) => {
            // Convert the worksheet to JSON and cast to object array
            const worksheet = workbook.Sheets[name]
            const rows = utils.sheet_to_json(worksheet, rest) as object[]
            // Return a WorkbookSheet object with sheet name and rows
            return <WorkbookSheet>{ name, rows }
        }
    )
}

/**
 * Attempts to parse XLSX data, returning an empty array on failure.
 *
 * @param data - The XLSX data as a Uint8Array.
 * @param options - Optional parsing options including a specific sheet name.
 * @returns A promise that resolves to an array of WorkbookSheet objects or an empty array if parsing fails.
 */
export async function XLSXTryParse(
    data: Uint8Array,
    options?: ParseXLSXOptions
): Promise<WorkbookSheet[]> {
    try {
        // Attempt to parse the XLSX data
        return await XLSXParse(data, options)
    } catch (e) {
        // Log any errors encountered during parsing
        logInfo(e)
        // Return an empty array if parsing fails
        return []
    }
}
