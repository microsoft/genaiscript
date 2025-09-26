[zod](https://zod.dev/) est une validation de schéma orientée TypeScript avec inférence de type statique.

```ts
import { z } from "@genaiscript/runtime"
// city array schema
const CitySchema = z.array(
    z.object({
        name: z.string(),
        population: z.number(),
        url: z.string(),
    })
)
```

Les schémas zod peuvent être utilisés dans `defSchema` pour contraindre la sortie de l'outil.

```ts
// JSON schema to constrain the output of the tool.
const schema = defSchema("CITY_SCHEMA", CitySchema)
...
```