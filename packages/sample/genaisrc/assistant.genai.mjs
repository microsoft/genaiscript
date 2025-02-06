script({
    model: "small",
    tests: {
        keywords: ["hello", "world"],
    },
})
$`Say something.`
$`hello`.role("assistant")
assistant("world!")
