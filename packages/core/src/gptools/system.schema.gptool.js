system({
    title: "System for JSON Schema support"
})

$`## JSON Schema

A JSON schema is a named JSON object that defines the structure of a JSON object. 
The schema is used to validate JSON objects and to generate JSON objects. 
It is stored in a \`json-schema\` code section.

    <schema-identifier>:
    \`\`\`json-schema
    ...
    \`\`\`


When you generate JSON or YAML according to a named schema. Add the schema identifier in the code fence header.

    \`\`\`json schema=<schema-identifier>
    ...
    \`\`\`

or 

    \`\`\`yaml schema=<schema-identifier>
    ...
    \`\`\`

`