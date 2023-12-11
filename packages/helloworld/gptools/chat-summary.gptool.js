gptool({
    title: "chat-summary",
    copilot: true,
    system: ["system"]
})

// use $ to output formatted text to the prompt
$`You are an expert a LLM prompt engineering.
You will summarize the chat history as text (you can format it in markdown).
Do not generate a fence region for the output.`

// use def to emit and reference chunks of text
def("CHAT", env.chat.content, { language: "markdown" })
