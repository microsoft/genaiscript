---
title: "Cast"
description: "Use the cast helper to convert text to structured data"
sidebar:
    order: 80
---

The `cast` function in GenAIScript allows you to convert text or images to structured data.
It provides a simple interface to leverage the power of LLMs for extracting data from unstructured text and images.

## Usage

`cast` is defined in the runtime and needs to be imported. It takes the unstructure text (or files), a JSON schema
and returns the extract data (or error).

```js
import { cast } from "genaiscript/runtime"

const { data } = await cast(
    "The quick brown fox jumps over the lazy dog.; jumps",
    {
        type: "object",
        properties: {
            partOfSpeech: { type: "string" },
        },
    },
    {
        instructions: `You will be presented with a sentence and a word contained
in that sentence. You have to determine the part of speech for a given word`,
    }
)
```

:::note

`cast` is provided as part of the runtime (slightly different way to package GenAIScript functionalities) and needs to be imported using this code...

```js
import { cast } from "genaiscript/runtime"
```

:::

### Images

You can pass a function that takes a prompt context
and build the `DATA` variable programmatically.
This allows you to select files, images and other GenAIScript options.

```js
const res = await cast(_ => {
    _.defImages('DATA', img)
}, ...)
```

## Model and other options

The `cast` function uses the `cast` [model alias](/genaiscript/reference/scripts/model-aliases) by default.
You can modify this alias or specify another model in the options.

```js
const res = await cast("...", {
    model: "large",
})
```

The `options` are passed internally to the [inline prompt](/genaiscript/reference/scripts/inline-prompts) and can be used to modify the behavior of the LLM.

## Acknowlegments

This function is inspired from [Marvin](https://www.askmarvin.ai/docs/text/transformation/).
