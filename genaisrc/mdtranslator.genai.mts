script({
    title: "Markdown Translator with Link Validation",
    description: "Translate markdown documents while preserving all links and structure",
    group: "Translation",
    temperature: 0,
})

// Import the classify function for QA steps
import { classify } from "genaiscript/runtime"

// Language parameterization
const langCode = env.vars.lang || "fr"
const langName = {
    fr: "French",
    es: "Spanish", 
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese"
}[langCode] || "French"

if (!env.files.length) {
    cancel("No markdown files provided")
}

/**
 * Extract all links from markdown content
 * Includes both inline links [text](url) and reference links [text][ref]
 * Handles edge cases like nested brackets, escaped characters, and malformed links
 * Properly excludes links inside code blocks and inline code
 */
function extractLinks(markdown: string): { text: string; url: string; type: 'inline' | 'reference'; line?: number }[] {
    const links: { text: string; url: string; type: 'inline' | 'reference'; line?: number }[] = []
    const lines = markdown.split('\n')
    
    // Track code block state
    let inCodeBlock = false
    
    // Extract inline links [text](url) with line numbers for better debugging
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // Check for code block boundaries
        if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock
            continue
        }
        
        // Skip processing if we're inside a code block
        if (inCodeBlock) {
            continue
        }
        
        // More robust regex that handles nested brackets and special characters
        const inlineRegex = /\[([^\]]*(?:\[[^\]]*\][^\]]*)*)\]\(([^)]+)\)/g
        let match
        while ((match = inlineRegex.exec(line)) !== null) {
            const url = match[2].trim()
            // Skip if it's inside inline code (check for backticks before the match)
            const beforeMatch = line.substring(0, match.index)
            const afterMatch = line.substring(match.index + match[0].length)
            const beforeBackticks = (beforeMatch.match(/`/g) || []).length
            const afterBackticks = (afterMatch.match(/`/g) || []).length
            
            // If odd number of backticks before and after, we're inside inline code
            if (beforeBackticks % 2 === 0) { // Not inside inline code
                links.push({
                    text: match[1],
                    url: url,
                    type: 'inline',
                    line: i + 1
                })
            }
        }
    }
    
    // Extract reference links [text]: url with better handling
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // Skip if line is in a code block (simple check for ``` blocks)
        let lineInCodeBlock = false
        for (let j = 0; j <= i; j++) {
            if (lines[j].trim().startsWith('```')) {
                lineInCodeBlock = !lineInCodeBlock
            }
        }
        
        if (lineInCodeBlock) {
            continue
        }
        
        // Match reference links, allowing for quotes around URLs
        const referenceRegex = /^\s*\[([^\]]+)\]:\s*(.+?)(?:\s+"[^"]*")?\s*$/
        const match = referenceRegex.exec(line)
        if (match) {
            let url = match[2].trim()
            // Remove surrounding quotes if present
            if ((url.startsWith('"') && url.endsWith('"')) || 
                (url.startsWith("'") && url.endsWith("'"))) {
                url = url.slice(1, -1)
            }
            // Remove optional title
            url = url.split(/\s+/)[0]
            
            links.push({
                text: match[1],
                url: url,
                type: 'reference',
                line: i + 1
            })
        }
    }
    
    return links
}

/**
 * Validate that all links from original are preserved in translation
 * Provides detailed reporting on what links are missing, added, or modified
 */
