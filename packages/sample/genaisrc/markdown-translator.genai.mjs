/**
 * Example markdown translator GenAI script
 */
script({
    title: "Markdown Translator",
    description: "Translate markdown documents using the markdown translator utility",
    files: "*.md",
    temperature: 0
})

// Get the target language from variables or default to Spanish
const targetLang = env.vars.lang || "Spanish"

// Parse the markdown file
const file = env.files[0]
console.log(`Translating ${file.filename} to ${targetLang}...`)

// Use the markdown translator utility
const parseResult = await MD.translator.parse(file)
console.log(`Parsed ${parseResult.chunks.length} chunks`)

// Extract translatable content
const translatableContent = MD.translator.extractTranslatableContent(parseResult.chunks)
console.log(`Found ${translatableContent.length} translatable chunks`)

if (translatableContent.length === 0) {
    console.log("No translatable content found")
    return
}

// Create prompt for translation
def("ORIGINAL_CONTENT", translatableContent.join("\n\n---\n\n"), { language: "markdown" })

$`You are an expert translator. Translate the following markdown content to ${targetLang}.

Rules:
- Preserve all markdown formatting (headings, lists, links, etc.)
- Do not translate code blocks or inline code
- Do not translate URLs or image paths
- Keep the same structure and meaning
- Return only the translated content, separated by "---" on new lines
- Do not add explanations or comments

ORIGINAL_CONTENT`

// Process the response to extract translations
const response = env.vars.response || _
if (!response) {
    console.log("No translation response received")
    return
}

// Split the response into individual translations
const translations = response.split(/\n\s*---\s*\n/).map(t => t.trim()).filter(t => t)

if (translations.length !== translatableContent.length) {
    console.log(`Warning: Expected ${translatableContent.length} translations, got ${translations.length}`)
}

// Create translation map
const translationMap = MD.translator.createTranslationMap(parseResult.chunks, translations)

// Reconstruct the markdown with translations
const translatedMarkdown = MD.translator.reconstruct(parseResult, translationMap)

// Output the result
const outputFilename = file.filename.replace(/\.md$/, `-${targetLang.toLowerCase()}.md`)
defFileOutput(outputFilename, translatedMarkdown, "Translated markdown file")

console.log(`Translation complete! Generated ${outputFilename}`)