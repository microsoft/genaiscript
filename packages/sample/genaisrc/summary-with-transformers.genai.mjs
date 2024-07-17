import { pipeline } from "@xenova/transformers"

script({
    title: "summary of summary - transformers.js",
    model: "ollama:phi3",
    files: ["src/rag/markdown.md"],
    tests: {
        files: ["src/rag/markdown.md"],
        keywords: ["markdown"],
    },
})

console.log("loading summarizer transformer")
const summarizer = await pipeline("summarization")

for (const file of env.files) {
    console.log(`summarizing ${file.filename}`)
    const [summary] = await summarizer(file.content)
    def("FILE", {
        filename: file.filename,
        // @ts-ignore
        content: summary.summary_text,
    })
}

console.log(`summarize all summaries`)
$`Summarize all the contents in FILE.`
