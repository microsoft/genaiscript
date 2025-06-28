# Unified Markdown Processing with HTML Comment Support

This module implements mdast (Markdown Abstract Syntax Tree) processing with support for ignoring HTML comments, addressing issue #1676.

## Overview

The implementation provides a unified interface for markdown processing that can optionally remove HTML comments during parsing and processing. It includes both a full implementation using the unified/remark ecosystem and a fallback regex-based approach.

## Features

- ✅ Parse markdown to mdast AST with optional comment removal
- ✅ Process markdown with configurable HTML comment handling
- ✅ Detect HTML comments in markdown content
- ✅ Graceful fallback when unified packages are not available
- ✅ Full integration with existing markdown processing pipeline
- ✅ TypeScript support with proper type definitions

## API Reference

### Core Functions

#### `processMarkdownWithMdast(markdown, options?)`

Process markdown content with optional HTML comment removal.

```typescript
import { processMarkdownWithMdast } from './unified'

// Remove HTML comments
const cleaned = processMarkdownWithMdast(markdown, { ignoreHtmlComments: true })

// Preserve HTML comments (default)
const preserved = processMarkdownWithMdast(markdown, { ignoreHtmlComments: false })
```

#### `parseMarkdownToMdast(markdown, options?)`

Parse markdown to mdast AST with optional comment filtering.

```typescript
import { parseMarkdownToMdast } from './unified'

const ast = parseMarkdownToMdast(markdown, { ignoreHtmlComments: true })
console.log(ast.type) // 'root'
```

#### `containsHtmlComments(markdown)`

Check if markdown contains HTML comments.

```typescript
import { containsHtmlComments } from './unified'

if (containsHtmlComments(markdown)) {
    console.log('This markdown contains HTML comments')
}
```

#### `removeHtmlComments(markdown)`

Convenience function to remove HTML comments.

```typescript
import { removeHtmlComments } from './unified'

const cleaned = removeHtmlComments(markdown)
```

### Options Interface

```typescript
interface MdastOptions {
    /**
     * Whether to ignore HTML comments in the markdown.
     * When true, HTML comments will be removed from the processed output.
     * When false, HTML comments will be preserved.
     * @default false
     */
    ignoreHtmlComments?: boolean
}
```

## Integration with Existing Code

The functionality is re-exported from `markdown.ts` for easy integration:

```typescript
import { 
    processMarkdownWithMdast, 
    containsHtmlComments,
    removeHtmlComments 
} from './markdown'
```

Enhanced integration functions are available in `markdown-integration.ts`:

```typescript
import { 
    cleanMarkdownForAI,
    analyzeMarkdownContent,
    prettifyMarkdownWithCommentHandling 
} from './markdown-integration'

// Clean markdown for AI processing (removes comments + prettifies)
const cleaned = cleanMarkdownForAI(markdown)

// Analyze markdown content
const analysis = analyzeMarkdownContent(markdown)
console.log(analysis.hasHtmlComments) // boolean
console.log(analysis.suggestions.removeComments) // string | null
```

## Example Usage

```typescript
const markdownWithComments = `# Documentation

This is important content.

<!-- TODO: Add more examples -->

## Section 2

More content here.

<!-- FIXME: Update this section -->`

// Check for comments
if (containsHtmlComments(markdownWithComments)) {
    console.log('Found HTML comments')
}

// Remove comments
const cleaned = processMarkdownWithMdast(markdownWithComments, {
    ignoreHtmlComments: true
})

console.log(cleaned)
// Output:
// # Documentation
// 
// This is important content.
// 
// ## Section 2
// 
// More content here.
```

## Implementation Details

### Unified Ecosystem Support

When the unified packages are available, the implementation uses:
- `unified` - Core processor
- `remark-parse` - Markdown parser  
- `remark-stringify` - Markdown serializer
- `@slorber/remark-comment` - HTML comment removal plugin

### Fallback Implementation

When unified packages are not available, the implementation falls back to:
- Regex-based HTML comment detection and removal
- Simple AST-like structure creation
- Basic text processing for stringify operations

### Performance

The fallback regex-based approach is lightweight and fast:
- Comment detection: `O(n)` where n is markdown length
- Comment removal: `O(n)` single pass replacement
- Memory efficient with minimal allocations

## Testing

Comprehensive test suites are provided:
- `unified.test.ts` - Core functionality tests
- `markdown-integration.test.ts` - Integration tests

Run tests with:
```bash
npm test
```

## Dependencies

### Required (already available)
- TypeScript
- Node.js

### Optional (for full functionality)
- `unified@^11.0.5`
- `remark@^15.0.1` 
- `remark-parse@^11.0.0`
- `remark-stringify@^11.0.0`
- `@slorber/remark-comment@^1.1.3`

The implementation works without these packages using the fallback approach.