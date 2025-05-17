script({ model: "echo", maxTokens: 20, tests: {}, group: "commit" })
def("HUGE", ":) ".repeat(1000000), { maxTokens: 1000 })
$`Summarize HUGE i one word.`
