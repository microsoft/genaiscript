// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { extractRange, extractRangeAroundLine } from "../src/liner.js";

describe("liner center line", function () {
  test("extractRange with line option", function () {
    const text = `line 1
line 2
line 3
line 4
line 5
line 6
line 7
line 8
line 9
line 10`;
    
    // Test center line 5 (should include lines around it)
    const result = extractRange(text, { line: 5 });
    assert.include(result, "line 5");
    assert.include(result, "line 4");
    assert.include(result, "line 6");
  });

  test("extractRangeAroundLine with small file", function () {
    const text = `line 1
line 2
line 3
line 4
line 5`;
    
    // For small files, should include most content
    const result = extractRangeAroundLine(text, 3);
    const lines = result.split("\n");
    
    // Should include all or most lines for small files
    assert.isTrue(lines.length >= 3);
    assert.include(result, "line 3");
  });

  test("extractRangeAroundLine with large file", function () {
    // Create a large file with 100 lines
    const lines = [];
    for (let i = 1; i <= 100; i++) {
      lines.push(`line ${i}`);
    }
    const text = lines.join("\n");
    
    // Test center line 50
    const result = extractRangeAroundLine(text, 50);
    const resultLines = result.split("\n");
    
    // Should be less than the full file but include line 50
    assert.isTrue(resultLines.length < 100);
    assert.include(result, "line 50");
    
    // Should include some lines before and after
    assert.include(result, "line 49");
    assert.include(result, "line 51");
  });

  test("extractRangeAroundLine with out of bounds center line", function () {
    const text = `line 1
line 2
line 3`;
    
    // Test with center line beyond file bounds
    const result1 = extractRangeAroundLine(text, 10);
    assert.strictEqual(result1, text);
    
    // Test with center line below 1
    const result2 = extractRangeAroundLine(text, 0);
    assert.strictEqual(result2, text);
  });

  test("extractRange prioritizes lineStart/lineEnd over line", function () {
    const text = `line 1
line 2
line 3
line 4
line 5`;
    
    // When both line and lineStart/lineEnd are provided, lineStart/lineEnd should take precedence
    const result = extractRange(text, { lineStart: 2, lineEnd: 4, line: 1 });
    const expected = `line 2
line 3
line 4`;
    assert.strictEqual(result, expected);
  });

  test("extractRange with only line option vs lineStart option", function () {
    const text = `line 1
line 2
line 3
line 4
line 5`;
    
    // Test that line option works when lineStart/lineEnd are not provided
    const result = extractRange(text, { line: 3 });
    assert.include(result, "line 3");
    
    // Test that existing lineStart option still works
    const result2 = extractRange(text, { lineStart: 2 });
    assert.include(result2, "line 2");
    assert.include(result2, "line 5");
  });

  test("extractRangeAroundLine with edge cases", function () {
    // Test with very small file (1 line)
    const singleLine = "only line";
    const result1 = extractRangeAroundLine(singleLine, 1);
    assert.strictEqual(result1, singleLine);

    // Test with center line at beginning
    const text = `line 1
line 2
line 3
line 4
line 5
line 6
line 7
line 8
line 9
line 10`;
    
    const result2 = extractRangeAroundLine(text, 1);
    assert.include(result2, "line 1");
    // Should not include lines before line 1 (since there are none)
    const lines = result2.split("\n");
    assert.isTrue(lines[0].includes("line 1"));

    // Test with center line at end
    const result3 = extractRangeAroundLine(text, 10);
    assert.include(result3, "line 10");
    const lines3 = result3.split("\n");
    assert.isTrue(lines3[lines3.length - 1].includes("line 10"));
  });

  test("dynamic range calculation for different file sizes", function () {
    // Test very small file (10 lines)
    const smallLines = [];
    for (let i = 1; i <= 10; i++) {
      smallLines.push(`line ${i}`);
    }
    const smallText = smallLines.join("\n");
    const smallResult = extractRangeAroundLine(smallText, 5);
    const smallResultLines = smallResult.split("\n");
    // Should include most of the file for very small files
    assert.isTrue(smallResultLines.length >= 5);

    // Test medium file (200 lines)
    const mediumLines = [];
    for (let i = 1; i <= 200; i++) {
      mediumLines.push(`line ${i}`);
    }
    const mediumText = mediumLines.join("\n");
    const mediumResult = extractRangeAroundLine(mediumText, 100);
    const mediumResultLines = mediumResult.split("\n");
    // Should be a reasonable subset for medium files
    assert.isTrue(mediumResultLines.length < 200);
    assert.isTrue(mediumResultLines.length > 20);
    assert.include(mediumResult, "line 100");

    // Test large file (1000 lines)
    const largeLines = [];
    for (let i = 1; i <= 1000; i++) {
      largeLines.push(`line ${i}`);
    }
    const largeText = largeLines.join("\n");
    const largeResult = extractRangeAroundLine(largeText, 500);
    const largeResultLines = largeResult.split("\n");
    // Should be a focused subset for large files
    assert.isTrue(largeResultLines.length < 1000);
    assert.isTrue(largeResultLines.length > 30);
    assert.include(largeResult, "line 500");
  });
});