// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { isJSONLFilename, JSONLTryParse, JSONLStringify } from "../src/jsonl.js";

describe("JSONL utils", async () => {
  test("isJSONLFilename identifies JSONL files", () => {
    assert.equal(isJSONLFilename("file.jsonl"), true);
    assert.equal(isJSONLFilename("file.mdjson"), true);
    assert.equal(isJSONLFilename("file.ldjson"), true);
    assert.equal(isJSONLFilename("file.JSONL"), true);
    assert.equal(isJSONLFilename("file.txt"), false);
    assert.equal(isJSONLFilename("file.json"), false);
  });

  test("JSONLTryParse parses valid JSONL", () => {
    const input = '{"a":1}\n{"b":2}\n{"c":3}';
    const expected = [{ a: 1 }, { b: 2 }, { c: 3 }];
    assert.deepEqual(JSONLTryParse(input), expected);
  });

  test("JSONLTryParse handles empty input", () => {
    assert.deepEqual(JSONLTryParse(""), []);
    assert.deepEqual(JSONLTryParse(null), []);
    assert.deepEqual(JSONLTryParse(undefined), []);
  });

  test("JSONLTryParse skips invalid lines", () => {
    const input = '{"a":1}\nin ; "valid\n{"c":3}';
    const expected = [{ a: 1 }, { c: 3 }];
    assert.deepEqual(JSONLTryParse(input), expected);
  });

  test("JSONLStringify converts objects to JSONL", () => {
    const input = [{ a: 1 }, { b: 2 }, { c: 3 }];
    const expected = '{"a":1}\n{"b":2}\n{"c":3}\n';
    assert.equal(JSONLStringify(input), expected);
  });

  test("JSONLStringify handles empty input", () => {
    assert.equal(JSONLStringify([]), "");
    assert.equal(JSONLStringify(null), "");
    assert.equal(JSONLStringify(undefined), "");
  });

  test("JSONLStringify skips null/undefined entries", () => {
    const input = [{ a: 1 }, null, { c: 3 }, undefined];
    const expected = '{"a":1}\n{"c":3}\n';
    assert.equal(JSONLStringify(input), expected);
  });
});
