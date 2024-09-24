/**
 * Defines interfaces and functions for parsing and applying changelogs.
 * A changelog describes changes between original and modified code segments.
 */

// Represents a chunk of code with a start and end line and its content.
export interface ChangeLogChunk {
    start: number // Starting line number
    end: number // Ending line number
    lines: { index: number; content: string }[] // Lines of code within the chunk
}

// Represents a change between an original and a changed code chunk.
export interface ChangeLogChange {
    original: ChangeLogChunk // Original code chunk
    changed: ChangeLogChunk // Changed code chunk
}

// Represents a complete changelog for a file.
export interface ChangeLog {
    index: number // Index of the changelog entry
    filename: string // Filename associated with the changelog
    description: string // Description of the changes
    changes: ChangeLogChange[] // List of changes within the changelog
}

/**
 * Parses the raw changelog string into structured ChangeLog objects.
 *
 * @param source The raw string containing changelog information.
 * @returns An array of parsed ChangeLog objects.
 */
export function parseChangeLogs(source: string): ChangeLog[] {
    const lines = source.split("\n")
    const changelogs: ChangeLog[] = []

    // Process each line to extract changelog information.
    while (lines.length) {
        if (!lines[0].trim()) {
            lines.shift()
            continue // Skip empty lines
        }

        // Parse the ChangeLog header line.
        let m = /^ChangeLog:\s*(?<index>\d+)@(?<file>.*)$/i.exec(lines[0])
        if (!m) throw new Error("missing ChangeLog header in " + lines[0])
        const changelog: ChangeLog = {
            index: parseInt(m.groups.index),
            filename: m.groups.file.trim(),
            description: undefined,
            changes: [],
        }
        changelogs.push(changelog)
        lines.shift()

        // Parse the Description line.
        m = /^Description:(?<description>.*)$/i.exec(lines[0])
        if (!m) throw new Error("missing ChangeLog description")
        changelog.description = m.groups.description.trim()
        lines.shift()

        // Parse changes block.
        while (lines.length) {
            // Skip empty lines.
            if (/^\s*$/.test(lines[0])) {
                lines.shift()
                continue
            }
            // Attempt to parse a change.
            const change = parseChange()
            if (change) changelog.changes.push(change)
            else break
        }
    }
    return changelogs

    // Parses a single change within the changelog.
    function parseChange(): ChangeLogChange {
        // Parse OriginalCode block
        let m = /^OriginalCode@(?<start>\d+)-(?<end>\d+):$/i.exec(lines[0])
        if (!m) return undefined
        lines.shift()

        const original = parseChunk(m)

        // Parse ChangedCode block
        m = /^ChangedCode@(?<start>\d+)-(?<end>\d+):$/i.exec(lines[0])
        if (!m) throw new Error("missing ChangedCode Changed in " + lines[0])

        lines.shift()
        const changed = parseChunk(m)
        return <ChangeLogChange>{ original, changed }
    }

    // Parses a chunk of code from the changelog.
    function parseChunk(m: RegExpExecArray): ChangeLogChunk {
        const start = parseInt(m.groups.start)
        const end = parseInt(m.groups.end)
        const chunk: ChangeLogChunk = {
            start,
            end,
            lines: [],
        }
        while (lines.length) {
            m = /^\[(?<index>\d+)\](?<content>.*)$/i.exec(lines[0])
            if (m) {
                let content = m.groups.content
                if (content[0] === " ") content = content.slice(1)
                chunk.lines.push({
                    index: parseInt(m.groups.index),
                    content,
                })
                lines.shift()
            } else {
                break
            }
        }
        return chunk
    }

    /*
    Example changelog format:
    ChangeLog:1@<file>
    Description: <summary>.
    OriginalCode@4-6:
    [4] <white space> <original code line>
    // More lines
    ChangedCode@4-6:
    [4] <white space> <changed code line>
    // More lines
    */
}

/**
 * Applies a changelog to a given source string, modifying it according to the changes.
 *
 * @param source The original source code as a string.
 * @param changelog The ChangeLog object containing the changes to apply.
 * @returns The modified source code as a string.
 */
export function applyChangeLog(source: string, changelog: ChangeLog): string {
    const lines = source.split("\n")
    for (let i = 0; i < changelog.changes.length; ++i) {
        const change = changelog.changes[i]
        const { original, changed } = change

        // Replace original lines with changed lines in the source.
        lines.splice(
            original.start - 1,
            original.end - original.start + 1,
            ...changed.lines.map((l) => l.content)
        )

        // Adjust subsequent change indices based on the shift in lines.
        const shift = changed.lines.length - original.lines.length
        for (let j = i + 1; j < changelog.changes.length; ++j) {
            const c = changelog.changes[j]
            c.original.start += shift
            c.original.end += shift
        }
    }
    return lines.join("\n")
}
