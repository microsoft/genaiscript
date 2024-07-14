import { beforeEach, describe, test } from "node:test"
import assert from "node:assert/strict"
import { TestHost } from "./testhost"
import { vectorSearch } from "./vectorsearch"
import { GENAISCRIPT_FOLDER } from "./constants"

describe("vectorsearch", () => {
    const folderPath = `./${GENAISCRIPT_FOLDER}/vectors`
    beforeEach(() => {
        TestHost.install()
    })

    test("onefile", async () => {
        const files = [{ filename: "hello.md", content: "hello world" }]
        const res = await vectorSearch("world", files, { folderPath })
        assert.strictEqual(res.length, 1)
        assert.strictEqual(res[0].filename, "hello.md")
    })

    test("twofiles", async () => {
        const files = [
            { filename: "hello.md", content: "hello world" },
            { filename: "other.md", content: "this is completely unrelated" },
        ]
        const res = await vectorSearch("world", files, { folderPath })
        console.log(JSON.stringify(res, null, 2))
        assert.strictEqual(res[0].filename, "hello.md")
    })
})
