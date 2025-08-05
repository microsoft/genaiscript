// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Chunks markdown into sections based on headings while maintaining subtrees.
 * Handles WorkspaceFile objects and plain markdown strings.
 * Does not reliably handle code sections containing markdown.
 * @param markdown - The markdown content as a string or a WorkspaceFile object. If a WorkspaceFile, its content is used. Throws if encoding is base64.
 * @param approximateTokens - Function to estimate token count of text. Used to calculate chunk sizes.
 * @param options - Optional configuration including maxTokens (default 4096) and pageSeparator (default "======").
 * @returns Array of TextChunk objects representing the chunks, including metadata such as filename and line range.
 */
export async function chunkMarkdown(markdown, approximateTokens, options) {
    const { maxTokens = 4096, pageSeparator = "======" } = options || {};
    if (!markdown)
        return [];
    const filename = typeof markdown === "object" ? markdown.filename : "";
    if (typeof markdown === "object") {
        if (markdown.encoding === "base64")
            throw new Error("base64 encoding not supported");
        markdown = markdown.content;
    }
    const lines = markdown.split(/\r?\n/g);
    const sections = [];
    let current = null;
    lines.forEach((line) => {
        if (line.startsWith(pageSeparator)) {
            if (current)
                sections.push(current);
            current = null;
            return;
        }
        const match = /^(#{1,6})\s+(.*)/.exec(line);
        if (match) {
            if (current)
                sections.push(current);
            current = {
                heading: match[2],
                lines: [line],
                level: match[1].length,
            };
            return;
        }
        if (!current)
            current = { heading: "", lines: [], level: 0 };
        current.lines.push(line);
    });
    if (current)
        sections.push(current);
    const chunks = [];
    let tempChunk = [];
    let tokenCount = 0;
    for (let i = 0; i < sections.length; i++) {
        const sectionTokens = sectionTokenCount(sections[i], approximateTokens);
        if (sectionTokens > maxTokens) {
            if (tempChunk.length) {
                chunks.push(buildChunk(tempChunk));
                tempChunk = [];
                tokenCount = 0;
            }
            chunks.push(buildChunk([sections[i]]));
            continue;
        }
        if (tokenCount + sectionTokens <= maxTokens) {
            tempChunk.push(sections[i]);
            tokenCount += sectionTokens;
        }
        else {
            // Instead of discarding, gather removed sections and prepend them to the new chunk
            const removedSections = [];
            let j = i;
            while (j > 0 &&
                sections[j].level > sections[j - 1].level &&
                tokenCount + sectionTokens > maxTokens &&
                tempChunk.length) {
                const removed = tempChunk.pop();
                if (removed) {
                    removedSections.unshift(removed);
                    tokenCount -= sectionTokenCount(removed, approximateTokens);
                }
                j--;
            }
            // Close off current chunk
            if (tempChunk.length) {
                chunks.push(buildChunk(tempChunk));
            }
            // Start the new chunk with removed and current
            tempChunk = [...removedSections, sections[i]];
            tokenCount = tempChunk.reduce((acc, sec) => acc + sectionTokenCount(sec, approximateTokens), 0);
        }
    }
    if (tempChunk.length)
        chunks.push(buildChunk(tempChunk));
    // convert into text chunk
    let currentLine = 0;
    return chunks.map((chunk, i) => ({
        filename: filename + `#chunk${i}`,
        lineStart: currentLine,
        lineEnd: (currentLine += chunk.split(/\r?\n/g).length),
        content: chunk,
    }));
    function sectionTokenCount(section, tokenCount) {
        return section.lines.reduce((acc, line) => acc + tokenCount(line), 0);
    }
    function buildChunk(sections) {
        return sections.map((s) => s.lines.join("\n")).join("\n");
    }
}
//# sourceMappingURL=mdchunk.js.map