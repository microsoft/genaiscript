---
title: Inline prompts
sidebar:
    order: 10
---

The `runPrompt` function allows to build an inner LLM invocation. It returns the output of the prompt.

```js
const output = await runPrompt(() => {
    // use def, $ and other helpers
    def("FILE", file)
    $`Summarize the FILE. Be concise.`
})
```

## Limitations

- Functions are not supported in the inner prompt.

## Example: Summarize files

The snippet below uses `gpt-3.5` to summarize files individually before
adding them to the main prompt.

```js
for (const file of env.files) {
    const summary = await runPrompt(
        () => {
            def("FILE", file)
            $`Summarize the FILE. Be concise.`
        },
        {
            // Use a different model!
            model: "gpt-3.5-turbo",
        }
    )
    def("FILE", { ...file, content: summary })
}
```
