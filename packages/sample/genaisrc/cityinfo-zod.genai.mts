script({
    files: ["./src/cities.md"],
})

// the data to analyze
def("CITIES", env.files)

import { z } from "genaiscript/runtime"
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
// the task`
$`Answer with the information of the cities in the CITIES data set,
compliant with ${schema}.`
