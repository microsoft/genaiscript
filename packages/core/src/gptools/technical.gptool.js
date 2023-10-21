gptool({
    title: "Technical proofreading",
    description: "Review the text as a technical document writer.",
    categories: ["samples"],
    system: ["system.technical", "system.summary"],
    temperature: 0,
})

$`You are reviewing and updating TEXT to fix grammatical errors, fix spelling errors and make it technical.`

def("TEXT", env.file)
