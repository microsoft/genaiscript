import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { isDomainAllowed, createDomainBlockedError } from "../src/domainfilter.js";

describe("domainfilter", () => {
  describe("isDomainAllowed", () => {
    test("allows exact domain match", () => {
      assert.equal(isDomainAllowed("github.com", ["github.com"]), true);
      assert.equal(isDomainAllowed("api.openai.com", ["api.openai.com"]), true);
    });

    test("blocks non-matching domains", () => {
      assert.equal(isDomainAllowed("badsite.com", ["github.com"]), false);
      assert.equal(isDomainAllowed("api.openai.com", ["github.com"]), false);
    });

    test("supports wildcard patterns", () => {
      assert.equal(isDomainAllowed("api.github.com", ["*.github.com"]), true);
      assert.equal(isDomainAllowed("raw.githubusercontent.com", ["*.githubusercontent.com"]), true);
      assert.equal(isDomainAllowed("github.com", ["*.github.com"]), false); // exact match doesn't match wildcard
    });

    test("supports multiple allowed domains", () => {
      const allowedDomains = ["github.com", "*.openai.com", "example.org"];
      assert.equal(isDomainAllowed("github.com", allowedDomains), true);
      assert.equal(isDomainAllowed("api.openai.com", allowedDomains), true);
      assert.equal(isDomainAllowed("example.org", allowedDomains), true);
      assert.equal(isDomainAllowed("badsite.com", allowedDomains), false);
    });

    test("handles edge cases", () => {
      assert.equal(isDomainAllowed("", ["github.com"]), false);
      assert.equal(isDomainAllowed("github.com", []), false);
      assert.equal(isDomainAllowed("github.com", null as any), false);
      assert.equal(isDomainAllowed(null as any, ["github.com"]), false);
    });

    test("supports global wildcard", () => {
      assert.equal(isDomainAllowed("any-domain.com", ["*"]), true);
      assert.equal(isDomainAllowed("github.com", ["*"]), true);
    });
  });

  describe("createDomainBlockedError", () => {
    test("creates descriptive error message", () => {
      const error = createDomainBlockedError("badsite.com", ["github.com", "*.openai.com"]);
      assert.ok(error.includes("badsite.com"));
      assert.ok(error.includes("github.com, *.openai.com"));
      assert.ok(error.includes("GENAISCRIPT_ALLOWED_DOMAINS"));
      assert.ok(error.includes("allowedDomains"));
    });
  });
});