// cSpell: disable
import { describe, test } from "node:test"
import { MarkdownStringify, splitMarkdownTextImageParts } from "./markdown"
import assert from "node:assert/strict"
import { parseTraceTree } from "./traceparser"

describe("trace tree", () => {
    test("empty", () => {
        const { root: res } = parseTraceTree(undefined)
        delete res.id
        assert.deepStrictEqual(res, {
            type: "details",
            label: "trace",
            content: [""],
        })
    })
    test("stringify", () => {
        assert.strictEqual(MarkdownStringify({ a: 1 }), "\n- a: 1\n")
        assert.strictEqual(
            MarkdownStringify({ a: 1, b: 2 }),
            "\n- a: 1\n- b: 2\n"
        )
        assert.strictEqual(
            MarkdownStringify({ a: "string" }, { quoteValues: true }),
            "\n- a: `string`\n"
        )
        assert.strictEqual(MarkdownStringify([1, 2, 3]), "\n- 1\n- 2\n- 3\n")
        assert.strictEqual(
            MarkdownStringify({ a: 1 }, { headings: 0, headingLevel: 3 }),
            "\n### A\n1\n"
        )
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
            label: "trace",
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
            label: "trace",
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
            label: "trace",
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
            label: "trace",
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
    test("splitMarkdownTextImageParts - only text", async () => {
        const input = "This is a simple text block."
        const parts = await splitMarkdownTextImageParts(input)
        assert.deepStrictEqual(parts, [
            { type: "text", text: "This is a simple text block." },
        ])
    })

    test("splitMarkdownTextImageParts - text with image", async () => {
        const input = "Hello\n![alt text](http://example.com/image.png)\nworld."
        const parts = await splitMarkdownTextImageParts(input, {
            allowedDomains: ["example.com"],
        })
        assert.deepStrictEqual(parts, [
            { type: "text", text: "Hello\n" },
            {
                type: "image",
                alt: "alt text",
                url: "http://example.com/image.png",
            },
            { type: "text", text: "\nworld." },
        ])
    })


    test("splitMarkdownTextImageParts - empty string", async () => {
        const input = ""
        const parts = await splitMarkdownTextImageParts(input)
        assert.deepStrictEqual(parts, [])
    })
})
