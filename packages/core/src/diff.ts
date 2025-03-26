import parseDiff from "parse-diff"
import { arrayify, isEmptyString } from "./cleaners"
import debug from "debug"
import { errorMessage } from "./error"
import { createTwoFilesPatch } from "diff"
import { resolve } from "node:path"
const dbg = debug("genaiscript:diff")

export function diffParse(input: string) {
    if (isEmptyString(input)) return []
    const files = parseDiff(input)
    return files
}

/**
 * Parses a diff string into a structured format using the parse-diff library.
 * @param diff - The diff string to parse. Must be in a supported diff format.
 * @returns A parsed array of file objects if successful, or undefined if parsing fails or no files are found.
 */
export function tryDiffParse(diff: string) {
    try {
        return diffParse(diff)
    } catch (e) {
        dbg(`diff parsing failed: ${errorMessage(e)}`)
        return []
    }
}

/**
 * Creates a unified diff between two workspace files.
 * @param left - The original workspace file or its content.
 * @param right - The modified workspace file or its content.
 * @param options - Optional parameters, such as the number of context lines.
 * @returns The diff as a string, with redundant headers removed.
 */
export function diffCreatePatch(
    left: string | WorkspaceFile,
    right: string | WorkspaceFile,
    options?: {
        context?: number
        ignoreCase?: boolean
        ignoreWhitespace?: boolean
    }
) {
    if (typeof left === "string") left = { filename: "left", content: left }
    if (typeof right === "string") right = { filename: "right", content: right }
    const res = createTwoFilesPatch(
        left.filename || "",
        right.filename || "",
        left.content || "",
        right.content || "",
        undefined,
        undefined,
        {
            ignoreCase: true,
            ignoreWhitespace: true,
            ...(options ?? {}),
        }
    )
    return res.replace(/^[^=]*={10,}\n/, "")
}

export function diffFindChunk(
    file: string,
    line: number,
    diff: ElementOrArray<DiffFile>
): { file?: DiffFile; chunk?: DiffChunk } | undefined {
    // line is zero-based
    const fn = file ? resolve(file) : undefined
    const df = arrayify(diff).find(
        (f) => (!file && !f.to) || resolve(f.to) === fn
    )
    if (!df) return undefined // file not found in diff

    const { chunks } = df
    for (const chunk of chunks) {
        if (line >= chunk.newStart && line <= chunk.newStart + chunk.newLines)
            return { file: df, chunk }
    }
    return { file: df }
}
