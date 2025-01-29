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

## Labels

The `labels` parameter is an object where the keys are the labels you want to classify the input into, and the values are descriptions of those labels. The LLM uses these descriptions to understand what each label means.

Each label id should be a single word that encodes into a single token. This allows to boost the label using logit-bias and improve the reliability of the classification.

### `other` label

A `other` label can be automatically added to the list
of label to give an escape route for the LLM when it is not able to classify the text.

```js "other: true"
const res = await classify(
    "...",
    { ... },
    { other: true }
)
```

## Explanations

By default, the classification prompt is tuned to return a token (`maxToken: 1`) as the label.
You can enable emitting a justification before returning the label.

```js "explanation: true"
const res = await classify(
    "...",
    { ... },
    { explanation: true }
)
```

## Model and other options

The `classify` function uses the `classify` [model alias](/genaiscript/reference/scripts/model-aliases) by default.
You can modify this alias or specify another model in the options.

```js
const res = await classify("...", {
    model: "large",
})
```

The `options` are passed internally to the [inline prompt](/genaiscript/reference/scripts/inline-prompts) and can be used to modify the behavior of the LLM.

## Assessing classification quality

GenAIScript returns the [logprob](/genaiscript/reference/scripts/logprobs) (and entropy) of the classification label. You can use this value to assess the quality of the labelling.

If the label has a high probability, it means it is probably a good quality classification. A lower probably may mean that the LLM
hesitated or that other labels were considered as well.

```js
const { label, probPercent } = await classify(...)
if (probPercent < 80) { // 80%
    console.log(`classifier confused...`)
}
```

### Configuration

You can disable `logprobs` by setting `logprobs: false` in the options. You can disable `topLogprobs` by setting `topLogprobs: false` in the options.

## Acknowlegments

This function is inspired from [Marvin](https://www.askmarvin.ai/docs/text/transformation/).
