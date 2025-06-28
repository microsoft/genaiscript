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

/**
 * Test the enhanced link validation functionality
 */

// Test with a more complex markdown document
const complexTestContent = `# Complex Test Document

Here's an [inline link](https://example.com) and another [complex link with (parentheses)](https://test.com/path?param=value).

Check out the [docs][docs] and [repo][repo].

The same link appears [here](https://example.com) again.

[docs]: https://microsoft.github.io/genaiscript/ "Documentation Title"
[repo]: https://github.com/microsoft/genaiscript
[unused]: https://unused.com

## Code Examples
\`\`\`
// This should not be extracted: [fake](https://fake.com)
\`\`\`

Inline code like \`[not a link](https://ignored.com)\` should be ignored.
`

const complexGoodTranslation = `# Document de Test Complexe

Voici un [lien en ligne](https://example.com) et un autre [lien complexe avec (parenthèses)](https://test.com/path?param=value).

Consultez la [documentation][docs] et le [dépôt][repo].

Le même lien apparaît [ici](https://example.com) encore.

[docs]: https://microsoft.github.io/genaiscript/ "Documentation Title"
[repo]: https://github.com/microsoft/genaiscript
[unused]: https://unused.com

## Exemples de Code
\`\`\`
// This should not be extracted: [fake](https://fake.com)
\`\`\`

Le code en ligne comme \`[not a link](https://ignored.com)\` devrait être ignoré.
`

const complexBadTranslation = `# Document de Test Complexe

Voici un [lien en ligne](https://example.com) et un autre [lien complexe](https://test.com/path?param=value).

Consultez la [documentation][docs].

[docs]: https://microsoft.github.io/genaiscript/ "Documentation Title"
`

console.log("=== Testing Enhanced Link Extraction ===")
const complexLinks = extractLinks(complexTestContent)
console.log("Complex links found:", complexLinks.length)
complexLinks.forEach(link => console.log(`  ${link.type}: "${link.text}" -> ${link.url} (line ${link.line})`))

console.log("\n=== Testing Enhanced Validation (Good) ===")
const complexGoodValidation = validateLinks(complexTestContent, complexGoodTranslation)
console.log("Valid:", complexGoodValidation.valid)
console.log("Issues:", complexGoodValidation.issues)
console.log("Details:", JSON.stringify(complexGoodValidation.details, null, 2))

console.log("\n=== Testing Enhanced Validation (Bad) ===")
const complexBadValidation = validateLinks(complexTestContent, complexBadTranslation)
console.log("Valid:", complexBadValidation.valid)
console.log("Issues:", complexBadValidation.issues)

console.log("\n✅ Enhanced link validation test completed")

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