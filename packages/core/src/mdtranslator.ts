/**
 * Markdown Translator Utility
 * 
 * This module provides utilities for translating markdown documents using LLMs.
 * It includes functions to parse markdown into lexical chunks, compute hashes for 
 * translation mapping, and reconstruct markdown from translations.
 */

import { hash } from "./crypto"
import { WorkspaceFile } from "./workspace"

/**
 * Represents a lexical chunk of markdown content
 */
export interface MarkdownChunk {
    /** Unique hash identifier for this chunk */
    hash: string
    /** Type of the chunk (heading, paragraph, list, blockquote, etc.) */
    type: string
    /** Original markdown content */
    content: string
    /** Line number where chunk starts (0-based) */
    startLine: number
    /** Line number where chunk ends (0-based) */
    endLine: number
    /** Hierarchy level for headings (1-6), or 0 for non-headings */
    level?: number
    /** Whether this chunk should be translated */
    translatable: boolean
}

/**
 * Translation mapping interface
 */
export interface TranslationMap {
    [hash: string]: string
}

/**
 * Options for parsing markdown
 */
export interface ParseOptions {
    /** Whether to include code blocks in translatable chunks */
    includeCodeBlocks?: boolean
    /** Whether to include HTML blocks in translatable chunks */
    includeHtmlBlocks?: boolean
    /** Custom hash algorithm (defaults to sha-256) */
    hashAlgorithm?: string
    /** Hash length (defaults to 12) */
    hashLength?: number
}

/**
 * Result of markdown parsing
 */
export interface ParseResult {
    /** Array of parsed chunks */
    chunks: MarkdownChunk[]
    /** Original content lines for reconstruction */
    originalLines: string[]
}

/**
 * Parses markdown content into lexical chunks using simple regex-based parsing
 * This is a lightweight implementation that doesn't require remark dependencies
 */
