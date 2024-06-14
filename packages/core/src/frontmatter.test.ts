import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { frontmatterTryParse } from "./frontmatter"

describe("replace frontmatter", () => {
    test("only", () => {
        const actual = `---
foo: bar
---
`
        const { value: res } = frontmatterTryParse(actual)
        assert.deepEqual(res, { foo: "bar" })
    })
    test("mix", () => {
        const actual = `---
foo: bar
---
foo bar
`
        const { value: res } = frontmatterTryParse(actual)
        assert.deepEqual(res, { foo: "bar" })
    })
})
