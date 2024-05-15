---
title: JSON Mode
description: Learn how to enable JSON output mode in scripts for structured data generation with OpenAI's platform.
keywords: JSON output, scripting, OpenAI JSON, structured data, automation
sidebar:
    order: 12
---

Some models support forcing the output format to JSON, like the [JSON mode](https://platform.openai.com/docs/guides/text-generation/json-mode) of OpenAI.

The generated file name will be `[spec].[template].json`.

## `responseSchema`

You can specify a `responseSchema` in the script metadata which will automatically turn on the JSON mode. The output will be validated against the schema, and GenAIScript will attempt to repair the output is not valid. The script will fail if the output does not match the schema.

```js "responseSchema"
script({
    responseSchema: {
        type: "object",
        properties: {
            cities: {
                type: "array",
                description:
                    "A list of cities with population and elevation information.",
                items: {
                    type: "object",
                    description:
                        "A city with population and elevation information.",
                    properties: {
                        name: {
                            type: "string",
                            description: "The name of the city.",
                        },
                        population: {
                            type: "number",
                            description: "The population of the city.",
                        },
                    },
                    required: ["name", "population", "url"],
                },
            },
        },
    },
})
```


## `responseType`

You can also enable this mode without a schema by setting `response_type` to `json_object`.

```javascript
script({
    ...,
    responseType: `json_object`,
})
```
