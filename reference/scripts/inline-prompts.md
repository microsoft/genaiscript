
import { Code } from "@astrojs/starlight/components"
import summaryOfSummaryGpt35 from "../../../../../../packages/sample/genaisrc/summary-of-summary-gpt35.genai.js?raw"
import summaryOfSummaryPhi3 from "../../../../../../packages/sample/genaisrc/summary-of-summary-phi3.genai.js?raw"

The `prompt` or `runPrompt` function allows to build an inner LLM invocation. It returns the output of the prompt.

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
await Promise.all(env.files, file => prompt`Summarize the ${file}`)
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

## Example: Summary of file summaries using gpt-3.5

The snippet below uses `gpt-3.5` to summarize files individually before
adding them to the main prompt.

<Code code={summaryOfSummaryGpt35} wrap={true} lang="js" />

## Example: Summary of file summaries using Phi-3

The snippet below uses [Phi-3](https://azure.microsoft.com/en-us/blog/introducing-phi-3-redefining-whats-possible-with-slms/)
through [Ollama](https://ollama.com/) to summarize files individually before adding them to the main prompt.

<Code code={summaryOfSummaryPhi3} wrap={true} lang="js" />
```
