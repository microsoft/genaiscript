import type { TraceOptions } from "./trace.js";
import type { CSVStringifyOptions, ElementOrArray, WorkspaceFile } from "./types.js";
/**
 * Parses a CSV string or file into an array of objects.
 *
 * @param text - The CSV string or file to parse. If a file is provided, its content is read.
 * @param options - Optional configuration for parsing.
 * @param options.delimiter - The delimiter used in the CSV, defaults to a comma.
 * @param options.headers - Column headers for the CSV, as an array or single value. If not provided, headers are inferred from the first line.
 * @param options.repair - Whether to repair common escape errors, defaults to false.
 * @returns An array of objects representing the parsed CSV data. Skips empty lines and records with errors.
 */
export declare function CSVParse(text: string | WorkspaceFile, options?: {
    delimiter?: string;
    headers?: ElementOrArray<string>;
    repair?: boolean;
}): object[];
/**
 * Attempts to parse a CSV string into an array of objects, handling errors gracefully.
 *
 * @param text - The CSV string to parse. Returns an empty array if the input is empty.
 * @param options - Optional configuration for parsing and error handling.
 * @param options.delimiter - The delimiter used to separate values, defaults to a comma.
 * @param options.headers - Column headers for the parsed data, as an array or single value.
 * @param options.repair - Enables basic error correction in the input data.
 * @param options.trace - Trace function for logging errors during parsing.
 * @returns An array of objects representing the parsed CSV data, or undefined if an error occurs.
 */
export declare function CSVTryParse(text: string, options?: {
    delimiter?: string;
    headers?: ElementOrArray<string>;
    repair?: boolean;
} & TraceOptions): object[] | undefined;
/**
 * Converts an array of objects into a CSV string.
 *
 * @param csv - Array of objects to convert to CSV format. Returns an empty string if the input is null or undefined.
 * @param options - Optional configuration for CSV stringification, including headers, delimiter, and other settings.
 * @returns A CSV formatted string representation of the input data.
 */
export declare function CSVStringify(csv: object[], options?: CSVStringifyOptions): string;
/**
 * Converts an array of objects into a Markdown table.
 *
 * @param csv - Array of objects representing the data to convert. Returns an empty string if the input is empty.
 * @param options - Configuration options for the table.
 * @param options.headers - Headers for the table columns. If not provided, keys from the first object are used. If empty, defaults to object keys. Headers are escaped for Markdown.
 * @returns A Markdown table as a string, with rows and columns formatted and escaped for Markdown. Rows are joined without additional newlines.
 */
export declare function dataToMarkdownTable(csv: object[], options?: {
    headers?: ElementOrArray<string>;
}): string;
/**
 * Generates the Markdown table separator row based on headers.
 *
 * @param headers - Array of column headers used to determine the number of separator cells in the row.
 * @returns A string representing the Markdown table separator row.
 */
export declare function headersToMarkdownTableSeparator(headers: string[]): string;
/**
 * Generates the header row for a Markdown table.
 *
 * @param headers - Array of header names to be included in the table's first row.
 * @returns A string representing the header row of a Markdown table, with headers separated by pipes, ending with a newline.
 */
export declare function headersToMarkdownTableHead(headers: string[]): string;
/**
 * Converts a single object into a Markdown table row.
 *
 * @param row - The object containing data for the row. Keys correspond to column headers.
 * @param headers - The list of headers determining the order of columns in the row.
 * @param options - Optional configuration settings.
 * @param options.skipEscape - If true, skips escaping special Markdown characters.
 * @returns A string representing the row formatted as a Markdown table row.
 */
export declare function objectToMarkdownTableRow(row: object, headers: string[], options?: {
    skipEscape?: boolean;
}): string;
/**
 * Splits an array of objects into chunks of a specified size.
 *
 * @param rows - Array of objects to be divided into chunks.
 * @param size - Number of objects per chunk. Must be at least 1.
 * @returns Array of chunk objects, each containing a starting index and rows.
 */
export declare function CSVChunk(rows: object[], size: number): {
    chunkStartIndex: number;
    rows: object[];
}[];
//# sourceMappingURL=csv.d.ts.map