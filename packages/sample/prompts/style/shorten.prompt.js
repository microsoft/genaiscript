prompt({
    title: "Shorten",
    replaces: "fragment",
    context: "root",
    system: ["system.notes"],
})

$`Shorten the following SUMMARY. Limit changes to minimum.`

def("SUMMARY", env.fragment)

$`Respond with the new SUMMARY.`
