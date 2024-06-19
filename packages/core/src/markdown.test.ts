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

    test("one node", () => {
        const res = parseDetailsTree(`
flat tree
<details>
<summary>2</summary>
2.5
</details>
3
`)
        assert.deepStrictEqual(res, {
            label: "root",
            content: [
                `
flat tree`,
                { label: "2", content: ["2.5"] },
                `3
`,
            ],
        })
    })
})
