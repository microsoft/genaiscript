import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { GitClient } from "./git"

describe("GitClient", () => {
    test("changedFiles method exists", () => {
        const client = new GitClient(".")
        assert(typeof client.changedFiles === "function", "changedFiles method should exist")
    })

    test("changedFiles method signature", () => {
        const client = new GitClient(".")
        // Test that the method accepts the expected parameters
        const method = client.changedFiles
        assert.equal(method.length, 1, "changedFiles should accept 1 parameter")
    })

    test("changedFiles returns Promise", () => {
        const client = new GitClient(".")
        const result = client.changedFiles({ since: "1 hour ago" })
        assert(result instanceof Promise, "changedFiles should return a Promise")
    })

    test("changedFiles returns empty array when no since parameter", async () => {
        const client = new GitClient(".")
        const result = await client.changedFiles()
        assert(Array.isArray(result), "changedFiles should return an array")
        assert.equal(result.length, 0, "changedFiles should return empty array when no since parameter")
    })
})