script({
    title: "custom output",
    system: [],
})
const output = env.spec.filename + ".txt"
def("FILE", env.files)
$`Summarize all the files. Respond as raw text.`

defOutput((o) => {
    console.log(`writing to ${output}`)
    return {
        files: {
            [output]: o.text,
        },
    }
})
