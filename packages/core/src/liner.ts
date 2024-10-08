// This module provides functions to add and remove line numbers from text.
// It includes special handling for "diff" formatted text.

import { start } from "repl"
import { llmifyDiff, tryParseDiff } from "./diff"

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

    return text
        .split("\n") // Split text into lines
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
