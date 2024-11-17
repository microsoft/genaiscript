---
title: Structured Output
sidebar:
    order: 12.1
description: Utilize structured output in GenAIScript to generate JSON data with schema validation for precise and reliable data structuring.
keywords: structured output, JSON schema, GenAIScript, data validation, reliable data
---

Structured output is a feature that allows you to generate structured data in JSON format with a [JSON schema](/genaiscript/reference/scripts/schemas). This is more strict than [JSON mode](/genaiscript/reference/scripts/json-mode) and is supported by `gpt-4o-mini`, `gpt-4o-2024-08-06` and [later models](https://platform.openai.com/docs/guides/structured-outputs/structured-outputs-vs-json-mode).

To enable this mode, set `responseType` to `json_schema`.

```js "responseType: 'json_schema'"
script({
    responseType: "json_schema",
    responseSchema: {
        type: "object",
        properties: {
            name: { type: "string" },
            age: { type: "number" },
        },
        required: ["name", "age"],
    },
})
```

Note that there are [several restrictions](https://platform.openai.com/docs/guides/structured-outputs/how-to-use) on the schema features supported by this mode.

-   `additionalProperties: true` is not supported.
-   all optional fields (e.g. not in `required`) will be returned and might be `null`

## Choices

If you are looking to build a LLM-as-a-Judge and only looking for outputs in a set of words, you can also consider using [choices](/genaiscript/reference/scripts/choices) to increase the probability of the model generating the specified words.
