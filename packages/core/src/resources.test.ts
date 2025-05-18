import { describe, test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { tryResolveResource } from "./resources"
import { pathToFileURL } from "node:url"
import { join } from "node:path"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { rmdir } from "node:fs/promises"
import { TestHost } from "./testhost"

describe("resources", async () => {
    let tempDir: string

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), "resources-test-"))
        TestHost.install()
    })

    afterEach(async () => {
        // Cleanup is left minimal intentionally
        await rmdir(tempDir, { recursive: true })
    })

    await test("should resolve file URLs", async () => {
        // Create a test file
        const testFilePath = join(tempDir, "test-file.txt")
        const testContent = "test content"
        writeFileSync(testFilePath, testContent)

        const fileUrl = pathToFileURL(testFilePath).href
        const result = await tryResolveResource(fileUrl)

        assert(result)
        assert.equal(result.files.length, 1)
        assert.equal(result.files[0].filename, testFilePath)
    })

    await test("should resolve https URL to raw content", async () => {
        const url =
            "https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/main/package.json"
        const result = await tryResolveResource(url)

        assert(result)
        assert.equal(result.files.length, 1)
        assert(result.files[0].content)
        assert(result.files[0].content.includes("GenAIScript"))
    })

    await test("should adapt GitHub blob URLs to raw URLs", async () => {
        const url =
            "https://github.com/microsoft/genaiscript/blob/main/package.json"
        const result = await tryResolveResource(url)

        assert(result)
        assert.equal(result.files.length, 1)
        assert(result.files[0].content)
        assert(result.files[0].content.includes("GenAIScript"))
    })
    await test("should resolve gist URLs", async () => {
        // Using a public test gist
        const url =
            "https://github.com/pelikhan/7f3f28389b7a9712da340f08cd19cff5/"
        const result = await tryResolveResource(url)

        assert(result)
        assert(result.files.length > 0)
        assert(result.files[0].content.includes("GenAIScript"))
    })
    await test("should resolve gist URLs (gist.github.com)", async () => {
        // Using a public test gist
        const url =
            "https://gist.github.com/pelikhan/7f3f28389b7a9712da340f08cd19cff5/"
        const result = await tryResolveResource(url)

        assert(result)
        assert(result.files.length > 0)
        assert(result.files[0].content.includes("GenAIScript"))
    })
    await test("should resolve gist URLs with files", async () => {
        // Using a public test gist
        const url =
            "https://github.com/pelikhan/7f3f28389b7a9712da340f08cd19cff5/readme.md"
        const result = await tryResolveResource(url)

        assert(result)
        assert(result.files.length === 1)
        assert(result.files[0].content.includes("GenAIScript"))
    })

    await test("should resolve VSCode gistfs URLs", async () => {
        const url =
            "vscode://vsls-contrib.gistfs/open?gist=7f3f28389b7a9712da340f08cd19cff5&file=readme.md"
        const result = await tryResolveResource(url)

        assert(result)
        assert.equal(result.files.length > 0, true)
        // The first file should be the one specified in the URL
        assert(result.files[0].filename.includes("readme.md"))
    })
})
