"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.XLSXParse = XLSXParse;
exports.XLSXTryParse = XLSXTryParse;
// Import the logInfo function for logging purposes
const util_js_1 = require("./util.js");
/**
 * Parses XLSX data into an array of workbook sheets.
 *
 * @param data - The XLSX data to parse.
 * @param options - Parsing options, including an optional sheet name and other utilities for conversion.
 * @returns A promise resolving to an array of WorkbookSheet objects, each containing sheet name and data rows.
 */
async function XLSXParse(data, options) {
    // Destructure options to separate sheet-specific option
    const { sheet, ...rest } = options || {};
    // Dynamically import 'xlsx' library's read and utils modules
    const { read, utils } = await import("xlsx");
    // Read the workbook from the data with 'array' type
    const workbook = read(data, { type: "array" });
    // Filter and map the sheet names to WorkbookSheet objects
    return workbook.SheetNames.filter((n) => !sheet || n === sheet).map((name) => {
        // Convert the worksheet to JSON and cast to object array
        const worksheet = workbook.Sheets[name];
        const rows = utils.sheet_to_json(worksheet, rest);
        // Return a WorkbookSheet object with sheet name and rows
        return { name, rows };
    });
}
/**
 * Attempts to parse XLSX data, returning an empty array on failure.
 *
 * @param data - The XLSX data as a Uint8Array.
 * @param options - Optional parsing options including a specific sheet name.
 * @returns A promise that resolves to an array of WorkbookSheet objects or an empty array if parsing fails.
 */
async function XLSXTryParse(data, options) {
    try {
        if (!data)
            return [];
        // Attempt to parse the XLSX data
        return await XLSXParse(data, options);
    }
    catch (e) {
        // Log any errors encountered during parsing
        (0, util_js_1.logInfo)(e);
        // Return an empty array if parsing fails
        return [];
    }
}
//# sourceMappingURL=xlsx.js.map