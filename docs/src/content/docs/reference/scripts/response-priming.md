---
title: Response Priming
sidebar:
    order: 100
description: Learn how to prime LLM responses with specific syntax or format using the writeText function in scripts.
keywords: response priming, LLM syntax, script formatting, writeText function, assistant message
---

It is possible to provide the start of the LLM response (`assistant` message) in the script.
This allows to steer the answer of the LLM to a specify syntax or format.

Use `writeText` with the `{assistant: true}` option to provide the assistant text.

```js
$`Answer with a JSON array. Do not emit the enclosing markdown.`

// help the LLM by starting the JSON array syntax
// in the assistant response
writeText(`[`, { assistant: true })
```

### How does it work?

Internally when invoking the LLM, an additional message is added to the query as if the LLM had generated this content.

```json
{
  "messages": [
    ...,
    {
      "role": "assistant",
      "content": "[\n"
    }
  ]
}
```
