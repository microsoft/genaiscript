system({
    title: "Math expression evaluator",
    description: "Register a function that evaluates math expressions",
})

defTool(
    "math_eval",
    "Evaluates a math expression. Do NOT try to compute arithmetic operations yourself, use this tool.",
    {
        type: "object",
        properties: {
            expression: {
                type: "string",
                description:
                    "Math expression to evaluate using mathjs format. Use ^ for power operator.",
            },
        },
        required: ["expression"],
    },
    async (args) => {
        const { context, expression } = args
        const res = String((await parsers.math(expression)) ?? "?")
        context.log(`math: ${expression} => ${res}`)
        return res
    }
)
