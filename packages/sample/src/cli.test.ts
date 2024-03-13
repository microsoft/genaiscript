import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { CLI_JS } from "genaiscript-core"
import "zx/globals"

const cli = `../cli/built/${CLI_JS}`

describe("run", () => {
    const cmd = "run"
    describe("dry run", () => {
        const flags = `--prompt`
        test("slides greeter", async () => {
            const res =
                await $`node ${cli} ${cmd} slides src/greeter.ts ${flags}`
            const resj = JSON.parse(res.stdout)
            assert(Array.isArray(resj))
            assert(
                resj.some(
                    (msg) =>
                        msg.role === "user" &&
                        msg.content[0].text.includes("src/greeter.ts")
                )
            )
        })
    })
})

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

describe("cli", () => {
    test("help-all", async () => {
        $`node ${cli} help-all`
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
        assert(
            res.stdout.includes(
                "Microsoft Word is a word processor developed by Microsoft."
            )
        )
    })
    test("tokens", async () => {
        const res = await $`node ${cli} ${cmd} tokens "**/*.md"`
    })
})

describe("retreival", () => {
    const cmd = "retreival"
    describe("outline", () => {
        const action = "outline"
        test("greeter.ts", async () => {
            const res = await $`node ${cli} ${cmd} ${action} src/greeter.ts`
            assert(res.stdout.includes("class Greeter"))
        })
    })
})
