import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { isDomainAllowed, createDomainBlockedError } from "../src/domainfilter.js";
import type { HostConfiguration } from "../src/hostconfiguration.js";

describe("domainfilter", () => {
  describe("isDomainAllowed", () => {
    test("allows exact domain match", () => {
      const config: HostConfiguration = { allowedDomains: ["github.com"] };
      assert.equal(isDomainAllowed("github.com", config), true);
      
      const config2: HostConfiguration = { allowedDomains: ["api.openai.com"] };
      assert.equal(isDomainAllowed("api.openai.com", config2), true);
    });

    test("blocks non-matching domains", () => {
      const config: HostConfiguration = { allowedDomains: ["github.com"] };
      assert.equal(isDomainAllowed("badsite.com", config), false);
      assert.equal(isDomainAllowed("api.openai.com", config), false);
    });

    test("supports wildcard patterns", () => {
      const config: HostConfiguration = { allowedDomains: ["*.github.com"] };
      assert.equal(isDomainAllowed("api.github.com", config), true);
      
      const config2: HostConfiguration = { allowedDomains: ["*.githubusercontent.com"] };
      assert.equal(isDomainAllowed("raw.githubusercontent.com", config2), true);
      
      // exact match doesn't match wildcard
      assert.equal(isDomainAllowed("github.com", config), false);
    });

    test("supports multiple allowed domains", () => {
      const config: HostConfiguration = { 
        allowedDomains: ["github.com", "*.openai.com", "example.org"] 
      };
      assert.equal(isDomainAllowed("github.com", config), true);
      assert.equal(isDomainAllowed("api.openai.com", config), true);
      assert.equal(isDomainAllowed("example.org", config), true);
      assert.equal(isDomainAllowed("badsite.com", config), false);
    });

    test("handles edge cases", () => {
      const config: HostConfiguration = { allowedDomains: ["github.com"] };
      assert.equal(isDomainAllowed("", config), false);
      assert.equal(isDomainAllowed("github.com", { allowedDomains: [] }), false);
      assert.equal(isDomainAllowed("github.com", {}), false);
      assert.equal(isDomainAllowed("github.com", undefined), false);
      assert.equal(isDomainAllowed(null as any, config), false);
    });

    test("supports global wildcard", () => {
      const config: HostConfiguration = { allowedDomains: ["*"] };
      assert.equal(isDomainAllowed("any-domain.com", config), true);
      assert.equal(isDomainAllowed("github.com", config), true);
    });

    test("uses default domains when no config provided", () => {
      // Should use default GitHub domains
      assert.equal(isDomainAllowed("github.com", undefined), true);
      assert.equal(isDomainAllowed("api.github.com", undefined), true);
      assert.equal(isDomainAllowed("raw.githubusercontent.com", undefined), true);
      assert.equal(isDomainAllowed("example.github.io", undefined), true);
      assert.equal(isDomainAllowed("badsite.com", undefined), false);
    });

    test("uses default domains when allowedDomains not specified", () => {
      const config: HostConfiguration = {};
      // Should use default GitHub domains
      assert.equal(isDomainAllowed("github.com", config), true);
      assert.equal(isDomainAllowed("api.github.com", config), true);
      assert.equal(isDomainAllowed("raw.githubusercontent.com", config), true);
      assert.equal(isDomainAllowed("example.github.io", config), true);
      assert.equal(isDomainAllowed("badsite.com", config), false);
    });
  });

  describe("createDomainBlockedError", () => {
    test("creates descriptive error message", () => {
      const config: HostConfiguration = { allowedDomains: ["github.com", "*.openai.com"] };
      const error = createDomainBlockedError("badsite.com", config);
      assert.ok(error.includes("badsite.com"));
      assert.ok(error.includes("github.com, *.openai.com"));
      assert.ok(error.includes("GENAISCRIPT_ALLOWED_DOMAINS"));
      assert.ok(error.includes("allowedDomains"));
    });

    test("uses default domains in error message when no config provided", () => {
      const error = createDomainBlockedError("badsite.com", undefined);
      assert.ok(error.includes("badsite.com"));
      assert.ok(error.includes("github.com"));
      assert.ok(error.includes("*.github.com"));
      assert.ok(error.includes("*.githubusercontent.com"));
      assert.ok(error.includes("*.github.io"));
    });
  });
});