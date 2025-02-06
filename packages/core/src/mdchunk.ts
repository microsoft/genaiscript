/**
 * Chunks markdown according to headings, and maintains subtrees together.
 * It will be deafeated by code section that contain markdown themselves.
 * @param markdown
 * @param encoding
 * @param options
 * @returns
 */
export async function chunkMarkdown(
    markdown: string,
    estimateTokens: (text: string) => number,
    maxTokens = 4096
): Promise<string[]> {
    if (!markdown) return []

    type Section = { heading: string; lines: string[]; level: number }

    const lines = markdown.split(/\r?\n/g)

    const sections: Section[] = []
    let current: Section | null = null

    lines.forEach((line) => {
        const match = /^(\#{1,6})\s+(.*)/.exec(line)
        if (match) {
            if (current) sections.push(current)
            current = {
                heading: match[2],
                lines: [line],
                level: match[1].length,
            }
        } else {
            if (!current) current = { heading: "", lines: [], level: 0 }
            current.lines.push(line)
        }
    })
    if (current) sections.push(current)

    const chunks: string[] = []
    let tempChunk: Section[] = []
    let tokenCount = 0

    for (let i = 0; i < sections.length; i++) {
        const sectionTokens = sectionTokenCount(sections[i], estimateTokens)

        // Handle big single section immediately
        if (sectionTokens > maxTokens) {
            // Push it as its own chunk
            if (tempChunk.length) {
                chunks.push(buildChunk(tempChunk))
                tempChunk = []
                tokenCount = 0
            }
            chunks.push(buildChunk([sections[i]]))
            continue
        }

        if (tokenCount + sectionTokens <= maxTokens) {
            tempChunk.push(sections[i])
            tokenCount += sectionTokens
        } else {
            // Instead of discarding, gather removed sections and prepend them to the new chunk
            const removedSections: Section[] = []
            let j = i
            while (
                j > 0 &&
                sections[j].level > sections[j - 1].level &&
                tokenCount + sectionTokens > maxTokens &&
                tempChunk.length
            ) {
                const removed = tempChunk.pop()
                if (removed) {
                    removedSections.unshift(removed)
                    tokenCount -= sectionTokenCount(removed, estimateTokens)
                }
                j--
            }
            // Close off current chunk
            if (tempChunk.length) {
                chunks.push(buildChunk(tempChunk))
            }
            // Start the new chunk with removed and current
            tempChunk = [...removedSections, sections[i]]
            tokenCount = tempChunk.reduce(
                (acc, sec) => acc + sectionTokenCount(sec, estimateTokens),
                0
            )
        }
    }
    if (tempChunk.length) chunks.push(buildChunk(tempChunk))
    return chunks

    function sectionTokenCount(
        section: { lines: string[] },
        estimateTokens: (txt: string) => number
    ) {
        return section.lines.reduce(
            (acc, line) => acc + estimateTokens(line),
            0
        )
    }

    function buildChunk(sections: { lines: string[] }[]) {
        return sections.map((s) => s.lines.join("\n")).join("\n")
    }
}
