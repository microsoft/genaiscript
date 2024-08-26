import { calculator } from "@agentic/calculator"

script({
    model: "openai:gpt-35-turbo",
    parameters: {
        question: {
            type: "string",
            default: "How much is 11 + 4? then divide by 3?",
        },
    },
    tests: {
        description: "Testing the default prompt",
        keywords: "5",
    },
})

// todo fix agentic specs
defTool(calculator as any)

$`Answer the following arithmetic question: 

    ${env.vars.question}
`
