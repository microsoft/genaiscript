import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { CSVParse, CSVTryParse, CSVToMarkdown } from "./csv";

describe('CSVParse', () => {
    test('Parse simple CSV data with default options', () => {
        const csv = "name,age\nJohn,30\nJane,25";
        const result = CSVParse(csv);
        assert.deepEqual(result, [
            { name: "John", age: "30" },
            { name: "Jane", age: "25" }
        ]);
    });

    test('Parse CSV data with custom delimiter', () => {
        const csv = "name|age\nJohn|30\nJane|25";
        const result = CSVParse(csv, { delimiter: "|" });
        assert.deepEqual(result, [
            { name: "John", age: "30" },
            { name: "Jane", age: "25" }
        ]);
    });

    test('Parse CSV data with specified headers', () => {
        const csv = "John,30\nJane,25";
        const result = CSVParse(csv, { headers: ["name", "age"] });
        assert.deepEqual(result, [
            { name: "John", age: "30" },
            { name: "Jane", age: "25" }
        ]);
    });
});

describe('CSVTryParse', () => {
    test('Try to parse valid CSV data', () => {
        const csv = "name,age\nJohn,30\nJane,25";
        const result = CSVTryParse(csv);
        assert.deepEqual(result, [
            { name: "John", age: "30" },
            { name: "Jane", age: "25" }
        ]);
    });
});

describe('CSVToMarkdown', () => {
    test('Convert parsed CSV data to markdown table', () => {
        const csv = [{ name: "John", age: "30" }, { name: "Jane", age: "25" }];
        const result = CSVToMarkdown(csv);
        const expected = `
|name|age|
|-|-|
|John|30|
|Jane|25|
`.trim().replace(/[\t ]+/g, " ");
        assert.equal(result, expected);
    });

    test('Convert parsed CSV data to markdown table with custom headers', () => {
        const csv = [{ name: "John", age: "30" }, { name: "Jane", age: "25" }];
        const result = CSVToMarkdown(csv, { headers: ["age", "name"] });
        const expected = `
|age|name|
|-|-|
|30|John|
|25|Jane|
`.trim().replace(/[\t ]+/g, " ");
        assert.equal(result, expected);
    });

    test('Handle empty CSV data input', () => {
        const result = CSVToMarkdown([]);
        assert.equal(result, "");
    });
});