import { LocalDocument } from "./LocalDocument"
import { LocalDocumentIndex } from "./LocalDocumentIndex"
import {
    QueryResult,
    DocumentChunkMetadata,
    DocumentTextSection,
} from "./types"

/**
 * Represents a search result for a document stored on disk.
 */
export class LocalDocumentResult extends LocalDocument {
    private readonly _chunks: QueryResult<DocumentChunkMetadata>[]
    private readonly _tokenizer: Tokenizer
    private readonly _score: number

    /**
     * @private
     * Internal constructor for `LocalDocumentResult` instances.
     */
    public constructor(
        index: LocalDocumentIndex,
        id: string,
        uri: string,
        chunks: QueryResult<DocumentChunkMetadata>[],
        tokenizer: Tokenizer
    ) {
        super(index, id, uri)
        this._chunks = chunks
        this._tokenizer = tokenizer

        // Compute average score
        let score = 0
        this._chunks.forEach((chunk) => (score += chunk.score))
        this._score = score / this._chunks.length
    }

    /**
     * Returns the chunks of the document that matched the query.
     */
    public get chunks(): QueryResult<DocumentChunkMetadata>[] {
        return this._chunks
    }

    /**
     * Returns the average score of the document result.
     */
    public get score(): number {
        return this._score
    }

    /**
     * Renders all of the results chunks as spans of text (sections.)
     * @remarks
     * The returned sections will be sorted by document order and limited to maxTokens in length.
     * @param maxTokens Maximum number of tokens per section.
     * @returns Array of rendered text sections.
     */
    public async renderAllSections(
        maxTokens: number
    ): Promise<DocumentTextSection[]> {
        // Load text from disk
        const text = await this.loadText()

        // Add chunks to a temp array and split any chunks that are longer than maxTokens.
        const chunks: SectionChunk[] = []
        for (let i = 0; i < this._chunks.length; i++) {
            const chunk = this._chunks[i]
            const startPos = chunk.item.metadata.startPos
            const endPos = chunk.item.metadata.endPos
            const chunkText = text.substring(startPos, endPos + 1)
            const tokens = this._tokenizer.encode(chunkText)
            let offset = 0
            while (offset < tokens.length) {
                const chunkLength = Math.min(maxTokens, tokens.length - offset)
                chunks.push({
                    text: this._tokenizer.decode(
                        tokens.slice(offset, offset + chunkLength)
                    ),
                    startPos: startPos + offset,
                    endPos: startPos + offset + chunkLength - 1,
                    score: chunk.score,
                    tokenCount: chunkLength,
                })
                offset += chunkLength
            }
        }

        // Sort chunks by startPos
        const sorted = chunks.sort((a, b) => a.startPos - b.startPos)

        // Generate sections
        const sections: Section[] = []
        for (let i = 0; i < sorted.length; i++) {
            const chunk = sorted[i]
            let section = sections[sections.length - 1]
            if (!section || section.tokenCount + chunk.tokenCount > maxTokens) {
                section = {
                    chunks: [],
                    score: 0,
                    tokenCount: 0,
                }
                sections.push(section)
            }
            section.chunks.push(chunk)
            section.score += chunk.score
            section.tokenCount += chunk.tokenCount
        }

        // Normalize section scores
        sections.forEach((section) => (section.score /= section.chunks.length))

        // Return final rendered sections
        return sections.map((section) => {
            let text = ""
            section.chunks.forEach((chunk) => (text += chunk.text))
            return {
                text: text,
                tokenCount: section.tokenCount,
                score: section.score,
            }
        })
    }

