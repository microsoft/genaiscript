import test, { describe } from "node:test"
import assert from "node:assert"
import { addLineNumbersToDiff } from "./liner"

describe("liner", function () {
    test("diff test 1", function () {
        const diff = `diff --git a/packages/core/src/liner.diff.txt b/packages/core/src/liner.diff.txt
index 8cf2f17f..c3cfa4ae 100644
--- a/packages/core/src/liner.diff.txt
+++ b/packages/core/src/liner.diff.txt
@@ -1,3 +1,3 @@
 line 1
-line 2
+new line 2
 line 3`
        const expected = `--- packages/core/src/liner.diff.txt
+++ packages/core/src/liner.diff.txt
@@ -1,3 +1,3 @@
[1]  line 1
-line 2
[2] +new line 2
[3]  line 3
`
        assertDiff(diff, expected)
    })

    test("diff test 2", function () {
        const diff = `diff --git a/packages/core/src/liner.diff.txt b/packages/core/src/liner.diff.txt
index 8cf2f17f..e17283d9 100644
--- a/packages/core/src/liner.diff.txt
+++ b/packages/core/src/liner.diff.txt
@@ -1,3 +1,4 @@
 line 1
-line 2
-line 3
+new line 2
+new line 3
+line 3`
        const expected = `--- packages/core/src/liner.diff.txt
+++ packages/core/src/liner.diff.txt
@@ -1,3 +1,4 @@
[1]  line 1
-line 2
-line 3
[2] +new line 2
[3] +new line 3
[4] +line 3
`
        assertDiff(diff, expected)
    })   
    
    test("diff test 3", function () {
        const diff = `diff --git a/packages/core/src/liner.diff.txt b/packages/core/src/liner.diff.txt
index 8cf2f17f..519f67a6 100644
--- a/packages/core/src/liner.diff.txt
+++ b/packages/core/src/liner.diff.txt
@@ -1,3 +1,4 @@
+line 0
 line 1
-line 2
+line 2.5
 line 3
\ No newline at end of file`
        const expected = `--- packages/core/src/liner.diff.txt
+++ packages/core/src/liner.diff.txt
@@ -1,3 +1,4 @@
[1] +line 0
[2]  line 1
-line 2
[3] +line 2.5
[4]  line 3
`
        assertDiff(diff, expected)
    })    

    test("returns the original diff if it is empty", function () {
        const diff = ""
        const result = addLineNumbersToDiff(diff)
        assert.strictEqual(result, diff)
    })
})
function assertDiff(diff: string, expected: string) {
    const result = addLineNumbersToDiff(diff)
    console.log(diff)
    console.log("\n> result")
    console.log(result)
    console.log("\n> expected")
    console.log(expected)
    assert.strictEqual(result, expected)
}
