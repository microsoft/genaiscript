script({ maxTokens: 20 })
def("HUGE", ":) ".repeat(1000000), { maxTokens: 1000 })
$`Summarize HUGE i one word.`
