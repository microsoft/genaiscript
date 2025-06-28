/**
 * Unified markdown processing with mdast (Markdown Abstract Syntax Tree) support.
 * Provides options for handling HTML comments in markdown content.
 */

/**
 * Basic mdast node type for when mdast types are not available
 */
export interface MdastRoot {
    type: "root"
    children: Array<any>
    [key: string]: any
}

/**
 * Options for markdown processing with mdast
 */
export interface MdastOptions {
    /**
     * Whether to ignore HTML comments in the markdown.
     * When true, HTML comments will be removed from the processed output.
     * When false, HTML comments will be preserved.
     * @default false
     */
    ignoreHtmlComments?: boolean
}

// Try to import unified packages, fall back to minimal implementation if not available
let unified: any, remarkParse: any, remarkStringify: any, remarkComment: any
try {
    // These imports will be available when the packages are installed
    // Using dynamic imports to handle optional dependencies
    unified = eval('require("unified")')
    remarkParse = eval('require("remark-parse")')
    remarkStringify = eval('require("remark-stringify")')
    remarkComment = eval('require("@slorber/remark-comment")')
} catch (e) {
    // Fallback to minimal implementations
    // Don't log warning during tests or when dependencies are intentionally missing
}

/**
 * Parse markdown content to mdast (Markdown Abstract Syntax Tree)
 * @param markdown - The markdown content to parse
 * @param options - Options for processing
 * @returns The parsed mdast root node
 */
export function parseMarkdownToMdast(
    markdown: string,
    options?: MdastOptions
): MdastRoot {
    const { ignoreHtmlComments = false } = options || {}

    if (unified && remarkParse) {
        const processor = unified.default ? unified.default() : unified()
        processor.use(remarkParse.default || remarkParse)

        // Apply the remark-comment plugin if we want to ignore HTML comments
        if (ignoreHtmlComments && remarkComment) {
            processor.use(remarkComment.default || remarkComment)
        }

        return processor.parse(markdown) as MdastRoot
    } else {
        // Fallback: create a minimal mdast-like structure
        let content = markdown
        if (ignoreHtmlComments) {
            content = removeHtmlCommentsSimple(content)
        }
        return {
            type: "root",
            children: [
                {
                    type: "text",
                    value: content,
                },
            ],
        }
    }
}

/**
 * Process markdown content with mdast, applying transformations based on options
 * @param markdown - The markdown content to process
 * @param options - Options for processing
 * @returns The processed markdown content
 */
export function processMarkdownWithMdast(
    markdown: string,
    options?: MdastOptions
): string {
    const { ignoreHtmlComments = false } = options || {}

    if (unified && remarkParse && remarkStringify) {
        let processor = unified.default ? unified.default() : unified()
        processor = processor.use(remarkParse.default || remarkParse)

        // Apply the remark-comment plugin if we want to ignore HTML comments
        if (ignoreHtmlComments && remarkComment) {
            processor = processor.use(remarkComment.default || remarkComment)
        }

        processor = processor.use(remarkStringify.default || remarkStringify)

        const result = processor.processSync(markdown)
        return String(result)
    } else {
        // Fallback: simple string processing
        if (ignoreHtmlComments) {
            return removeHtmlCommentsSimple(markdown)
        }
        return markdown
    }
}

/**
 * Stringify an mdast tree back to markdown
 * @param tree - The mdast tree to stringify
 * @returns The markdown string
 */
export function stringifyMdast(tree: MdastRoot): string {
    if (unified && remarkStringify) {
        const processor = unified.default ? unified.default() : unified()
        processor.use(remarkStringify.default || remarkStringify)
        const result = processor.stringify(tree)
        return String(result)
    } else {
        // Fallback: extract text content
        return extractTextFromTree(tree)
    }
}

/**
 * Check if markdown content contains HTML comments
 * @param markdown - The markdown content to check
 * @returns True if HTML comments are found, false otherwise
 */
export function containsHtmlComments(markdown: string): boolean {
    // Simple regex to detect HTML comments
    const htmlCommentRegex = /<!--[\s\S]*?-->/g
    return htmlCommentRegex.test(markdown)
}

/**
 * Remove HTML comments from markdown using mdast processing
 * @param markdown - The markdown content to process
 * @returns The markdown content with HTML comments removed
 */
export function removeHtmlComments(markdown: string): string {
    return processMarkdownWithMdast(markdown, { ignoreHtmlComments: true })
}

/**
 * Simple fallback function to remove HTML comments using regex
 * @param markdown - The markdown content
 * @returns The markdown content with HTML comments removed
 */
function removeHtmlCommentsSimple(markdown: string): string {
    // Remove HTML comments using regex, handling nested cases and edge cases
    // This regex handles:
    // - Single line comments: <!-- comment -->
    // - Multi-line comments: <!-- comment\nmore\nlines -->
    // - Comments with special characters and nested content
    return markdown.replace(/<!--[\s\S]*?-->/g, "").replace(/\n\s*\n\s*\n/g, "\n\n")
}

/**
 * Extract text content from an mdast tree (fallback implementation)
 * @param tree - The mdast tree
 * @returns The text content
 */
function extractTextFromTree(tree: any): string {
    if (typeof tree === "string") return tree
    if (tree?.value) return tree.value
    if (tree?.children && Array.isArray(tree.children)) {
        return tree.children.map(extractTextFromTree).join("")
    }
    return ""
}