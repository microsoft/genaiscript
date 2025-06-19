import { cleanedClone } from "./clone";
import { describe, test } from "node:test";
import assert from "node:assert/strict";

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
