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
import { summarize as summarizeTs } from "./summarizer-mts.mts"
const { summarize: summarizeDynamicTs } = await import("./summarizer-mts.mts")

$`You are an export at analyzing data.`

export default async function () {
    await summarize(env.generator, env.files)
    await summarizeTs(env.generator, env.files)
    await summarizeDynamicTs(env.generator, env.files)
}
