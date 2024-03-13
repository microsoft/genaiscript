import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { CLI_JS } from "genaiscript-core"
import "zx/globals"

const cli = `../cli/built/${CLI_JS}`
describe("cli", () => {
    test("tools list", async () => {
        const res = await $`node ${cli} tools list`
        assert(
            res.stdout.includes(
                "system.json, JSON system prompt, builtin, system"
            )
        )
    })
})
