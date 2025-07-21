import { splitMarkdown, frontmatterTryParse } from "./frontmatter"
import { deleteUndefinedValues } from "./cleaners"
import { JSON5Stringify } from "./json5"

/**
 * Interface representing a parsed .genai.md document
 */
interface GenaiMdDocument {
    meta: PromptArgs
    frontmatter: any
    content: string
    codeBlocks: string[]
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
 * Extracts TypeScript code blocks from markdown content
 * @param content - The markdown content to parse
 * @returns Array of extracted code strings
 */
function extractGenaiCodeBlocks(content: string): string[] {
    const codeBlocks: string[] = []
    
    // Match ```ts genai or ```typescript genai code blocks
    const regex = /```(?:ts|typescript)\s+genai\s*\n([\s\S]*?)\n```/gi
    let match: RegExpExecArray | null
    
    while ((match = regex.exec(content)) !== null) {
        const code = match[1].trim()
        if (code) {
            codeBlocks.push(code)
        }
    }
    
    return codeBlocks
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
    
    // Extract genai code blocks
    const codeBlocks = extractGenaiCodeBlocks(content)
    
    return { 
        meta, 
        frontmatter: frontmatterObj, 
        content, 
        codeBlocks 
    }
}

/**
 * Converts a GenaiMdDocument into a GenAIScript
 * @param doc - The GenaiMdDocument to convert
 * @returns String containing the generated GenAIScript
 */
export function genaiMdToGenAIScript(doc: GenaiMdDocument): string {
    const { meta, content, codeBlocks } = doc
    
    let src = ''
    
    // Add script configuration if metadata exists
    if (Object.keys(meta).length > 0) {
        src += `script(${JSON5Stringify(meta, null, 2)})\n\n`
    }
    
    // Add extracted code blocks inline
    if (codeBlocks.length > 0) {
        src += codeBlocks.join('\n\n') + '\n\n'
    }
    
    // Add the remaining markdown content as a template string
    // Remove the genai code blocks from content since they're already extracted
    let cleanContent = content
    cleanContent = cleanContent.replace(/```(?:ts|typescript)\s+genai\s*\n[\s\S]*?\n```/gi, '')
    cleanContent = cleanContent.trim()
    
    if (cleanContent) {
        // Escape backticks in the content and add as template literal
        const escapedContent = cleanContent.replace(/`/g, '\\`')
        src += `$\`${escapedContent}\``
    }
    
    return src
}