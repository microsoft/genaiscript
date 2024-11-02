script({
    system: ["system"],
    tools: ["python_code_interpreter"],
    files: ["src/penguins.csv"],
    tests: {},
})

const data = def("DATA", env.files, { sliceSample: 25 })

$`Analyze ${data} with a detailed statistical analysis. Respond with markdown.`
