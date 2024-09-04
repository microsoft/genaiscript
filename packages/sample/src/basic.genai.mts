script({
    title: "Basic Prompt",
    description: "A basic prompt that uses the chat API to answer questions",
    parameters: {
        question: {
            type: "string",
            default: "Who is the most famous person in the world?",
        },
    },
})

$`You are an AI assistant who helps people find information.
As the assistant, you answer questions briefly, succinctly.`
$`${env.vars.question}

${env.vars.hint}`
