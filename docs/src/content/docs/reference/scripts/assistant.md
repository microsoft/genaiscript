---
title: Assistant 
sidebar:
  order: 100
---

It is possible to provide the start of the LLM response (assistant) in the script.
This allows to steer the answer of the LLM to a specify syntax or format.

Use `writeText` with the `{assistant: true}` option to provide the assistant text.

```js
$`Answer with a JSON array. Do not emit the enclosing markdown.`

// help the LLM by starting the JSON array syntax
writeText(`[`, { assistant: true })
```