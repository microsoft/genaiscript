import { assert } from "./util"
import parseDiff from "parse-diff"
import { createTwoFilesPatch } from "diff"

/**
 * Represents a chunk of changes in a diff.
 */
export interface Chunk {
    state: "existing" | "deleted" | "added"
    lines: string[]
    lineNumbers: number[]
}

/**
 * Parses a text in the LLMD diff format into a list of chunks.
 * The format may lose indentation or some code during regeneration.
 * @param text - The diff text to parse.
 * @returns An array of chunks representing the diff.
 */
export function parseLLMDiffs(text: string): Chunk[] {
    const lines = text.split("\n")
    const chunks: Chunk[] = []

    // Initialize the first chunk
    let chunk: Chunk = { state: "existing", lines: [], lineNumbers: [] }
    chunks.push(chunk)

    let currentLine = Number.NaN
    for (let i = 0; i < lines.length; ++i) {
        let line = lines[i]
        const diffM = /^(\[(\d+)\] )?(-|\+) (\[(\d+)\] )?/.exec(line)
        
        // Process lines that match the diff pattern
        if (diffM) {
            const l = line.substring(diffM[0].length)
            let diffln = diffM ? parseInt(diffM[5] ?? diffM[2]) : Number.NaN
            const op = diffM[3]
            
            // Adjust line numbers
            if (isNaN(diffln) && !isNaN(currentLine)) {
                currentLine++
                diffln = currentLine
                if (op === "-") currentLine--
            } else {
                currentLine = diffln
            }

            // Handle added lines
            if (op === "+") {
                const l = line.substring(diffM[0].length)
                if (lines[diffln] === l) {
                    // Skip duplicate line
                    continue
                }
                if (chunk.state === "added") {
                    chunk.lines.push(l)
                    chunk.lineNumbers.push(diffln)
                } else {
                    chunk = {
                        state: "added",
                        lines: [l],
                        lineNumbers: [diffln],
                    }
                    chunks.push(chunk)
                }
            } else {
                // Handle deleted lines
                assert(op === "-")
                if (chunk.state === "deleted") {
                    chunk.lines.push(l)
                    chunk.lineNumbers.push(diffln)
                } else {
                    chunk = {
                        state: "deleted",
                        lines: [l],
                        lineNumbers: [diffln],
                    }
                    chunks.push(chunk)
                }
            }
        } else {
            // Handle existing lines
            const lineM = /^\[(\d+)\] /.exec(line)
            let lineNumber = lineM ? parseInt(lineM[1]) : Number.NaN
            const l = line.substring(lineM ? lineM[0].length : 0)
            if (isNaN(lineNumber) && !isNaN(currentLine)) {
                currentLine++
                lineNumber = currentLine
            } else {
                currentLine = lineNumber
            }
            if (chunk.state === "existing") {
                chunk.lines.push(l)
                chunk.lineNumbers.push(lineNumber)
            } else {
                chunk = {
                    state: "existing",
                    lines: [l],
                    lineNumbers: [lineNumber],
                }
                chunks.push(chunk)
            }
        }
    }

    // Clean trailing empty lines in the last chunk
    if (chunk.state === "existing") {
        while (/^\s*$/.test(chunk.lines[chunk.lines.length - 1])) {
            chunk.lines.pop()
            chunk.lineNumbers.pop()
        }
        if (chunk.lines.length === 0) chunks.pop()
    }

    // Remove duplicate lines added without changes
    for (let i = 0; i < chunks.length - 1; ++i) {
        const current = chunks[i]
        const next = chunks[i + 1]
        if (
            current.lines.length === 1 &&
            next.lines.length === 1 &&
            current.state === "existing" &&
            next.state === "added" &&
            current.lines[0] === next.lines[0]
        ) {
            // Remove current, added line since it does not change the file
            chunks.splice(i, 2)
        }
    }

    return chunks
}

const MIN_CHUNK_SIZE = 4

/**
 * Finds the starting position of a chunk in the given lines.
 * @param lines - The array of lines to search through.
 * @param chunk - The chunk to find.
 * @param startLine - The line to start the search from.
 * @returns The index of the starting line of the chunk, or -1 if not found.
 */
function findChunk(lines: string[], chunk: Chunk, startLine: number): number {
    const chunkLines = chunk.lines
    if (chunkLines.length === 0) return startLine
    const chunkStart = chunkLines[0].trim()
    let linei = startLine
    while (linei < lines.length) {
        const line = lines[linei].trim()
        if (line === chunkStart) {
            let found = true
            let i = 1
            for (
                ;
                i < Math.min(MIN_CHUNK_SIZE, chunkLines.length) &&
                linei + i < lines.length;
                ++i
            ) {
                if (lines[linei + i].trim() !== chunkLines[i].trim()) {
                    found = false
                    break
                }
            }
            if (found && i === chunkLines.length) return linei
        }
        ++linei
    }
    return -1
}

/**
 * Applies a series of LLMDiff chunks to a source string.
 * @param source - The original source content.
 * @param chunks - The chunks representing changes to apply.
 * @returns The modified source content.
 */
