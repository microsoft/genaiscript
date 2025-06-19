import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { tagFilter } from "./tags";

describe("tagFilter", () => {
  test("should return true when no tags are provided", () => {
    assert.equal(tagFilter([], "example"), true);
    assert.equal(tagFilter(undefined as any, "example"), true);
    assert.equal(tagFilter(null as any, "example"), true);
  });

  test("should return true when tag starts with any tag in the list", () => {
    assert.equal(tagFilter(["example"], "example"), true);
    assert.equal(tagFilter(["ex"], "example"), true);
    assert.equal(tagFilter(["other", "ex"], "example"), true);
  });

  test("should be case insensitive", () => {
    assert.equal(tagFilter(["Example"], "example"), true);
    assert.equal(tagFilter(["example"], "Example"), true);
  });

  test("should return false when tag does not start with any tag in the list", () => {
    assert.equal(tagFilter(["other"], "example"), false);
    assert.equal(tagFilter(["ampl"], "example"), false);
  });

  test("should handle exclusions correctly", () => {
    assert.equal(tagFilter([":!ex"], "example"), false, "exclusion should take precedence");
    assert.equal(tagFilter([":!example"], "example"), false, "exclusion should take precedence 2");
    assert.equal(tagFilter([":!other"], "example"), true, "inclusion should take precedence");
  });

  test("should handle mixed inclusions and exclusions", () => {
    assert.equal(
      tagFilter(["ex", ":!example"], "example"),
      false,
      "exclusion should take precedence",
    );
    assert.equal(
      tagFilter(["other", ":!ex"], "example"),
      false,
      "exclusion should take precedence 2",
    );
    assert.equal(tagFilter(["ex", ":!other"], "example"), true, "inclusion should take precedence");
  });

  test("should handle undefined or null tag", () => {
    assert.equal(tagFilter(["example"], undefined as any), false);
    assert.equal(tagFilter(["example"], null as any), false);
  });
});
