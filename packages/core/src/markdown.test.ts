import { describe, test } from "node:test"
import { parseDetailsTree } from "./markdown"
import assert from "node:assert/strict"

describe("trace tree", () => {
    test("flat", () => {
        const res = parseDetailsTree(`
flat tree
2
3
`)
        assert.deepStrictEqual(res, {
            label: "root",
            content: [
                `
flat tree
2
3
`,
            ],
        })
    })
})
