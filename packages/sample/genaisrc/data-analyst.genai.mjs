script({
    system: ["system"],
    tools: ["python_code_interpreter"],
    files: ["src/penguins.csv"],
})

const data = def("DATA", env.files, { sliceSample: 25 })

$`Analyze ${data} with a detailed statistical analysis. 

- Do not generate visualizations.
- Validate computations with code.
`
