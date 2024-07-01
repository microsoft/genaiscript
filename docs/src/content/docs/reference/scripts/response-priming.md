---
title: Response Priming
sidebar:
  order: 100
description: Learn how to prime LLM responses with specific syntax or format
  using the writeText function in scripts.
keywords: response priming, LLM syntax, script formatting, writeText function,
  assistant message
genaiscript:
  model: openai:gpt-3.5-turbo

---

It is possible to provide the start of the LLM response (`assistant` message) in the script.
This allows to steer the answer of the LLM to a specify syntax or format.

Use `writeText` with the `{assistant: true}` option to provide the assistant text.

```js
$`List 5 colors. Answer with a JSON array. Do not emit the enclosing markdown.`

// help the LLM by starting the JSON array syntax
// in the assistant response
writeText(`[`, { assistant: true })
```

<!-- genaiscript output start -->

<details>
<summary>👤 user</summary>


```markdown wrap
List 5 colors. Answer with a JSON array. Do not emit the enclosing markdown.
```


</details>


<details open>
<summary>🤖 assistant</summary>


```markdown wrap
[
```


</details>


<details open>
<summary>🤖 assistant</summary>


```markdown wrap
"red",
"blue",
"green",
"yellow",
"purple"
]
```


</details>

<!-- genaiscript output end -->



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
