system({
    title: "Apply JSON schemas to generated data.",
})

export default function main(ctx) {
    const folder = ctx.env.vars["outputFolder"] || "."

    $`
## Files with Schema

When you generate JSON or YAML or CSV according to a named schema, 
you MUST add the schema identifier in the code fence header.
`

    ctx.def(`File ${folder}/data.json`, `...`, {
        language: "json",
        schema: "CITY_SCHEMA",
    })
}
