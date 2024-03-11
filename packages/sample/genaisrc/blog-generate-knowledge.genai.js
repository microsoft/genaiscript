script({
    title: "blog using generated knowledge",
    description:
        "Using Generatored Knowledge technique. More at https://learnprompting.org/docs/intermediate/generated_knowledge",
})

// first prompt LLM to generate facts
const { text } = await runPrompt(() => {
    def("FILE", env.files)
    $`Generate 10 facts about the content of FILE.`
})

// then use the facts to generate a blog
def("FACTS", text)
$`Use the above facts to write a one paragraph blog post`
