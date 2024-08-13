script({
    system: ["system", "system.python_interpreter"],
    files: ["src/penguins.csv"],
})

const data = def("DATA", env.files, { sliceSample: 25 })

$`Analyze ${data} with a detailed statistical analysis.`
