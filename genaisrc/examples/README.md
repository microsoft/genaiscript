# GenAI Script Examples

This directory contains example scripts demonstrating various GenAI features.

## Code Review with Copilot Instructions

The `code-review-with-instructions.genai.mts` script demonstrates how to use the new runtime helper for automatically importing GitHub Copilot instruction files.

### Features

- Automatically discovers and imports relevant copilot instruction files from `.github/instructions/` and `.github/copilot-instructions.md`
- Matches instruction files to selected files using glob patterns from frontmatter `applyTo` field
- Formats instructions for inclusion in prompts
- Supports custom instruction paths and file patterns

### Usage

```bash
# Review TypeScript files using applicable instructions
genaiscript run code-review-with-instructions src/**/*.ts

# Review GenAI scripts (will match *.genai.* patterns)
genaiscript run code-review-with-instructions genaisrc/*.genai.mts
```

### Setting up Copilot Instructions

1. Create instruction files in `.github/instructions/` with frontmatter:

```markdown
---
applyTo: "**/*.ts"
description: "TypeScript coding standards"
---

# TypeScript Guidelines

- Use strict type checking
- Prefer interfaces over type aliases for object shapes
- Document public APIs with JSDoc
```

2. Create general instructions in `.github/copilot-instructions.md`:

```markdown
# General Coding Standards

- Write clean, readable code
- Add meaningful comments
- Follow existing project conventions
```

### Example Instruction Files

The repository includes these instruction files that demonstrate the pattern:

- `.github/instructions/genaiscript.instructions.md` - For `**/*.genai.*` files
- `.github/copilot-instructions.md` - General project instructions

### Runtime API

```typescript
import { importCopilotInstructions, formatCopilotInstructions } from "@genaiscript/runtime"

// Import instructions matching env.files
const instructions = await importCopilotInstructions(workspace, env.files)

// Format for prompt inclusion
const formatted = formatCopilotInstructions(instructions, {
    includeSourceInfo: true,
    separator: "\n\n---\n\n"
})
```