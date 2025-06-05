// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { GROQEvaluate } from "../src/groq.js";

describe("GROQEvaluate", async () => {
  test("simple query", async () => {
    const data = { name: "test" };
    const res = await GROQEvaluate("*", data);
    assert.deepEqual(res, data);
  });

  test("filtered query", async () => {
    const data = [
      { id: 1, name: "first" },
      { id: 2, name: "second" },
    ];
    const res = await GROQEvaluate("*[id == 1]", data);
    assert.deepEqual(res, [{ id: 1, name: "first" }]);
  });

  test("query with params", async () => {
    const data = [
      { id: 1, name: "first" },
      { id: 2, name: "second" },
    ];
    const res = await GROQEvaluate("*[id == $id]", data, {
      params: { id: 2 },
    });
    assert.deepEqual(res, [{ id: 2, name: "second" }]);
  });

  test("undefined dataset returns undefined", async () => {
    const res = await GROQEvaluate("*", undefined);
    assert.equal(res, undefined);
  });
});
