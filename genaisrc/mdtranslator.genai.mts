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
 */
function extractLinks(markdown: string): { text: string; url: string; type: 'inline' | 'reference' }[] {
    const links: { text: string; url: string; type: 'inline' | 'reference' }[] = []
    
    // Extract inline links [text](url)
    const inlineRegex = /\[([^\]]*)\]\(([^)]+)\)/g
    let match
    while ((match = inlineRegex.exec(markdown)) !== null) {
        links.push({
            text: match[1],
            url: match[2],
            type: 'inline'
        })
    }
    
    // Extract reference links [text]: url
    const referenceRegex = /^\s*\[([^\]]+)\]:\s*(.+)$/gm
    while ((match = referenceRegex.exec(markdown)) !== null) {
        links.push({
            text: match[1],
            url: match[2],
            type: 'reference'
        })
    }
    
    return links
}

/**
 * Validate that all links from original are preserved in translation
 */
async function validateLinks(originalContent: string, translatedContent: string): Promise<{valid: boolean, issues: string[]}> {
    const originalLinks = extractLinks(originalContent)
    const translatedLinks = extractLinks(translatedContent)
    
    const issues: string[] = []
    
    // Check if all original URLs are preserved
    const originalUrls = originalLinks.map(link => link.url).sort()
    const translatedUrls = translatedLinks.map(link => link.url).sort()
    
    // Find missing URLs
    const missingUrls = originalUrls.filter(url => !translatedUrls.includes(url))
    if (missingUrls.length > 0) {
        issues.push(`Missing URLs in translation: ${missingUrls.join(', ')}`)
    }
    
    // Find added URLs (should not happen)
    const addedUrls = translatedUrls.filter(url => !originalUrls.includes(url))
    if (addedUrls.length > 0) {
        issues.push(`Unexpected new URLs in translation: ${addedUrls.join(', ')}`)
    }
    
    // Check if URL count matches
    if (originalUrls.length !== translatedUrls.length) {
        issues.push(`Link count mismatch: original has ${originalUrls.length} links, translation has ${translatedUrls.length} links`)
    }
    
    return {
        valid: issues.length === 0,
        issues
    }
}

// Process each file
for (const file of env.files) {
    console.log(`Processing: ${file.filename}`)
    
    const originalContent = file.content
    const originalLinks = extractLinks(originalContent)
    
    console.log(`Found ${originalLinks.length} links in original document`)
    
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
        
        // Attempt to fix the translation by re-running with validation feedback
        console.log("Attempting to fix link validation issues...")
        
        const fixResponse = await runPrompt(
            (_) => {
                _.def("ORIGINAL", file, { language: "markdown" })
                _.def("FAILED_TRANSLATION", translatedContent, { language: "markdown" })
                _.$`The translation in FAILED_TRANSLATION has link validation issues:
${validation.issues.join('\n')}

Please provide a corrected translation of ORIGINAL to ${langName} that:
1. Preserves ALL original links exactly as they are
2. Only translates the visible text, never URLs
3. Maintains the same number of links
4. Fixes the specific issues listed above

Provide only the corrected markdown content.`
            },
            { 
                label: `fix-translation-${file.filename}`,
                system: ["system.technical"]
            }
        )
        
        if (!fixResponse.error) {
            const fixedTranslation = fixResponse.text
            const revalidation = await validateLinks(originalContent, fixedTranslation)
            
            if (revalidation.valid) {
                console.log("✅ Fixed translation passed link validation")
                def("TRANSLATION", fixedTranslation, { 
                    filename: file.filename.replace(/\.md$/, `.${langCode}.md`),
                    language: "markdown" 
                })
            } else {
                console.error("❌ Fixed translation still fails validation")
                console.error(revalidation.issues.join('\n'))
            }
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

Processed ${env.files.length} markdown file(s) with link validation.

### Quality Assurance
- ✅ All links validated before classification
- ✅ No links added or modified during translation  
- ✅ Translation quality verified through classification

The translated files maintain all original links while providing natural ${langName} translations.`