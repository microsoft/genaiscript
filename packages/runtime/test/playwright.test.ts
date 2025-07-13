import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { BrowserManager } from "../src/playwright.js";
import { initialize } from "@genaiscript/runtime";

describe("BrowserManager", () => {
  let browserManager: BrowserManager;

  beforeEach(async () => {
    await initialize({ test: true})
    browserManager = new BrowserManager();
  });

  afterEach(async () => {
    await browserManager.stopAndRemove();
  });

  test("browse", async () => {
    const page = await browserManager.browse("https://microsoft.github.io/genaiscript/");
    expect(page).toBeDefined();
  });
});
