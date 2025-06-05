// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { cleanedClone } from "../src/clone.js";
import { describe, test, assert } from "vitest";

describe("cleanedClone", () => {
  test("clones and cleans simple object", () => {
    const input: any = {
      a: 1,
      b: "",
      c: null,
      d: undefined,
      e: 0,
    };
    const expected = {
      a: 1,
      e: 0,
    };
    const result = cleanedClone(input);
    assert.deepStrictEqual(result, expected);
  });
});
