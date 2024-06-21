script({
    title: "top-level-mjs",
    model: "openai:gpt-3.5-turbo",
    files: ["src/rag/markdown.md"],
    tests: {
        files: ["src/rag/markdown.md"],
        keywords: "markdown",
    },
})

import { summarize } from "./summarizer.mjs"

$`You are an export at analyzing data.`

export default async function () {
    summarize(env.generator, env.files)
}
