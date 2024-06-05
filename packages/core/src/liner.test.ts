import test, { describe } from "node:test"
import assert from "node:assert"
import { addLineNumbersToDiff } from "./liner"

describe("liner", function () {
    test("adds line numbers to a simple diff", function () {
        const diff = `--- a/file1.txt\n+++ b/file2.txt\n@@ -1,2 +1,2 @@\n-line1\n-line2\n+line1\n+line2`
        const expected = `--- a/file1.txt\n+++ b/file2.txt\n@@ -1,2 +1,2 @@\n-1: line1\n-2: line2\n+line1\n+line2`
        const result = addLineNumbersToDiff(diff)
        console.log(diff)
        console.log('\n> result')
        console.log(result)
        console.log('\n> expected')
        console.log(expected)
        assert.strictEqual(result, expected)
    })

    test("returns the original diff if it is empty", function () {
        const diff = ""
        const result = addLineNumbersToDiff(diff)
        assert.strictEqual(result, diff)
    })

    // Add more test cases as needed...
})
