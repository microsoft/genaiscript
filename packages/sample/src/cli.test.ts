import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { CLI_JS } from "../../core/src/constants"
import { $ } from "zx"

const cli = `../cli/built/${CLI_JS}`

describe("init", async () => {
    await import("zx/globals")
})
describe("run", async () => {
    const cmd = "run"
    const flags = ""
    await test("poem", async () => {
        const res = await $`node ${cli} ${cmd} poem --model echo`
        console.log("---\n" + res.stdout + "\n---")
    })
    await test("gist", async () => {
        const uri =
            "vscode://vsls-contrib.gistfs/open?gist=8f7db2674f7b0eaaf563eae28253c2b0&file=echo.genai.mts"
        const res = await $`node ${cli} ${cmd} ${uri} --model echo`
        console.log("---\n" + res.stdout + "\n---")
    })
})
describe("scripts", async () => {
    const cmd = "scripts"
    await test("list json", async () => {
        const res = await $`node ${cli} ${cmd} list --json --unlisted`
        const d = JSON.parse(res.stdout)
        assert(d.find((s) => s.id === "poem"))
        assert(d.find((s) => s.id === "system"))
        assert(d.find((s) => s.id === "system.output_markdown"))
        assert(!d.some((s) => s.system && s.filename))
    })
    await test("create foobar", async () => {
        const res = await $`node ${cli} ${cmd} create foobar`
        assert(res.stdout.includes("foobar"))
    })
    await test("create foobar", async () => {
        const res = await $`node ${cli} ${cmd} create foobar`
        assert(res.stdout.includes("foobar"))
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
    test("env", async () => {
        await $`node ${cli} ${action} env`
    })
    test("env openai", async () => {
        await $`node ${cli} ${action} env openai`
    })
})
describe("cli", async () => {
    const action = "models"
    test("models", async () => {
        await $`node ${cli} ${action}`
    })
    test("models alias", async () => {
        await $`node ${cli} ${action} alias`
    })
})
describe("parse", async () => {
    const cmd = "parse"
    await test("pdf", async () => {
        const res = await $`node ${cli} ${cmd} pdf src/rag/loremipsum.pdf`
        assert(res.stdout.includes("Lorem Ipsum"))
    })
    await test("docx", async () => {
        const res = await $`node ${cli} ${cmd} docx src/rag/Document.docx`
        assert(res.stdout.includes("**Microsoft Word**"))
    })
    await test("tokens", async () => {
        await $`node ${cli} ${cmd} tokens "src/*" -ef "**/*.pdf" -ef "**/*.docx"`
    })
    await test("prompty", async () => {
        const res = await $`node ${cli} ${cmd} "src/*.prompty"`.nothrow()
        assert(!res.exitCode)
    })
})

describe("retrieval", () => {
    const cmd = "retrieval"
    describe("fuzz", () => {
        const action = "fuzz"
        test("markdown", async () => {
            const res =
                await $`node ${cli} ${cmd} ${action} markdown src/rag/*`.nothrow()
            assert(res.stdout.includes("markdown.md"))
            assert(!res.exitCode)
        })
    })
})

describe("video", () => {
    const cmd = "video"
    test("extract-audio", async () => {
        const action = "extract-audio"
        const res =
            await $`node ${cli} ${cmd} ${action} src/audio/helloworld.mp4`.nothrow()
        assert(!res.exitCode)
    })

    test("extract-frames", async () => {
        const action = "extract-frames"
        const res =
            await $`node ${cli} ${cmd} ${action} src/audio/helloworld.mp4`.nothrow()
        assert(!res.exitCode)
    })

    test("probe", async () => {
        const action = "probe"
        const res =
            await $`node ${cli} ${cmd} ${action} src/audio/helloworld.mp4`.nothrow()
        assert(!res.exitCode)
    })
})

describe("action", () => {
    const cmd = "configure"
    test("configure", async () => {
        const action = "action"
        const res =
            await $`node ${cli} ${cmd} ${action} poem --out .genaiscript/action --ffmpeg --playwright`
        assert(res.stderr.includes("poem"))
    })
})
