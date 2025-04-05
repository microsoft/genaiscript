import { YouTube } from "astro-embed"
import { Code } from "@astrojs/starlight/components"
import summaryOfSummaryPhi3 from "../../../../../../packages/sample/genaisrc/summary-of-summary.genai.js?raw"

The `prompt` or `runPrompt` function allows to build an inner LLM invocation. It returns the output of the prompt.

<YouTube id="https://youtu.be/lnjvPVXgC9k" posterQuality="high" />

`prompt` is a syntactic sugar for `runPrompt` that takes a template string literal as the prompt text.

```js
const { text } = await prompt`Write a short poem.`
```

You can pass a function to `runPrompt` that takes a single argument `_` which is the prompt builder.
It defines the same helpers like `$`, `def`, but applies to the inner prompt.

```js
const { text } = await runPrompt((_) => {
    // use def, $ and other helpers
    _.def("FILE", file)
    _.$`Summarize the FILE. Be concise.`
})
```

You can also shortcut the function and pass the prompt text directly

```js
const { text } = await runPrompt(
    `Select all the image files in ${env.files.map((f) => f.filename)}`
)
```

## Don't mix global helpers in inner prompts 

:::tip

This is a very common mistake when using inner prompts.

:::

A common mistake is to use the global `def`, `$` and other helpers in the inner prompt.
These helpers are not available in the inner prompt and you should use `_.$`, `_.def` and other helpers instead.

- **no good**

```js "def"
const { text } = await runPrompt((_) => {
    def("FILE", env.files) // oops, _. is missing and def added content in the main prompt
    $`Summarize files.` // oops, _ is missing and $ added content in the main prompt
})
```

- **good**

```js "_.def"
const { text } = await runPrompt((_) => {
    _.def("FILE", env.files) // yes, def added content in the inner prompt
    _.$`Summarize the FILE.`
})
```

## Options

Both `prompt` and `runPrompt` support various options similar to the `script` function.

```js
const { text } = await prompt`Write a short poem.`.options({ temperature: 1.5 })
const { text } = await runPrompt((_) => { ...}, { temperature: 1.5 })
```

## Tools

You can use inner prompts in [tools](/genaiscript/reference/scripts/tools).

```js
defTool(
    "poet",
    "Writes 4 line poem about a given theme",
    {
        theme: {
            type: "string",
            description: "Theme of the poem",
        }
    },
    (({theme})) => prompt`Write a ${4} line ${"poem"} about ${theme}`
)
```

## Concurrency

`prompt` and `runPrompt` are async functions that can be used in a loop to run multiple prompts concurrently.

```js
await Promise.all(env.files, (file) => prompt`Summarize the ${file}`)
```

Internally, GenAIScript applies a concurrent limit of 8 per model by default. You can change this limit using the `modelConcurrency` option.

```js "modelConcurrency"
script({
    ...,
    modelConcurrency: {
        "openai:gpt-4o": 20
    }
})
```

If you need more control over concurrent queues,
you can try the [p-all](https://www.npmjs.com/package/p-all),
[p-limit](https://www.npmjs.com/package/p-limit) or similar libraries.

## Inline-only scripts

If your scripts ends up calling into inline prompts and never generate the main prompt, you can configure it to use the `none` LLM provider.
This will prevent GenAIScript from trying to resolve the connection information and also throw an error if you ever try to generate prompts in the main execution.

```js
script({
    model: "none",
})
```

## Example: Summary of file summaries using Phi-3

The snippet below uses [Phi-3](https://azure.microsoft.com/en-us/blog/introducing-phi-3-redefining-whats-possible-with-slms/)
through [Ollama](https://ollama.com/) to summarize files individually before adding them to the main prompt.

<Code code={summaryOfSummaryPhi3} wrap={true} lang="js" />