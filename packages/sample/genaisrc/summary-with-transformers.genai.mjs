import { pipeline } from "@xenova/transformers"

script({
    title: "summary of summary - transformers.js",
    model: "openai:gpt-3.5-turbo",
    files: ["src/rag/*"],
    tests: {
        files: ["src/rag/*"],
        keywords: ["markdown", "lorem", "microsoft"],
    },
})

// download summarizer model from huggingface
const summarizer = await pipeline("summarization")

// map each file to its summary
for (const file of env.files) {
    const [summary] = await summarizer(file.content)
    // @ts-ignore
    def("FILE", { filename: file.filename, content: summary.summary_text })
}
// reduce all summaries to a single summary
$`Summarize all the FILE.`
