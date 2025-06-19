import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { defaultModelConfigurations } from "./llms";
import { TestHost } from "./testhost";
import { LARGE_MODEL_ID, SMALL_MODEL_ID, VISION_MODEL_ID } from "./constants";

describe("defaultModelConfigurations", () => {
  beforeEach(async () => {
    TestHost.install();
  });

  test("should return the expected model configurations", () => {
    const modelConfigs = defaultModelConfigurations();
    assert(modelConfigs);
    assert.equal(typeof modelConfigs, "object");
    // Further checks based on expected structure of modelConfigs
  });

  test("should process aliases correctly", () => {
    const modelConfigs = defaultModelConfigurations();
    const aliases = [
      LARGE_MODEL_ID,
      SMALL_MODEL_ID,
      VISION_MODEL_ID,
      "vision_small",
      "embeddings",
      "reasoning",
      "reasoning_small",
    ];
    aliases.forEach((alias) => {
      assert(alias in modelConfigs);
    });
  });
});
