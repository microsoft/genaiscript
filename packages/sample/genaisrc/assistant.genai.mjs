script({
    model: "small",
    tests: {
        keywords: ["hello", "world"],
    },
})
$`Say something.`
assistant("Hello, world!")
