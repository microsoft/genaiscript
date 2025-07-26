script({
    title: "LLM-optimized content generator",
    description: "Analyze markdown files and generate LLM-optimized content for the 'llmstxt' frontmatter field",
    group: "docs",
    system: ["system", "system.files"],
    temperature: 0.3,
    model: "large",
})

defFileOutput("*.{md,mdx}", "Updated markdown files with LLM-optimized content")
defFileMerge(function llmstxt(fn, label, before, generated) {
    if (!/\.mdx?$/i.test(fn)) return undefined
    
    // Parse the generated LLM-optimized content
    const optimizedContent = generated.trim()
    
    // Skip if no content was generated or if it's too short to be useful
    if (!optimizedContent || optimizedContent.length < 10) {
        return undefined
    }
    
    // Calculate hash of the current content (excluding frontmatter)
    const { content } = MD.parseFrontmatter(before)
    const contentHash = MD5(content.trim())
    
    // Update frontmatter with both the optimized content and content hash
    const updated = MD.updateFrontmatter(before, {
        llmstxt: optimizedContent,
        llmstxtHash: contentHash,
    })
    return updated
})

// Filter markdown and MDX files and check if they need updating
const markdownFiles = env.files.filter(f => {
    if (!/\.mdx?$/i.test(f.filename)) return false
    
    // Parse frontmatter to check existing hash
    const { frontmatter, content } = MD.parseFrontmatter(f.content)
    const currentHash = MD5(content.trim())
    const existingHash = frontmatter?.llmstxtHash
    
    // Include file if hash is different or doesn't exist
    if (!existingHash || existingHash !== currentHash) {
        console.log(`File ${f.filename} needs LLM optimization (hash changed or missing)`)
        return true
    }
    
    console.log(`File ${f.filename} skipped (content unchanged)`)
    return false
})

def("FILES", markdownFiles)

$`
You are an expert at optimizing content for Large Language Model (LLM) consumption and understanding.

For each file in FILES, analyze the markdown content (excluding the frontmatter) and generate a concise, LLM-optimized version that:

## Requirements:
1. **Extract the core concepts and information** from the original content
2. **Use clear, direct language** that LLMs can easily parse and understand
3. **Maintain technical accuracy** while simplifying complex explanations
4. **Include key code examples or snippets** in a simplified form when relevant
5. **Preserve important terminology and concepts** specific to the domain
6. **Focus on actionable information** and key insights
7. **Use structured format** with clear sections when applicable

## Optimization Guidelines:
- Remove redundant explanations and filler words
- Convert verbose descriptions into concise bullet points when appropriate
- Simplify complex sentence structures
- Focus on the "what", "why", and "how" of the content
- Maintain context that would be important for an LLM to understand the topic
- Keep technical accuracy but improve clarity
- Aim for 30-50% reduction in length while preserving essential information

## Output Format:
Generate ONLY the optimized content text - do not include frontmatter, markdown headers, or any metadata.
The output should be clean, readable text that can be directly inserted into the 'llmstxt' frontmatter field.

Focus on making the content more digestible for LLM processing while retaining all the important information and context.
`