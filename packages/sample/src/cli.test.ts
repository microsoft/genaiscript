import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { CLI_JS } from "genaiscript-core"
import "zx/globals"

const cli = `../cli/built/${CLI_JS}`
describe("tools", () => {
    const cmd = "tools"
    test("list", async () => {
        const res = await $`node ${cli} ${cmd} list`
        assert(
            res.stdout.includes(
                "system.json, JSON system prompt, builtin, system"
            )
        )
    })
})

describe("parse", () => {
    const cmd = "parse"
    test("pdf", async () => {
        const res = await $`node ${cli} ${cmd} pdf src/rag/loremipsum.pdf`
        assert(res.stdout.includes("Lorem Ipsum"))
    })
    test("docx", async () => {
        const res = await $`node ${cli} ${cmd} docx src/rag/Document.docx`
        assert(res.stdout.includes("Microsoft Word is a word processor developed by Microsoft."))
    })
    test("tokens", async () => {
        const res = await $`node ${cli} ${cmd} tokens "**/*.md"`
    })
})
