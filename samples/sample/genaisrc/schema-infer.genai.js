script({
    title: "JSON schema inferer",
    model: "small",
    files: "src/penguins.csv",
    tests: [
        {
            files: "src/penguins.csv",
            keywords: "species",
        },
        {
            files: "src/penguins.xlsx",
            keywords: "species",
        },
    ],
})
// use def to emit LLM variables
// https://microsoft.github.io/genaiscript/reference/scripts/context/#definition-def
const files = def("FILE", env.files, { sliceSample: 20 })

// use $ to output formatted text to the prompt
// https://microsoft.github.io/genaiscript/reference/scripts/prompt/
$`Infer the JSON schema from the data in ${files}. 
Save the schema to a file named schema.json.`
