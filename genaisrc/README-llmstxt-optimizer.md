# LLM-Optimized Content Generator

This GenAIScript analyzes markdown files from an Astro Starlight website and generates LLM-optimized content stored in the `llmstxt` frontmatter field.

## Overview

The script:
1. Processes markdown (`.md`) and MDX (`.mdx`) files
2. Analyzes the content (excluding frontmatter)
3. Generates a concise, LLM-optimized version
4. Stores the optimized content in the `llmstxt` frontmatter field
5. Updates files in-place

## Usage

### Basic Usage

```bash
# Process a single file
node packages/cli/dist/src/index.js run llmstxt-optimizer path/to/file.md

# Process multiple files
node packages/cli/dist/src/index.js run llmstxt-optimizer docs/src/content/docs/**/*.md

# Apply changes (modify files in-place)
node packages/cli/dist/src/index.js run llmstxt-optimizer docs/src/content/docs/**/*.md --apply-edits
```

### Example Input/Output

**Input file:**
```markdown
---
title: My Document
description: A sample document
---

# My Document

This is a very long explanation of a concept that could be much more concise. It includes redundant information and verbose descriptions that make it harder for LLMs to extract the key points efficiently.

## Key Points

- Point 1: Important information
- Point 2: More important information
```

**Output file:**
```markdown
---
title: My Document
description: A sample document
llmstxt: "Document explaining key concepts. Key points: Point 1 covers important information, Point 2 provides additional important information. Concise explanation optimized for LLM consumption."
---

# My Document

This is a very long explanation of a concept that could be much more concise. It includes redundant information and verbose descriptions that make it harder for LLMs to extract the key points efficiently.

## Key Points

- Point 1: Important information
- Point 2: More important information
```

## Schema Extension

The script also updates the Astro Starlight schema to include the `llmstxt` field:

```typescript
// docs/src/content.config.ts
export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: (context) => {
        const blog = blogSchema(context);
        return blog.extend({
          llmstxt: z.string().optional(),
        });
      },
    }),
  }),
};
```

## Features

- **Content Optimization**: Reduces content length by 30-50% while preserving essential information
- **Technical Accuracy**: Maintains technical accuracy and key terminology
- **Code Preservation**: Includes important code examples in simplified form
- **Structured Output**: Uses clear, structured format for better LLM comprehension
- **Schema Validation**: Ensures the `llmstxt` field is properly typed in the Astro schema
- **Batch Processing**: Can process multiple files efficiently

## Configuration

The script uses these settings:
- **Model**: `large` (configurable)
- **Temperature**: `0.3` (low temperature for consistent output)
- **System**: `["system", "system.files"]` (file processing capabilities)

## Output Quality

The optimized content:
- Extracts core concepts and information
- Uses clear, direct language
- Simplifies complex explanations
- Focuses on actionable information
- Maintains important context
- Reduces redundancy
- Preserves technical terminology