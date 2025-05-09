import { beforeEach, describe, test } from "node:test"
import assert from "node:assert/strict"
import { grepSearch } from "./grep"
import { TestHost } from "./testhost"

// testmarker = aojkhsdfvfaweiojhfwqepiouiasdojhvfadshjoasdf

describe("grepSearch (integration)", () => {
    beforeEach(() => {
        TestHost.install()
        console.log(`cwd: ${process.cwd()}`)
    })

    test("should return files and matches for string pattern", async () => {
        const result = await grepSearch(
            "aojkhsdfvfaweiojhfwqepiouiasdojhvfadshjoasdf",
            {
                glob: ["*.ts"],
                path: "src",
            }
        )
        assert(Array.isArray(result.files))
        assert(Array.isArray(result.matches))
        assert(result.files.some((f) => typeof f.filename === "string"))
        assert(
            result.matches.every(
                (m) =>
                    typeof m.filename === "string" &&
                    typeof m.content === "string"
            )
        )
        assert(result.files.length === 1)
        assert(result.files[0].filename === "packages/core/src/grep.test.ts")
    })

    test("should support RegExp pattern and ignoreCase", async () => {
        const result = await grepSearch(/grep/i, {
            glob: ["*.ts"],
            path: "src",
        })
        assert(result.files.some((f) => typeof f.filename === "string"))
        assert(result.matches.some((m) => typeof m.filename === "string"))
    })

    test("should not read file content if readText is false", async () => {
        const result = await grepSearch("grep", {
            glob: ["*.ts"],
            path: "src",
            readText: false,
        })
        assert(result.files.every((f) => !("content" in f)))
    })

    test("should bypass .gitignore filtering if applyGitIgnore is false", async () => {
        const result = await grepSearch("McpClientManager", {
            applyGitIgnore: false,
        })
        assert(Array.isArray(result.files))
    })
})
