import assert from "node:assert/strict";
import { test, describe } from "vitest";
import { parseRetryAfter } from "../src/fetch.js";

describe("parseRetryAfter", () => {
  test("parses seconds correctly", () => {
    assert.strictEqual(parseRetryAfter("120"), 120);
    assert.strictEqual(parseRetryAfter("60"), 60);
    assert.strictEqual(parseRetryAfter("0"), 0);
    assert.strictEqual(parseRetryAfter("  30  "), 30); // with whitespace
  });

  test("parses HTTP dates correctly", () => {
    const futureDate = new Date(Date.now() + 5000); // 5 seconds from now
    const retryAfterSeconds = parseRetryAfter(futureDate.toUTCString());

    // Should be approximately 5 seconds (allow some tolerance)
    assert(
      retryAfterSeconds >= 4 && retryAfterSeconds <= 6,
      `Expected ~5 seconds, got ${retryAfterSeconds}`,
    );
  });

  test("handles invalid input", () => {
    assert.strictEqual(parseRetryAfter(""), null);
    assert.strictEqual(parseRetryAfter("invalid"), null);
    assert.strictEqual(parseRetryAfter("not-a-date"), null);
  });

  test("handles negative seconds", () => {
    assert.strictEqual(parseRetryAfter("-10"), null);
  });

  test("handles past dates", () => {
    const pastDate = new Date(Date.now() - 5000); // 5 seconds ago
    const retryAfterSeconds = parseRetryAfter(pastDate.toUTCString());

    // Should return 0 for past dates
    assert.strictEqual(retryAfterSeconds, 0);
  });
});
