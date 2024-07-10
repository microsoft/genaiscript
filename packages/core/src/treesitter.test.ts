import { treeSitterQuery } from "./treesitter"
import { beforeEach, describe, test } from "node:test"
import assert from "node:assert/strict"
import { TestHost } from "./testhost"
import { resolveFileContent } from "./file"

describe("treesitter", () => {
    beforeEach(() => {
        TestHost.install()
    })

    test("ts", async () => {
        const f: WorkspaceFile = { filename: "./src/treesitter.ts" }
        await resolveFileContent(f)
        const x = await treeSitterQuery(f)
        assert.strictEqual(x[0].name, "tree")
    })

    test("py", async () => {
        const f: WorkspaceFile = {
            filename: "./src/dummy.py",
            content: "def foo():\n    pass",
        }
        const x = await treeSitterQuery(f)
        assert.strictEqual(x[0].name, "tree")
    })
})
