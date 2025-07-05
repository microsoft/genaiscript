import { beforeEach, describe, test } from "node:test"
import assert from "node:assert/strict"
import { GitHubClient } from "../githubclient"
import { TestHost } from "../testhost"

describe("GitHubClient new artifact methods", async () => {
    const client = GitHubClient.default()

    beforeEach(() => {
        TestHost.install()
    })

    await test("listArtifacts() method exists", async () => {
        assert(typeof client.listArtifacts === "function")
    })

    await test("downloadArtifact() alias exists", async () => {
        assert(typeof client.downloadArtifact === "function")
    })

    await test("readArtifact() method exists", async () => {
        assert(typeof client.readArtifact === "function")
    })

    await test("readArtifact() validates input", async () => {
        try {
            await client.readArtifact("")
            assert.fail("Should have thrown error for empty name")
        } catch (error) {
            assert(error.message.includes("non-empty string"))
        }

        try {
            await client.readArtifact(null as any)
            assert.fail("Should have thrown error for null name")
        } catch (error) {
            assert(error.message.includes("non-empty string"))
        }
    })
})