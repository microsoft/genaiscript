prompt({
    title: "↑ Summarize",
    replaces: "fragment",
    children: "present",
    categories: ["summarize"],
    description:
        "Update the introductory paragraph to match the context of the children.",
})

$`Update the following SUMMARY to match STEPS.`

def("STEPS", env.children)
def("SUMMARY", env.fragment)

$`Respond with the new SUMMARY. Limit changes to minimum.`