export async function parseMarkdown(
    content: string | WorkspaceFile,
    options: ParseOptions = {}
): Promise<ParseResult> {
    const {
        includeCodeBlocks = false,
        includeHtmlBlocks = false,
        hashAlgorithm = "sha-256",
        hashLength = 12
    } = options

    // Extract content and handle WorkspaceFile
    let markdownContent: string
    if (typeof content === "object") {
        if (content.encoding === "base64") {
            throw new Error("base64 encoding not supported")
        }
        markdownContent = content.content
    } else {
        markdownContent = content
    }

    const originalLines = markdownContent.split(/\r?\n/)
    const chunks: MarkdownChunk[] = []

    let i = 0
    while (i < originalLines.length) {
        const line = originalLines[i]
        
        // Skip empty lines
        if (!line.trim()) {
            i++
            continue
        }

        let chunkLines: string[] = []
        let chunkType = 'paragraph'
        let translatable = true
        let level: number | undefined = undefined
        let startLine = i
        let endLine = i

        // Check for heading
        const headingMatch = line.match(/^(#{1,6})\s+(.*)/)
        if (headingMatch) {
            chunkType = 'heading'
            level = headingMatch[1].length
            chunkLines = [line]
        }
        // Check for code block
        else if (line.startsWith('```')) {
            chunkType = 'code'
            translatable = includeCodeBlocks
            chunkLines = [line]
            i++
            
            // Find end of code block
            while (i < originalLines.length) {
                chunkLines.push(originalLines[i])
                if (originalLines[i].startsWith('```')) {
                    endLine = i
                    break
                }
                i++
            }
        }
        // Check for HTML block
        else if (line.trim().startsWith('<') && line.trim().endsWith('>')) {
            chunkType = 'html'
            translatable = includeHtmlBlocks
            chunkLines = [line]
            
            // For multi-line HTML, continue until we find a closing tag or empty line
            i++
            while (i < originalLines.length && originalLines[i].trim()) {
                chunkLines.push(originalLines[i])
                endLine = i
                if (originalLines[i].trim().endsWith('>')) {
                    break
                }
                i++
            }
        }
        // Check for list item
        else if (line.match(/^\s*[-*+]\s+/) || line.match(/^\s*\d+\.\s+/)) {
            chunkType = 'list'
            chunkLines = [line]
            
            // Continue with indented lines or additional list items
            i++
            while (i < originalLines.length) {
                const nextLine = originalLines[i]
                if (!nextLine.trim()) {
                    // Empty line - check if next non-empty line continues the list
                    const nextNonEmpty = i + 1
                    while (nextNonEmpty < originalLines.length && !originalLines[nextNonEmpty].trim()) {
                        i++
                    }
                    if (nextNonEmpty < originalLines.length && 
                        (originalLines[nextNonEmpty].match(/^\s*[-*+]\s+/) || 
                         originalLines[nextNonEmpty].match(/^\s*\d+\.\s+/) ||
                         originalLines[nextNonEmpty].startsWith('  '))) {
                        chunkLines.push('')
                        continue
                    } else {
                        break
                    }
                } else if (nextLine.match(/^\s*[-*+]\s+/) || 
                          nextLine.match(/^\s*\d+\.\s+/) || 
                          nextLine.startsWith('  ')) {
                    chunkLines.push(nextLine)
                    endLine = i
                } else {
                    break
                }
                i++
            }
        }
        // Check for blockquote
        else if (line.startsWith('>')) {
            chunkType = 'blockquote'
            chunkLines = [line]
            
            // Continue with blockquote lines
            i++
            while (i < originalLines.length && (originalLines[i].startsWith('>') || !originalLines[i].trim())) {
                chunkLines.push(originalLines[i])
                endLine = i
                if (originalLines[i].trim()) {
                    i++
                } else {
                    break
                }
            }
        }
        // Regular paragraph
        else {
            chunkLines = [line]
            
            // Continue with non-empty lines that don't start special syntax
            i++
            while (i < originalLines.length) {
                const nextLine = originalLines[i]
                if (!nextLine.trim() || 
                    nextLine.match(/^#{1,6}\s+/) ||
                    nextLine.startsWith('```') ||
                    nextLine.match(/^\s*[-*+]\s+/) ||
                    nextLine.match(/^\s*\d+\.\s+/) ||
                    nextLine.startsWith('>')) {
                    break
                }
                chunkLines.push(nextLine)
                endLine = i
                i++
            }
        }

        // Create chunk if we have content
        if (chunkLines.length > 0) {
            const content = chunkLines.join('\n')
            const chunkHash = hash(content, {
                algorithm: hashAlgorithm,
                length: hashLength
            })

            chunks.push({
                hash: chunkHash,
                type: chunkType,
                content,
                startLine,
                endLine,
                translatable,
                level
            })
        }

        i++
    }

    return {
        chunks,
        originalLines
    }
}

/**
 * Reconstructs markdown from translation map with fallback to original content
 */
export function reconstructMarkdown(
    parseResult: ParseResult,
    translationMap: TranslationMap
): string {
    const { chunks, originalLines } = parseResult
    const resultLines = [...originalLines]

    // Sort chunks by line number in reverse order to avoid line number shifts
    const sortedChunks = [...chunks].sort((a, b) => b.startLine - a.startLine)

    for (const chunk of sortedChunks) {
        if (chunk.translatable) {
            const translation = translationMap[chunk.hash]
            if (translation && translation.trim() !== chunk.content.trim()) {
                // Replace the chunk content with translation
                const chunkLines = translation.split(/\r?\n/)
                resultLines.splice(chunk.startLine, chunk.endLine - chunk.startLine + 1, ...chunkLines)
            }
        }
    }

    return resultLines.join('\n')
}

/**
 * Creates a translation map from chunks and their translations
 */
export function createTranslationMap(
    chunks: MarkdownChunk[],
    translations: string[]
): TranslationMap {
    const map: TranslationMap = {}
    
    const translatableChunks = chunks.filter(chunk => chunk.translatable)
    
    for (let i = 0; i < Math.min(translatableChunks.length, translations.length); i++) {
        const chunk = translatableChunks[i]
        const translation = translations[i]
        if (translation && translation.trim()) {
            map[chunk.hash] = translation
        }
    }
    
    return map
}

/**
 * Extracts translatable content from chunks
 */
export function extractTranslatableContent(chunks: MarkdownChunk[]): string[] {
    return chunks
        .filter(chunk => chunk.translatable)
        .map(chunk => chunk.content)
}