export function applyLLMDiff(source: string, chunks: Chunk[]): string {
    if (!chunks?.length || !source) return source

    const lines = source.split("\n")
    let current = 0
    let i = 0
    while (i + 1 < chunks.length) {
        const chunk = chunks[i++]
        if (chunk.state !== "existing")
            throw new Error("expecting existing chunk")

        // Find location of existing chunk
        const chunkStart = findChunk(lines, chunk, current)
        if (chunkStart === -1) break
        current = chunkStart + chunk.lines.length

        // Handle deleted chunk
        if (chunks[i]?.state === "deleted") {
            const deletedChunk = chunks[i++]
            const chunkDel = findChunk(lines, deletedChunk, current)
            if (chunkDel === current) {
                lines.splice(current, deletedChunk.lines.length)
            }
            if (chunks[i]?.state === "existing") continue
        }

        const addedChunk = chunks[i++]
        if (!addedChunk) break
        if (addedChunk?.state !== "added")
            throw new Error("expecting added chunk")

        // Find the end of the next existing chunk
        let nextChunk = chunks[i]
        if (nextChunk && nextChunk.state !== "existing")
            throw new Error("expecting existing chunk")
        const chunkEnd = nextChunk
            ? findChunk(lines, nextChunk, current)
            : lines.length

        if (chunkEnd === -1) break

        // Finally, replace the lines with the added chunk
        const toRemove = chunkEnd - current
        lines.splice(current, toRemove, ...addedChunk.lines)

        current += addedChunk.lines.length - toRemove
    }

    return lines.join("\n")
}

/**
 * Custom error class for handling diff-related errors.
 */
export class DiffError extends Error {
    constructor(message: string) {
        super(message)
    }
}

/**
 * Applies a series of LLMDiff chunks to a source string using line numbers.
 * @param source - The original source content.
 * @param chunks - The chunks representing changes to apply.
 * @returns The modified source content.
 */
export function applyLLMPatch(source: string, chunks: Chunk[]): string {
    if (!chunks?.length || !source) return source

    const lines = source.split("\n")

    // Process modified and deleted chunks
    chunks
        .filter((c) => c.state !== "added")
        .forEach((chunk) => {
            for (let li = 0; li < chunk.lines.length; ++li) {
                const line =
                    chunk.state === "deleted" ? undefined : chunk.lines[li]
                const linei = chunk.lineNumbers[li] - 1
                if (isNaN(linei))
                    throw new DiffError(`diff: missing or nan line number`)
                if (linei < 0 || linei >= lines.length)
                    throw new DiffError(
                        `diff: invalid line number ${linei} in ${lines.length}`
                    )
                lines[linei] = line
            }
        })

    // Insert added chunks after processing deletions and modifications
    for (let ci = chunks.length - 1; ci > 0; ci--) {
        const chunk = chunks[ci]
        if (chunk.state !== "added") continue
        let previ = ci - 1
        let prev = chunks[previ]
        // Find the previous existing chunk
        while (prev && prev.state !== "existing") {
            prev = chunks[--previ]
        }
        if (!prev) throw new Error("missing previous chunk for added chunk")
        const prevLinei = prev.lineNumbers[prev.lineNumbers.length - 1]
        lines.splice(prevLinei, 0, ...chunk.lines)
    }

    // Filter out undefined lines (deleted)
    return lines.filter((l) => l !== undefined).join("\n")
}

/**
 * Tries to parse a diff string into a structured format.
 * @param diff - The diff string to parse.
 * @returns The parsed diff as an array of files, or undefined if parsing fails.
 */
export function tryParseDiff(diff: string) {
    let parsed: parseDiff.File[]
    try {
        parsed = parseDiff(diff)
        if (!parsed?.length) parsed = undefined
    } catch (e) {
        parsed = undefined
    }
    return parsed
}

/**
 * Converts a diff string into the LLMDiff format.
 * @param diff - The diff string to convert.
 * @returns The LLMDiff formatted string, or undefined if parsing fails.
 */
export function llmifyDiff(diff: string) {
    if (!diff) return diff

    const parsed = tryParseDiff(diff)
    if (!parsed) return undefined

    for (const file of parsed) {
        for (const chunk of file.chunks) {
            let currentLineNumber = chunk.newStart
            for (const change of chunk.changes) {
                if (change.type === "del") continue
                ;(change as any).line = currentLineNumber
                currentLineNumber++
            }
        }
    }

    // Convert back to unified diff format
    let result = ""
    for (const file of parsed) {
        result += `--- ${file.from}\n+++ ${file.to}\n`
        for (const chunk of file.chunks) {
            result += `${chunk.content}\n`
            for (const change of chunk.changes) {
                const ln =
                    (change as any).line !== undefined
                        ? `[${(change as any).line}] `
                        : ""
                result += `${ln}${change.content}\n`
            }
        }
    }

    return result
}

/**
 * Creates a diff between two workspace files.
 * @param left - The original workspace file.
 * @param right - The modified workspace file.
 * @param options - Optional settings for creating the diff.
 * @returns The diff as a string, with certain headers removed.
 */
export function createDiff(
    left: WorkspaceFile,
    right: WorkspaceFile,
    options?: { context?: number }
) {
    const res = createTwoFilesPatch(
        left.filename,
        right.filename,
        left.content,
        right.content,
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
