---
title: AICI
sidebar:
  order: 200
---

[Microsoft AICI](https://github.com/microsoft/aici/) allows to constrain the output of a LLM using WASM. In particular, it is possible to send JavaScript program to describe the prompt.

GenAIScript support executing scripts and converting the output into a AICI compatible JavaScript program, which will them generate constrainted output.

:::caution

This feature is experimental and may change in the future.

:::

## Metadata

An AICI template should set the `aici: true` field in the `script` function.

```js title="answer-to-everything.genai.js"
script({ ...
    aici: true,
})
```

## `gen`

The `AICI.gen` function creates a constrain in the prompt flow.

```js title="answer-to-everything.genai.js"
$`Ultimate answer is to the life, universe 
and everything is ${AICI.gen({ regex: /\d\d/ })}`
```

## Token

AICI uses `AICI_API_KEY`, `AICI_API_BASE` and `AICI_API_VERSION` (default `v1`) to compose the API URL.

```
<base>/<model>/<version>/run
```
