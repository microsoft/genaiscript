import { describe, test, assert } from "vitest";
import { isDomainAllowed, createDomainBlockedError } from "../src/domainfilter.js";

describe("domainfilter", () => {
  describe("isDomainAllowed", () => {
    test("allows exact domain match", () => {
      assert.equal(isDomainAllowed("github.com", { allowedDomains: ["github.com"] }), true);
      assert.equal(isDomainAllowed("api.openai.com", { allowedDomains: ["api.openai.com"] }), true);
    });

    test("blocks non-matching domains", () => {
      assert.equal(isDomainAllowed("badsite.com", { allowedDomains: ["github.com"] }), false);
      assert.equal(isDomainAllowed("api.openai.com", { allowedDomains: ["github.com"] }), false);
    });

    test("supports wildcard patterns", () => {
      assert.equal(isDomainAllowed("api.github.com", { allowedDomains: ["*.github.com"] }), true);
      assert.equal(isDomainAllowed("raw.githubusercontent.com", { allowedDomains: ["*.githubusercontent.com"] }), true);
      
      // exact match doesn't match wildcard
      assert.equal(isDomainAllowed("github.com", { allowedDomains: ["*.github.com"] }), false);
    });

    test("supports multiple allowed domains", () => {
      const options = { allowedDomains: ["github.com", "*.openai.com", "example.org"] };
      assert.equal(isDomainAllowed("github.com", options), true);
      assert.equal(isDomainAllowed("api.openai.com", options), true);
      assert.equal(isDomainAllowed("example.org", options), true);
      assert.equal(isDomainAllowed("badsite.com", options), false);
    });

    test("handles edge cases", () => {
      assert.equal(isDomainAllowed("", { allowedDomains: ["github.com"] }), false);
      assert.equal(isDomainAllowed("github.com", { allowedDomains: [] }), false);
      assert.equal(isDomainAllowed(null as any, { allowedDomains: ["github.com"] }), false);
    });

    test("supports global wildcard", () => {
      assert.equal(isDomainAllowed("any-domain.com", { allowedDomains: ["*"] }), true);
      assert.equal(isDomainAllowed("github.com", { allowedDomains: ["*"] }), true);
    });

    test("uses default domains when no config provided", () => {
      // Should use default wildcard domain (all domains allowed)
      assert.equal(isDomainAllowed("github.com", undefined), true);
      assert.equal(isDomainAllowed("api.github.com", undefined), true);
      assert.equal(isDomainAllowed("raw.githubusercontent.com", undefined), true);
      assert.equal(isDomainAllowed("example.github.io", undefined), true);
      assert.equal(isDomainAllowed("badsite.com", undefined), true);
      assert.equal(isDomainAllowed("any-domain.com", undefined), true);
    });

    test("uses default domains when allowedDomains not specified", () => {
      // Should use default wildcard domain (all domains allowed)
      assert.equal(isDomainAllowed("github.com", {}), true);
      assert.equal(isDomainAllowed("api.github.com", {}), true);
      assert.equal(isDomainAllowed("raw.githubusercontent.com", {}), true);
      assert.equal(isDomainAllowed("example.github.io", {}), true);
      assert.equal(isDomainAllowed("badsite.com", {}), true);
      assert.equal(isDomainAllowed("any-domain.com", {}), true);
    });
  });

  describe("createDomainBlockedError", () => {
    test("creates descriptive error message", () => {
      const error = createDomainBlockedError("badsite.com", { allowedDomains: ["github.com", "*.openai.com"] });
      assert(error.includes("badsite.com"));
      assert(error.includes("github.com, *.openai.com"));
      assert(error.includes("GENAISCRIPT_ALLOWED_DOMAINS"));
      assert(error.includes("allowedDomains"));
    });

    test("uses default domains in error message when no config provided", () => {
      const error = createDomainBlockedError("badsite.com", undefined);
      assert(error.includes("badsite.com"));
      assert(error.includes("*"));
    });
  });

  describe("script-level domain configuration", () => {
    test("script allowedDomains takes precedence over default", () => {
      // Script allows example.com, which is not in default domains
      assert.equal(isDomainAllowed("example.com", { allowedDomains: ["example.com"] }), true);
      assert.equal(isDomainAllowed("github.com", { allowedDomains: ["example.com"] }), false);
    });

    test("script can restrict domains more than default", () => {
      // Script only allows specific GitHub domain, not all GitHub domains
      assert.equal(isDomainAllowed("github.com", { allowedDomains: ["github.com"] }), true);
      assert.equal(isDomainAllowed("api.github.com", { allowedDomains: ["github.com"] }), false);
    });

    test("script can expand domains beyond default", () => {
      // Script allows additional domains beyond GitHub
      const options = { allowedDomains: ["github.com", "*.openai.com", "example.org"] };
      assert.equal(isDomainAllowed("github.com", options), true);
      assert.equal(isDomainAllowed("api.openai.com", options), true);
      assert.equal(isDomainAllowed("example.org", options), true);
      assert.equal(isDomainAllowed("badsite.com", options), false);
    });
  });
});