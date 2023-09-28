prompt({
    title: "Shorten",
    description: "Shorten the summary of the fragment.",
    context: "root",
    system: ["system.notes"],
})

$`Shorten the following SUMMARY. Limit changes to minimum.`

def("SUMMARY", env.file)

$`Respond with the new SUMMARY and update file.`
