# @genaiscript/mdx

MDX support for GenAIScript with runtime execution and custom JSX factory.

## Features

- 🚀 **MDX Runtime Execution**: Compile and execute MDX with a custom JSX factory
- 🎯 **Custom DOM Implementation**: Replace React DOM with a GenAIScript-specific DOM subset
- 📝 **GenAIScript Components**: Native support for `<System>`, `<User>`, `<Assistant>`, `<Def>`, `<File>` components
- 🔧 **Frontmatter Support**: Configure GenAIScript options via YAML frontmatter
- 🎨 **Standard HTML Elements**: Support for common HTML elements rendered to markdown
- ⚡ **TypeScript Support**: Full TypeScript support with proper type definitions

## Installation

```bash
npm install @genaiscript/mdx
```

## Usage

### Basic MDX Compilation

```typescript
import { MdxCompiler } from "@genaiscript/mdx";

const compiler = new MdxCompiler();
const result = await compiler.compile(mdxContent);
console.log(result.content); // Generated GenAIScript
```

### MDX with Frontmatter

```mdx
---
title: "My GenAI Prompt"
model: "gpt-4"
temperature: 0.7
maxTokens: 2000
system: "You are a helpful assistant"
---

# My Prompt

<System>
You are an expert code reviewer.
</System>

<User>
Please review this code:
<File name="example.ts" />
</User>
```

### Custom Components

The package provides these GenAIScript-specific components:

- `<System>` - System message
- `<User>` - User message  
- `<Assistant>` - Assistant message
- `<Def name="variable">` - Define a variable
- `<File name="path" />` - Include a file
- `<Context>` - Add context information
- `<Image src="path" />` - Include an image

### Runtime Execution

The package uses a custom JSX runtime that executes MDX without React:

```typescript
import { MdxRuntime } from "@genaiscript/mdx";

const runtime = new MdxRuntime();
const result = await runtime.execute(compiledMdx);
```

### Custom JSX Factory

The custom JSX factory is available for direct use:

```typescript
import { jsx, jsxs, Fragment } from "@genaiscript/mdx/jsx-runtime";

// Use in your own MDX compilation
const compileOptions = {
  jsxImportSource: "@genaiscript/mdx",
  jsx: true
};
```

## API Reference

### MdxCompiler

Main compiler class for processing MDX files.

#### Methods

- `compile(content: string, options?: MdxCompilerOptions): Promise<MdxCompilerResult>`
- `compileFile(file: WorkspaceFile, options?: MdxCompilerOptions): Promise<MdxCompilerResult>`
- `generateOutputFilename(inputFilename: string): string`
- `createPromptScript(result: MdxCompilerResult, metadata?: object): PromptScript`

### MdxRuntime

Runtime executor for compiled MDX code.

#### Methods

- `execute(compiledMdx: string, scope?: Record<string, any>): Promise<string>`
- `executeWithComponents(compiledMdx: string, customComponents?: Record<string, any>, scope?: Record<string, any>): Promise<string>`

### PromptDom

Custom DOM implementation for rendering GenAIScript prompts.

#### Methods

- `getComponents(): Record<string, Function>`
- `renderToString(nodes: (PromptDomNode | string)[]): string`

## Architecture

### Custom JSX Factory

Instead of React DOM, this package implements a lightweight JSX factory that:

1. Compiles JSX elements to a custom virtual DOM
2. Renders the virtual DOM to GenAIScript format
3. Supports both automatic and classic JSX transforms

### Runtime Execution

The MDX runtime:

1. Compiles MDX to executable JavaScript
2. Executes the code in a sandboxed context
3. Captures the resulting virtual DOM
4. Renders to GenAIScript format

### Component System

Components are mapped to GenAIScript constructs:

| Component | GenAIScript Output |
|-----------|-------------------|
| `<System>` | `${system}` |
| `<User>` | `${user}` |
| `<Assistant>` | `${assistant}` |
| `<Def name="x">` | `def("x", () => { ... })` |
| `<File name="x" />` | `file("x")` |

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
