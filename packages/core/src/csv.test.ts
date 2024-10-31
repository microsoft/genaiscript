import { describe, test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { CSVParse, CSVTryParse, CSVToMarkdown, CSVStringify } from "./csv"

describe("CSVParse", () => {
    test("parse values with quotes", () => {
        const csv = `RuleID, TestID, TestInput, ExpectedOutput, Reasoning
1, 1, "The quick brown fox jumps over the lazy dog.;fox", "NN", "Tests if the word 'fox' is tagged correctly as a noun."
1, 2, "He runs quickly to the store.;quickly", "RB", "Tests if the word 'quickly' is tagged correctly as an adverb."
`
        const result = CSVParse(csv)
        console.log(result)
        assert.equal(result.length, 2)
    })

    test("Parse simple CSV data with default options", () => {
        const csv = "name,age\nJohn,30\nJane,25"
        const result = CSVParse(csv)
        assert.deepEqual(result, [
            { name: "John", age: "30" },
            { name: "Jane", age: "25" },
        ])
    })

    test("Parse CSV data with custom delimiter", () => {
        const csv = "name|age\nJohn|30\nJane|25"
        const result = CSVParse(csv, { delimiter: "|" })
        assert.deepEqual(result, [
            { name: "John", age: "30" },
            { name: "Jane", age: "25" },
        ])
    })

    test("Parse CSV data with specified headers", () => {
        const csv = "John,30\nJane,25"
        const result = CSVParse(csv, { headers: ["name", "age"] })
        assert.deepEqual(result, [
            { name: "John", age: "30" },
            { name: "Jane", age: "25" },
        ])
    })
    test("Parse CSV data with invalid quotes", () => {
        const csv = "\"\\\"John\\\"\",30\nJane,25"
        const result = CSVParse(csv, { headers: ["name", "age"], repair: true })
        assert.deepEqual(result, [
            { name: "\"John\"", age: "30" },
            { name: "Jane", age: "25" },
        ])
    })

})

describe("CSVTryParse", () => {
    test("Try to parse valid CSV data", () => {
        const csv = "name,age\nJohn,30\nJane,25"
        const result = CSVTryParse(csv)
        assert.deepEqual(result, [
            { name: "John", age: "30" },
            { name: "Jane", age: "25" },
        ])
    })
})

describe("CSVToMarkdown", () => {
    test("Convert parsed CSV data to markdown table", () => {
        const csv = [
            { name: "John", age: "30" },
            { name: "Jane", age: "25" },
        ]
        const result = CSVToMarkdown(csv)
        const expected = `
|name|age|
|-|-|
|John|30|
|Jane|25|
`
            .trim()
            .replace(/[\t ]+/g, " ")
        assert.equal(result, expected)
    })

    test("Convert parsed CSV data to markdown table with custom headers", () => {
        const csv = [
            { name: "John", age: "30" },
            { name: "Jane", age: "25" },
        ]
        const result = CSVToMarkdown(csv, { headers: ["age", "name"] })
        const expected = `
|age|name|
|-|-|
|30|John|
|25|Jane|
`
            .trim()
            .replace(/[\t ]+/g, " ")
        assert.equal(result, expected)
    })

    test("Handle empty CSV data input", () => {
        const result = CSVToMarkdown([])
        assert.equal(result, "")
    })
})
describe("CSVStringify", () => {
    test("Stringify simple CSV data with default options", () => {
        const csv = [
            { name: "John", age: "30" },
            { name: "Jane", age: "25" },
        ]
        const result = CSVStringify(csv)
        const expected = "John,30\nJane,25\n"
        assert.equal(result, expected)
    })
    test("Stringify simple CSV data with headers", () => {
        const csv = [
            { name: "John", age: "30" },
            { name: "Jane", age: "25" },
        ]
        const result = CSVStringify(csv, { header: true })
        const expected = "name,age\nJohn,30\nJane,25\n"
        assert.equal(result, expected)
    })

    test("Stringify CSV data with custom delimiter", () => {
        const csv = [
            { name: "John", age: "30" },
            { name: "Jane", age: "25" },
        ]
        const result = CSVStringify(csv, { header: true, delimiter: "|" })
        const expected = "name|age\nJohn|30\nJane|25\n"
        assert.equal(result, expected)
    })
})
