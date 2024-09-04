import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { INIParse, INIStringify } from "./ini"

describe("ini", () => {
    test("rountrip", () => {
        const o = { a: "1", b: "foo" }
        const text = INIStringify(o)
        const r = INIParse(text)

        assert.equal(JSON.stringify(r), JSON.stringify(o))
    })
})
