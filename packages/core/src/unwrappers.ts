import { arrayify } from "./cleaners"

/**
 * Remove code fences from a fenced block for the specified language.
 * @param text - The text containing the fenced block.
 * @param language - The language used in the fence.
 * @returns The text without fences.
 */
export function unfence(text: string, language?: ElementOrArray<string>) {
    if (!text) return text

    language = arrayify(language)
    const lg = language
        .filter((s) => s !== undefined && s !== null)
        .map((l) => l.replace(/[^a-z0-9_]/gi, ""))
        .join("|")
    const startRx = new RegExp(`^[\r\n\s]*(\`{3,})(${lg})\s*\r?\n`, "i")
    const mstart = startRx.exec(text)
    if (mstart) {
        const n = mstart[1].length
        const endRx = new RegExp(`\r?\n\`{${n},${n}}[\r\n\s]*$`, "i")
        const mend = endRx.exec(text)
        if (mend) return text.slice(mstart.index + mstart[0].length, mend.index)
    }
    return text
}

/**
 * Remove quotes from a string if they exist.
 * @param s - The string to unquote.
 * @returns The unquoted string.
 */
export function unquote(s: string) {
    for (const sep of "\"'`")
        if (s && s[0] === sep && s[s.length - 1] === sep) return s.slice(1, -1)
    return s
}

/**
 * Retrieves the content from a given file or content string.
 * If the input is a string, it returns the string itself. 
 * If the input is a WorkspaceFile, it returns the content property.
 * 
 * @param fileOrContent - The input which can be a string or a WorkspaceFile.
 * @returns The content as a string.
 */
export function filenameOrFileToContent(
    fileOrContent: string | WorkspaceFile
): string {
    return typeof fileOrContent === "string"
        ? fileOrContent
        : fileOrContent?.content
}

/**
 * Retrieve the filename from a given file or content.
 * If input is a string, it returns the string itself.
 * If input is a WorkspaceFile object, it returns the filename property.
 * 
 * @param fileOrContent - The input which can be a filename string or WorkspaceFile object.
 * @returns The extracted filename.
 */
export function filenameOrFileToFilename(
    fileOrContent: string | WorkspaceFile
): string {
    return typeof fileOrContent === "string"
        ? fileOrContent
        : fileOrContent?.filename
}

/**
 * Trims leading and trailing newline characters from a given string.
 * Removes any newline characters at the beginning and at the end of the string.
 * If the string is undefined or null, returns it as is.
 */
export function trimNewlines(s: string) {
    return s?.replace(/^\n*/, "").replace(/\n*$/, "")
}
