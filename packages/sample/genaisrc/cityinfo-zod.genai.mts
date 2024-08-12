script({
    files: ["./src/cities.md"],
})

// the data to analyze
def("CITIES", env.files)

import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"
// create schema using zod
const CitySchema = z.array(
    z.object({
        name: z.string(),
        population: z.number(),
        url: z.string(),
    })
)
// JSON schema to constrain the output of the tool.
const schema = defSchema("CITY_SCHEMA", zodToJsonSchema(CitySchema, "citySchema").definitions[
    "citySchema"
] as JSONSchemaArray)
// the task`
$`Answer with the information of the cities in the CITIES data set,
compliant with ${schema}.`
