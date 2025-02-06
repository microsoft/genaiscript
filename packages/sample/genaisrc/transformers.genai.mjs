script({
    model: "transformers:onnx-community/Qwen2.5-Coder-0.5B-Instruct:q4",
    tests: {},
})

const res = await runPrompt(
    (ctx) => {
        ctx.$`Write a poem in python.`
    },
    {
        model: "transformers:onnx-community/Qwen2.5-Coder-0.5B-Instruct:q4",
    }
)
const res2 = await runPrompt(
    (ctx) => {
        ctx.$`Write a poem in typescript.`
    },
    {
        cache: "trfs",
        model: "transformers:onnx-community/Qwen2.5-Coder-0.5B-Instruct:q4",
    }
)
$`Write a poem with 2 paragraphs.`
