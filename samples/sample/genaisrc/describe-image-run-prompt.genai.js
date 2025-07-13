script({
    title: "Describe objects in each image",
    model: "small",
    group: "vision",
    maxTokens: 4000,
    system: [],
    files: "src/robots.jpg",
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
            model: "vision",
            maxTokens: 4000,
        }
    )
    def("OBJECTS", res.text)
}

$`Summarize the content of OBJECTS.`
