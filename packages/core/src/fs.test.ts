import { describe, test, before, after } from "node:test"
import assert from "node:assert/strict"
import { tryStat } from "./fs"
import * as fs from "fs/promises"
import * as path from "path"

describe("tryStat", async () => {
    const testDir = path.join(process.cwd(), "test-tryStat")
    const testFile = path.join(testDir, "testfile.txt")

    before(async () => {
        // Setup test directory and file
        await fs.mkdir(testDir, { recursive: true })
        await fs.writeFile(testFile, "test content")
    })

    after(async () => {
        // Cleanup
        await fs.rm(testDir, { recursive: true, force: true })
    })

    test("should return stat information for an existing file", async () => {
        const stat = await tryStat(testFile)
        assert(
            stat !== undefined,
            "Stat should not be undefined for existing file"
        )
        assert(stat.isFile(), "Should be a file")
    })

    test("should return stat information for an existing directory", async () => {
        const stat = await tryStat(testDir)
        assert(
            stat !== undefined,
            "Stat should not be undefined for existing directory"
        )
        assert(stat.isDirectory(), "Should be a directory")
    })

    test("should return undefined for non-existent file", async () => {
        const nonExistentFile = path.join(testDir, "nonexistent.txt")
        const stat = await tryStat(nonExistentFile)
        assert.equal(
            stat,
            undefined,
            "Should return undefined for non-existent file"
        )
    })

    test("should return undefined for invalid path", async () => {
        const stat = await tryStat("")
        assert.equal(
            stat,
            undefined,
            "Should return undefined for invalid path"
        )
    })
})
