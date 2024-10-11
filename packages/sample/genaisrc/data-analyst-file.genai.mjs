script({
    system: ["system"],
    tools: ["python_code_interpreter"],
    files: ["src/penguins.csv"],
})

const data = def("DATA", env.files.map(({ filename }) => filename).join("\n"))

$`Analyze ${data} with a detailed statistical analysis. Respond with markdown.`
