// This module provides functions for parsing and converting CSV data,
// including error handling and conversion to Markdown table format.

import { parse } from "csv-parse/sync"
import { TraceOptions } from "./trace"
import { stringify } from "csv-stringify/sync"
import { arrayify } from "./util"
import { chunk } from "es-toolkit"
import { filenameOrFileToContent } from "./unwrappers"

/**
 * Parses a CSV string into an array of objects.
 *
 * @param text - The CSV string or file to parse.
 * @param options - Optional parsing configuration.
 * @param options.delimiter - Delimiter used in the CSV, defaults to comma.
 * @param options.headers - Headers for the CSV columns, as an array or single value.
 * @param options.repair - Whether to repair escape errors, defaults to false.
 * @returns An array of objects representing the CSV data.
 */
export function CSVParse(
    text: string | WorkspaceFile,
    options?: {
        delimiter?: string
        headers?: ElementOrArray<string>
        repair?: boolean
    }
): object[] {
    text = filenameOrFileToContent(text)

    // Destructure options or provide defaults
    const { delimiter, headers, repair, ...rest } = options || {}
    const columns = headers ? arrayify(headers) : true

    // common LLM escape errors
    if (repair && text) {
        text = text.replace(/\\"/g, '""').replace(/""""/g, '""')
    }
    // Parse the CSV string based on the provided options
    return parse(text, {
        autoParse: true, // Automatically parse values to appropriate types
        castDate: false, // Do not cast strings to dates
        comment: "#", // Ignore comments starting with '#'
        columns, // Use provided headers or infer from the first line
        skipEmptyLines: true, // Skip empty lines in the CSV
        skipRecordsWithError: true, // Skip records that cause errors
        delimiter, // Use the provided delimiter
        relaxQuotes: true, // Allow quotes to be relaxed
        relaxColumnCount: true, // Allow rows to have different column counts
        trim: true, // Trim whitespace from values
        ...rest,
    })
}

/**
 * Attempts to parse a CSV string into an array of objects, handling errors gracefully.
 *
 * @param text - The CSV string to parse.
 * @param options - Optional configuration for parsing and error handling.
 * @param options.delimiter - Delimiter to separate values, defaults to comma.
 * @param options.headers - Array of column headers for the parsed data.
 * @param options.repair - Flag to enable basic error correction in the input data.
 * @param options.trace - Optional trace function for logging errors during parsing.
 * @returns An array of objects representing the parsed CSV data, or undefined on error.
 */
export function CSVTryParse(
    text: string,
    options?: {
        delimiter?: string
        headers?: ElementOrArray<string>
        repair?: boolean
    } & TraceOptions
): object[] | undefined {
    const { trace } = options || {}
    try {
        if (!text) return [] // Return empty array if CSV is empty
        // Attempt to parse the CSV
        return CSVParse(text, options)
    } catch (e) {
        // Log error using trace function if provided
        trace?.error("reading csv", e)
        return undefined
    }
}

/**
 * Converts an array of objects into a CSV string.
 *
 * @param csv - Array of objects to convert to CSV format. Returns an empty string if the array is null or undefined.
 * @param options - Configuration for CSV stringification, such as headers or delimiter settings.
 * @returns A CSV formatted string representation of the input data.
 */
export function CSVStringify(csv: object[], options?: CSVStringifyOptions) {
    if (!csv) return "" // Return empty string if CSV is empty
    // Convert objects to CSV string using the provided options
    return stringify(csv, options)
}

/**
 * Converts an array of objects into a Markdown table format.
 *
 * @param csv - The array of objects representing CSV data.
 * @param options - Options for formatting the table.
 * @param options.headers - Array of headers for the table columns.
 * @returns A string representing the CSV data in Markdown table format.
 */
export function dataToMarkdownTable(
    csv: object[],
    options?: { headers?: ElementOrArray<string> }
) {
    if (!csv?.length) return "" // Return empty string if CSV is empty

    const headers = arrayify(options?.headers)
    if (headers.length === 0) headers.push(...Object.keys(csv[0])) // Use object keys as headers if not provided
    const res: string[] = [
        headersToMarkdownTableHead(headers), // Create Markdown separator row
        headersToMarkdownTableSeperator(headers),
        ...csv.map((row) => objectToMarkdownTableRow(row, headers)),
    ]
    return res.join("") // Join rows with newline
}

export function headersToMarkdownTableSeperator(headers: string[]) {
    return `|${headers.map(() => "-").join("|")}|\n`
}

export function headersToMarkdownTableHead(headers: string[]) {
    return `|${headers.join("|")}|\n`
}

export function objectToMarkdownTableRow(
    row: object,
    headers: string[],
    options?: { skipEscape?: boolean }
) {
    const { skipEscape } = options || {}
    return `|${headers
        .map((key) => {
            const v = (row as any)[key]
            let s = v === undefined || v === null ? "" : String(v)
            // Escape special Markdown characters and format cell content
            s = s
                .replace(/\s+$/, "") // Trim trailing whitespace
                .replace(/</g, "lt;") // Replace '<' with its HTML entity
                .replace(/>/g, "gt;") // Replace '>' with its HTML entity
                .replace(/\r?\n/g, "<br>") // Replace newlines with <br>
            if (!skipEscape)
                s = s.replace(/[\\`*_{}[\]()#+\-.!]/g, (m) => "\\" + m) // Escape special characters
            return s || " "
        })
        .join("|")}|\n` // Join columns with '|'
}

/**
 * Splits an array of objects into chunks of a specified size.
 * 
 * @param rows - The array of objects to split into chunks.
 * @param size - The size of each chunk.
 * @returns An array of chunk objects with starting index and rows.
 */
export function CSVChunk(
    rows: object[],
    size: number
): { chunkStartIndex: number; rows: object[] }[] {
    return chunk(rows || [], Math.max(1, size | 0)).map(
        (rows, chunkStartIndex) => ({
            chunkStartIndex,
            rows,
        })
    )
}
