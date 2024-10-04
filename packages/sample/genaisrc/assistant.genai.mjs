script({
    model: "openai:gpt-4o-mini",
    tests: {
        keywords: ["hello", "world"],
    },
})
$`Say something.`
assistant("Hello, world!")
