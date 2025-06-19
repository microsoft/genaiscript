import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { indent, dedent } from "./indent";

describe("indent/dedent utils", async () => {
  test("indent adds spaces to each line", () => {
    const input = "line1\nline2\nline3";
    const expected = "  line1\n  line2\n  line3";
    assert.equal(indent(input, "  "), expected);
  });

  test("indent handles empty string", () => {
    assert.equal(indent("", "  "), "");
  });

  test("indent handles undefined", () => {
    assert.equal(indent(undefined, "  "), undefined);
  });

  test("indent handles single line", () => {
    assert.equal(indent("single", "  "), "  single");
  });

  test("dedent removes common indentation", () => {
    const input = `
            first line
            second line
            third line
        `;
    const expected = "first line\nsecond line\nthird line";
    assert.equal(dedent(input).trim(), expected);
  });

  test("dedent works with template literals", () => {
    const value = "test";
    const result = dedent`
            Hello ${value}
            This is indented
        `;
    assert.equal(result.trim(), `Hello ${value}\nThis is indented`);
  });

  test("dedent handles undefined", () => {
    assert.equal(dedent(undefined), undefined);
  });

  test("dedent handles null", () => {
    assert.equal(dedent(null), null);
  });
});
