script({
    model: "small",
    tests: {
        keywords: ["Hello", "World"],
    },
})
$`##Task
Print "Hello" in the response.`.role("system")
$`Print "world" in the response.`.role("system")

$`Do what you have been told.`
