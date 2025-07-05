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
})