    /**
     * Renders the top spans of text (sections) of the document based on the query result.
     * @remarks
     * The returned sections will be sorted by relevance and limited to the top `maxSections`.
     * @param maxTokens Maximum number of tokens per section.
     * @param maxSections Maximum number of sections to return.
     * @param overlappingChunks Optional. If true, overlapping chunks of text will be added to each section until the maxTokens is reached.
     * @returns Array of rendered text sections.
     */
    public async renderSections(
        maxTokens: number,
        maxSections: number,
        overlappingChunks = true
    ): Promise<DocumentTextSection[]> {
        // Load text from disk
        const text = await this.loadText()

        // First check to see if the entire document is shorter than maxTokens
        const length = await this.getLength()
        if (length <= maxTokens) {
            return [
                {
                    text,
                    tokenCount: length,
                    score: 1.0,
                },
            ]
        }

        // Otherwise, we need to split the document into sections
        // - Add each chunk to a temp array and filter out any chunk that's longer then maxTokens.
        // - Sort the array by startPos to arrange chunks in document order.
        // - Generate a new array of sections by combining chunks until the maxTokens is reached for each section.
        // - Generate an aggregate score for each section by averaging the score of each chunk in the section.
        // - Sort the sections by score and limit to maxSections.
        // - For each remaining section combine adjacent chunks of text.
        // - Dynamically add overlapping chunks of text to each section until the maxTokens is reached.
        const chunks: SectionChunk[] = this._chunks
            .map((chunk) => {
                const startPos = chunk.item.metadata.startPos
                const endPos = chunk.item.metadata.endPos
                const chunkText = text.substring(startPos, endPos + 1)
                return {
                    text: chunkText,
                    startPos,
                    endPos,
                    score: chunk.score,
                    tokenCount: this._tokenizer.encode(chunkText).length,
                }
            })
            .filter((chunk) => chunk.tokenCount <= maxTokens)
            .sort((a, b) => a.startPos - b.startPos)

        // Check for no chunks
        if (chunks.length === 0) {
            // Take the top chunk and return a subset of its text
            const topChunk = this._chunks[0]
            const startPos = topChunk.item.metadata.startPos
            const endPos = topChunk.item.metadata.endPos
            const chunkText = text.substring(startPos, endPos + 1)
            const tokens = this._tokenizer.encode(chunkText)
            return [
                {
                    text: this._tokenizer.decode(tokens.slice(0, maxTokens)),
                    tokenCount: maxTokens,
                    score: topChunk.score,
                },
            ]
        }

        // Generate sections
        const sections: Section[] = []
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]
            let section = sections[sections.length - 1]
            if (!section || section.tokenCount + chunk.tokenCount > maxTokens) {
                section = {
                    chunks: [],
                    score: 0,
                    tokenCount: 0,
                }
                sections.push(section)
            }
            section.chunks.push(chunk)
            section.score += chunk.score
            section.tokenCount += chunk.tokenCount
        }

        // Normalize section scores
        sections.forEach((section) => (section.score /= section.chunks.length))

        // Sort sections by score and limit to maxSections
        sections.sort((a, b) => b.score - a.score)
        if (sections.length > maxSections) {
            sections.splice(maxSections, sections.length - maxSections)
        }

        // Combine adjacent chunks of text
        sections.forEach((section) => {
            for (let i = 0; i < section.chunks.length - 1; i++) {
                const chunk = section.chunks[i]
                const nextChunk = section.chunks[i + 1]
                if (chunk.endPos + 1 === nextChunk.startPos) {
                    chunk.text += nextChunk.text
                    chunk.endPos = nextChunk.endPos
                    chunk.tokenCount += nextChunk.tokenCount
                    section.chunks.splice(i + 1, 1)
                    i--
                }
            }
        })

        // Add overlapping chunks of text to each section until the maxTokens is reached
        if (overlappingChunks) {
            const connector: SectionChunk = {
                text: "\n\n...\n\n",
                startPos: -1,
                endPos: -1,
                score: 0,
                tokenCount: this._tokenizer.encode("\n\n...\n\n").length,
            }
            sections.forEach((section) => {
                // Insert connectors between chunks
                if (section.chunks.length > 1) {
                    for (let i = 0; i < section.chunks.length - 1; i++) {
                        section.chunks.splice(i + 1, 0, connector)
                        section.tokenCount += connector.tokenCount
                        i++
                    }
                }

                // Add chunks to beginning and end of the section until maxTokens is reached
                let budget = maxTokens - section.tokenCount
                if (budget > 40) {
                    const sectionStart = section.chunks[0].startPos
                    const sectionEnd =
                        section.chunks[section.chunks.length - 1].endPos
                    if (sectionStart > 0) {
                        const beforeTex = text.substring(
                            0,
                            section.chunks[0].startPos
                        )
                        const beforeTokens = this.encodeBeforeText(
                            beforeTex,
                            Math.ceil(budget / 2)
                        )
                        const beforeBudget =
                            sectionEnd < text.length - 1
                                ? Math.min(
                                      beforeTokens.length,
                                      Math.ceil(budget / 2)
                                  )
                                : Math.min(beforeTokens.length, budget)
                        const chunk: SectionChunk = {
                            text: this._tokenizer.decode(
                                beforeTokens.slice(-beforeBudget)
                            ),
                            startPos: sectionStart - beforeBudget,
                            endPos: sectionStart - 1,
                            score: 0,
                            tokenCount: beforeBudget,
                        }
                        section.chunks.unshift(chunk)
                        section.tokenCount += chunk.tokenCount
                        budget -= chunk.tokenCount
                    }

                    if (sectionEnd < text.length - 1) {
                        const afterText = text.substring(sectionEnd + 1)
                        const afterTokens = this.encodeAfterText(
                            afterText,
                            budget
                        )
                        const afterBudget = Math.min(afterTokens.length, budget)
                        const chunk: SectionChunk = {
                            text: this._tokenizer.decode(
                                afterTokens.slice(0, afterBudget)
                            ),
                            startPos: sectionEnd + 1,
                            endPos: sectionEnd + afterBudget,
                            score: 0,
                            tokenCount: afterBudget,
                        }
                        section.chunks.push(chunk)
                        section.tokenCount += chunk.tokenCount
                        budget -= chunk.tokenCount
                    }
                }
            })
        }

        // Return final rendered sections
        return sections.map((section) => {
            let text = ""
            section.chunks.forEach((chunk) => (text += chunk.text))
            return {
                text: text,
                tokenCount: section.tokenCount,
                score: section.score,
            }
        })
    }

    private encodeBeforeText(text: string, budget: number): number[] {
        const maxLength = budget * 8
        const substr =
            text.length <= maxLength
                ? text
                : text.substring(text.length - maxLength)
        return this._tokenizer.encode(substr)
    }

    private encodeAfterText(text: string, budget: number): number[] {
        const maxLength = budget * 8
        const substr =
            text.length <= maxLength ? text : text.substring(0, maxLength)
        return this._tokenizer.encode(substr)
    }
}

interface SectionChunk {
    text: string
    startPos: number
    endPos: number
    score: number
    tokenCount: number
}

interface Section {
    chunks: SectionChunk[]
    score: number
    tokenCount: number
}