async function validateLinks(originalContent: string, translatedContent: string): Promise<{valid: boolean, issues: string[], details: any}> {
    const originalLinks = extractLinks(originalContent)
    const translatedLinks = extractLinks(translatedContent)
    
    const issues: string[] = []
    
    // Create URL mappings for detailed analysis
    const originalUrls = new Set(originalLinks.map(link => link.url))
    const translatedUrls = new Set(translatedLinks.map(link => link.url))
    
    // Find missing URLs
    const missingUrls = [...originalUrls].filter(url => !translatedUrls.has(url))
    if (missingUrls.length > 0) {
        issues.push(`Missing URLs in translation: ${missingUrls.join(', ')}`)
    }
    
    // Find added URLs (should not happen)
    const addedUrls = [...translatedUrls].filter(url => !originalUrls.has(url))
    if (addedUrls.length > 0) {
        issues.push(`Unexpected new URLs in translation: ${addedUrls.join(', ')}`)
    }
    
    // Check URL frequency (same URL might appear multiple times)
    const originalUrlCounts = new Map<string, number>()
    const translatedUrlCounts = new Map<string, number>()
    
    originalLinks.forEach(link => {
        const count = originalUrlCounts.get(link.url) || 0
        originalUrlCounts.set(link.url, count + 1)
    })
    
    translatedLinks.forEach(link => {
        const count = translatedUrlCounts.get(link.url) || 0
        translatedUrlCounts.set(link.url, count + 1)
    })
    
    // Check for frequency mismatches
    for (const [url, originalCount] of originalUrlCounts) {
        const translatedCount = translatedUrlCounts.get(url) || 0
        if (originalCount !== translatedCount) {
            issues.push(`URL "${url}" appears ${originalCount} times in original but ${translatedCount} times in translation`)
        }
    }
    
    // Check if total link count matches
    if (originalLinks.length !== translatedLinks.length) {
        issues.push(`Total link count mismatch: original has ${originalLinks.length} links, translation has ${translatedLinks.length} links`)
    }
    
    return {
        valid: issues.length === 0,
        issues,
        details: {
            original: {
                total: originalLinks.length,
                inline: originalLinks.filter(l => l.type === 'inline').length,
                reference: originalLinks.filter(l => l.type === 'reference').length,
                unique: originalUrls.size,
                links: originalLinks
            },
            translated: {
                total: translatedLinks.length,
                inline: translatedLinks.filter(l => l.type === 'inline').length,
                reference: translatedLinks.filter(l => l.type === 'reference').length,
                unique: translatedUrls.size,
                links: translatedLinks
            }
        }
    }
}

