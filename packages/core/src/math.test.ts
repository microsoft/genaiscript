import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { MathTryEvaluate } from "./math";

describe("MathTryEvaluate", async () => {
  await test("evaluates a simple expression", async () => {
    const result = await MathTryEvaluate("1 + 1");
    assert.equal(result, 2);
  });

  await test("evaluates an expression with variables from scope", async () => {
    const result = await MathTryEvaluate("x + y", {
      scope: { x: 5, y: 3 },
    });
    assert.equal(result, 8);
  });

  await test("returns defaultValue for empty expression", async () => {
    const result = await MathTryEvaluate("", {
      defaultValue: 42,
    });
    assert.equal(result, 42);
  });

  await test("returns undefined for invalid expression", async () => {
    const result = await MathTryEvaluate("1 +");
    assert.equal(result, undefined);
  });

  await test("returns undefined for expression with undefined variables", async () => {
    const result = await MathTryEvaluate("x + y");
    assert.equal(result, undefined);
  });

  await test("handles complex expressions", async () => {
    const result = await MathTryEvaluate("sin(PI/2)");
    assert.equal(result, 1);
  });
});
