# Markdown Translator Utility

The Markdown Translator utility provides a comprehensive solution for translating markdown documents using LLMs while preserving structure and maintaining translation mappings for incremental updates.

## Features

- **Lexical Chunking**: Parses markdown into semantic chunks (headings, paragraphs, lists, blockquotes, code blocks)
- **Hash-based Mapping**: Generates unique hashes for each chunk to enable translation caching and incremental updates
- **Structure Preservation**: Maintains markdown formatting and document structure during translation
- **Flexible Options**: Configurable handling of code blocks and HTML content
- **Fallback Support**: Uses original content when translations are not available

## API Reference

### `MD.translator.parse(content, options?)`

Parses markdown content into translatable chunks.

**Parameters:**
- `content` (string | WorkspaceFile): The markdown content to parse
- `options` (object, optional):
  - `includeCodeBlocks` (boolean): Whether to include code blocks as translatable content (default: false)
  - `includeHtmlBlocks` (boolean): Whether to include HTML blocks as translatable content (default: false)
  - `hashAlgorithm` (string): Hash algorithm to use (default: "sha-256")
  - `hashLength` (number): Length of generated hashes (default: 12)

**Returns:** Promise<ParseResult>
```typescript
{
  chunks: MarkdownChunk[],
  originalLines: string[]
}
```

### `MD.translator.extractTranslatableContent(chunks)`

Extracts translatable content from parsed chunks.

**Parameters:**
- `chunks` (MarkdownChunk[]): Array of chunks from parse()

**Returns:** string[] - Array of translatable content strings

### `MD.translator.createTranslationMap(chunks, translations)`

Creates a hash-to-translation mapping.

**Parameters:**
- `chunks` (MarkdownChunk[]): Array of chunks from parse()
- `translations` (string[]): Array of translated content strings

**Returns:** Record<string, string> - Hash to translation mapping

### `MD.translator.reconstruct(parseResult, translationMap)`

Reconstructs markdown with translations, falling back to original content.

**Parameters:**
- `parseResult`: Result from parse()
- `translationMap`: Hash to translation mapping

**Returns:** string - Reconstructed markdown

## Example Usage

### Basic Translation Script

```javascript
script({
    title: "Markdown Translator",
    files: "*.md",
    temperature: 0
})

const targetLang = env.vars.lang || "Spanish"
const file = env.files[0]

// Parse the markdown
const parseResult = await MD.translator.parse(file)
const content = MD.translator.extractTranslatableContent(parseResult.chunks)

// Create translation prompt
def("CONTENT", content.join("\n\n---\n\n"), { language: "markdown" })

$`Translate to ${targetLang}:

CONTENT`

// Process response and reconstruct
const translations = _.split(/\n\s*---\s*\n/).map(t => t.trim())
const translationMap = MD.translator.createTranslationMap(parseResult.chunks, translations)
const translated = MD.translator.reconstruct(parseResult, translationMap)

defFileOutput(`translated-${targetLang.toLowerCase()}.md`, translated)
```

### Advanced Usage with Caching

```javascript
// Load existing translations
const cacheFile = `translations-${targetLang}.json`
let existingMap = {}
try {
    existingMap = JSON.parse(await readText(cacheFile))
} catch {}

// Parse markdown
const parseResult = await MD.translator.parse(file)

// Find chunks that need translation
const needsTranslation = parseResult.chunks
    .filter(chunk => chunk.translatable && !existingMap[chunk.hash])

if (needsTranslation.length > 0) {
    const content = MD.translator.extractTranslatableContent(needsTranslation)
    
    // Translate only new content
    def("NEW_CONTENT", content.join("\n\n---\n\n"))
    $`Translate to ${targetLang}: NEW_CONTENT`
    
    // Update translation map
    const newTranslations = _.split(/\n\s*---\s*\n/)
    const newMap = MD.translator.createTranslationMap(needsTranslation, newTranslations)
    Object.assign(existingMap, newMap)
    
    // Save updated cache
    defFileOutput(cacheFile, JSON.stringify(existingMap, null, 2))
}

// Reconstruct with all translations
const result = MD.translator.reconstruct(parseResult, existingMap)
defFileOutput(`translated.md`, result)
```

## Supported Markdown Elements

- **Headings**: `# H1`, `## H2`, etc. (preserves level)
- **Paragraphs**: Regular text content
- **Lists**: Unordered (`-`, `*`, `+`) and ordered (`1.`, `2.`, etc.)
- **Blockquotes**: `> quoted text`
- **Code Blocks**: ` ```language` (translatable if enabled)
- **HTML Blocks**: `<div>...</div>` (translatable if enabled)

## Chunk Types

Each parsed chunk has a type indicating its semantic role:

- `heading`: Markdown headings (includes level 1-6)
- `paragraph`: Regular text paragraphs
- `list`: List items and sublists
- `blockquote`: Quoted content
- `code`: Code blocks (when `includeCodeBlocks: true`)
- `html`: HTML content (when `includeHtmlBlocks: true`)

## Hash-based Translation Mapping

The utility uses content-based hashing to create stable identifiers for each chunk:

1. Each chunk gets a unique hash based on its content
2. Translations are mapped to hashes, not line numbers
3. This enables incremental translation when documents change
4. Unchanged chunks retain their existing translations
5. Only new or modified content needs re-translation

This approach is particularly useful for:
- Large documents with frequent updates
- Collaborative translation workflows
- Version control integration
- Translation caching and optimization