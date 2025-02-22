import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { filterGitIgnore } from "./gitignore"

describe("filterGitIgnore", async () => {
    test("returns all files when gitignore is empty", async () => {
        const files = ["file1.txt", "file2.js", "dir/file3.ts"]
        const result = await filterGitIgnore("", files)
        assert.deepEqual(result, files)
    })

    test("filters files based on gitignore patterns", async () => {
        const gitignore = `
*.txt
node_modules/
temp/
`
        const files = [
            "file1.txt",
            "src/file2.js", 
            "node_modules/lib.js",
            "temp/cache.json",
            "src/index.ts"
        ]
        const expected = ["src/file2.js", "src/index.ts"]
        const result = await filterGitIgnore(gitignore, files)
        assert.deepEqual(result, expected)
    })

    test("handles directory patterns correctly", async () => {
        const gitignore = "dist/"
        const files = [
            "src/index.ts",
            "dist/bundle.js",
            "dist/styles.css",
            "package.json"
        ]
        const expected = ["src/index.ts", "package.json"]
        const result = await filterGitIgnore(gitignore, files)
        assert.deepEqual(result, expected)
    })
})