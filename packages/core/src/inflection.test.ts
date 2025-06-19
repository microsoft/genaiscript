import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { splitalize, titleize, humanize } from "./inflection";

describe("inflection", () => {
  describe("splitalize", () => {
    test("should separate camelCase words with spaces", () => {
      assert.equal(splitalize("camelCase"), "camel Case");
    });

    test("should separate PascalCase words with spaces", () => {
      assert.equal(splitalize("PascalCase"), "Pascal Case");
    });

    test("should handle multiple camelCase words", () => {
      assert.equal(splitalize("thisIsCamelCase"), "this Is Camel Case");
    });

    test("should not modify text without case transitions", () => {
      assert.equal(splitalize("lowercase"), "lowercase");
      assert.equal(splitalize("UPPERCASE"), "UPPERCASE");
    });

    test("should handle null or undefined input", () => {
      assert.equal(splitalize(undefined as unknown as string), undefined);
      assert.equal(splitalize(null as unknown as string), null);
    });
  });

  describe("titleize", () => {
    test("should capitalize each word and separate camelCase", () => {
      assert.equal(titleize("camelCase"), "Camel Case");
    });

    test("should capitalize each word in a sentence", () => {
      assert.equal(titleize("this is a test"), "This Is a Test");
    });

    test("should handle PascalCase", () => {
      assert.equal(titleize("PascalCaseTest"), "Pascal Case Test");
    });

    test("should handle empty, null or undefined input", () => {
      assert.equal(titleize(""), "");
      assert.equal(titleize(null as unknown as string), null);
      assert.equal(titleize(undefined as unknown as string), undefined);
    });
  });

  describe("humanize", () => {
    test("should make text more human-readable by separating camelCase", () => {
      assert.equal(humanize("camelCase"), "Camel case");
    });

    test("should capitalize the first word only", () => {
      assert.equal(humanize("this is a test"), "This is a test");
    });

    test("should handle PascalCase", () => {
      assert.equal(humanize("PascalCaseTest"), "Pascal case test");
    });

    test("should handle empty, null or undefined input", () => {
      assert.equal(humanize(""), "");
      assert.equal(humanize(null as unknown as string), null);
      assert.equal(humanize(undefined as unknown as string), undefined);
    });
  });
});
