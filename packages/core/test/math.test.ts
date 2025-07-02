// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { MathTryEvaluate } from "../src/math.js";

describe("MathTryEvaluate", async () => {
  test("evaluates a simple expression", async () => {
    const result = await MathTryEvaluate("1 + 1");
    assert.equal(result, 2);
  });

  test("evaluates an expression with variables from scope", async () => {
    const result = await MathTryEvaluate("x + y", {
      scope: { x: 5, y: 3 },
    });
    assert.equal(result, 8);
  });

  test("returns defaultValue for empty expression", async () => {
    const result = await MathTryEvaluate("", {
      defaultValue: 42,
    });
    assert.equal(result, 42);
  });

  test("returns undefined for invalid expression", async () => {
    const result = await MathTryEvaluate("1 +");
    assert.equal(result, undefined);
  });

  test("returns undefined for expression with undefined variables", async () => {
    const result = await MathTryEvaluate("x + y");
    assert.equal(result, undefined);
  });

  test("handles complex expressions", async () => {
    const result = await MathTryEvaluate("sin(PI/2)");
    assert.equal(result, 1);
  });
});
