import { describe, test } from "node:test"
import assert from "node:assert/strict"

function replaceFrontMatter(before: string, generated: string) {
    const start = 0
    let end = 0
    const lines = (before || "").split("\n")
    if (lines[0] === "---") end = lines.indexOf("---", 1)
    const gstart = 0
    let gend = 0
    const glines = generated.split("\n")
    if (glines[0] === "---") gend = glines.indexOf("---", 1)
    if (gend > 0) {
        const res = lines.slice(0)
        const newfm = glines.slice(gstart, gend + 1)
        res.splice(
            start,
            end > 0 ? end + 1 - start : 0,
            ...newfm
        )
        console.log({ end, gend, lines, glines, newfm, res})
        return res.join("\n")
    }
    return before
}

describe("replace frontmatter", () => {
    test("none", () => {
        const generated = `---
foo: bar
---
`
        const res = replaceFrontMatter(undefined, generated)
        assert.equal(res, generated)
    })
    test("only", () => {
        const before = `---
baz: qux
---`
        const generated = `---
foo: bar
---`
        const res = replaceFrontMatter(before, generated)
        assert.equal(res, generated)
    })
    test("mix", () => {
        const before = `---
baz: qux
---
content`
        const generated = `---
foo: bar
---`
        const res = replaceFrontMatter(before, generated)
        assert.equal(res, generated + "\ncontent")
    })
})
