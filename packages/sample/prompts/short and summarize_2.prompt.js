prompt({
    title: "Shorten and Summarize",
    description: "Shorten the summary of the fragment.",
    system: ["system.summary"]
})

$`Shorten the following FILE. Limit changes to minimum.`

def("FILE", env.file)
