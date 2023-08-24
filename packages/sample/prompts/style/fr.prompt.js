prompt({
    title: "Translate to French",
    output: ".fr.md",
    categories: ["translation"],
    description: "Translate current fragment to French.",
})

$`Translate the following SUMMARY to French. The existing translation is EXISTING.`

def("SUMMARY", env.fragment)

def("EXISTING", env.output || "")

$`Respond with the new SUMMARY (do not translate the word SUMMARY). Limit changes to minimum with respect to EXISTING.`
