script({
    title: "top-level-ts",
    model: "small",
    files: ["src/rag/markdown.md"],
    tests: {
        files: ["src/rag/markdown.md"],
        keywords: "markdown",
    },
})

function f(x: number) {}
const x: number = 123 // typescript syntax

import { summarize } from "./summarizer.mjs"
const { summarize: summarizeTs } = await import("./summarizer-mts.mts")

$`You are an export at analyzing data.`

export default async function () {
    summarize(env.generator, env.files)
    summarizeTs(env.generator, env.files)
}
