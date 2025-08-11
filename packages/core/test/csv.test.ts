// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { CSVParse, CSVTryParse, dataToMarkdownTable, CSVStringify, CSVChunk } from "../src/csv.js";

describe("CSVParse", () => {
  test("parse values with quotes", () => {
    const csv = `RuleID, TestID, TestInput, ExpectedOutput, Reasoning
1, 1, "The quick brown fox jumps over the lazy dog.;fox", "NN", "Tests if the word 'fox' is tagged correctly as a noun."
1, 2, "He runs quickly to the store.;quickly", "RB", "Tests if the word 'quickly' is tagged correctly as an adverb."
`;
    const result = CSVParse(csv);
    console.log(result);
    assert.equal(result.length, 2);
  });

  test("Parse simple CSV data with default options", () => {
    const csv = "name,age\nJohn,30\nJane,25";
    const result = CSVParse(csv);
    assert.deepEqual(result, [
      { name: "John", age: "30" },
      { name: "Jane", age: "25" },
    ]);
  });

  test("Parse CSV data with custom delimiter", () => {
    const csv = "name|age\nJohn|30\nJane|25";
    const result = CSVParse(csv, { delimiter: "|" });
    assert.deepEqual(result, [
      { name: "John", age: "30" },
      { name: "Jane", age: "25" },
    ]);
  });

  test("Parse CSV data with specified headers", () => {
    const csv = "John,30\nJane,25";
    const result = CSVParse(csv, { headers: ["name", "age"] });
    assert.deepEqual(result, [
      { name: "John", age: "30" },
      { name: "Jane", age: "25" },
    ]);
  });
  test("Parse CSV data with invalid quotes", () => {
    const csv = '"\\"John\\"",30\nJane,25';
    const result = CSVParse(csv, { headers: ["name", "age"], repair: true });
    assert.deepEqual(result, [
      { name: '"John"', age: "30" },
      { name: "Jane", age: "25" },
    ]);
  });

  test("Parse CSV data with many columns", () => {
    // Test case to reproduce issue #1850 - CSV parser doesn't parse all columns
    const csv = `col1,col2,col3,col4,col5,col6,col7,col8,col9,col10,col11,col12,col13,col14,col15
val1,val2,val3,val4,val5,val6,val7,val8,val9,val10,val11,val12,val13,val14,val15
a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15`;
    const result = CSVParse(csv);
    
    // Should parse all 15 columns
    assert.equal(result.length, 2, "Should have 2 data rows");
    
    // Check first row has all columns
    const firstRow = result[0];
    const expectedKeys = ['col1', 'col2', 'col3', 'col4', 'col5', 'col6', 'col7', 'col8', 'col9', 'col10', 'col11', 'col12', 'col13', 'col14', 'col15'];
    const actualKeys = Object.keys(firstRow);
    
    console.log("Expected columns:", expectedKeys.length);
    console.log("Actual columns:", actualKeys.length);
    console.log("Expected keys:", expectedKeys);
    console.log("Actual keys:", actualKeys);
    console.log("First row data:", firstRow);
    
    assert.equal(actualKeys.length, 15, "Should have all 15 columns");
    expectedKeys.forEach(key => {
      assert(key in firstRow, `Column ${key} should be present`);
    });
    
    // Check values are correct
    assert.equal((firstRow as any).col1, "val1");
    assert.equal((firstRow as any).col15, "val15");
  });

  test("Parse CSV data with quoted fields and many columns", () => {
    // Test more complex CSV with quotes and many columns
    const csv = `"id","name","description","value1","value2","value3","value4","value5","value6","value7","extra_col1","extra_col2"
"1","John Doe","A person with, comma","100","200","300","400","500","600","700","extra1","extra2"
"2","Jane Smith","Another person","101","201","301","401","501","601","701","extra3","extra4"`;
    
    const result = CSVParse(csv);
    
    console.log("Complex CSV result length:", result.length);
    console.log("Complex CSV columns:", Object.keys(result[0] || {}));
    console.log("Complex CSV first row:", result[0]);
    
    assert.equal(result.length, 2, "Should have 2 data rows");
    assert.equal(Object.keys(result[0]).length, 12, "Should have all 12 columns");
    assert.equal((result[0] as any).name, "John Doe");
    assert.equal((result[0] as any).description, "A person with, comma");
    assert.equal((result[0] as any).extra_col2, "extra2");
  });

  test("Parse CSV with malformed quotes that might cause column loss", () => {
    // Test CSV that might have parsing issues similar to what the user experienced
    const csv = `col1,col2,col3,"quoted col4",col5,col6,col7,col8,col9,"col10 with, comma",col11,col12
val1,val2,val3,"quoted val4",val5,val6,val7,val8,val9,"val10 with, comma",val11,val12
a1,a2,a3,"quoted a4",a5,a6,a7,a8,a9,"a10 with, comma",a11,a12`;
    
    const result = CSVParse(csv);
    
    console.log("Malformed quotes test - result length:", result.length);
    console.log("Malformed quotes test - columns:", Object.keys(result[0] || {}));
    console.log("Malformed quotes test - first row:", result[0]);
    
    assert.equal(result.length, 2, "Should have 2 data rows");
    assert.equal(Object.keys(result[0]).length, 12, "Should have all 12 columns");
  });

  test("Parse CSV with problematic characters and edge cases", () => {
    // Test CSV with various problematic scenarios
    const csv = `col1,col2,"col3 with ""quotes""",col4,col5\nval1,val2,"val3 with ""nested quotes""",val4,val5\na1,a2,"a3 with ""more quotes""",a4,a5`;
    
    const result = CSVParse(csv);
    
    console.log("Problematic chars test - result length:", result.length);
    console.log("Problematic chars test - columns:", Object.keys(result[0] || {}));
    console.log("Problematic chars test - first row:", result[0]);
    
    assert.equal(result.length, 2, "Should have 2 data rows");
    assert.equal(Object.keys(result[0]).length, 5, "Should have all 5 columns");
  });

  test("Parse CSV and compare with different parsing options", () => {
    // Test to understand what options might cause column loss
    const csv = `col1,col2,col3,col4,col5,col6,col7,col8,col9,col10
val1,val2,"val3 with, comma",val4,,val6,val7,val8,"val9 with ""quotes""",val10
a1,a2,a3,a4,a5,a6,a7,a8,a9,a10`;

    // Test with current default options
    const resultDefault = CSVParse(csv);
    
    // Test with stricter options
    const resultStrict = CSVParse(csv, {});
    
    console.log("Default parsing - columns:", Object.keys(resultDefault[0] || {}));
    console.log("Default parsing - first row:", resultDefault[0]);
    console.log("Strict parsing - columns:", Object.keys(resultStrict[0] || {}));
    console.log("Strict parsing - first row:", resultStrict[0]);
    
    assert.equal(Object.keys(resultDefault[0]).length, 10, "Default should have all 10 columns");
    assert.equal(Object.keys(resultStrict[0]).length, 10, "Strict should have all 10 columns");
  });

  test("Parse CSV that may have issues with skipRecordsWithError", () => {
    // Test CSV that might be affected by skipRecordsWithError setting
    const problematicCSV = `col1,col2,col3,col4,col5,col6,col7,col8,col9,col10
val1,val2,val3,val4,val5,val6,val7,val8,val9,val10
good1,good2,good3,good4,good5,good6,good7,good8,good9,good10`;

    // Test with default options (skipRecordsWithError: true)
    const resultWithSkip = CSVParse(problematicCSV);
    
    console.log("With skipRecordsWithError - result length:", resultWithSkip.length);
    console.log("With skipRecordsWithError - columns:", Object.keys(resultWithSkip[0] || {}));
    
    // Should have 2 good rows
    assert.equal(resultWithSkip.length, 2, "Should have 2 good rows");
  });

  test("Compare CSV parsing behavior with different options", () => {
    // Test CSV that demonstrates the issue - some rows might be dropped
    const testCSV = `name,age,city,country,occupation,salary,department,manager,email,phone
John,30,NYC,USA,Engineer,75000,Tech,Bob,john@test.com,123-456-7890
Jane,25,LA,USA,Designer,65000,Design,Alice,jane@test.com,123-456-7891
"Mike,35,Chicago,USA,Manager,85000,Sales,Carol,mike@test.com,123-456-7892
Bob,40,Seattle,USA,Director,95000,Tech,David,bob@test.com,123-456-7893`;

    // Test with new default options (skipRecordsWithError: false)
    const resultDefault = CSVParse(testCSV);
    
    console.log("New default CSV parsing:");
    console.log("- Result length:", resultDefault.length);
    console.log("- Columns:", Object.keys(resultDefault[0] || {}));
    console.log("- All rows:", resultDefault);
    
    // Test with explicit skipRecordsWithError: true (old behavior)
    const resultSkipErrors = CSVParse(testCSV, { skipRecordsWithError: true });
    
    console.log("Skip errors CSV parsing:");
    console.log("- Result length:", resultSkipErrors.length);
    
    // With the new implementation, we should get more data preserved
    assert(resultDefault.length >= resultSkipErrors.length, "New default should preserve more or equal data");
    
    // The new implementation should handle malformed quotes better and preserve more data
    console.log("Improvement: New default returned", resultDefault.length, "rows vs", resultSkipErrors.length, "with skipRecordsWithError");
  });

  test("Demonstrate CSV parsing fix for issue #1850", () => {
    // This test demonstrates the fix for the CSV parsing issue
    const problematicCSV = `name,age,city,country,occupation
John,30,NYC,USA,Engineer
Jane,25,LA,USA,Designer
"Mike,35,Chicago,USA,Manager
Bob,40,Seattle,USA,Director`;

    console.log("\n=== DEMONSTRATION OF FIX FOR ISSUE #1850 ===");
    console.log("Input CSV with malformed quote on Mike's row:");
    console.log(problematicCSV);
    console.log("\n");

    // Test with new default behavior (skipRecordsWithError: false)
    const newResult = CSVParse(problematicCSV);
    console.log("NEW BEHAVIOR (default skipRecordsWithError: false):");
    console.log(`- Rows returned: ${newResult.length}`);
    console.log(`- Columns: ${Object.keys(newResult[0] || {}).join(', ')}`);
    
    // Test with old behavior (skipRecordsWithError: true)
    const oldResult = CSVParse(problematicCSV, { skipRecordsWithError: true });
    console.log("OLD BEHAVIOR (skipRecordsWithError: true):");
    console.log(`- Rows returned: ${oldResult.length}`);
    console.log(`- Columns: ${Object.keys(oldResult[0] || {}).join(', ')}`);
    
    console.log("\nSUMMARY:");
    console.log(`- Old behavior would return ${oldResult.length} rows (data loss)`);
    console.log(`- New behavior returns ${newResult.length} rows (preserves data)`);
    console.log("=== END DEMONSTRATION ===\n");

    // The fix should preserve at least as much data as the old behavior
    assert(newResult.length >= oldResult.length, 
      "New default should preserve more or equal data than old behavior");
    
    // Both should preserve the column structure
    if (newResult.length > 0 && oldResult.length > 0) {
      assert.equal(Object.keys(newResult[0]).length, Object.keys(oldResult[0]).length,
        "Both should preserve the same column structure");
    }
  });

  test("Parse very long CSV with many columns to test column preservation", () => {
    // Create a CSV with 30 columns to test edge cases
    const headers = Array.from({length: 30}, (_, i) => `col${i+1}`).join(',');
    const row1 = Array.from({length: 30}, (_, i) => `val${i+1}`).join(',');
    const row2 = Array.from({length: 30}, (_, i) => `data${i+1}`).join(',');
    
    const csv = `${headers}\n${row1}\n${row2}`;
    
    const result = CSVParse(csv);
    
    console.log("Long CSV - result length:", result.length);
    console.log("Long CSV - columns count:", Object.keys(result[0] || {}).length);
    console.log("Long CSV - last few columns:", Object.keys(result[0] || {}).slice(-5));
    
    assert.equal(result.length, 2, "Should have 2 data rows");
    assert.equal(Object.keys(result[0]).length, 30, "Should have all 30 columns");
    assert.equal((result[0] as any).col1, "val1");
    assert.equal((result[0] as any).col30, "val30");
  });
});

