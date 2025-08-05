// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// This module provides functions to add and remove line numbers from text.
// It includes special handling for "diff" formatted text.

import { llmifyDiff } from "./llmdiff.js";
import { MIN_LINE_NUMBER_LENGTH } from "./constants.js";
import { tryDiffParse } from "./diff.js";

/**
 * Adds 1-based line numbers to each line of the input text.
 * If the language is "diff" or the text is detected as a diff, processes it using llmifyDiff.
 *
 * @param text - The input text to process.
 * @param options - Optional parameters:
 *   - language: Specifies the language format (e.g., "diff").
 *   - startLine: The starting line number for numbering (default is 1).
 * @returns The text with line numbers added, the original text if it is too small, or processed diff text if applicable.
 */
export function addLineNumbers(text: string, options?: { language?: string; startLine?: number }) {
  const { language, startLine = 1 } = options || {};
  if (language === "diff" || tryDiffParse(text)) {
    const diffed = llmifyDiff(text); // Process the text with a special function for diffs
    if (diffed !== undefined) return diffed; // Return processed text if diff handling was successful
  }

  // don't add line numbers for small files
  const lines = text.split("\n"); // Split text into lines
  if (startLine === 1 && lines.length < MIN_LINE_NUMBER_LENGTH) return text;

  return lines
    .map((line, i) => `[${i + startLine}] ${line}`) // Add line numbers in the format "[line_number] "
    .join("\n"); // Join lines back into a single string
}

/**
 * Removes line numbers from each line of a given text.
 * Assumes line numbers are in the format "[number] ".
 *
 * @param text - The text from which line numbers will be removed.
 * @returns The text without line numbers, or the original text if no line numbers are found.
 */
export function removeLineNumbers(text: string) {
  const rx = /^\[\d+\] /; // Regular expression to match line numbers in the format "[number] "
  const lines = text.split("\n"); // Split text into lines

  // Check the first 10 lines for the presence of line numbers
  if (!lines.slice(0, 10).every((line) => rx.test(line))) return text; // Return original text if not all lines have numbers

  return lines.map((line) => line.replace(rx, "")).join("\n"); // Remove line numbers and join lines back
}

/**
 * Extracts a line range from the text using 1-based inclusive line numbers.
 *
 * @param text - The input text from which to extract the range.
 * @param options - An object specifying the line range.
 *   - lineStart: The 1-based starting line number of the range.
 *   - lineEnd: The 1-based ending line number of the range.
 *   - line: Center line number around which to extract content dynamically.
 * @returns The extracted range of text or the original text if no valid range is provided.
 */
export function extractRange(text: string, options?: { lineStart?: number; lineEnd?: number; line?: number }) {
  const { lineStart, lineEnd, line } = options || {};
  
  // Handle existing lineStart/lineEnd logic first (takes priority)
  if (!isNaN(lineStart) || !isNaN(lineEnd)) {
    const lines = text.split("\n");
    const startLine = lineStart || 1;
    const endLine = lineEnd || lines.length;
    return lines.slice(startLine - 1, endLine).join("\n");
  }
  
  // Handle center line option if lineStart/lineEnd not provided
  if (!isNaN(line)) {
    return extractRangeAroundLine(text, line);
  }
  
  // If no valid range is provided, return original text
  return text;
}

/**
 * Extracts a dynamic range around a center line.
 * The range size is calculated based on file size and context needs.
 * 
 * @param text - The input text from which to extract the range.
 * @param centerLine - The 1-based center line number.
 * @returns The extracted range of text around the center line.
 */
export function extractRangeAroundLine(text: string, centerLine: number): string {
  const lines = text.split("\n");
  const totalLines = lines.length;
  
  // Validate center line
  if (centerLine < 1 || centerLine > totalLines) {
    return text; // Return original text if center line is out of bounds
  }
  
  // Calculate dynamic range based on file size
  const contextLines = calculateContextLines(totalLines);
  
  // Calculate start and end lines around center
  const startLine = Math.max(1, centerLine - contextLines);
  const endLine = Math.min(totalLines, centerLine + contextLines);
  
  // Extract the range (convert to 0-based indexing)
  return lines.slice(startLine - 1, endLine).join("\n");
}

/**
 * Calculates the number of context lines to include around a center line
 * based on the total file size and other factors.
 * 
 * @param totalLines - Total number of lines in the file.
 * @returns Number of lines to include on each side of the center line.
 */
function calculateContextLines(totalLines: number): number {
  // Dynamic calculation based on file size
  if (totalLines <= 20) {
    // For very small files, include most content
    return Math.floor(totalLines / 2);
  } else if (totalLines <= 100) {
    // For small files, include a reasonable chunk
    return 15;
  } else if (totalLines <= 500) {
    // For medium files, focus on the area around the line
    return 25;
  } else if (totalLines <= 2000) {
    // For large files, be more conservative
    return 50;
  } else {
    // For very large files, be very conservative
    return 75;
  }
}

/**
 * Converts a string position index to a line number.
 * @param text - The text in which to find the line number.
 * @param index - The position index within the text.
 * @returns The line number corresponding to the position index, starting from 1.
 */
export function indexToLineNumber(text: string, index: number): number {
  if (text === undefined || text === null || index < 0 || index >= text.length) return -1;
  let lineNumber = 1;
  const n = Math.min(index, text.length);
  for (let i = 0; i < n; i++) {
    if (text[i] === "\n") {
      lineNumber++;
    }
  }
  return lineNumber;
}
