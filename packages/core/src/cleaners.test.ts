import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  deleteUndefinedValues,
  deleteEmptyValues,
  normalizeString,
  normalizeFloat,
  normalizeInt,
  trimTrailingSlash,
  normalizeVarKey,
  unmarkdown,
  collapseNewlines,
  arrayify,
  encodeIDs,
  isEmptyString,
} from "./cleaners";

describe("cleaners", () => {
  test("deleteUndefinedValues", () => {
    const input: any = { a: 1, b: undefined, c: "test" };
    const expected = { a: 1, c: "test" };
    assert.deepEqual(deleteUndefinedValues(input), expected);
  });

  test("deleteEmptyValues", () => {
    const input: any = { a: 1, b: undefined, c: "", d: [], e: null };
    const expected = { a: 1 };
    assert.deepEqual(deleteEmptyValues(input), expected);
  });

  test("normalizeString", () => {
    assert.equal(normalizeString("test"), "test");
    assert.equal(normalizeString(123), "123");
    assert.equal(normalizeString(true), "true");
    assert.equal(normalizeString({ a: 1 }), '{"a":1}');
  });

  test("normalizeFloat", () => {
    assert.equal(normalizeFloat("123.45"), 123.45);
    assert.equal(normalizeFloat(123.45), 123.45);
    assert.equal(normalizeFloat(true), 1);
    assert.equal(normalizeFloat({}), 0);
    assert.equal(normalizeFloat("invalid"), undefined);
  });

  test("normalizeInt", () => {
    assert.equal(normalizeInt("123"), 123);
    assert.equal(normalizeInt(123.45), 123.45);
    assert.equal(normalizeInt(true), 1);
    assert.equal(normalizeInt({}), 0);
    assert.equal(normalizeInt("invalid"), undefined);
  });

  test("trimTrailingSlash", () => {
    assert.equal(trimTrailingSlash("test/"), "test");
    assert.equal(trimTrailingSlash("test///"), "test");
    assert.equal(trimTrailingSlash("test"), "test");
  });

  test("normalizeVarKey", () => {
    assert.equal(normalizeVarKey("Test-Key_123"), "testkey123");
    assert.equal(normalizeVarKey("test.key"), "test.key");
  });

  test("unmarkdown", () => {
    assert.equal(unmarkdown("[link](http://test.com)"), "link");
    assert.equal(unmarkdown("<strong>bold</strong>"), "bold");
  });

  test("collapseNewlines", () => {
    assert.equal(collapseNewlines("line1\n\n\n\nline2"), "line1\n\nline2");
    assert.equal(collapseNewlines("line1\n\nline2"), "line1\n\nline2");
  });
  test("arrayify", () => {
    // Basic array case
    assert.deepEqual(arrayify([1, 2, 3]), [1, 2, 3]);

    // Non-array conversion
    assert.deepEqual(arrayify(42), [42]);

    // undefined case
    assert.deepEqual(arrayify(undefined), []);

    // With filterEmpty option
    assert.deepEqual(
      arrayify([1, null, 2, undefined, 3, false, ""], {
        filterEmpty: true,
      }),
      [1, 2, 3],
    );
    assert.deepEqual(arrayify([1, 2, 3], { filterEmpty: false }), [1, 2, 3]);
  });

  test("isEmptyString", () => {
    assert.equal(isEmptyString(""), true);
    assert.equal(isEmptyString(null), true);
    assert.equal(isEmptyString(undefined), true);
    assert.equal(isEmptyString("text"), false);
    assert.equal(isEmptyString(" "), false);
  });

  test("encodeIDs", () => {
    const uuid = "123e4567-e89b-12d3-a456-426614174000";
    const text = `User ${uuid} logged in.`;

    const result = encodeIDs(text);

    // Test encoded text
    assert.notEqual(result.encoded, text);
    // Test decode function
    assert.equal(result.decode(result.encoded), text);

    // Test with custom matcher
    const customText = "User ABC-123-XYZ logged in.";
    const customResult = encodeIDs(customText, {
      matcher: /ABC-\d+-XYZ/g,
    });

    assert.notEqual(customResult.encoded, customText);
    assert.equal(customResult.decode(customResult.encoded), customText);

    // Test with multiple matches
    const multiText = `${uuid} and ${uuid}`;
    const multiResult = encodeIDs(multiText);
    assert.equal(multiResult.decode(multiResult.encoded), multiText);
  });
});
