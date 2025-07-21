import { splitMarkdown, frontmatterTryParse } from "./frontmatter"
import { deleteUndefinedValues } from "./cleaners"
import { JSON5Stringify } from "./json5"

/**
 * Interface representing a content segment (either text or code)
 */
interface ContentSegment {
    type: 'text' | 'code'
    content: string
}

/**
 * Interface representing a parsed .genai.md document
 */
interface GenaiMdDocument {
    meta: PromptArgs
    frontmatter: any
    segments: ContentSegment[]
}

/**
 * Converts frontmatter from a .genai.md file to PromptArgs metadata
 * @param frontmatter - The parsed frontmatter object
 * @returns PromptArgs object with converted metadata
 */
function genaiMdFrontmatterToMeta(frontmatter: any): PromptArgs {
    if (!frontmatter || typeof frontmatter !== 'object') {
        return {}
    }

    // Directly map frontmatter properties to PromptArgs
    // This allows full flexibility in defining script properties
    const meta = deleteUndefinedValues({
        title: frontmatter.title,
        description: frontmatter.description,
        model: frontmatter.model,
        temperature: frontmatter.temperature,
        maxTokens: frontmatter.maxTokens || frontmatter.max_tokens,
        topP: frontmatter.topP || frontmatter.top_p,
        seed: frontmatter.seed,
        responseType: frontmatter.responseType || frontmatter.response_type,
        responseSchema: frontmatter.responseSchema || frontmatter.response_schema,
        parameters: frontmatter.parameters,
        files: frontmatter.files,
        tests: frontmatter.tests,
        unlisted: frontmatter.unlisted,
        isSystem: frontmatter.isSystem || frontmatter.is_system,
        group: frontmatter.group,
        ...frontmatter // Allow any additional properties
    } satisfies PromptArgs)

    return meta
}

/**
 * Parses markdown content into alternating text and code segments
 * @param content - The markdown content to parse
 * @returns Array of content segments in order
 */
function parseContentSegments(content: string): ContentSegment[] {
    const segments: ContentSegment[] = []
    
    // Split content by genai code blocks while preserving the split positions
    const regex = /```(?:ts|typescript)\s+genai\s*\n([\s\S]*?)\n```/gi
    let lastIndex = 0
    let match: RegExpExecArray | null
    
    while ((match = regex.exec(content)) !== null) {
        // Add text segment before the code block (if any)
        const textBefore = content.slice(lastIndex, match.index).trim()
        if (textBefore) {
            segments.push({ type: 'text', content: textBefore })
        }
        
        // Add code segment
        const code = match[1].trim()
        if (code) {
            segments.push({ type: 'code', content: code })
        }
        
        lastIndex = match.index + match[0].length
    }
    
    // Add remaining text after the last code block (if any)
    const textAfter = content.slice(lastIndex).trim()
    if (textAfter) {
        segments.push({ type: 'text', content: textAfter })
    }
    
    return segments
}

/**
 * Parses a .genai.md document from filename and text content
 * @param filename - The name of the file being processed
 * @param text - The raw text of the document
 * @returns GenaiMdDocument object representing the parsed document
 */
export function genaiMdParse(filename: string, text: string): GenaiMdDocument {
    const { frontmatter = "", content = "" } = splitMarkdown(text)
    
    // Parse frontmatter using frontmatterTryParse
    const frontmatterObj = frontmatter ? frontmatterTryParse(text)?.value : {}
    const meta: PromptArgs = genaiMdFrontmatterToMeta(frontmatterObj)
    
    if (filename) meta.filename = filename
    
    // Parse content into segments
    const segments = parseContentSegments(content)
    
    return { 
        meta, 
        frontmatter: frontmatterObj, 
        segments
    }
}

/**
 * Converts a GenaiMdDocument into a GenAIScript
 * @param doc - The GenaiMdDocument to convert
 * @returns String containing the generated GenAIScript
 */
export function genaiMdToGenAIScript(doc: GenaiMdDocument): string {
    const { meta, segments } = doc
    
    let src = ''
    
    // Add script configuration if metadata exists
    if (Object.keys(meta).length > 0) {
        src += `script(${JSON5Stringify(meta, null, 2)})\n\n`
    }
    
    // Process segments in order, interleaving text and code
    for (const segment of segments) {
        if (segment.type === 'code') {
            // Add code block directly
            src += segment.content + '\n\n'
        } else if (segment.type === 'text') {
            // Add text as template literal
            const escapedContent = segment.content.replace(/`/g, '\\`')
            src += `$\`${escapedContent}\`\n\n`
        }
    }
    
    return src.trim()
}