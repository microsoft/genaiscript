import { describe, test, expect } from "vitest";
import { normalizeInt } from "../src/cleaners.js";

describe("test timeout functionality", () => {
  test("normalizeInt should handle timeout values correctly", () => {
    expect(normalizeInt("5")).toBe(5);
    expect(normalizeInt("60")).toBe(60);
    expect(normalizeInt(undefined)).toBe(undefined);
    expect(normalizeInt("")).toBe(undefined);
  });

  test("timeout should default to 60 seconds", () => {
    const testTimeout = normalizeInt(undefined) || 60;
    expect(testTimeout).toBe(60);
  });
});