import { describe, test, beforeEach } from "vitest";
import { cacheClear } from "../src/cache.js";
import { TestHost } from "@genaiscript/core";

describe("cache", () => {
  beforeEach(() => {
    TestHost.install();
  });
  test("should clear the cache directory", async () => {
    const name = "tests";
    await cacheClear(name);
  });
});
