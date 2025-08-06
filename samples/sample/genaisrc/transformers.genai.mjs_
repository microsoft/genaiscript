script({
    model: "transformers:onnx-community/Qwen2.5-Coder-0.5B-Instruct:q4",
    maxTokens: 100,
})

const res = await runPrompt(
    (ctx) => {
        ctx.$`Write a poem in python.`
    },
    {
        maxTokens: 100,
        model: "transformers:onnx-community/Qwen2.5-Coder-0.5B-Instruct:q4",
    }
)
const res2 = await runPrompt(
    (ctx) => {
        ctx.$`Write a poem in typescript.`
    },
    {
        cache: "trfs",
        maxTokens: 100,
        model: "transformers:onnx-community/Qwen2.5-Coder-0.5B-Instruct:q4",
    }
)
$`Write a poem with 2 paragraphs.`
