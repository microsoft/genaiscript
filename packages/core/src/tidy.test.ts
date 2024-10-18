import assert from "assert"
import { tidyData } from "./tidy"
import { describe, it } from "node:test"

describe("tidyData", function () {
    it("should handle distinct option", function () {
        const rows = [{ a: 1 }, { a: 1 }, { a: 2 }]
        const options = { distinct: ["a"] }
        const result = tidyData(rows, options)
        assert.deepStrictEqual(result, [{ a: 1 }, { a: 2 }])
    })

    it("should handle headers option", function () {
        const rows = [
            { a: 1, b: 2 },
            { a: 3, b: 4 },
        ]
        const options = { headers: ["a"] }
        const result = tidyData(rows, options)
        assert.deepStrictEqual(result, [{ a: 1 }, { a: 3 }])
    })

    it("should handle sliceSample option", function () {
        const rows = [{ a: 1 }, { a: 2 }, { a: 3 }]
        const options = { sliceSample: 2 }
        const result = tidyData(rows, options)
        assert.strictEqual(result.length, 2)
    })

    it("should handle sliceHead option", function () {
        const rows = [{ a: 1 }, { a: 2 }, { a: 3 }]
        const options = { sliceHead: 2 }
        const result = tidyData(rows, options)
        assert.deepStrictEqual(result, [{ a: 1 }, { a: 2 }])
    })

    it("should handle sliceTail option", function () {
        const rows = [{ a: 1 }, { a: 2 }, { a: 3 }]
        const options = { sliceTail: 2 }
        const result = tidyData(rows, options)
        assert.deepStrictEqual(result, [{ a: 2 }, { a: 3 }])
    })

    // add test for sort option
    it("should handle sort option", function () {
        const rows = [{ a: 2 }, { a: 1 }, { a: 0 }]
        const options = { sort: ["a"] }
        const result = tidyData(rows, options)
        assert.deepStrictEqual(result, [{ a: 0 }, { a: 1 }, { a: 2 }])
    })
})
