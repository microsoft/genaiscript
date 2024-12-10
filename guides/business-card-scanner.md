import { Code } from '@astrojs/starlight/components';
import importedCode from "../../../../../packages/sample/src/vision/describe-card.genai.js?raw"
import importedSchemaCode from "../../../../../packages/sample/src/vision/describe-card-schema.genai.js?raw"

This guide shows how to use vision and image variables to scan business card information in a structured format.

## Vision model

You will need access to a deployment of the OpenAI vision model. In this example, it is identifier by `gpt-4o`.
Also set the `maxTokens` to 4000 to ensure the model can process the entire business card.

```js "gpt-4o"
script({
    ...
    model: "openai:gpt-4o",
    maxTokens: 4000,
})
```

## `defImage`

The [defImage](/genaiscript/reference/scripts/images) function can be used to input multiple files to the script. 
The non-image files will automatically be ignored, so you can typically pass [env.files](/genaiscript/reference/scripts/context) directly to `defImages`.

```js
defImages(env.files)
```

## Producing CSV

All together the script looks like the following:

<Code title="scan-business-card.genai.mjs" code={importedCode} wrap={true} lang="js" />

## Using a schema

We can add data format validation by adding a schema for the business data rows.

```js
const schema = defSchema("EXPENSE", {
    type: "array",
    items: {
        type: "object",
        properties: {
            Date: { type: "string" },
            Location: { type: "string" },
            Total: { type: "number" },
            Tax: { type: "number" },
            Item: { type: "string" },
            ExpenseCategory: { type: "string" },
            Quantity: { type: "number" },
        },
        required: ["Date", "Location", "Total", "Tax", "Item", "Quantity"],
    },
})
```

And the script above is adapter to use the schema instead of the CSV description.

<Code title="scan-business-card.genai.mjs" code={importedSchemaCode} wrap={true} lang="js" />
