import test, { describe } from "node:test"
import assert from "node:assert"
import { llmifyDiff } from "./diff"

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

    test("diff test 4", function () {
        const diff = `diff --git a/packages/core/src/liner.ts b/packages/core/src/liner.ts
index 1215f7e7..385884e0 100644
--- a/packages/core/src/liner.ts
+++ b/packages/core/src/liner.ts
@@ -31,7 +31,7 @@ export function addLineNumbersToDiff(diff: string) {
         for (const chunk of file.chunks) {
             let currentLineNumber = chunk.oldStart
             for (const change of chunk.changes) {
-                if (change.type === "add") continue
+                if (change.type === "del") continue
                 ;(change as any).line = currentLineNumber
                 currentLineNumber++
             }`
        const expected = `--- packages/core/src/liner.ts
+++ packages/core/src/liner.ts
@@ -31,7 +31,7 @@ export function addLineNumbersToDiff(diff: string) {
[31]          for (const chunk of file.chunks) {
[32]              let currentLineNumber = chunk.oldStart
[33]              for (const change of chunk.changes) {
-                if (change.type === "add") continue
[34] +                if (change.type === "del") continue
[35]                  ;(change as any).line = currentLineNumber
[36]                  currentLineNumber++
[37]              }
`
        assertDiff(diff, expected)
    })      
    test("returns the original diff if it is empty", function () {
        const diff = ""
        const result = llmifyDiff(diff)
        assert.strictEqual(result, diff)
    })
})
function assertDiff(diff: string, expected: string) {
    const result = llmifyDiff(diff)
    console.log(diff)
    console.log("\n> result")
    console.log(result)
    console.log("\n> expected")
    console.log(expected)
    assert.strictEqual(result, expected)
}
