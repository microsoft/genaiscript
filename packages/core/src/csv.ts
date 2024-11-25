// This module provides functions for parsing and converting CSV data,
// including error handling and conversion to Markdown table format.

import { parse } from "csv-parse/sync"
import { TraceOptions } from "./trace"
import { stringify } from "csv-stringify/sync"
import { arrayify } from "./util"
import { chunk } from "es-toolkit"

/**
 * Parses a CSV string into an array of objects.
 *
 * @param text - The CSV string to parse.
 * @param options - Optional parsing configuration.
 * @param options.delimiter - Delimiter used in the CSV, defaults to comma.
 * @param options.headers - Array of headers for the CSV columns.
 * @returns An array of objects representing the CSV data.
 */
export function CSVParse(
    text: string,
    options?: {
        delimiter?: string
        headers?: ElementOrArray<string>
        repair?: boolean
    }
): object[] {
    // Destructure options or provide defaults
    const { delimiter, headers, repair, ...rest } = options || {}
    const columns = headers ? arrayify(headers) : true

    // common LLM escape errors
    if (repair) {
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
 * Attempts to parse a CSV string into an array of objects, with error handling.
 *
 * @param text - The CSV string to parse.
 * @param options - Optional parsing configuration and tracing options.
 * @param options.delimiter - Delimiter used in the CSV, defaults to comma.
 * @param options.headers - Array of headers for the CSV columns.
 * @param options.trace - Trace function for logging errors.
 * @returns An array of objects representing the CSV data, or undefined if parsing fails.
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
 * @param csv - An array of objects to be converted into CSV format.
 * @param options - Optional configuration for CSV stringification.
 * @returns A string representing the CSV formatted data.
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
export function CSVToMarkdown(
    csv: object[],
    options?: { headers?: ElementOrArray<string> }
) {
    if (!csv?.length) return "" // Return empty string if CSV is empty

    const headers = arrayify(options?.headers)
    if (headers.length === 0) headers.push(...Object.keys(csv[0])) // Use object keys as headers if not provided
    const res: string[] = [
        `|${headers.join("|")}|`, // Create Markdown header row
        `|${headers.map(() => "-").join("|")}|`, // Create Markdown separator row
        ...csv.map(
            (row) =>
                `|${headers
                    .map((key) => {
                        const v = (row as any)[key]
                        const s = v === undefined || v === null ? "" : String(v)
                        // Escape special Markdown characters and format cell content
                        return s
                            .replace(/\s+$/, "") // Trim trailing whitespace
                            .replace(/[\\`*_{}[\]()#+\-.!]/g, (m) => "\\" + m) // Escape special characters
                            .replace(/</g, "lt;") // Replace '<' with its HTML entity
                            .replace(/>/g, "gt;") // Replace '>' with its HTML entity
                            .replace(/\r?\n/g, "<br>") // Replace newlines with <br>
                    })
                    .join("|")}|` // Join columns with '|'
        ),
    ]
    return res.join("\n") // Join rows with newline
}

/**
 * Splits the original array into chunks of the specified size.
 * @param csv
 * @param rows
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