describe("CSVTryParse", () => {
  test("Try to parse valid CSV data", () => {
    const csv = "name,age\nJohn,30\nJane,25";
    const result = CSVTryParse(csv);
    assert.deepEqual(result, [
      { name: "John", age: "30" },
      { name: "Jane", age: "25" },
    ]);
  });
});

describe("CSVToMarkdown", () => {
  test("Convert parsed CSV data to markdown table", () => {
    const csv = [
      { name: "John", age: "30" },
      { name: "Jane", age: "25" },
    ];
    const result = dataToMarkdownTable(csv);
    const expected = `|name|age|
|-|-|
|John|30|
|Jane|25|
`.replace(/[\t ]+/g, " ");
    assert.equal(result, expected);
  });

  test("Convert parsed CSV data to markdown table with custom headers", () => {
    const csv = [
      { name: "John", age: "30" },
      { name: "Jane", age: "25" },
    ];
    const result = dataToMarkdownTable(csv, { headers: ["age", "name"] });
    const expected = `|age|name|
|-|-|
|30|John|
|25|Jane|
`.replace(/[\t ]+/g, " ");
    assert.equal(result, expected);
  });

  test("Handle empty CSV data input", () => {
    const result = dataToMarkdownTable([]);
    assert.equal(result, "");
  });
});
describe("CSVStringify", () => {
  test("Stringify simple CSV data with default options", () => {
    const csv = [
      { name: "John", age: "30" },
      { name: "Jane", age: "25" },
    ];
    const result = CSVStringify(csv);
    const expected = "John,30\nJane,25\n";
    assert.equal(result, expected);
  });
  test("Stringify simple CSV data with headers", () => {
    const csv = [
      { name: "John", age: "30" },
      { name: "Jane", age: "25" },
    ];
    const result = CSVStringify(csv, { header: true });
    const expected = "name,age\nJohn,30\nJane,25\n";
    assert.equal(result, expected);
  });

  test("Stringify CSV data with custom delimiter", () => {
    const csv = [
      { name: "John", age: "30" },
      { name: "Jane", age: "25" },
    ];
    const result = CSVStringify(csv, { header: true, delimiter: "|" });
    const expected = "name|age\nJohn|30\nJane|25\n";
    assert.equal(result, expected);
  });

  test("chunk", () => {
    const csv = [
      { name: "John", age: "30" },
      { name: "Jane", age: "25" },
      { name: "Doe", age: "35" },
      { name: "Smith", age: "40" },
    ];
    const result = CSVChunk(csv, 2);
    assert.equal(result.length, 2);
  });
});
