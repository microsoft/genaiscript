
# JavaScript Runtime for GenAI

- **eval** (commonjs) or **esm** + TypeScript!
```js
// poem.genai.js
script(...)
$`Write a poem.`
```
```js
// poem.genai.mjs/ts
import { parse } from "ini"
script(...)
...
```

- parsers: PDF, DOCX, HTML, JSON5, YAML, XML, CSV, tokenizers, ...

- file search: grep, fuzz search, RAG, tree sitter queries, ...

- Debugging Just Works™

- LLM tools as JavaScript functions (Agents!)