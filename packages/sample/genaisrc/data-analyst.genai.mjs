script({
    system: ["system", "system.python_interpreter"],
    files: ["src/penguins.csv"],
})

const data = def("DATA", env.files, { sliceSample: 100 })

$`Analyze ${data} with a detailed statistical analysis.`
