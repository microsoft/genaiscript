// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach } from "vitest";
import { TestHost } from "../src/testhost.js";
import { fetchText } from "../src/fetchtext.js";

describe("fetch", () => {
  beforeEach(async () => {
    TestHost.install();
  });

  test("fetchText llms.txt", async () => {
    const res = await fetchText("https://microsoft.github.io/genaiscript/llms.txt");
    assert(res.ok);
    assert(res.text.includes("GenAIScript"));
  });

  test("fetchText allows all domains by default with wildcard", async () => {
    // With the new default of ["*"], all domains should be allowed
    // The actual network request will likely fail, but domain filtering should pass
    try {
      await fetchText("https://example.com/test.txt");
      // If we get here, either the request succeeded or failed for non-domain reasons
      // which is expected with wildcard default
    } catch (error) {
      // If it's a domain filtering error, fail the test
      if (error.message.includes("is not allowed")) {
        assert.fail(`Domain filtering should allow all domains with wildcard default: ${error.message}`);
      }
      // Other errors (network, 404, timeout, etc.) are okay for this test
    }
  });

  test("fetchText blocks domains when explicitly configured", async () => {
    // Test that domain blocking still works when explicitly configured
    try {
      await fetchText("https://example.com/test.txt", {
        script: { allowedDomains: ["github.com", "*.github.com"] }
      });
      assert.fail("Should have thrown error for unauthorized domain when allowedDomains is configured");
    } catch (error) {
      assert(error.message.includes("Domain 'example.com' is not allowed"));
      assert(error.message.includes("github.com"));
      assert(error.message.includes("GENAISCRIPT_ALLOWED_DOMAINS"));
    }
  });

  test("fetchText allows github domains by default", async () => {
    // This test may fail in CI due to network restrictions, but demonstrates the expected behavior
    // The domain filtering logic should pass for GitHub domains
    const githubDomains = [
      "https://api.github.com",
      "https://raw.githubusercontent.com", 
      "https://github.com",
      "https://microsoft.github.io"
    ];
    
    for (const domain of githubDomains) {
      try {
        // We just want to verify the domain filter passes, actual network request may fail
        await fetchText(`${domain}/test`);
      } catch (error) {
        // If it's a domain filtering error, fail the test
        if (error.message.includes("is not allowed")) {
          assert.fail(`Domain filtering should allow ${domain}: ${error.message}`);
        }
        // Other errors (network, 404, etc.) are okay for this test
      }
    }
  });
});
