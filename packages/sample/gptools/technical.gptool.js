gptool({
    title: "Technical proofreading",
    description: "Review the text as a technical document writer.",
    categories: ["samples"],
    system: ["system.files", "system.technical", "system.summary"],
    temperature: 0,
})

def("FILE", env.file)

$`You are a helpful expert writer at technical documentation.
You are reviewing and updating FILE to fix grammatical errors, 
fix spelling errors and make it sound technical.`
