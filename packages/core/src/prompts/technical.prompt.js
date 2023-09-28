prompt({
    title: "Technical proofreading",
    description: "Review the text as a technical document writer.",
    categories: ["samples"],
    system: ["system.multifile", "system.technical"],
    temperature: 0
})

$`You are reviewing TEXT to fix grammatical errors, 
fix spelling errors and make it technical.`

def("TEXT", env.file)

$`Generate the updated file. Limit changes to minimum.`
