import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { CLI_JS } from "genaiscript-core"

const cli = `../cli/built/${CLI_JS}`

describe("init", async () => {
    await import("zx/globals")
})
describe("run", async () => {
    const cmd = "run"
    const flags = `--prompt`
    await test("slides greeter", async () => {
        const res = await $`node ${cli} ${cmd} slides src/greeter.ts ${flags}`
        console.log("---\n" + res.stdout + "\n---")
        const resj = JSON.parse(res.stdout)
        assert(Array.isArray(resj))
        assert(
            resj.some(
                (msg) =>
                    msg.role === "user" &&
                    msg.content.includes("src/greeter.ts")
            )
        )
    })
    await test("parameters", async () => {
        debugger
        const res =
            await $`node ${cli} ${cmd} parameters src/greeter.ts ${flags}`.nothrow()
        assert.equal(res.exitCode, 0)
    })
})
describe("scripts", async () => {
    const cmd = "scripts"
    await test("list", async () => {
        const res = await $`node ${cli} ${cmd}`
        assert(
            res.stdout.includes(
                "system.files, File generation, system, builtin, system"
            )
        )
    })
})
describe("cli", async () => {
    const action = "info"
    test("help", async () => {
        await $`node ${cli} ${action} help`
    })
    test("system", async () => {
        await $`node ${cli} ${action} system`
    })
})
describe("parse", async () => {
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
        await $`node ${cli} ${cmd} tokens "src/**" -ef "**/*.pdf"`
    })
    describe("code", async () => {
        const action = "code"
        test("greeter.ts query", async () => {
            const res =
                await $`node ${cli} ${cmd} ${action} src/greeter.ts "(interface_declaration) @i"`
            assert(res.stdout.includes("interface_declaration"))
        })
        test("greeter.ts tree", async () => {
            const res = await $`node ${cli} ${cmd} ${action} src/greeter.ts`
            assert(res.stdout.includes("interface_declaration"))
        })
        test("counting.py", async () => {
            const res =
                await $`node ${cli} ${cmd} ${action} src/counting.py "(class_definition) @i"`
            assert(res.stdout.includes("class_definition"))
        })
        test("ewd.tla", async () => {
            const res =
                await $`node ${cli} ${cmd} ${action} src/tla/EWD998PCal.tla "(block_comment) @i"`
            assert(res.stdout.includes("block_comment"))
        })
        test("README.md not supported", async () => {
            const res =
                await $`node ${cli} ${cmd} ${action} README.md`.nothrow()
            assert(res.exitCode)
        })
    })
})

describe("retrieval", () => {
    const cmd = "retrieval"
    test("fuzz markdown", async () => {
        const action = "fuzz"
        const res =
            await $`node ${cli} ${cmd} ${action} markdown src/rag/*`.nothrow()
        assert(res.stdout.includes("markdown.md"))
        assert(!res.exitCode)
    })
})
