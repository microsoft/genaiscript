/**
 * Example integration of unified.ts with existing markdown processing
 */

// Import our unified mdast functionality
import {
    processMarkdownWithMdast,
    containsHtmlComments,
    removeHtmlComments,
    type MdastOptions
} from "./unified"

// Import existing markdown functions
import { prettifyMarkdown, splitMarkdownTextImageParts } from "./markdown"

/**
 * Enhanced markdown prettification that can optionally remove HTML comments
 * @param md - The markdown string to prettify
 * @param options - Options including HTML comment handling
 * @returns The prettified markdown string
 */
export function prettifyMarkdownWithCommentHandling(
    md: string,
    options?: MdastOptions & { prettify?: boolean }
): string {
    const { ignoreHtmlComments = false, prettify = true } = options || {}
    
    let result = md
    
    // First, optionally remove HTML comments using our mdast implementation
    if (ignoreHtmlComments) {
        result = processMarkdownWithMdast(result, { ignoreHtmlComments: true })
    }
    
    // Then apply existing prettification if requested
    if (prettify) {
        result = prettifyMarkdown(result)
    }
    
    return result
}

/**
 * Enhanced markdown text/image splitting that can optionally ignore HTML comments
 * @param markdown - The markdown string to split
 * @param options - Options including HTML comment handling
 * @returns Array of text and image parts
 */
export async function splitMarkdownTextImagePartsWithCommentHandling(
    markdown: string,
    options?: MdastOptions & {
        dir?: string
        allowedDomains?: string[]
        convertToDataUri?: boolean
    }
) {
    const { ignoreHtmlComments = false, ...splitOptions } = options || {}
    
    let processedMarkdown = markdown
    
    // Optionally remove HTML comments before splitting
    if (ignoreHtmlComments) {
        processedMarkdown = processMarkdownWithMdast(processedMarkdown, { 
            ignoreHtmlComments: true 
        })
    }
    
    return await splitMarkdownTextImageParts(processedMarkdown, splitOptions)
}

/**
 * Helper function to analyze markdown content and suggest processing options
 * @param markdown - The markdown content to analyze
 * @returns Analysis results with suggestions
 */
export function analyzeMarkdownContent(markdown: string) {
    const hasComments = containsHtmlComments(markdown)
    const lines = markdown.split('\n')
    const commentLines = lines.filter(line => line.includes('<!--')).length
    
    return {
        hasHtmlComments: hasComments,
        commentLines,
        totalLines: lines.length,
        suggestions: {
            removeComments: hasComments && commentLines > 0 
                ? `Consider using ignoreHtmlComments: true to remove ${commentLines} HTML comment lines`
                : null,
            processing: hasComments 
                ? "HTML comments detected - use processMarkdownWithMdast with ignoreHtmlComments option"
                : "No HTML comments found - standard processing is sufficient"
        }
    }
}

/**
 * Convenience function to clean markdown for AI processing
 * Removes HTML comments and applies prettification
 * @param markdown - The markdown content to clean
 * @returns Cleaned markdown suitable for AI processing
 */
export function cleanMarkdownForAI(markdown: string): string {
    return prettifyMarkdownWithCommentHandling(markdown, {
        ignoreHtmlComments: true,
        prettify: true
    })
}