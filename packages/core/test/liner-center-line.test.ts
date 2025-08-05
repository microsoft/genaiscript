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

  test("extractRange with maxTokens budget", function () {
    // Create a file with lines of varying length
    const lines = [];
    for (let i = 1; i <= 50; i++) {
      lines.push(`line ${i} - content that is reasonably long to have tokens`);
    }
    const text = lines.join("\n");

    // Test with a small token budget - should get fewer lines
    const result1 = extractRange(text, { line: 25, maxTokens: 100 });
    assert.include(result1, "line 25");
    
    // Result should be much smaller than the full text
    assert.isTrue(result1.length < text.length);
    
    // Test with a larger token budget - should get more lines
    const result2 = extractRange(text, { line: 25, maxTokens: 500 });
    assert.include(result2, "line 25");
    
    // Larger budget should give more content
    assert.isTrue(result2.length > result1.length);
  });

  test("extractRangeAroundLine with maxTokens budget", function () {
    // Create lines with predictable token counts
    const lines = [];
    for (let i = 1; i <= 20; i++) {
      lines.push(`line ${i}`); // Each line has approximately 3-4 tokens
    }
    const text = lines.join("\n");

    // Test with a very small budget that should only include center line
    const result1 = extractRangeAroundLine(text, 10, { maxTokens: 5 });
    assert.strictEqual(result1, "line 10");

    // Test with a larger budget that should include some context
    const result2 = extractRangeAroundLine(text, 10, { maxTokens: 50 });
    assert.include(result2, "line 10");
    assert.include(result2, "line 9");
    assert.include(result2, "line 11");
    
    // Should not include the entire file
    assert.notInclude(result2, "line 1");
    assert.notInclude(result2, "line 20");
  });

  test("extractRangeAroundLine token budget expansion", function () {
    // Test that expansion alternates between up and down directions
    const lines = [];
    for (let i = 1; i <= 10; i++) {
      lines.push(`line ${i}`);
    }
    const text = lines.join("\n");

    // Use a moderate budget that should expand beyond just the center line
    const result = extractRangeAroundLine(text, 5, { maxTokens: 25 });
    
    // Should include center line
    assert.include(result, "line 5");
    
    // Should include at least one line on each side due to alternating expansion
    const resultLines = result.split("\n");
    assert.isTrue(resultLines.length >= 3); // At least center + one on each side
    assert.isTrue(resultLines.length <= 10); // But not the entire file
  });

  test("extractRangeAroundLine with maxTokens near file boundaries", function () {
    const lines = [];
    for (let i = 1; i <= 10; i++) {
      lines.push(`line ${i}`);
    }
    const text = lines.join("\n");

    // Test near beginning of file
    const result1 = extractRangeAroundLine(text, 2, { maxTokens: 20 });
    assert.include(result1, "line 2");
    assert.include(result1, "line 1"); // Should include line 1
    
    // Test near end of file
    const result2 = extractRangeAroundLine(text, 9, { maxTokens: 20 });
    assert.include(result2, "line 9");
    assert.include(result2, "line 10"); // Should include line 10
  });

  test("maxTokens budget priority over lineStart/lineEnd", function () {
    const lines = [];
    for (let i = 1; i <= 20; i++) {
      lines.push(`line ${i}`);
    }
    const text = lines.join("\n");

    // When lineStart/lineEnd are specified, they should take priority over maxTokens
    const result = extractRange(text, { 
      lineStart: 5, 
      lineEnd: 15, 
      line: 10, 
      maxTokens: 5 
    });
    
    // Should use lineStart/lineEnd range, not maxTokens
    assert.include(result, "line 5");
    assert.include(result, "line 15");
    assert.include(result, "line 10");
  });

  test("extractRangeAroundLine when center line exceeds budget", function () {
    // Create a very long center line that exceeds the token budget
    const centerLine = "line 5 ".repeat(50); // Very long line
    const lines = [
      "line 1",
      "line 2", 
      "line 3",
      "line 4",
      centerLine,
      "line 6",
      "line 7",
      "line 8"
    ];
    const text = lines.join("\n");

    // Small budget that's exceeded by center line alone
    const result = extractRangeAroundLine(text, 5, { maxTokens: 10 });
    
    // Should return just the center line when it already exceeds budget
    assert.strictEqual(result, centerLine);
  });
});