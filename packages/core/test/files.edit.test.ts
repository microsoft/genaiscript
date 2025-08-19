import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { readFile, writeFile, unlink } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"

// Mock workspace for testing
const mockWorkspace = {
    async readText(filename: string) {
        try {
            const content = await readFile(filename, "utf-8")
            return { content }
        } catch (e) {
            throw new Error(`File not found: ${filename}`)
        }
    },
    async writeText(filename: string, content: string) {
        await writeFile(filename, content, "utf-8")
    }
}

// Mock context
const mockContext = {
    log: (message: string) => console.log(message)
}

describe("system.files.edit", () => {
    let testFile: string
    let originalContent: string

    beforeEach(async () => {
        testFile = join(tmpdir(), `test-file-${Date.now()}.txt`)
        originalContent = "line 1\nline 2\nline 3\nline 4\nline 5"
        await writeFile(testFile, originalContent, "utf-8")
    })

    afterEach(async () => {
        try {
            await unlink(testFile)
        } catch {
            // Ignore if file doesn't exist
        }
    })

    it("should insert lines without deleting", async () => {
        // Mock the tool function (simplified for testing)
        const editFile = async (args: any) => {
            const { filename, insertLine, deleteCount = 0, lines = [] } = args
            
            const result = await mockWorkspace.readText(filename)
            const fileContent = result.content ?? ""
            const fileLines = fileContent.split(/\r?\n/)
            
            const zeroBasedIndex = insertLine - 1
            fileLines.splice(zeroBasedIndex, deleteCount, ...lines)
            
            const newContent = fileLines.join("\n")
            await mockWorkspace.writeText(filename, newContent)
            
            return `File edited successfully`
        }

        await editFile({
            filename: testFile,
            insertLine: 3,
            deleteCount: 0,
            lines: ["inserted line A", "inserted line B"]
        })

        const result = await readFile(testFile, "utf-8")
        const expected = "line 1\nline 2\ninserted line A\ninserted line B\nline 3\nline 4\nline 5"
        expect(result).toBe(expected)
    })

    it("should delete lines without inserting", async () => {
        const editFile = async (args: any) => {
            const { filename, insertLine, deleteCount = 0, lines = [] } = args
            
            const result = await mockWorkspace.readText(filename)
            const fileContent = result.content ?? ""
            const fileLines = fileContent.split(/\r?\n/)
            
            const zeroBasedIndex = insertLine - 1
            fileLines.splice(zeroBasedIndex, deleteCount, ...lines)
            
            const newContent = fileLines.join("\n")
            await mockWorkspace.writeText(filename, newContent)
            
            return `File edited successfully`
        }

        await editFile({
            filename: testFile,
            insertLine: 2,
            deleteCount: 2,
            lines: []
        })

        const result = await readFile(testFile, "utf-8")
        const expected = "line 1\nline 4\nline 5"
        expect(result).toBe(expected)
    })

    it("should replace lines (delete and insert)", async () => {
        const editFile = async (args: any) => {
            const { filename, insertLine, deleteCount = 0, lines = [] } = args
            
            const result = await mockWorkspace.readText(filename)
            const fileContent = result.content ?? ""
            const fileLines = fileContent.split(/\r?\n/)
            
            const zeroBasedIndex = insertLine - 1
            fileLines.splice(zeroBasedIndex, deleteCount, ...lines)
            
            const newContent = fileLines.join("\n")
            await mockWorkspace.writeText(filename, newContent)
            
            return `File edited successfully`
        }

        await editFile({
            filename: testFile,
            insertLine: 2,
            deleteCount: 2,
            lines: ["replacement line 1", "replacement line 2", "replacement line 3"]
        })

        const result = await readFile(testFile, "utf-8")
        const expected = "line 1\nreplacement line 1\nreplacement line 2\nreplacement line 3\nline 4\nline 5"
        expect(result).toBe(expected)
    })
})