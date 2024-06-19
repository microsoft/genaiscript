import { describe, test } from "node:test"
import { parseTraceTree } from "./markdown"
import assert from "node:assert/strict"

describe("trace tree", () => {
    test("flat", () => {
        const res = parseTraceTree(undefined)
        assert.deepStrictEqual(res, {
            label: "root",
            content: [''],
        })
    })

    test("flat", () => {
        const res = parseTraceTree(`
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
        const res = parseTraceTree(`
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

    test("multi node", () => {
        const res = parseTraceTree(`
flat tree
<details>
<summary>
2
</summary>
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

    test("nested node", () => {
        const res = parseTraceTree(`
flat tree
<details>
<summary>
2
</summary>
<details>
<summary>
2.5
</summary>
2.5.5
</details>
</details>
3
`)
        assert.deepStrictEqual(res, {
            label: "root",
            content: [
                `
flat tree`,
                { label: "2", content: [{ label: "2.5", content: ["2.5.5"] }] },
                `3
`,
            ],
        })
    })
})
