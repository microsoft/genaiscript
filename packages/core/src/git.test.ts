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
        assert.equal(method.length, 2, "changedFiles should accept 2 parameters")
    })

    test("changedFiles returns Promise", () => {
        const client = new GitClient(".")
        const result = client.changedFiles("1 hour ago")
        assert(result instanceof Promise, "changedFiles should return a Promise")
    })

    test("changedFiles with options returns Promise", () => {
        const client = new GitClient(".")
        const result = client.changedFiles("1 hour ago", { paths: ["src/"] })
        assert(result instanceof Promise, "changedFiles should return a Promise")
    })
})