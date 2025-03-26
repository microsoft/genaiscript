import parseDiff from "parse-diff"
import { arrayify, isEmptyString } from "./cleaners"
import debug from "debug"
import { errorMessage } from "./error"
import { createTwoFilesPatch } from "diff"
import { resolve } from "node:path"
const dbg = debug("genaiscript:diff")

/**
 * Parses a diff string into a structured format.
 *
 * @param input - The diff string to parse. Should be in a valid diff format.
 * @returns An array of parsed file objects. If the input is empty or invalid, returns an empty array.
 */
export function diffParse(input: string) {
    if (isEmptyString(input)) return []
    const files = parseDiff(input)
    return files
}

/**
 * Resolves the input into an array of DiffFile objects.
 *
 * @param input - The input to resolve. Can be a diff string in valid format or an ElementOrArray of DiffFile objects.
 * @returns An array of DiffFile objects. If the input is a string, it is parsed into DiffFile objects using diffParse. If the input is already an ElementOrArray of DiffFile objects, it is converted to an array using arrayify.
 */
export function diffResolve(
    input: string | ElementOrArray<DiffFile>
): DiffFile[] {
    if (typeof input === "string") return diffParse(input)
    else return arrayify(input)
}

/**
 * Attempts to parse a diff string into a structured format.
 * If parsing fails, logs the error and returns an empty array.
 *
 * @param diff - The diff string to parse.
 * @returns An array of parsed file objects if successful, or an empty array if parsing fails.
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
 * @param left - The original workspace file or its content. If a string, it is wrapped in a WorkspaceFile object with a default filename.
 * @param right - The modified workspace file or its content. If a string, it is wrapped in a WorkspaceFile object with a default filename.
 * @param options - Optional parameters, such as the number of context lines, case sensitivity, and whitespace handling.
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
        left?.filename || "",
        right?.filename || "",
        left?.content || "",
        right?.content || "",
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

/**
 * Finds a chunk in a diff corresponding to a specified file and line number.
 *
 * @param file - The file path to search for in the diff. Can be empty to search all files.
 * @param line - The line number or numbers (zero-based) to locate in the specified file's diff.
 * @param diff - The diff data, containing an array of file diffs. Can be a single diff file or an array of diff files.
 * @returns An object containing the matching file and the chunk if found, or an object with only the file if no chunk matches. Returns undefined if no file matches.
 */
export function diffFindChunk(
    file: string,
    line: ElementOrArray<number>,
    diff: ElementOrArray<DiffFile>
): { file?: DiffFile; chunk?: DiffChunk } | undefined {
    // line is zero-based!
    const fn = file ? resolve(file) : undefined
    const df = arrayify(diff).find(
        (f) => (!file && !f.to) || resolve(f.to) === fn
    )
    if (!df) return undefined // file not found in diff

    const { chunks } = df
    const lines = arrayify(line)
    for (const chunk of chunks) {
        for (const line of lines)
            if (
                line >= chunk.newStart &&
                line <= chunk.newStart + chunk.newLines
            )
                return { file: df, chunk }
    }
    return { file: df }
}
