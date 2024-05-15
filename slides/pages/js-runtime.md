
# JavaScript Runtime for GenAI

- In process eval or `esm` import
```js
// poem.genai.js
script(...)
$`Write a poem.`
```
```js
// poem.genai.mjs
script(...)
export default async function() {
    $`Write a poem.`
}
```

- parsers for PDF, DOCX, HTML, JSON5, YAML, XML, CSV, tokenizers, tree-sitter, ...

- virtual File system (vscode vs node.js vs web)

- builtin RAG (work in progress**)

- Debugging Just Works™
