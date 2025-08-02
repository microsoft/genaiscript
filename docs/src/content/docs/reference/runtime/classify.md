---
title: Classify
description: Use the classify helpers for your classification tasks
sidebar:
  order: 80
hero:
  image:
    alt: Three simple, brightly colored geometric boxes, each labeled with either
      "bug," "feature," or "qa," arranged in a corporate flat 8-bit art style.
      Above the boxes, abstract interconnected lines suggest AI or neural
      network analysis and a small digital bar shows classification probability.
      One box stands out as highlighted, indicating it has been selected. The
      image is small, uses only five bold colors, minimal shapes, and has no
      background, shadows, or people.
    file: ./classify.png
llmstxt:
  content: >-
    The `classify` function in GenAIScript categorizes text using an LLM. It
    requires importing from "@genaiscript/runtime" and takes input text, labels
    with descriptions, and optional settings. It returns the most probable label
    based on the LLM's evaluation.


    Example:

    ```js

    const { label } = await classify(
        "The app crashes when I try to upload a file.",
        {
            bug: "a software defect",
            feat: "a feature request",
            qa: "an inquiry about how to use the software",
        }
    )

    ```


    Labels are single-token keys with descriptions to guide the LLM. An optional
    `other` label can be added for unclassifiable inputs:

    ```js

    const res = await classify("...", { ... }, { other: true })

    ```


    Explanations can be enabled to provide reasoning before the label:

    ```js

    const res = await classify("...", { ... }, { explanation: true })

    ```


    The default model alias is `classify`, but it can be changed:

    ```js

    const res = await classify("...", { model: "large" })

    ```


    Classification quality can be assessed using `logprob` values. A
    `probPercent` below 80% may indicate uncertainty:

    ```js

    const { label, probPercent } = await classify(...)

    if (probPercent < 80) console.log("classifier confused...")

    ```


    Logprobs and topLogprobs can be disabled in the options. Inspired by
    Marvin's classification system.
  hash: a06e4ce4037292b20a3946380cb9804ac59686fe624038c53334a08a87eff055

---

The `classify` function in GenAIScript allows you to categorize inputs based on a machine learning model.
It provides a simple interface to leverage the power of LLMs for classification tasks.

## Usage

`classify` is defined in the [GenAIScript runtime](/genaiscript/reference/runtime) and needs to be imported. It takes the text to classify, a set of labels (and options for the LLM)
and returns the label provided by the LLM.

```js
import { classify } from "@genaiscript/runtime"

const { label } = await classify(
    "The app crashes when I try to upload a file.",
    {
        bug: "a software defect",
        feat: "a feature request",
        qa: "an inquiry about how to use the software",
    }
)
```

- The prompt encourages the LLM to explain its choices **before** returning the label.
- The label tokens are boosted using logit-bias to improve the reliability of the classification.

:::note

`classify` is provided as part of the runtime (slightly different way to package GenAIScript functionalities) and needs to be imported using this code...

```js
import { classify } from "@genaiscript/runtime"
```

:::

### Images

You can pass a function that takes a prompt context
and build the `DATA` variable programmatically.
This allows you to select files, images and other GenAIScript options.

```js
const res = await classify(_ => {
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

## Acknowledgments

This function is inspired from the classification in [Marvin](https://www.askmarvin.ai/docs/text/classification/).
