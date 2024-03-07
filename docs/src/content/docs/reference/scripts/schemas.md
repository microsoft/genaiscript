---
title: Data Schemas
sidebar:
    order: 6
---

It is possible to force the LLM to generate data that conforms to a specific schema.
This technique works reasonably well and GenAIScript also provides automatic validation "just in case".

You will notice that the schema supported by GenAIScript is much simpler than the full-blow JSON schema specification. We recommend using simple schemas to avoid confusing the LLM; then port them to your application
specific data format later on.

## `defSchema`

Use `defSchema` to define a JSON/YAML schema for the prompt output.

```javascript
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

## Use the schema

Then tell the LLM to use this schema to generate data.

```js
$`Use the TARGET_SCHEMA for the JSON schema.`
```

## Validation

When a JSON/YAML payload is generated with the schema identifier,
GenAIScript automatically validates the payload against the schema.

:::tip
Use YAML instead of JSON as it works better with the LLM tokenizers.
:::
