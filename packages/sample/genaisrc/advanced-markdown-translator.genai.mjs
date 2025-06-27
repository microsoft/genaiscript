/**
 * Advanced Markdown Translator with Incremental Translation Support
 * 
 * This script demonstrates how to use the markdown translator utility
 * for efficient incremental translation workflows with caching.
 */
script({
    title: "Advanced Markdown Translator",
    description: "Translate markdown with caching and incremental updates",
    files: "*.md",
    temperature: 0,
    model: "openai:gpt-4"
})

const targetLang = env.vars.lang || "Spanish"
const file = env.files[0]
const cacheFile = `${file.filename}.translations-${targetLang.toLowerCase()}.json`

console.log(`🌍 Translating ${file.filename} to ${targetLang}`)

// Load existing translation cache
let existingTranslations = {}
try {
    if (await fileExists(cacheFile)) {
        const cacheContent = await readText(cacheFile)
        existingTranslations = JSON.parse(cacheContent)
        console.log(`📋 Loaded ${Object.keys(existingTranslations).length} cached translations`)
    }
} catch (error) {
    console.log(`⚠️  Could not load translation cache: ${error.message}`)
}

// Parse the markdown document
console.log("🔍 Parsing markdown document...")
const parseResult = await MD.translator.parse(file, {
    includeCodeBlocks: false,  // Don't translate code blocks
    includeHtmlBlocks: false   // Don't translate HTML blocks
})

console.log(`📝 Found ${parseResult.chunks.length} total chunks`)

// Filter chunks that need translation
const translatableChunks = parseResult.chunks.filter(chunk => chunk.translatable)
const newChunks = translatableChunks.filter(chunk => !existingTranslations[chunk.hash])

console.log(`✅ ${translatableChunks.length} translatable chunks`)
console.log(`🆕 ${newChunks.length} new chunks needing translation`)
console.log(`♻️  ${translatableChunks.length - newChunks.length} chunks using cached translations`)

// Only translate new content if needed
if (newChunks.length > 0) {
    console.log("🤖 Requesting translations for new content...")
    
    const newContent = MD.translator.extractTranslatableContent(newChunks)
    
    // Create context for the translation
    def("DOCUMENT_INFO", `Document: ${file.filename}
Target Language: ${targetLang}
Chunks to translate: ${newChunks.length}

This is part of a larger document. Previous sections may have been translated already.`, {
        language: "text"
    })
    
    def("CONTENT_TO_TRANSLATE", newContent.join("\n\n---CHUNK_SEPARATOR---\n\n"), {
        language: "markdown"
    })

    $`You are an expert translator specializing in technical documentation and markdown content.

DOCUMENT_INFO

Please translate the following markdown content to ${targetLang}:

Rules:
- Preserve all markdown formatting (headings, lists, links, code blocks, etc.)
- Maintain the same document structure and hierarchy
- Do not translate code blocks, URLs, or technical identifiers
- Keep markdown syntax intact (# for headings, - for lists, etc.)
- Translate only the actual text content, not the markup
- Return each translated chunk separated by "---CHUNK_SEPARATOR---"
- Do not add explanations or comments
- Ensure consistency with technical terminology

CONTENT_TO_TRANSLATE`

    // Process the translation response
    if (env.vars.dryRun) {
        console.log("🔍 Dry run mode - would translate:")
        newContent.forEach((content, i) => {
            console.log(`  ${i + 1}. ${content.substring(0, 50)}...`)
        })
    } else {
        // Parse the response
        const translationResponse = env.vars.response || _
        if (!translationResponse) {
            console.error("❌ No translation response received")
            return
        }

        const newTranslations = translationResponse
            .split(/---CHUNK_SEPARATOR---/)
            .map(t => t.trim())
            .filter(t => t)

        if (newTranslations.length !== newChunks.length) {
            console.log(`⚠️  Warning: Expected ${newChunks.length} translations, received ${newTranslations.length}`)
        }

        // Create translation map for new content
        const newTranslationMap = MD.translator.createTranslationMap(newChunks, newTranslations)
        
        // Merge with existing translations
        Object.assign(existingTranslations, newTranslationMap)
        
        console.log(`✅ Added ${Object.keys(newTranslationMap).length} new translations`)
        
        // Save updated translation cache
        defFileOutput(cacheFile, JSON.stringify(existingTranslations, null, 2), "Translation cache")
    }
} else {
    console.log("✨ All content already translated!")
}

// Reconstruct the document with all available translations
console.log("🔨 Reconstructing translated document...")
const translatedMarkdown = MD.translator.reconstruct(parseResult, existingTranslations)

// Generate output filename
const outputFilename = file.filename.replace(/\.md$/, `-${targetLang.toLowerCase()}.md`)

defFileOutput(outputFilename, translatedMarkdown, "Translated markdown document")

// Generate translation statistics
const stats = {
    originalChunks: parseResult.chunks.length,
    translatableChunks: translatableChunks.length,
    translatedChunks: Object.keys(existingTranslations).length,
    newlyTranslated: newChunks.length,
    language: targetLang,
    timestamp: new Date().toISOString()
}

console.log("📊 Translation Statistics:")
console.log(`  - Total chunks: ${stats.originalChunks}`)
console.log(`  - Translatable: ${stats.translatableChunks}`)
console.log(`  - Translated: ${stats.translatedChunks}`)
console.log(`  - Newly translated: ${stats.newlyTranslated}`)
console.log(`  - Coverage: ${Math.round((stats.translatedChunks / stats.translatableChunks) * 100)}%`)

defFileOutput(`${file.filename}.translation-stats.json`, JSON.stringify(stats, null, 2), "Translation statistics")

console.log(`🎉 Translation complete! Generated ${outputFilename}`)

if (env.vars.verbose) {
    console.log("\n📋 Chunk breakdown:")
    const chunkTypes = {}
    parseResult.chunks.forEach(chunk => {
        chunkTypes[chunk.type] = (chunkTypes[chunk.type] || 0) + 1
    })
    
    Object.entries(chunkTypes).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`)
    })
}