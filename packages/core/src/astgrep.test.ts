import { beforeEach, describe, test } from "node:test"
import assert from "node:assert/strict"
import { astGrepFindInFiles, astGrepParse } from "./astgrep"
import { TestHost } from "./testhost"

describe("astgrep", () => {
    beforeEach(() => {
        TestHost.install()
    })

    test("finds matches in files", async () => {
        console.log("Hello, world!")
        const result = await astGrepFindInFiles(
            "ts",
            "src/astgrep.test.ts",
            "console.log($GREETING)"
        )
        assert.equal(result.files, 1)
        assert(result.matches.length > 0)
    })
    test("parses a JavaScript file", async () => {
        const file: WorkspaceFile = {
            filename: "test.js",
            content: "const x = 1;",
        }
        const result = await astGrepParse(file, { lang: "js" })
        assert(result)
    })

    test("returns undefined for binary file", async () => {
        const file: WorkspaceFile = {
            filename: "test.bin",
            encoding: "base64",
        }
        const result = await astGrepParse(file, { lang: "js" })
        assert.equal(result, undefined)
    })
})
