import { jq } from "./jq"
import { describe, test } from "node:test"
import assert from "node:assert/strict"

describe("jq", () => {
    test("returns undefined when input is undefined", () => {
        const result = jq(undefined, ".")
        assert.strictEqual(result, undefined)
    })

    test("applies JQ transformation to input data", () => {
        const input = { name: "John", age: 30 }
        const query = ".name"
        const result = jq(input, query)
        assert.strictEqual(result, "John")
    })

    test("handles nested objects correctly", () => {
        const input = { person: { name: "John", age: 30 } }
        const query = ".person.name"
        const result = jq(input, query)
        assert.strictEqual(result, "John")
    })

    test("returns null for non-existent keys", () => {
        const input = { name: "John", age: 30 }
        const query = ".address"
        const result = jq(input, query)
        assert.strictEqual(result, null)
    })

    test("handles arrays correctly", () => {
        const input = { people: [{ name: "John" }, { name: "Jane" }] }
        const query = ".people[1].name"
        const result = jq(input, query)
        assert.strictEqual(result, "Jane")
    })

    test("returns entire input when query is '.'", () => {
        const input = { name: "John", age: 30 }
        const query = "."
        const result = jq(input, query)
        assert.deepStrictEqual(result, input)
    })
})
