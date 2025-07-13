---
applyTo: "**/*.genai.*"
description: "Instructions for working with GenAIScript files"
---

## GenAIScript Code Generation Instructions

GenAIScript is a custom runtime for node.js. It provides a set of unique APIs and support the TypeScript syntax, ESM, await/async.

- GenAIScript documentation: https://microsoft.github.io/genaiscript/llms-full.txt
- GenAIScript ambient type definitions: https://microsoft.github.io/genaiscript/genaiscript.d.ts

## Guidance for Code Generation

- you always generate TypeScript code using ESM modules for Node.JS.
- you prefer using APIs from GenAIScript `genaiscript.d.ts` rather than node.js. Do NOT use node.js imports.
- you keep the code simple, avoid exception handlers or error checking.
- you add `TODOs` where you are unsure so that the user can review them
- you use the global types in genaiscript.d.ts are already loaded in the global context, no need to import them.
- save generated code in the `./genaisrc` folder with `.genai.mts` extension
