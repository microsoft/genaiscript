---
title: Code Outline
sidebar:
    order: 11
---

The `retreival.outline` creates an outline of the code based on [tree sitter](https://github.com/tree-sitter/tree-sitter). This feature is powered by [llm-code-highlighter](https://github.com/restlessronin/llm-code-highlighter).

```js
const outline = await retreival.outline(env.files)
const code = def("CODE", outline)
```

## Supported languages

The `retreival.outline` supports the languages registered in [web-tree-sitter](https://www.npmjs.com/package/web-tree-sitter).

Currently, the following list of file extensions are supported: `.js`, `.mjs`, `.cs`, `.sh`, `.py`, `.rs`, `.ts`
