---
title: JSON Mode
description: Learn how to enable JSON output mode in scripts for structured data generation with OpenAI's platform.
keywords: JSON output, scripting, OpenAI JSON, structured data, automation
sidebar:
    order: 12
---

Some models support forcing the output format to a JSON object, like the [JSON Object mode](https://platform.openai.com/docs/guides/text-generation/json-mode) of OpenAI.

The generated file name will be `[spec].[template].json`.

```js 'responseType: "json_object"'
script({
    responseType: "json_object",
})
```

## Schema validation

You can specify a [schema](/genaiscript/reference/scripts/schemas) through `responseSchema` which will automatically turn on the JSON mode. The output will be validated against the schema, and GenAIScript will attempt to repair the output is not valid. The script will fail if the output does not match the schema.

```js "responseSchema"
script({
    responseType: "json_object",
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

## Inline schemas

You can also specify the [schema inline](/genaiscript/reference/scripts/schemas) in the script and use a mixed markdown/data that GenAIScript will parse.

## Structured Output

Recent models have added a [structured output](/genaiscript/reference/scripts/structured-output) mode that is more strict than JSON mode. This mode is enabled by setting `responseType` to `json_schema`.

```js "responseSchema"
script({
    responseType: "json_schema",
    responseSchema: {...},
})
```
