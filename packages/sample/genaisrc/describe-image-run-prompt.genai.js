script({
    title: "Describe objects in each image",
    model: "openai:gpt-3.5-turbo",
    group: "vision",
    maxTokens: 4000,
    system: [],
    tests: {
        files: "src/robots.jpg",
        keywords: "robot",
    },
})

for (const file of env.files) {
    const res = await runPrompt(
        (_) => {
            _.$`Return the list of objects in the images.`
            _.defImages(file, { detail: "low" })
        },
        {
            model: "openai:gpt-4-turbo-v",
            maxTokens: 4000,
        }
    )
    def("OBJECTS", res.text)
}

$`Summarize the objects in images.`
