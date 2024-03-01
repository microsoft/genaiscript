---
title: JSON and YAML
sidebar:
    order: 9
---

In general, GenAIScript will try to handle JSON(5) and YAML seamlessly.

:::tip
Use YAML instead of JSON as it works better with the LLM tokenizers.
:::

## Schemas

Use `defSchema` to define a JSON/YAML schema for the prompt output.

```js
defSchema("TARGET_SCHEMA", {
    type: "array",
    description: "An array of targets",
    items: {
        description: "A target that is impacted by the actions in the file",
        type: "object",
        properties: {
            name: {
                description: "Identifier of the target",
                type: "string",
            },
            source: {
                description: "Path of the file defining the target",
                type: "string",
            },
            action: {
                description: "What is being done on the cloud resource",
                type: "string",
            },
        },
    },
})
```

Then tell the LLM to use this schema to generate data.

```js
$`Use the TARGET_SCHEMA for the JSON schema.`
```

When a JSON/YAML payload is generated with the schema identifier,
genaiscript automatically validates the payload against the schema.

## JSON output

You can use `system.json` system message to force a single JSON output file. This
enables the [JSON mode](https://platform.openai.com/docs/guides/text-generation/json-mode) of OpenAI.

```js
script({
    ...,
    system: ["system.json"],
})
```

The generated file name will be `[spec].[template].json`.
