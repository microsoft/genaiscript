script({
    model: "openai:gpt-3.5-turbo",
    tests: {
        keywords: ["paris", "monday"],
        asserts: [
            {
                type: "not-icontains",
                value: "hello",
            },
        ],
    },
})
$`What is the capital of {{ country }}?`.jinja({ country: "France" })
$`Today is {{ day }}. What day of the week is it?`.mustache({ day: "Monday" })
$`This part of the prompt should not be inlined. SaY HELLO.`.maxTokens(1)
