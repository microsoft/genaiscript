script({
    title: "top-level-ts",
    model: "openai:gpt-3.5-turbo",
    files: ["src/rag/markdown.md"],
    tests: {
        files: ["src/rag/markdown.md"],
        keywords: "markdown",
    },
})

function f(x: number) {}
const x: number = 123 // typescript syntax

import { summarize } from "./summarizer.mjs"
const { summarize: summarizeTs } = await import("./summarizer-ts.mts")

$`You are an export at analyzing data.`

export default async function () {
    summarize(env.generator, env.files)
    summarizeTs(env.generator, env.files)
}
