script({
    title: "custom output",
    system: [],
})
const output = env.files[0].filename + ".txt"
def("FILE", env.files)
$`Summarize all the files. Respond as raw text.`

defOutputProcessor((o) => {
    console.log(`writing to ${output}`)
    return {
        files: {
            [output]: o.text,
        },
    }
})
