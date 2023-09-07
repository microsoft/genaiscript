prompt({
    title: "Technical proofreading",
    description: "Review the text as a technical document writer.",
    replaces: "fragment",
    categories: ["samples"],
    system: ["system.technical"],
    temperature: 0
})

$`You are reviewing TEXT to fix grammatical errors, 
fix spelling errors and make it technical.`

def("TEXT", env.fragment)

$`Generate the updated TEXT. Limit changes to minimum.`
