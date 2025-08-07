import { describe, test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import {
    CSVParse,
    CSVTryParse,
    dataToMarkdownTable,
    CSVStringify,
    CSVChunk,
} from "./csv"

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
        const csv = '"\\"John\\"",30\nJane,25'
        const result = CSVParse(csv, { headers: ["name", "age"], repair: true })
        assert.deepEqual(result, [
            { name: '"John"', age: "30" },
            { name: "Jane", age: "25" },
        ])
    })

    test("Parse CSV with many columns and quoted fields", () => {
        const csv = `Date,Email,Description,Models,Sentiment,UserAgent,Billing,PageURL,Region,Spend,AccountID,IsInternational,Type,Satisfied,Contact,Attachment
"2024-01-01","user@example.com","This is a comment with, commas","GPT-4, Claude","Very positive","Mozilla/5.0","Premium","https://example.com","US","100","12345","false","premium","Yes","true","file.pdf"
"2024-01-02","test@test.com","Another comment, with commas","Various models","Negative","Chrome/1.0","Basic","https://test.com","EU","50","67890","true","basic","No","false","image.jpg"`
        
        const result = CSVParse(csv)
        assert.equal(result.length, 2)
        
        // Check that all columns are preserved
        const expectedColumns = [
            "Date", "Email", "Description", "Models", "Sentiment", "UserAgent", 
            "Billing", "PageURL", "Region", "Spend", "AccountID", "IsInternational", 
            "Type", "Satisfied", "Contact", "Attachment"
        ]
        
        const actualColumns = Object.keys(result[0])
        assert.equal(actualColumns.length, expectedColumns.length, `Expected ${expectedColumns.length} columns, got ${actualColumns.length}`)
        
        // Verify specific column values
        assert.equal(result[0].Date, "2024-01-01")
        assert.equal(result[0].Email, "user@example.com")
        assert.equal(result[0].Description, "This is a comment with, commas")
        assert.equal(result[0].Models, "GPT-4, Claude")
        assert.equal(result[0].Attachment, "file.pdf")
    })

    test("Parse CSV with custom options - disable autoParse", () => {
        const csv = "name,age,active\nJohn,30,true\nJane,25,false"
        const result = CSVParse(csv, { autoParse: false })
        assert.deepEqual(result, [
            { name: "John", age: "30", active: "true" },
            { name: "Jane", age: "25", active: "false" },
        ])
    })

    test("Parse CSV with custom options - enable castDate", () => {
        const csv = "name,birthdate\nJohn,2000-01-01\nJane,1995-12-25"
        const result = CSVParse(csv, { castDate: true })
        // Dates should be parsed as Date objects when castDate is true
        assert.equal(result[0].name, "John")
        assert.equal(result[1].name, "Jane")
    })

    test("Parse CSV with custom comment character", () => {
        const csv = `name,age
John,30
;This is a comment line with semicolon
Jane,25`
        const result = CSVParse(csv, { comment: ";" })
        assert.equal(result.length, 2)
        assert.deepEqual(result, [
            { name: "John", age: 30 },
            { name: "Jane", age: 25 },
        ])
    })

    test("Parse CSV with skipEmptyLines disabled", () => {
        const csv = `name,age
John,30

Jane,25`
        const result = CSVParse(csv, { skipEmptyLines: false })
        // Should include the empty line as a record
        assert.equal(result.length, 3)
    })

    test("Parse CSV with skipRecordsWithError enabled", () => {
        const csv = `name,age
John,30
"Invalid,record
Jane,25`
        const result = CSVParse(csv, { skipRecordsWithError: true })
        // Should skip the malformed record and only return valid ones
        assert.equal(result.length, 2)
        assert.equal(result[0].name, "John")
        assert.equal(result[1].name, "Jane")
    })

    test("Parse CSV with relaxQuotes disabled", () => {
        const csv = `name,description
John,"He said "hello" to me"
Jane,"Simple description"`
        const result = CSVParse(csv, { relaxQuotes: false })
        // With relaxQuotes disabled, parsing might be more strict
        assert.equal(result.length, 2)
    })

    test("Parse CSV with trim disabled", () => {
        const csv = "name,age\n John ,30\n Jane ,25"
        const result = CSVParse(csv, { trim: false })
        assert.deepEqual(result, [
            { name: " John ", age: 30 },
            { name: " Jane ", age: 25 },
        ])
    })
})

describe("CSVTryParse", () => {
    test("Try to parse valid CSV data", () => {
        const csv = "name,age\nJohn,30\nJane,25"
        const result = CSVTryParse(csv)
        assert.deepEqual(result, [
            { name: "John", age: 30 },
            { name: "Jane", age: 25 },
        ])
    })

    test("Try to parse CSV with custom options", () => {
        const csv = "name,age\nJohn,30\nJane,25"
        const result = CSVTryParse(csv, { autoParse: false })
        assert.deepEqual(result, [
            { name: "John", age: "30" },
            { name: "Jane", age: "25" },
        ])
    })

    test("Try to parse invalid CSV and return undefined", () => {
        const csv = `name,age
John,30
"Invalid,record without closing quote
Jane,25`
        const result = CSVTryParse(csv, { skipRecordsWithError: false })
        // Should return undefined on parsing error
        assert.equal(result, undefined)
    })
})

describe("CSVToMarkdown", () => {
    test("Convert parsed CSV data to markdown table", () => {
        const csv = [
            { name: "John", age: "30" },
            { name: "Jane", age: "25" },
        ]
        const result = dataToMarkdownTable(csv)
        const expected = `|name|age|
|-|-|
|John|30|
|Jane|25|
`.replace(/[\t ]+/g, " ")
        assert.equal(result, expected)
    })

    test("Convert parsed CSV data to markdown table with custom headers", () => {
        const csv = [
            { name: "John", age: "30" },
            { name: "Jane", age: "25" },
        ]
        const result = dataToMarkdownTable(csv, { headers: ["age", "name"] })
        const expected = `|age|name|
|-|-|
|30|John|
|25|Jane|
`.replace(/[\t ]+/g, " ")
        assert.equal(result, expected)
    })

    test("Handle empty CSV data input", () => {
        const result = dataToMarkdownTable([])
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

    test("chunk", () => {
        const csv = [
            { name: "John", age: "30" },
            { name: "Jane", age: "25" },
            { name: "Doe", age: "35" },
            { name: "Smith", age: "40" },
        ]
        const result = CSVChunk(csv, 2)
        assert.equal(result.length, 2)
    })
})
