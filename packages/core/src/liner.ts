// This module provides functions to add and remove line numbers from text.
// It includes special handling for "diff" formatted text.

import { start } from "repl"
import { llmifyDiff, tryParseDiff } from "./diff"
import { MIN_LINE_NUMBER_LENGTH } from "./constants"

/**
 * Adds 1-based line numbers to each line of a given text.
 * If the language is "diff", it processes the text using llmifyDiff.
 *
 * @param text - The text to which line numbers will be added.
 * @param language - Optional parameter to specify the text format. Special handling for "diff".
 * @returns The text with line numbers added, or processed diff text if applicable.
 */
export function addLineNumbers(
    text: string,
    options?: { language?: string; startLine?: number }
) {
    const { language, startLine = 1 } = options || {}
    if (language === "diff" || tryParseDiff(text)) {
        const diffed = llmifyDiff(text) // Process the text with a special function for diffs
        if (diffed !== undefined) return diffed // Return processed text if diff handling was successful
    }

    // don't add line numbers for small files
    const lines = text.split("\n") // Split text into lines
    if (startLine === 1 && lines.length < MIN_LINE_NUMBER_LENGTH) return text

    return lines
        .map((line, i) => `[${i + startLine}] ${line}`) // Add line numbers in the format "[line_number] "
        .join("\n") // Join lines back into a single string
}

/**
 * Removes line numbers from each line of a given text.
 * Assumes line numbers are in the format "[number] ".
 *
 * @param text - The text from which line numbers will be removed.
 * @returns The text without line numbers, or the original text if no line numbers are found.
 */
export function removeLineNumbers(text: string) {
    const rx = /^\[\d+\] / // Regular expression to match line numbers in the format "[number] "
    const lines = text.split("\n") // Split text into lines

    // Check the first 10 lines for the presence of line numbers
    if (!lines.slice(0, 10).every((line) => rx.test(line))) return text // Return original text if not all lines have numbers

    return lines.map((line) => line.replace(rx, "")).join("\n") // Remove line numbers and join lines back
}

/**
 * Extracts a line range from a given text using 1-based inclusive line numbers.
 * @param text
 * @param options
 */
export function extractRange(
    text: string,
    options?: { lineStart?: number; lineEnd?: number }
) {
    const { lineStart, lineEnd } = options || {}
    if (isNaN(lineStart) && isNaN(lineEnd)) return text

    const lines = text.split("\n")
    const startLine = lineStart || 1
    const endLine = lineEnd || lines.length
    return lines.slice(startLine - 1, endLine).join("\n")
}

/**
 * Converts a string position index to a line number.
 * @param text - The text in which to find the line number.
 * @param index - The position index within the text.
 * @returns The line number corresponding to the position index, starting from 1.
 */
export function indexToLineNumber(text: string, index: number): number {
    if (
        text === undefined ||
        text === null ||
        index < 0 ||
        index >= text.length
    )
        return -1
    let lineNumber = 1
    const n = Math.min(index, text.length)
    for (let i = 0; i < n; i++) {
        if (text[i] === "\n") {
            lineNumber++
        }
    }
    return lineNumber
}
