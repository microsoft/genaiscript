script({
    tools: ["data_infer_schema"],
    files: ["src/sample.json"],
    tests: {
        files: ["src/sample.json"],
    },
})

const file = env.files[0]
$`Describe the data structure of ${file.filename}`
