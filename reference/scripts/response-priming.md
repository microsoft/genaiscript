
It is possible to provide the start of the LLM response (`assistant` message) in the script.
This allows steering the answer of the LLM to a specific syntax or format.

Use `assistant` function to provide the assistant text.

```js
$`List 5 colors. Answer with a JSON array. Do not emit the enclosing markdown.`

// help the LLM by starting the JSON array syntax
// in the assistant response
assistant(`[`)
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

:::caution

This feature is **not** supported by all models.

:::

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
