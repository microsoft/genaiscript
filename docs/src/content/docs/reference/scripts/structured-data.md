---
title: Structured Data
sidebar:
    order: 6
---

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

Then tell the LLM to use this schema to generate data.

```js
$`Use the TARGET_SCHEMA for the JSON schema.`
```

When a JSON/YAML payload is generated with the schema identifier,
genaiscript automatically validates the payload against the schema.

:::tip
Use YAML instead of JSON as it works better with the LLM tokenizers.
:::
