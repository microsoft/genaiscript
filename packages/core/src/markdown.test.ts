import { describe, test } from "node:test"
import { parseTraceTree } from "./markdown"
import assert from "node:assert/strict"

describe("trace tree", () => {
    test("empty", () => {
        const { root: res } = parseTraceTree(undefined)
        delete res.id
        assert.deepStrictEqual(res, {
            type: "details",
            label: "root",
            content: [""],
        })
    })

    test("flat", () => {
        const { root: res } = parseTraceTree(`
flat tree
2
3
`)
        delete res.id
        assert.deepStrictEqual(res, {
            type: "details",
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
        const { root: res } = parseTraceTree(`
flat tree
<details>
<summary>2</summary>
2.5
</details>
3
`)
        delete res.id
        delete (res.content[1] as any).id
        assert.deepStrictEqual(res, {
            type: "details",
            label: "root",
            content: [
                `
flat tree`,
                { type: "details", label: "2", content: ["2.5"] },
                `3
`,
            ],
        })
    })

    test("multi node", () => {
        const { root: res } = parseTraceTree(`
flat tree
<details>
<summary>
2
</summary>
2.5
</details>
3
`)
        delete res.id
        delete (res.content[1] as any).id
        assert.deepStrictEqual(res, {
            type: "details",
            label: "root",
            content: [
                `
flat tree`,
                { type: "details", label: "2", content: ["2.5"] },
                `3
`,
            ],
        })
    })

    test("nested node", () => {
        const { root: res } = parseTraceTree(`
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
        delete res.id
        delete (res.content[1] as any).id
        delete (res.content[1] as any).content[0].id
        assert.deepStrictEqual(res, {
            type: "details",
            label: "root",
            content: [
                `
flat tree`,
                {
                    type: "details",
                    label: "2",
                    content: [
                        {
                            type: "details",
                            label: "2.5",
                            content: ["2.5.5"],
                        },
                    ],
                },
                `3
`,
            ],
        })
    })
})
