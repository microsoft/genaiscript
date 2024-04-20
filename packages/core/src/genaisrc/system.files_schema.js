system({
    description: "Apply JSON schemas to generated data.",
})

const folder = env.vars["outputFolder"] || "."

$`
## Files with JSON Schema

When you generate JSON or YAML according to a named schema, 
you MUST add the schema identifier in the code fence header.
`

def(`File ${folder}/data.json`, `...`, {
    language: "json",
    schema: "CITY_SCHEMA",
})
