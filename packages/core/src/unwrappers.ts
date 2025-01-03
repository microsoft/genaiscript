/**
 * Remove code fences from a fenced block for the specified language.
 * @param text - The text containing the fenced block.
 * @param language - The language used in the fence.
 * @returns The text without fences.
 */
export function unfence(text: string, language: string) {
    if (!text) return text

    const startRx = new RegExp(`^[\r\n\s]*(\`{3,})${language}\s*\r?\n`, "i")
    const mstart = startRx.exec(text)
    if (mstart) {
        const n = mstart[1].length
        const endRx = new RegExp(`\r?\n\`{${n},}[\r\n\s]*$`, "i")
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

export function filenameOrFileToContent(
    fileOrContent: string | WorkspaceFile
): string {
    return typeof fileOrContent === "string"
        ? fileOrContent
        : fileOrContent?.content
}

export function trimNewlines(s: string) {
    return s?.replace(/^\n*/, "").replace(/\n*$/, "")
}
