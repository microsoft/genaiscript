import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { GitHubClient, patchGithubImages } from "./githubclient"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { isCI } from "./ci"

describe("GitHubClient", async () => {
    const client = GitHubClient.default()
    await test("patchGithubImages() replaces image URLs correctly", async () => {
        // Test when owner and repo match
        const info = { owner: "microsoft", repo: "genaiscript" }

        const inputText = `
Here's an image:
![](https://raw.githubusercontent.com/microsoft/genaiscript/genai-assets/8c17c9f01c87f4d965d121dfff551ce60b81f2f8f008773f1fcfb58d8c2d8169.png)

ignore
https://raw.githubusercontent.com/foo/bar/genai-assets/abc123def456.jpg
`

        const expectedOutput = `
Here's an image:
![](../blob/genai-assets/8c17c9f01c87f4d965d121dfff551ce60b81f2f8f008773f1fcfb58d8c2d8169.png?raw=true)

ignore
https://raw.githubusercontent.com/foo/bar/genai-assets/abc123def456.jpg
`

        const result = patchGithubImages(info, inputText)
        assert.equal(result, expectedOutput)
    })

    await test("info() returns GitHub options", async () => {
        const info = await client.info()
        assert(info.owner)
        assert(info.repo)
    })

    await test("api() returns GitHub client", async () => {
        const api = await client.api()
        assert(api.client)
        assert(api.owner)
        assert(api.repo)
    })

    await test("listIssues()", async () => {
        const issues = await client.listIssues({ count: 2 })
        assert(issues.length)
        const issue = await client.getIssue(issues[0].number)
        assert(issue?.number === issues[0].number)
        assert(issue?.title)
    })

    await test("listGists()", async () => {
        const gists = await client.listGists({ count: 2 })
        assert(Array.isArray(gists))
        const gist = await client.getGist(gists[0].id)
        assert(gist?.files)
    })

    await test("listPullRequests()", async () => {
        const prs = await client.listPullRequests({ count: 2 })
        assert(Array.isArray(prs))
        const pr = await client.getPullRequest(prs[0].number)
        assert(pr?.number === prs[0].number)
    })
    await test("listWorkflowRuns()", async () => {
        if (isCI) return
        const workflows = await client.listWorkflows({ count: 2 })
        assert(Array.isArray(workflows))
        const runs = await client.listWorkflowRuns(workflows[0].id)
        assert(Array.isArray(runs))
        const jobs = await client.listWorkflowJobs(runs[0].id)
        assert(Array.isArray(jobs))
        const log = await client.downloadWorkflowJobLog(jobs[0].id)
        assert(typeof log === "string")
    })

    await test("getFile() returns file content", async () => {
        const file = await client.getFile("README.md", "main")
        assert(file?.content)
    })
    await test("searchCode() returns search results", async () => {
        if (isCI) return
        const results = await client.searchCode("writeText")
        assert(Array.isArray(results))
    })

    await test("listBranches() returns array of branches", async () => {
        const branches = await client.listBranches()
        assert(Array.isArray(branches))
    })

    await test("listRepositoryLanguages() returns language stats", async () => {
        const langs = await client.listRepositoryLanguages()
        assert(typeof langs === "object")
    })

    await test("getRepositoryContent() returns repository files", async () => {
        const files = await client.getRepositoryContent("packages/core/src")
        assert(Array.isArray(files))
    })
    await test("getOrCreateRef()", async () => {
        const client = GitHubClient.default()
        const existingRef = await client.getOrCreateRef("test-ignore", {
            orphaned: true,
        })
        assert(existingRef)
        assert(existingRef.ref === "refs/heads/test-ignore")
    })
    await test("uploadAsset()", async () => {
        if (isCI) return
        const buffer = await readFile(fileURLToPath(import.meta.url))
        const client = GitHubClient.default()
        const url = await client.uploadAsset(buffer)
        assert(url)
        const parsedUrl = new URL(url)
        assert(parsedUrl.host === "raw.githubusercontent.com")

        // Test with undefined buffer
        const un = await client.uploadAsset(undefined)
        assert(un === undefined)
    })
})
