import { roundWithPrecision, renderWithPrecision } from "./precision";
import { describe, test } from "node:test";
import assert from "node:assert/strict";

describe("roundWithPrecision", () => {
  test("returns NaN for undefined input", () => {
    assert.ok(Number.isNaN(roundWithPrecision(undefined, 2)));
  });

  test("rounds to integer when digits is 0 or negative", () => {
    assert.strictEqual(roundWithPrecision(5.678, 0), 6);
    assert.strictEqual(roundWithPrecision(5.678, -1), 6);
  });

  test("returns 0 when input is 0", () => {
    assert.strictEqual(roundWithPrecision(0, 2), 0);
  });

  test("rounds to specified digits", () => {
    assert.strictEqual(roundWithPrecision(5.678, 2), 5.68);
    assert.strictEqual(roundWithPrecision(5.678, 1), 5.7);
    assert.strictEqual(roundWithPrecision(5.678, 3), 5.678);
  });

  test("uses provided rounding function", () => {
    assert.strictEqual(roundWithPrecision(5.678, 1, Math.floor), 5.6);
    assert.strictEqual(roundWithPrecision(5.678, 1, Math.ceil), 5.7);
  });
});

describe("renderWithPrecision", () => {
  test("returns '?' for undefined input", () => {
    assert.strictEqual(renderWithPrecision(undefined, 2), "?");
  });

  test("adds trailing zeros to match digit count", () => {
    assert.strictEqual(renderWithPrecision(5, 2), "5.00");
    assert.strictEqual(renderWithPrecision(5.6, 2), "5.60");
  });

  test("adds decimal point and zeros when no decimal", () => {
    assert.strictEqual(renderWithPrecision(5, 3), "5.000");
  });

  test("uses provided rounding function", () => {
    assert.strictEqual(renderWithPrecision(5.678, 1, Math.floor), "5.6");
    assert.strictEqual(renderWithPrecision(5.678, 1, Math.ceil), "5.7");
  });

  test("doesn't add zeros when digits is 0", () => {
    assert.strictEqual(renderWithPrecision(5.678, 0), "6");
  });
});
