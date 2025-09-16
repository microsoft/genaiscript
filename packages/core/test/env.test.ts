import { describe, test, assert } from "vitest";
import { parseAllowedDomains, parseDefaultMetaFromEnv } from "../src/env.js";

describe("env", () => {
  describe("parseAllowedDomains", () => {
    test("returns default wildcard when no env var set", () => {
      const result = parseAllowedDomains({});
      assert.deepStrictEqual(result, ["*"]);
    });

    test("parses comma-separated domains from GENAISCRIPT_ALLOWED_DOMAINS", () => {
      const env = { GENAISCRIPT_ALLOWED_DOMAINS: "github.com,api.openai.com,*.example.com" };
      const result = parseAllowedDomains(env);
      assert.deepStrictEqual(result, ["github.com", "api.openai.com", "*.example.com"]);
    });

    test("parses comma-separated domains from ALLOWED_DOMAINS", () => {
      const env = { ALLOWED_DOMAINS: "github.com,api.openai.com" };
      const result = parseAllowedDomains(env);
      assert.deepStrictEqual(result, ["github.com", "api.openai.com"]);
    });

    test("prefers GENAISCRIPT_ALLOWED_DOMAINS over ALLOWED_DOMAINS", () => {
      const env = { 
        GENAISCRIPT_ALLOWED_DOMAINS: "github.com",
        ALLOWED_DOMAINS: "different.com"
      };
      const result = parseAllowedDomains(env);
      assert.deepStrictEqual(result, ["github.com"]);
    });

    test("handles YAML array format", () => {
      const env = { GENAISCRIPT_ALLOWED_DOMAINS: '["github.com", "*.openai.com", "example.org"]' };
      const result = parseAllowedDomains(env);
      assert.deepStrictEqual(result, ["github.com", "*.openai.com", "example.org"]);
    });

    test("trims whitespace from comma-separated values", () => {
      const env = { GENAISCRIPT_ALLOWED_DOMAINS: " github.com , api.openai.com , *.example.com " };
      const result = parseAllowedDomains(env);
      assert.deepStrictEqual(result, ["github.com", "api.openai.com", "*.example.com"]);
    });

    test("filters out empty values", () => {
      const env = { GENAISCRIPT_ALLOWED_DOMAINS: "github.com,,api.openai.com," };
      const result = parseAllowedDomains(env);
      assert.deepStrictEqual(result, ["github.com", "api.openai.com"]);
    });

    test("handles single domain", () => {
      const env = { GENAISCRIPT_ALLOWED_DOMAINS: "github.com" };
      const result = parseAllowedDomains(env);
      assert.deepStrictEqual(result, ["github.com"]);
    });
  });

  describe("parseDefaultMetaFromEnv", () => {
    test("returns undefined when GENAISCRIPT_DEFAULT_META not set", () => {
      const result = parseDefaultMetaFromEnv({});
      assert.strictEqual(result, undefined);
    });

    test("parses valid JSON metadata", () => {
      const env = {
        GENAISCRIPT_DEFAULT_META: '{"temperature": 0.5, "model": "gpt-4", "title": "Default Title"}'
      };
      const result = parseDefaultMetaFromEnv(env);
      assert.deepStrictEqual(result, {
        temperature: 0.5,
        model: "gpt-4",
        title: "Default Title"
      });
    });

    test("parses valid JSON5 metadata", () => {
      const env = {
        GENAISCRIPT_DEFAULT_META: '{temperature: 0.5, model: "gpt-4", unlisted: true}'
      };
      const result = parseDefaultMetaFromEnv(env);
      assert.deepStrictEqual(result, {
        temperature: 0.5,
        model: "gpt-4",
        unlisted: true
      });
    });

    test("handles metadata with nested objects", () => {
      const env = {
        GENAISCRIPT_DEFAULT_META: '{"metadata": {"key1": "value1", "key2": "value2"}, "vars": {"var1": "val1"}}'
      };
      const result = parseDefaultMetaFromEnv(env);
      assert.deepStrictEqual(result, {
        metadata: {
          key1: "value1",
          key2: "value2"
        },
        vars: {
          var1: "val1"
        }
      });
    });

    test("returns undefined for invalid JSON", () => {
      const env = {
        GENAISCRIPT_DEFAULT_META: 'invalid json {'
      };
      const result = parseDefaultMetaFromEnv(env);
      assert.strictEqual(result, undefined);
    });

    test("returns undefined for non-object values", () => {
      const env = {
        GENAISCRIPT_DEFAULT_META: '"just a string"'
      };
      const result = parseDefaultMetaFromEnv(env);
      assert.strictEqual(result, undefined);
    });

    test("returns undefined for null values", () => {
      const env = {
        GENAISCRIPT_DEFAULT_META: 'null'
      };
      const result = parseDefaultMetaFromEnv(env);
      assert.strictEqual(result, undefined);
    });

    test("handles empty object", () => {
      const env = {
        GENAISCRIPT_DEFAULT_META: '{}'
      };
      const result = parseDefaultMetaFromEnv(env);
      assert.deepStrictEqual(result, {});
    });
  });
});