---
title: Structured Output
sidebar:
    order: 12.1
description: Utilize structured output in GenAIScript to generate JSON data with schema validation for precise and reliable data structuring.
keywords: structured output, JSON schema, GenAIScript, data validation, reliable data
---

GenAIScript supports the generation of structured outputs with automatic data repairs. It can leverage built-in schema validation from LLM providers or executes it own validation as needed.

The structured output are configured through two flags: `responseType`, which controls the data format, and `responseSchema` which controls the data structure.

## Response Type

The response type is controlled by the `responseType` optional argument and has the following options:

- `json`: tell the LLM to produce valid JSON output.
- `yaml`: tell the LLM to produce valid YAML output.
- `json_object`: use built-in OpenAI JSON output
- `json_schema`: use built-in OpenAI JSON output with JSON schema validation

Note that `text` and `markdown` are also supported to configure the LLM output.

### `json`

In this mode, GenAIScript prompts the LLM to produce valid JSON output. It also validate the output and attempt to repair it if it is not valid.
This mode is implemented by GenAIScript and does not rely on LLM providers support.

```js
script({
    responseType: "json",
})
```

The schema validation is applied if the `responseSchema` is provided.

### `yaml`

In this mode, GenAIScript prompts the LLM to produce valid JSON output. It also validate the output and attempt to repair it if it is not valid.
This mode is implemented by GenAIScript and does not rely on LLM providers support.

```js
script({
    responseType: "yaml",
})
```

The schema validation is applied if the `responseSchema` is provided.

### `json_object`

In this mode, GenAIScript prompts the LLM to produce valid JSON output. It also validate the output and attempt to repair it if it is not valid.
This mode relies on built-in support from LLMs, like OpenAI.

```js "responseSchema"
script({
    responseType: "json_object",
})
```

### `json_schema`

Structured output is a feature that allows you to generate structured data in data format like with a [JSON schema](/genaiscript/reference/scripts/schemas). This is more strict than `json_object`.

To enable this mode, set `responseType` to `json_schema` and provide a `responseSchema` object.

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

- `additionalProperties: true` is not supported.
- all optional fields (e.g. not in `required`) will be returned and might be `null`

## Schema validation

You can specify a [schema](/genaiscript/reference/scripts/schemas) through `responseSchema` which will automatically turn on the structured output mode. The output will be validated against the schema, and GenAIScript will attempt to repair the output if it is not valid. The script will fail if the output does not match the schema.

```js "responseSchema"
script({
    responseType: "json",
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

### Inlined schemas

Note that this section applies to the entire output of a chat. You can also use [inlined schemas](/genaiscript/reference/scripts/schemas) and use a mixed markdown/data that GenAIScript will parse.

### Choices

If you are looking to build a LLM-as-a-Judge and only looking for outputs in a set of words, you can also consider using [choices](/genaiscript/reference/scripts/choices) to increase the probability of the model generating the specified words.

## `cast`

The [cast](/genaiscript/reference/scripts/cast) function is a runtime helper to convert unstructured text/images into structured data.

```js "cast"
import { cast } from "genaiscript/runtime"

const { data } = await cast((_) => _.defImages(images), {
    type: "object",
    properties: {
        keywords: {
            type: "array",
            items: {
                type: "string",
                description: "Keywords describing the objects on the image",
            },
        },
    },
    required: ["keywords"],
})
```
