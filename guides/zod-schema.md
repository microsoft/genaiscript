
[zod](https://zod.dev/) is a TypeScript-first schema validation with static type inference. 

```ts
import { z } from "zod"
// city array schema
const CitySchema = z.array(
    z.object({
        name: z.string(),
        population: z.number(),
        url: z.string(),
    })
)
```

[zod-to-json-schema](https://www.npmjs.com/package/zod-to-json-schema) is a library that converts zod schemas to JSON schema.

```ts
import { zodToJsonSchema } from "zod-to-json-schema"
// convert to JSON schema
const CitySchemaJSON = zodToJsonSchema(CitySchema, "citySchema").definitions[
    "citySchema"
] as JSONSchemaArray
```

The JSON schemas can be used in `defSchema` to constrain the output of the tool.

```ts
// JSON schema to constrain the output of the tool.
const schema = defSchema("CITY_SCHEMA", CitySchemaJSON)
...
```
