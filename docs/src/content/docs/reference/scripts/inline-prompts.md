---
title: Inline prompts
sidebar:
    order: 10
---

The `runPrompt` function allows to build an inner LLM invocation. It returns the output of the prompt.

```js
const { text } = await runPrompt(async () => {
    // use def, $ and other helpers
    def("FILE", file)
    $`Summarize the FILE. Be concise.`
})
```

## Limitations

- Nested [functions](/genaiscript/reference/scripts/functions)
and [schemas](/genaiscript/reference/scripts/schemas) are not supported in the inner prompt.

## Example: Summarize files

The snippet below uses `gpt-3.5` to summarize files individually before
adding them to the main prompt.

```js
for (const file of env.files) {
    const { text } = await runPrompt(
        () => {
            def("FILE", file)
            $`Summarize the FILE. Be concise.`
        },
        {
            // Use a different model!
            model: "gpt-3.5-turbo",
        }
    )
    def("FILE", { ...file, content: text })
}
```
