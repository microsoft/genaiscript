script({
    tests: {},
})

def("DOC1", "Monkey", { fenceFormat: "xml" })
def("DOC2", "Horse", { fenceFormat: "markdown" })
def("DOC3", "Food", { fenceFormat: "none" })

defChatParticipant((context, messages) => {
    const user = messages.find((m) => m.role === "user")
    const content = user.content + ""
    if (!content.includes("<DOC1>\nMonkey\n</DOC1>"))
        throw new Error("DOC1 is not XML")
    if (!content.includes("DOC3:\nFood\n")) throw new Error("DOC3 is not none")
    if (!content.includes("DOC2:\n```\nHorse\n```"))
        throw new Error("DOC2 is not markdown")
})
