script({
    title: "blog using generated knowledge",
    model: "openai:gpt-3.5-turbo",
    description:
        "Using Generated Knowledge technique. More at https://learnprompting.org/docs/intermediate/generated_knowledge",
    tests: {
        files: "src/rag/markdown.md",
        keywords: ["markdown"],
    },
})

// first prompt LLM to generate facts
const { text } = await runPrompt((_) => {
    _.def("FILE", env.files)
    _.$`Generate 5 facts about the content of FILE.`
})

// then use the facts to generate a blog
def("FACTS", text)
$`Use the above facts to write a one paragraph blog post`
