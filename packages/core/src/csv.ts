// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// This module provides functions for parsing and converting CSV data,
// including error handling and conversion to Markdown table format.

import { parse } from "csv-parse/sync";
import { TraceOptions } from "./trace.js";
import { stringify } from "csv-stringify/sync";
import { arrayify } from "./cleaners.js";
import { chunk } from "es-toolkit";
import { filenameOrFileToContent } from "./unwrappers.js";
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
export function CSVParse(
  text: string | WorkspaceFile,
  options?: {
    delimiter?: string;
    headers?: ElementOrArray<string>;
    repair?: boolean;
  },
): object[] {
  text = filenameOrFileToContent(text);

  // Destructure options or provide defaults
  const { delimiter, headers, repair, ...rest } = options || {};
  const columns = headers ? arrayify(headers) : true;

  // common LLM escape errors
  if (repair && text) {
    text = text.replace(/\\"/g, '""').replace(/""""/g, '""');
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
  });
}

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
export function CSVTryParse(
  text: string,
  options?: {
    delimiter?: string;
    headers?: ElementOrArray<string>;
    repair?: boolean;
  } & TraceOptions,
): object[] | undefined {
  const { trace } = options || {};
  try {
    if (!text) return []; // Return empty array if CSV is empty
    // Attempt to parse the CSV
    return CSVParse(text, options);
  } catch (e) {
    // Log error using trace function if provided
    trace?.error("reading csv", e);
    return undefined;
  }
}

/**
 * Converts an array of objects into a CSV string.
 *
 * @param csv - Array of objects to convert to CSV format. Returns an empty string if the input is null or undefined.
 * @param options - Optional configuration for CSV stringification, including headers, delimiter, and other settings.
 * @returns A CSV formatted string representation of the input data.
 */
export function CSVStringify(csv: object[], options?: CSVStringifyOptions) {
  if (!csv) return ""; // Return empty string if CSV is empty
  // Convert objects to CSV string using the provided options
  return stringify(csv, options);
}

/**
 * Converts an array of objects into a Markdown table.
 *
 * @param csv - Array of objects representing the data to convert. Returns an empty string if the input is empty.
 * @param options - Configuration options for the table.
 * @param options.headers - Headers for the table columns. If not provided, keys from the first object are used. If empty, defaults to object keys. Headers are escaped for Markdown.
 * @returns A Markdown table as a string, with rows and columns formatted and escaped for Markdown. Rows are joined without additional newlines.
 */
export function dataToMarkdownTable(csv: object[], options?: { headers?: ElementOrArray<string> }) {
  if (!csv?.length) return ""; // Return empty string if CSV is empty

  const headers = arrayify(options?.headers);
  if (headers.length === 0) headers.push(...Object.keys(csv[0])); // Use object keys as headers if not provided
  const res: string[] = [
    headersToMarkdownTableHead(headers), // Create Markdown separator row
    headersToMarkdownTableSeperator(headers),
    ...csv.map((row) => objectToMarkdownTableRow(row, headers)),
  ];
  return res.join(""); // Join rows with newline
}

/**
 * Generates the Markdown table separator row based on headers.
 *
 * @param headers - Array of column headers used to determine the number of separator cells in the row.
 * @returns A string representing the Markdown table separator row.
 */
export function headersToMarkdownTableSeperator(headers: string[]) {
  return `|${headers.map(() => "-").join("|")}|\n`;
}

/**
 * Generates the header row for a Markdown table.
 *
 * @param headers - Array of header names to be included in the table's first row.
 * @returns A string representing the header row of a Markdown table, with headers separated by pipes, ending with a newline.
 */
export function headersToMarkdownTableHead(headers: string[]) {
  return `|${headers.join("|")}|\n`;
}

/**
 * Converts a single object into a Markdown table row.
 *
 * @param row - The object containing data for the row. Keys correspond to column headers.
 * @param headers - The list of headers determining the order of columns in the row.
 * @param options - Optional configuration settings.
 * @param options.skipEscape - If true, skips escaping special Markdown characters.
 * @returns A string representing the row formatted as a Markdown table row.
 */
export function objectToMarkdownTableRow(
  row: object,
  headers: string[],
  options?: { skipEscape?: boolean },
) {
  const { skipEscape } = options || {};
  return `|${headers
    .map((key) => {
      const v = (row as any)[key];
      let s = v === undefined || v === null ? "" : String(v);
      // Escape special Markdown characters and format cell content
      s = s
        .replace(/\s+$/, "") // Trim trailing whitespace
        .replace(/</g, "lt;") // Replace '<' with its HTML entity
        .replace(/>/g, "gt;") // Replace '>' with its HTML entity
        .replace(/\r?\n/g, "<br>"); // Replace newlines with <br>
      if (!skipEscape) s = s.replace(/[\\`*_{}[\]()#+\-.!]/g, (m) => "\\" + m); // Escape special characters
      return s || " ";
    })
    .join("|")}|\n`; // Join columns with '|'
}

/**
 * Splits an array of objects into chunks of a specified size.
 *
 * @param rows - Array of objects to be divided into chunks.
 * @param size - Number of objects per chunk. Must be at least 1.
 * @returns Array of chunk objects, each containing a starting index and rows.
 */
export function CSVChunk(
  rows: object[],
  size: number,
): { chunkStartIndex: number; rows: object[] }[] {
  return chunk(rows || [], Math.max(1, size | 0)).map((rows, chunkStartIndex) => ({
    chunkStartIndex,
    rows,
  }));
}
