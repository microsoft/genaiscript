system({
    title: "Math expression evaluator",
    description: "Register a function that evaluates math expressions",
})

defTool("math_eval", "Evaluates a math expression", {
    type: "object",
    properties: {
        expression: {
            type: "string",
            description: "Math expression to evaluate using mathjs format.",
        }
    },
    required: ["expression"],
}, async (args) => {
    const { expression } = args
    return "" + (await parsers.math(expression) ?? "?")
})