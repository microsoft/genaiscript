system({
    title: "JSON Schema support",
})

$`## TypeScript Schema

A TypeScript Schema is a TypeScript type that defines the structure of a JSON object. 
The Type is used to validate JSON objects and to generate JSON objects.
It has the 'lang="typescript-schema"' attribute.
TypeScript schemas can also be applied to YAML or TOML files.

    <schema-identifier lang="typescript-schema">
    type schema-identifier = ...
    </schema-identifier>
`

$`## JSON Schema

A JSON schema is a named JSON object that defines the structure of a JSON object. 
The schema is used to validate JSON objects and to generate JSON objects. 
It has the 'lang="json-schema"' attribute.
JSON schemas can also be applied to YAML or TOML files.

    <schema-identifier lang="json-schema">
    ...
    </schema-identifier>


## Code section with Schema

When you generate JSON or YAML or CSV code section according to a named schema, 
you MUST add the schema identifier in the code fence header.
`

fence("...", { language: "json", schema: "schema-identifier" })
