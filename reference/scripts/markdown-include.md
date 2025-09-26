Markdown scripts support including external files using the `@include` directive, allowing you to compose larger prompts from reusable components.

## Basic Usage

Use the `@include "filepath"` directive to insert the contents of an external file into your markdown script:

```markdown title="main.genai.md"
---
title: "My Script"
description: "Script with included content"
---

# Welcome

This is the main content.

@include "templates/greeting.md"

More content after the include.
```

```markdown title="templates/greeting.md"
## Hello World

This greeting template can be reused across multiple scripts.

Welcome to GenAIScript!
```

## File Resolution

File paths in `@include` directives are resolved relative to the directory containing the markdown script:

- `@include "file.txt"` - file in the same directory as the script
- `@include "templates/header.md"` - file in a subdirectory
- `@include "../shared/common.md"` - file in a parent directory

## Multiple Includes

You can use multiple `@include` directives in the same markdown script:

```markdown title="complex.genai.md"
# Complex Script

@include "header.md"

## Main Content

This is the main content section.

@include "examples/code-sample.md"

## Conclusion

@include "footer.md"
```

## Error Handling

If an included file cannot be found or read, the `@include` directive is replaced with an HTML comment containing the error message:

```markdown
<!-- Error including missing-file.txt: File not found: /path/to/missing-file.txt -->
```

This ensures that your script continues to work even when included files are missing, while providing clear feedback about what went wrong.

## Use Cases

The `@include` directive is useful for:

- **Reusable templates**: Share common greetings, instructions, or examples across multiple scripts
- **Modular prompts**: Break large prompts into manageable, focused files
- **Content organization**: Keep related content in separate files for better maintainability
- **Team collaboration**: Allow team members to work on different parts of a prompt independently

## Comparison with importTemplate

The `@include` directive is different from the programmatic `importTemplate` function:

| Feature | `@include` directive | `importTemplate` function |
|---------|---------------------|---------------------------|
| **Usage** | Markdown scripts (`.genai.md`) | JavaScript/TypeScript scripts (`.genai.mjs`, `.genai.mts`) |
| **Processing** | Content replacement during parsing | Runtime template rendering |
| **Variables** | No variable interpolation | Supports Mustache/Jinja variables |
| **Error handling** | HTML comments for missing files | Runtime errors |
| **File types** | Any text file | Template files with variable syntax |

Choose `@include` for simple content inclusion in markdown scripts, and `importTemplate` for dynamic template rendering with variables in JavaScript/TypeScript scripts.