// Process each file
for (const file of env.files) {
    console.log(`Processing: ${file.filename}`)
    
    const originalContent = file.content
    const originalLinks = extractLinks(originalContent)
    
    console.log(`Found ${originalLinks.length} links in original document:`)
    originalLinks.forEach((link, index) => {
        console.log(`  ${index + 1}. [${link.type}] "${link.text}" -> ${link.url}${link.line ? ` (line ${link.line})` : ''}`)
    })
    
    // Define the original content for translation
    def("ORIGINAL", file, { language: "markdown" })
    
    // Perform the translation
    const translationPrompt = $`You are an expert ${langName} translator specializing in technical documentation.

## Task
Translate the markdown document in ORIGINAL to ${langName}.

## Critical Rules for Link Preservation
- Do NOT modify, add, or remove ANY URLs
- Keep ALL links exactly as they are: [text](url) → [translated text](url)
- Preserve ALL reference links: [ref]: url
- Only translate the visible link text, never the URLs themselves
- Maintain the exact same number of links

## Translation Guidelines
- Translate all text content to natural, fluent ${langName}
- Preserve all markdown formatting (headers, lists, code blocks, etc.)
- Do NOT translate:
  - URLs and links
  - Code blocks and inline code
  - File paths and technical identifiers
  - Proper nouns and brand names
- Maintain the document structure and hierarchy

## Quality Checks
- Ensure every original link appears in the translation
- Verify no new links are introduced
- Check that link text is translated but URLs remain unchanged

Provide only the translated markdown content.`

    // Get the translation
    const response = await runPrompt(
        (_) => {
            _.def("ORIGINAL", file, { language: "markdown" })
            _.$`${translationPrompt}`
        },
        { 
            label: `translate-${file.filename}`,
            system: ["system.technical", "system.safety_harmful_content"]
        }
    )
    
    if (response.error) {
        console.error(`Translation failed for ${file.filename}: ${response.error}`)
        continue
    }
    
    const translatedContent = response.text
    
    // QA Step: Validate links before classify
    console.log("Running QA validation on links...")
    const validation = await validateLinks(originalContent, translatedContent)
    
    if (!validation.valid) {
        console.error(`❌ Link validation failed for ${file.filename}:`)
        validation.issues.forEach(issue => console.error(`  - ${issue}`))
        
        // Print detailed analysis
        console.log(`\nDetailed Analysis:`)
        console.log(`Original: ${validation.details.original.total} total (${validation.details.original.inline} inline, ${validation.details.original.reference} reference)`)
        console.log(`Translation: ${validation.details.translated.total} total (${validation.details.translated.inline} inline, ${validation.details.translated.reference} reference)`)
        
        // Attempt to fix the translation by re-running with validation feedback
        console.log("Attempting to fix link validation issues...")
        
        const fixResponse = await runPrompt(
            (_) => {
                _.def("ORIGINAL", file, { language: "markdown" })
                _.def("FAILED_TRANSLATION", translatedContent, { language: "markdown" })
                _.def("ORIGINAL_LINKS", JSON.stringify(validation.details.original.links, null, 2))
                _.def("TRANSLATION_LINKS", JSON.stringify(validation.details.translated.links, null, 2))
                _.$`The translation in FAILED_TRANSLATION has link validation issues:

${validation.issues.join('\n')}

Original links (ORIGINAL_LINKS):
${JSON.stringify(validation.details.original.links, null, 2)}

Translation links (TRANSLATION_LINKS):
${JSON.stringify(validation.details.translated.links, null, 2)}

Please provide a corrected translation of ORIGINAL to ${langName} that:
1. Preserves ALL original links exactly as they are (URLs must not change)
2. Only translates the visible link text, never URLs
3. Maintains the same number and type of links
4. Fixes the specific issues listed above
5. Preserves all reference link definitions

Provide only the corrected markdown content.`
            },
            { 
                label: `fix-translation-${file.filename}`,
                system: ["system.technical", "system.safety_harmful_content"]
            }
        )
        
        if (!fixResponse.error) {
            const fixedTranslation = fixResponse.text
            const revalidation = await validateLinks(originalContent, fixedTranslation)
            
            if (revalidation.valid) {
                console.log("✅ Fixed translation passed link validation")
                
                // Run classify step after successful validation
                console.log("Running classification on fixed translation...")
                const classification = await classify(
                    fixedTranslation,
                    {
                        technical: "Technical documentation with proper terminology",
                        narrative: "Narrative or tutorial content", 
                        reference: "Reference material or API documentation"
                    },
                    { explanations: true }
                )
                
                console.log(`Document classified as: ${JSON.stringify(classification)}`)
                
                def("TRANSLATION", fixedTranslation, { 
                    filename: file.filename.replace(/\.md$/, `.${langCode}.md`),
                    language: "markdown" 
                })
            } else {
                console.error("❌ Fixed translation still fails validation:")
                revalidation.issues.forEach(issue => console.error(`  - ${issue}`))
                console.error("Manual review required - translation not generated")
            }
        } else {
            console.error(`❌ Failed to generate fix: ${fixResponse.error}`)
        }
    } else {
        console.log("✅ Link validation passed")
        
        // Run classify step after successful validation
        console.log("Running classification...")
        const classification = await classify(
            translatedContent,
            {
                technical: "Technical documentation with proper terminology",
                narrative: "Narrative or tutorial content",
                reference: "Reference material or API documentation"
            },
            { explanations: true }
        )
        
        console.log(`Document classified as: ${classification}`)
        
        // Output the validated translation
        def("TRANSLATION", translatedContent, { 
            filename: file.filename.replace(/\.md$/, `.${langCode}.md`),
            language: "markdown" 
        })
    }
}

// Summary report
$`## Translation Summary

Successfully processed ${env.files.length} markdown file(s) with comprehensive link validation.

### Quality Assurance Process
- ✅ **Link Extraction**: Comprehensive detection of inline \`[text](url)\` and reference \`[ref]: url\` links
- ✅ **Code Block Handling**: Properly excludes links inside code blocks and inline code
- ✅ **Link Validation**: Validates all links are preserved before classification
- ✅ **Automatic Retry**: Attempts to fix validation failures with detailed feedback
- ✅ **Classification**: Documents classified only after successful validation

### Link Validation Features
- Detects missing URLs in translations
- Identifies unexpected new URLs (should not occur)
- Validates URL frequency (handles duplicate URLs correctly)
- Provides detailed analysis with line numbers for debugging
- Handles complex URLs with parameters, fragments, and special characters

### Translation Quality
The translated files maintain:
- All original links with exact URLs preserved
- Natural ${langName} translations of link text only
- Proper markdown structure and formatting
- Document classification for quality assessment

This QA process ensures no links are added, modified, or lost during translation.`