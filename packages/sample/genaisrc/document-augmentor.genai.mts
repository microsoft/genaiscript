script({
    secrets: ["TAVILY_API_KEY"],
    files: "src/rag/markdown.md",
})

const { tavilySearch } = await import("./tavily.mts")
const file = env.files[0]

// Question
const { text: question } = await runPrompt((_) => {
    const filen = _.def("FILE", file)
    _.$`Generate a question that summarizes the content of ${filen}`
})

// Search
const { answer } = await tavilySearch(question)

// Augment
const filen = def("FILE", file)
const answern = def("ANSWER", answer)

$`You are an expert at writing document. Integrate the information of ${answern} into ${filen} 
to make it more informative.`
