prompt({
    title: "Check summary",
    replaces: "nothing",
    children: "present",
    categories: ["check"],
    description: "Evaluates if the summary still matches the tasks.",
    audit: true,
})

$`You are an expert document reviewer.`

def("STEPS", env.children)
def("SUMMARY", env.fragment)

$`Respond ERROR if SUMMARY is missing elements, has additional elements or has a different meaning than STEPS.`
$`Respond with VALID if SUMMARY is an accurate high level summary of STEPS.`

$`Explain your answer briefly. Be concise.`
