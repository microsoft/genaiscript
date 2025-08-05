import type { ParseXLSXOptions, WorkbookSheet } from "./types.js";
/**
 * Parses XLSX data into an array of workbook sheets.
 *
 * @param data - The XLSX data to parse.
 * @param options - Parsing options, including an optional sheet name and other utilities for conversion.
 * @returns A promise resolving to an array of WorkbookSheet objects, each containing sheet name and data rows.
 */
export declare function XLSXParse(data: Uint8Array, options?: ParseXLSXOptions): Promise<WorkbookSheet[]>;
/**
 * Attempts to parse XLSX data, returning an empty array on failure.
 *
 * @param data - The XLSX data as a Uint8Array.
 * @param options - Optional parsing options including a specific sheet name.
 * @returns A promise that resolves to an array of WorkbookSheet objects or an empty array if parsing fails.
 */
export declare function XLSXTryParse(data: Uint8Array, options?: ParseXLSXOptions): Promise<WorkbookSheet[]>;
//# sourceMappingURL=xlsx.d.ts.map