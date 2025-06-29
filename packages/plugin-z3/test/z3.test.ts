import { assert, describe, test } from "vitest";
import { z3 } from "../src/z3.js";
import plugin from "../src/index.js";
import { runPrompt } from "@genaiscript/core"

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

describe("z3", () => {
  test("default export", async () => {
    await runPrompt(_ => {
      plugin(_) 
    }, { model: "echo"})
  })
  test("should return Z3Solver or undefined based on availability", async () => {
    const solver = await z3();
    assert(solver);

    // z3-solver is available
    assert.isDefined(solver);
    assert.isFunction(solver.run);
    assert.isFunction(solver.api);
  });

  test("should run SMT-LIB2 input successfully if z3 is available", async () => {
    const solver = await z3();
    assert(solver);

    const result = await solver.run("(check-sat)");
    assert.isString(result);
    // Result should be one of the standard SMT-LIB2 responses
    assert.match(result, /^\s*sat\s*$/);
  });

  test("should return api object if z3 is available", async () => {
    const solver = await z3();
    assert(solver);

    const api = solver.api();
    assert.isDefined(api);
    assert.isObject(api);
  });

  test("should handle complex SMT-LIB2 expressions if z3 is available", async () => {
    const solver = await z3();
    assert(solver);

    const smtInput = `
        (declare-const x Int)
        (declare-const y Int)
        (assert (> x 0))
        (assert (< y 10))
        (assert (= (+ x y) 15))
        (check-sat)
      `;

    const result = await solver.run(smtInput);
    assert.isString(result);
    assert.match(result, /^\s*sat\s*$/);
  });
});
