import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { dotEnvTryParse, dotEnvParse, dotEnvStringify } from "./dotenv";

describe("dotenv", () => {
  describe("dotEnvTryParse", () => {
    test("should parse a valid dotenv string into a key-value object", () => {
      const dotenvString = "KEY1=value1\nKEY2=value2";
      const expectedResult = { KEY1: "value1", KEY2: "value2" };
      const result = dotEnvTryParse(dotenvString);
      assert.deepEqual(result, expectedResult);
    });

    test("should return an empty object and log an error for an invalid dotenv string", () => {
      const dotenvString = "KEY1value1\nKEY2value2";
      const result = dotEnvTryParse(dotenvString);
      assert.deepEqual(result, {}); // Assuming logError handles logging separately
    });
  });

  describe("dotEnvParse", () => {
    test("should parse a valid dotenv string into a key-value object", () => {
      const dotenvString = "KEY1=value1\nKEY2=value2";
      const expectedResult = { KEY1: "value1", KEY2: "value2" };
      const result = dotEnvParse(dotenvString);
      assert.deepEqual(result, expectedResult);
    });
  });

  describe("dotEnvStringify", () => {
    test("should convert a key-value object into a dotenv-style string with proper formatting", () => {
      const keyValueObject = { KEY1: "value1", KEY2: "value2" };
      const expectedResult = "KEY1=value1\nKEY2=value2";
      const result = dotEnvStringify(keyValueObject);
      assert.equal(result, expectedResult);
    });

    test("should handle values with newlines or quotes properly", () => {
      const keyValueObject = { KEY1: "value\n1", KEY2: 'value"2"' };
      const expectedResult = 'KEY1="value\n1"\nKEY2="value\\"2\\""';
      const result = dotEnvStringify(keyValueObject);
      assert.equal(result, expectedResult);
    });

    test("should return an empty string for an empty record", () => {
      const keyValueObject = {};
      const expectedResult = "";
      const result = dotEnvStringify(keyValueObject);
      assert.equal(result, expectedResult);
    });
  });
});
