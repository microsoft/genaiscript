# @genaiscript/mdx-compiler

A TypeScript library that compiles MDX documents into GenAIScript `.genai.mts` files, integrating React-style JSX components with the GenAIScript prompt framework.

## Features

- 📝 Compile MDX documents to GenAIScript format
- ⚛️ React naming conventions for components (PascalCase)
- 🎯 Custom DOM for prompt generation
- 📋 YAML frontmatter support for script configuration
- 🔧 Integration with GenAIScript `WorkspaceFile` interface
- 📦 TypeScript/ESM compatible

## Installation

```bash
npm install @genaiscript/mdx-compiler
```

## Usage

### Basic Usage

```typescript
import { MdxCompiler } from '@genaiscript/mdx-compiler';

const compiler = new MdxCompiler();

// Compile a WorkspaceFile
const result = await compiler.compileFile(workspaceFile);
console.log(result.content); // Generated .genai.mts content

// Or compile from string
const result = await compiler.compile(mdxContent);
```

### Example MDX Input

```mdx
---
title: "Code Generation Prompt"
model: "gpt-4"
temperature: 0.7
maxTokens: 2000
---

# Code Generation Assistant

<System>
You are an expert TypeScript developer who writes clean, well-documented code.
</System>

<User>
Write a TypeScript function that {task}.
</User>

<Def name="requirements">
- Use modern TypeScript features
- Include proper type annotations
- Add JSDoc comments
</Def>

<File name="examples/typescript-patterns.ts" />

Please generate the requested function following best practices.
```

### Generated GenAIScript Output

```typescript
// Code Generation Prompt
model: "gpt-4"
temperature: 0.7
maxTokens: 2000

// Generated from MDX

# Code Generation Assistant

${system}
You are an expert TypeScript developer who writes clean, well-documented code.

${user}
Write a TypeScript function that {task}.

def("requirements", () => {
- Use modern TypeScript features
- Include proper type annotations
- Add JSDoc comments
});

file("examples/typescript-patterns.ts");

Please generate the requested function following best practices.
```

## API Reference

### MdxCompiler

The main compiler class that transforms MDX to GenAIScript format.

#### Methods

- `compileFile(file: WorkspaceFile, options?: MdxCompilerOptions): Promise<MdxCompilerResult>`
- `compile(content: string, options?: MdxCompilerOptions): Promise<MdxCompilerResult>`
- `generateOutputFilename(inputFilename: string, typescript?: boolean): string`
- `compileFiles(files: WorkspaceFile[], options?: MdxCompilerOptions): Promise<Array<{file: WorkspaceFile; result: MdxCompilerResult}>>`

### Available Components

The MDX compiler supports these GenAIScript-specific components:

#### Core Components

- `<System>` - System message (`${system}`)
- `<User>` - User message (`${user}`)
- `<Assistant>` - Assistant message (`${assistant}`)
- `<Def name="...">` - Define reusable content (`def()`)
- `<File name="..." />` - Include file (`file()`)

#### Utility Components

- `<Context>` - Add context comments
- `<Image src="..." />` - Include images (`defImages()`)

#### Standard HTML

Standard HTML elements like `h1`, `p`, `ul`, `li`, `code`, `pre`, etc. are converted to appropriate Markdown.

### Frontmatter Configuration

The compiler supports YAML frontmatter for GenAIScript configuration:

```yaml
---
title: "Prompt Title"          # Script title
description: "Description"     # Script description  
model: "gpt-4"                # AI model
temperature: 0.7              # Temperature setting
maxTokens: 2000               # Token limit
system: "System message"      # Global system message
files:                        # Files to include
  - "path/to/file.ts"
images:                       # Images to include
  - "path/to/image.png"
---
```

### Type Definitions

```typescript
interface MdxCompilerOptions {
  typescript?: boolean;
  outputDir?: string;
  mdxOptions?: CompileOptions;
}

interface MdxCompilerResult {
  content: string;
  messages: Array<{
    type: "error" | "warning" | "info";
    message: string;
  }>;
}
```

## Integration with GenAIScript

This compiler is designed to integrate seamlessly with the GenAIScript framework:

```typescript
import { WorkspaceFile } from '@genaiscript/core';
import { MdxCompiler } from '@genaiscript/mdx-compiler';

const compiler = new MdxCompiler();

// Process MDX files in a workspace
const mdxFiles = workspace.files.filter(f => f.filename.endsWith('.mdx'));
const results = await compiler.compileFiles(mdxFiles);

for (const { file, result } of results) {
  const outputPath = compiler.generateOutputFilename(file.filename);
  await workspace.writeFile(outputPath, result.content);
}
```

## License

MIT License - see LICENSE file for details.
