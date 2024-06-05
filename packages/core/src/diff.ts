import { assert } from "./util"
import parseDiff from "parse-diff"

export interface Chunk {
    state: "existing" | "deleted" | "added"
    lines: string[]
    lineNumbers: number[]
}

/**
 * The LLMD diff format is a simple format that can be used to represent changes.
 * It is not precise:
 * - indentation may be lost
 * - some code may be not regenerated
 */
export function parseLLMDiffs(text: string): Chunk[] {
    const lines = text.split("\n")
    const chunks: Chunk[] = []

    let chunk: Chunk = { state: "existing", lines: [], lineNumbers: [] }
    chunks.push(chunk)

    let currentLine = Number.NaN
    for (let i = 0; i < lines.length; ++i) {
        let line = lines[i]
        const diffM = /^(\[(\d+)\] )?(-|\+) (\[(\d+)\] )?/.exec(line)
        if (diffM) {
            const l = line.substring(diffM[0].length)
            let diffln = diffM ? parseInt(diffM[5] ?? diffM[2]) : Number.NaN
            const op = diffM[3]
            if (isNaN(diffln) && !isNaN(currentLine)) {
                currentLine++
                diffln = currentLine
                if (op === "-") currentLine--
            } else {
                currentLine = diffln
            }
            if (op === "+") {
                const l = line.substring(diffM[0].length)
                if (lines[diffln] === l) {
                    // trying to duplicate line
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

    // clean last chunk
    if (chunk.state === "existing") {
        while (/^\s*$/.test(chunk.lines[chunk.lines.length - 1])) {
            chunk.lines.pop()
            chunk.lineNumbers.pop()
        }
        if (chunk.lines.length === 0) chunks.pop()
    }

    // clean added duplicate lines
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
            // remove current, added line since it does not change the file
            chunks.splice(i, 2)
        }
    }

    return chunks
}

const MIN_CHUNK_SIZE = 4
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

export function applyLLMDiff(source: string, chunks: Chunk[]): string {
    if (!chunks?.length || !source) return source

    const lines = source.split("\n")
    let current = 0
    let i = 0
    while (i + 1 < chunks.length) {
        const chunk = chunks[i++]
        if (chunk.state !== "existing")
            throw new Error("expecting existing chunk")

        // find location of chunk
        const chunkStart = findChunk(lines, chunk, current)
        if (chunkStart === -1) break
        current = chunkStart + chunk.lines.length

        // handle deleted chunk
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

        // find the end chunk
        let nextChunk = chunks[i]
        if (nextChunk && nextChunk.state !== "existing")
            throw new Error("expecting existing chunk")
        const chunkEnd = nextChunk
            ? findChunk(lines, nextChunk, current)
            : lines.length

        if (chunkEnd === -1) break

        // finally swap the lines in
        const toRemove = chunkEnd - current
        lines.splice(current, toRemove, ...addedChunk.lines)

        current += addedChunk.lines.length - toRemove
    }

    return lines.join("\n")
}

export class DiffError extends Error {
    constructor(message: string) {
        super(message)
    }
}

export function applyLLMPatch(source: string, chunks: Chunk[]): string {
    if (!chunks?.length || !source) return source

    const lines = source.split("\n")

    // modified, deleted
    chunks
        .filter((c) => c.state !== "added")
        .forEach((chunk) => {
            for (let li = 0; li < chunk.lines.length; ++li) {
                const line =
                    chunk.state === "deleted" ? undefined : chunk.lines[li]
                const linei = chunk.lineNumbers[li] - 1
                if (isNaN(linei)) throw new DiffError("missing line number")
                if (linei < 0 || linei >= lines.length)
                    throw new DiffError("invalid line number")
                lines[linei] = line
            }
        })

    // update added
    for (let ci = chunks.length - 1; ci > 0; ci--) {
        const chunk = chunks[ci]
        if (chunk.state !== "added") continue
        let previ = ci - 1
        let prev = chunks[previ]
        while (prev && prev.state !== "existing") {
            prev = chunks[--previ]
        }
        if (!prev) throw new Error("missing previous chunk for added chunk")
        const prevLinei = prev.lineNumbers[prev.lineNumbers.length - 1]
        lines.splice(prevLinei, 0, ...chunk.lines)
    }

    return lines.filter((l) => l !== undefined).join("\n")
}


export function llmifyDiff(diff: string) {
    if (!diff) return diff

    const parsed = parseDiff(diff)
    for (const file of parsed) {
        for (const chunk of file.chunks) {
            let currentLineNumber = chunk.oldStart
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
                result += `${(change as any).line !== undefined ? `[${(change as any).line}] ` : ""}${change.content}\n`
            }
        }
    }

    return result
}
