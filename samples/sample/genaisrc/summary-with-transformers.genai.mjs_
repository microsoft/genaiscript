script({
    title: "summary of summary - transformers.js",
    model: "ollama:llama3.2:1b",
    files: ["src/rag/markdown.md"],
    tests: {
        files: ["src/rag/markdown.md"],
        keywords: ["markdown"],
    },
})

console.log("loading summarizer transformer")
import { pipeline } from "@huggingface/transformers"
const summarizer = await pipeline("summarization")

for (const file of env.files) {
    console.log(`summarizing ${file.filename}`)
    const [summary] = await summarizer(file.content)
    // @ts-ignore
    const { summary_text } = summary
    def("FILE", {
        filename: file.filename,
        // @ts-ignore
        content: summary_text,
    })
}

console.log(`summarize all summaries`)
$`Summarize all the contents in FILE.`
