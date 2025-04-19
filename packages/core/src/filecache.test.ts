import assert from "node:assert/strict"
import test, { beforeEach, describe } from "node:test"
import { dirname, join } from "node:path"
import { stat, readdir, rm } from "fs/promises"
import { existsSync } from "fs"
import { fileWriteCached } from "./filecache"
import { TestHost } from "./testhost"

describe("fileWriteCached", () => {
    const tempDir = join(dirname(__filename), "temp")

    beforeEach(async () => {
        TestHost.install()
        if (existsSync(tempDir)) {
            await rm(tempDir, { recursive: true, force: true })
        }
    })

    test("should write buffer to cache and return correct filename", async () => {
        const buffer: BufferLike = Buffer.from("test content")
        const filePath = await fileWriteCached(tempDir, buffer)

        const files = await readdir(tempDir)
        assert.equal(files.length, 1)
        const writtenFile = join(tempDir, files[0])

        const stats = await stat(writtenFile)
        assert(stats.isFile())

        assert.equal(filePath, writtenFile)
    })
})
