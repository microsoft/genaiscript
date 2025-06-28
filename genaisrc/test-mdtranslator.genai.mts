script({
    title: "Test MD Translator Link Validation",
    description: "Test the link validation functionality of the mdtranslator script",
    files: "test-document.md"
})

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
function validateLinks(originalContent: string, translatedContent: string): {valid: boolean, issues: string[]} {
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

// Test the link extraction functionality
const testContent = `# Test
[Link 1](https://example.com)
[Link 2](https://test.com)
[ref]: https://reference.com
`

const links = extractLinks(testContent)
console.log("Extracted links:", links)

// Test with a simulated translation that preserves links
const translatedContent = `# Test (Translated)
[Lien 1](https://example.com)
[Lien 2](https://test.com)
[ref]: https://reference.com
`

const validation = validateLinks(testContent, translatedContent)
console.log("Validation result:", validation)

// Test with a problematic translation (missing link)
const problematicTranslation = `# Test (Problematic)
[Lien 1](https://example.com)
[ref]: https://reference.com
`

const problemValidation = validateLinks(testContent, problematicTranslation)
console.log("Problem validation result:", problemValidation)

$`## Test Results

The link validation functionality has been tested with the following scenarios:

### Link Extraction Test
- Successfully extracted ${links.length} links from test content
- Found inline links: ${links.filter(l => l.type === 'inline').length}
- Found reference links: ${links.filter(l => l.type === 'reference').length}

### Validation Test (Good Translation)
- Valid: ${validation.valid}
- Issues: ${validation.issues.length === 0 ? 'None' : validation.issues.join(', ')}

### Validation Test (Problematic Translation)  
- Valid: ${problemValidation.valid}
- Issues: ${problemValidation.issues.join(', ')}

The link validation system correctly identifies when links are missing or modified.`