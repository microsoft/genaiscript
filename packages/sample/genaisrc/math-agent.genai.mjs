script({
    title: "math-agent",
    model: "openai:gpt-35-turbo",
    description: "A port of https://ts.llamaindex.ai/examples/agent",
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

defTool(
    "sum",
    "Use this function to sum two numbers",
    { a: 1, b: 2 },
    ({ a, b }) => {
        console.log(`${a} + ${b}`)
        return `${a + b}`
    }
)

defTool(
    "divide",
    "Use this function to divide two numbers",
    {
        type: "object",
        properties: {
            a: {
                type: "number",
                description: "The first number",
            },
            b: {
                type: "number",
                description: "The second number",
            },
        },
        required: ["a", "b"],
    },
    ({ a, b }) => {
        console.log(`${a} / ${b}`)
        return `${a / b}`
    }
)

$`Answer the following arithmetic question: 

    ${env.vars.question}
`
