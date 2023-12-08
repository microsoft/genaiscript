gptool({
    title: "chat-summary",
})

// use $ to output formatted text to the prompt
$`You are a helpful assistant. You will summary the chat history.`

// use def to emit and reference chunks of text
def("CHAT", env.chat.history.map(({ role, content, name }) =>
    `${name || "user"}: ${content}`
).join("\n\n"))
