---
title: "Classify"
description: "Use the classify helpers for your classification tasks"
sidebar:
    order: 80
---

The `classify` function in GenAIScript allows you to categorize inputs based on a machine learning model.
It provides a simple interface to leverage the power of LLMs for classification tasks.

## Usage

`classify` is defined in the runtime and needs to be imported. It takes the text to classify, a set of lables (and options for the LLM)
and returns the label provided by the LLM.

```js
import { classify } from "genaiscript/runtime"

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

## Labels

The `labels` parameter is an object where the keys are the labels you want to classify the input into, and the values are descriptions of those labels. The LLM uses these descriptions to understand what each label means.

Each label id should be a single word that encodes into a single token. This allows to boost the label using logit-bias and improve the reliability of the classification.

## Model and other options

The `classify` function uses the `classify` [model alias](/genaiscript/reference/scripts/model-aliases) by default.
You can modify this alias or specify another model in the options.

The `options` are passed internally to the [inline prompt](/genaiscript/reference/scripts/inline-prompt) and can be used to modify the behavior of the LLM.
