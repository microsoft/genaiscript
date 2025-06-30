import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { GitClient } from "./git"

describe("GitClient", () => {
    test("changedFilesSince method exists", () => {
        const client = new GitClient(".")
        assert(typeof client.changedFilesSince === "function", "changedFilesSince method should exist")
    })

    test("changedFilesSince method signature", () => {
        const client = new GitClient(".")
        // Test that the method accepts the expected parameters
        const method = client.changedFilesSince
        assert.equal(method.length, 2, "changedFilesSince should accept 2 parameters")
    })

    test("changedFilesSince returns Promise", () => {
        const client = new GitClient(".")
        const result = client.changedFilesSince("1 hour ago")
        assert(result instanceof Promise, "changedFilesSince should return a Promise")
    })
})