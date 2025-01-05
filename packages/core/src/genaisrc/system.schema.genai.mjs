system({
    title: "JSON Schema support",
})

export default function main(ctx) {
    ctx.$`## TypeScript Schema

A TypeScript Schema is a TypeScript type that defines the structure of a JSON object. 
The Type is used to validate JSON objects and to generate JSON objects.
It is stored in a \`typescript-schema\` code section.
JSON schemas can also be applied to YAML or TOML files.

    <schema-identifier>:
    \`\`\`typescript-schema
    type schema-identifier = ...
    \`\`\`
`

    ctx.$`## JSON Schema

A JSON schema is a named JSON object that defines the structure of a JSON object. 
The schema is used to validate JSON objects and to generate JSON objects. 
It is stored in a \`json-schema\` code section.
JSON schemas can also be applied to YAML or TOML files.

    <schema-identifier>:
    \`\`\`json-schema
    ...
    \`\`\`


## Code section with Schema

When you generate JSON or YAML or CSV code section according to a named schema, 
you MUST add the schema identifier in the code fence header.
`

    ctx.fence("...", { language: "json", schema: "<schema-identifier>" })
}
