export interface ChangeLogChunk {
    start: number
    end: number
    lines: { index: number; content: string }[]
}

export interface ChangeLogChange {
    original: ChangeLogChunk
    changed: ChangeLogChunk
}

export interface ChangeLog {
    index: number
    filename: string
    description: string
    changes: ChangeLogChange[]
}

/**
 *
 * @param source
 *
 */
export function parseChangeLogs(source: string): ChangeLog[] {
    const lines = source.split("\n")
    const changelogs: ChangeLog[] = []

    // outer loop
    while (lines.length) {
        if (!lines[0].trim()) {
            lines.shift()
            continue
        }
        // ChangeLog:....
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

        // Description:...
        m = /^Description:(?<description>.*)$/i.exec(lines[0])
        if (!m) throw new Error("missing ChangeLog description")
        changelog.description = m.groups.description.trim()
        lines.shift()

        // changes
        while (lines.length) {
            const change = parseChange()
            if (change) changelog.changes.push(change)
            else break
        }
    }
    return changelogs

    function parseChange(): ChangeLogChange {
        let m = /^OriginalCode@(?<start>\d+)-(?<end>\d+):$/i.exec(lines[0])
        if (!m) return undefined
        lines.shift()

        const original = parseChunk(m)

        m = /^ChangedCode@(?<start>\d+)-(?<end>\d+):$/i.exec(lines[0])
        if (!m) throw new Error("missing ChangedCode Changed in " + lines[0])

        lines.shift()
        const changed = parseChunk(m)
        return <ChangeLogChange>{ original, changed }
    }

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
                chunk.lines.push({
                    index: parseInt(m.groups.index),
                    content: m.groups.content,
                })
                lines.shift()
            } else {
                break
            }
        }
        return chunk
    }
    /*

ChangeLog:1@<file>
Description: <summary>.
OriginalCode@4-6:
[4] <white space> <original code line>
[5] <white space> <original code line>
[6] <white space> <original code line>
ChangedCode@4-6:
[4] <white space> <changed code line>
[5] <white space> <changed code line>
[6] <white space> <changed code line>
OriginalCode@9-10:
[9] <white space> <original code line>
[10] <white space> <original code line>
ChangedCode@9-9:
[9] <white space> <changed code line>
ChangeLog:K@<file>
Description: <summary>.
OriginalCode@15-16:
[15] <white space> <original code line>
[16] <white space> <original code line>
ChangedCode@15-17:
[15] <white space> <changed code line>
[16] <white space> <changed code line>
[17] <white space> <changed code line>
OriginalCode@23-23:
[23] <white space> <original code line>
ChangedCode@23-23:
[23] <white space> <changed code line>`

*/
}

export function applyChangeLog(source: string, changelog: ChangeLog): string {
    const lines = source.split("\n")
    for (let i = 0; i < changelog.changes.length; ++i) {
        const change = changelog.changes[i]
        const { original, changed } = change
        lines.splice(
            original.start - 1,
            original.end - original.start + 1,
            ...changed.lines.map((l) => l.content)
        )
        const shift = changed.lines.length - original.lines.length
        for (let j = i + 1; j < changelog.changes.length; ++j) {
            const c = changelog.changes[j]
            c.original.start += shift
            c.original.end += shift
        }
    }
    return lines.join("\n")
}
