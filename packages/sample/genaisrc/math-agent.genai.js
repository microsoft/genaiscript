script({
    title: "math-agent",
    description: "A port of https://ts.llamaindex.ai/examples/agent"
})

defFunction("sum", "Use this function to sum two numbers", {
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
}, ({ a, b }) => `${a + b}`)

defFunction("divide", "Use this function to divide two numbers", {
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
}, ({ a, b }) => `${a / b}`)

$`How much is 5 + 5? then divide by 2?`