import { Card } from "@astrojs/starlight/components"

It is possible to force the LLM to generate data that conforms to a specific schema.
This technique works reasonably well and GenAIScript also provides automatic validation "just in case".

You will notice that the schema supported by GenAIScript is much simpler than the full-blow JSON schema specification. We recommend using simple schemas to avoid confusing the LLM; then port them to your application
specific data format later on.

## JSON schemas

A JSON schema is a declarative language that allows you to validate the structure of JSON data.
It defines the expected data types, properties, and constraints for JSON objects.
JSON schemas are widely used in APIs, configuration files, and data interchange formats to ensure that the data adheres to a specific structure.
JSON schemas are defined using a JSON format and can be used to validate JSON data against the defined schema.
GenAIScript supports JSON schemas to define the structure of the data you want to generate.

```js
const schema = {
    type: "object",
    properties: {
        name: { type: "string" },
        population: { type: "number" },
        url: { type: "string" },
    },
    required: ["name", "population", "url"],
}
```

## `responseSchema`

Use `responseSchema` to define a JSON/YAML schema for the prompt output.

```js user=true
script({
    responseSchema: schema,
})
```

When using `responseSchema`, you can use the `responseType` to specify how the schema should be encoded in the request.

- `responseType: "json"`: The schema is encoded in a system message and validated by GenAIScript.
- `responseType: "json_object"`: The schema is encoded in the request, using the builtin LLM structured output support.
  It is also validated by GenAIScript.

Both approaches are tradeoffs and typically depends on the LLM you are using.

## `defSchema`

Use `defSchema` to define a JSON/YAML schema for the prompt output.

```js user=true
const schema = defSchema("CITY_SCHEMA", {
    type: "array",
    description: "A list of cities with population and elevation information.",
    items: {
        type: "object",
        description: "A city with population and elevation information.",
        properties: {
            name: { type: "string", description: "The name of the city." },
            population: {
                type: "number",
                description: "The population of the city.",
            },
            url: {
                type: "string",
                description: "The URL of the city's Wikipedia page.",
            },
        },
        required: ["name", "population", "url"],
    },
})

$`Generate data using JSON compliant with ${schema}.`
```

{/* genaiscript output start */}

<details open>
<summary>👤 user</summary>

````markdown wrap
CITY_SCHEMA:

```typescript-schema
// A list of cities with population and elevation information.
type CITY_SCHEMA = Array<{
    // The name of the city.
    name: string,
    // The population of the city.
    population: number,
    // The URL of the city's Wikipedia page.
    url: string,
  }>
```

Generate data using JSON compliant with CITY_SCHEMA.
````

</details>

<details open>
<summary>🤖 assistant</summary>

````markdown wrap
File ./data.json:

```json schema=CITY_SCHEMA
[
    {
        "name": "New York",
        "population": 8398748,
        "url": "https://en.wikipedia.org/wiki/New_York_City"
    },
    {
        "name": "Los Angeles",
        "population": 3990456,
        "url": "https://en.wikipedia.org/wiki/Los_Angeles"
    },
    {
        "name": "Chicago",
        "population": 2705994,
        "url": "https://en.wikipedia.org/wiki/Chicago"
    }
]
```
````

</details>

{/* genaiscript output end */}

### Native zod support

The [GenAIScript runtime](/genaiscript/reference/scripts/runtime) exposes the `z` module.

A [Zod](https://zod.dev/) type can be passed in `defSchema` and it will be automatically converted to JSON schema.
The GenAIScript also exports the `z` object from Zod for convenience.

```js
// import from genaiscript
import { z } from "genaiscript/runtime"
// or directly from zod
// import { z } from "zod"
// create schema using zod
const CitySchema = z.array(
    z.object({
        name: z.string(),
        population: z.number(),
        url: z.string(),
    })
)
// JSON schema to constrain the output of the tool.
const schema = defSchema("CITY_SCHEMA", CitySchema)
```

### Prompt encoding

Following the ["All You Need Is Types" approach](https://microsoft.github.io/TypeChat/docs/introduction/)
from TypeChat, the schema is converted TypeScript types before being injected in the LLM prompt.

```ts
// A list of cities with population and elevation information.
type CITY_SCHEMA = Array<{
    // The name of the city.
    name: string
    // The population of the city.
    population: number
    // The URL of the city's Wikipedia page.
    url: string
}>
```

You can change this behavior by using the `{ format: "json" }` option.

```js
const schema = defSchema("CITY_SCHEMA", {...}, { format: "json" })
```

:::tip[Read the Trace!]

The trace allows you to see the schema source and the rendered prompt
and the [cli](/genaiscript/reference/cli) will write the generated TypeScript files
in the output folder as well.

<details>
<summary>schema CITY_SCHEMA</summary>

- source:

```json
{
    "type": "array",
    "description": "A list of cities with population and elevation information.",
    "items": {
        "type": "object",
        "description": "A city with population and elevation information.",
        "properties": {
            "name": {
                "type": "string",
                "description": "The name of the city."
            },
            "population": {
                "type": "number",
                "description": "The population of the city."
            },
            "url": {
                "type": "string",
                "description": "The URL of the city's Wikipedia page."
            }
        },
        "required": ["name", "population", "url"]
    }
}
```

- prompt (rendered as typescript):

```ts
// A list of cities with population and elevation information.
type CITY_SCHEMA = Array<{
    // The name of the city.
    name: string
    // The population of the city.
    population: number
    // The URL of the city's Wikipedia page.
    url: string
}>
```

</details>
:::

## Use the schema

Then tell the LLM to use this schema to generate data.

```js
const schema = defSchema(...)
$`Use ${schema} for the JSON schema.`
```

## Validation

When a JSON/YAML payload is generated with the schema identifier,
GenAIScript automatically validates the payload against the schema.

:::tip

Not all data formats are equal! Some data formats like JSON introduce ambiguity
and can confuse the LLM.
[Read more...](https://betterprogramming.pub/yaml-vs-json-which-is-more-efficient-for-language-models-5bc11dd0f6df).

:::

## Repair

GenAIScript will automatically try to repair the data by issues additional messages
back to the LLM with the parsing output.

## Runtime Validation

Use `parsers.validateJSON` to validate JSON when running the script.

```js
const validation = parsers.validateJSON(schema, json)
```

Most APIs on the `workspace` object that parse data, also support a `schema` option to validate the data.

```js
const data = await workspace.readJSON("data.json", { schema })
```