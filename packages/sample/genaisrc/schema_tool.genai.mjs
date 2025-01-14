script({
    tools: ["data_schema_infer"],
    files: ["src/jsonconfig.json"],
})

const file = env.files[0]
$`Describe the data in ${file.filename}`
