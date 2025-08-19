import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseAllowedDomains } from "../src/env.js";

describe("env", () => {
  describe("parseAllowedDomains", () => {
    test("returns default github.com when no env var set", () => {
      const result = parseAllowedDomains({});
      assert.deepEqual(result, ["github.com", "*.github.com", "*.githubusercontent.com"]);
    });

    test("parses comma-separated domains from GENAISCRIPT_ALLOWED_DOMAINS", () => {
      const env = { GENAISCRIPT_ALLOWED_DOMAINS: "github.com,api.openai.com,*.example.com" };
      const result = parseAllowedDomains(env);
      assert.deepEqual(result, ["github.com", "api.openai.com", "*.example.com"]);
    });

    test("parses comma-separated domains from ALLOWED_DOMAINS", () => {
      const env = { ALLOWED_DOMAINS: "github.com,api.openai.com" };
      const result = parseAllowedDomains(env);
      assert.deepEqual(result, ["github.com", "api.openai.com"]);
    });

    test("prefers GENAISCRIPT_ALLOWED_DOMAINS over ALLOWED_DOMAINS", () => {
      const env = { 
        GENAISCRIPT_ALLOWED_DOMAINS: "github.com",
        ALLOWED_DOMAINS: "different.com"
      };
      const result = parseAllowedDomains(env);
      assert.deepEqual(result, ["github.com"]);
    });

    test("handles YAML array format", () => {
      const env = { GENAISCRIPT_ALLOWED_DOMAINS: '["github.com", "*.openai.com", "example.org"]' };
      const result = parseAllowedDomains(env);
      assert.deepEqual(result, ["github.com", "*.openai.com", "example.org"]);
    });

    test("trims whitespace from comma-separated values", () => {
      const env = { GENAISCRIPT_ALLOWED_DOMAINS: " github.com , api.openai.com , *.example.com " };
      const result = parseAllowedDomains(env);
      assert.deepEqual(result, ["github.com", "api.openai.com", "*.example.com"]);
    });

    test("filters out empty values", () => {
      const env = { GENAISCRIPT_ALLOWED_DOMAINS: "github.com,,api.openai.com," };
      const result = parseAllowedDomains(env);
      assert.deepEqual(result, ["github.com", "api.openai.com"]);
    });

    test("handles single domain", () => {
      const env = { GENAISCRIPT_ALLOWED_DOMAINS: "github.com" };
      const result = parseAllowedDomains(env);
      assert.deepEqual(result, ["github.com"]);
    });
  });
});