import parseDiff from "parse-diff"

/**
 * @param text Adds 1-based line numbers
 * @returns
 */
export function addLineNumbers(text: string, language?: string) {
    if (language === "diff") return addLineNumbersToDiff(text)

    return text
        .split("\n")
        .map((line, i) => `[${i + 1}] ${line}`)
        .join("\n")
}

export function removeLineNumbers(text: string) {
    const rx = /^\[\d+\] /
    const lines = text.split("\n")

    if (!lines.slice(0, 10).every((line) => rx.test(line))) return text

    return lines.map((line) => line.replace(rx, "")).join("\n")
}

export function addLineNumbersToDiff(diff: string) {
    if (!diff) return diff

    const parsed = parseDiff(diff)
    console.log(JSON.stringify(parsed, null, 2))
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
