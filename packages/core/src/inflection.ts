import { titleize as _titlelize, humanize as _humanize } from "inflection"

/**
 * Splits a camelCase string into separate words by inserting a space 
 * before each uppercase letter that follows a lowercase letter. 
 * If the input text is empty or undefined, it returns the input as is.
 *
 * @param text - The input string to be transformed.
 * @returns A string with spaces inserted before uppercase letters.
 */
export function splitalize(text: string) {
    if (!text) return text
    return text?.replace(/([a-z])([A-Z])/g, "$1 $2")
}

/**
 * Converts a given string to title case by first splitting it into words
 * using the splitalize function and then applying the titleize transformation.
 * If the input text is empty or undefined, the function returns the input as is.
 *
 * @param text - The string to be converted to title case.
 * @returns The title-cased representation of the input string, or the input if it is empty.
 */
export function titleize(text: string) {
    if (!text) return text
    return _titlelize(splitalize(text))
}

/**
 * Converts a given string into a human-readable format.
 * The function first applies splitalization to insert spaces 
 * between camel case words, then uses the inflection library's 
 * humanize method to format the string.
 * 
 * @param text - The input string to be humanized.
 * @returns The humanized string, or the original input if it is empty or undefined.
 */
export function humanize(text: string) {
    if (!text) return text
    return _humanize(splitalize(text))
}
