prompt({
    title: "Shorten",
    description: "Shorten the summary of the fragment.",
    system: ["system.multifile"],
})

$`Shorten the following FILE. Limit changes to minimum.`

def("FILE", env.file)
