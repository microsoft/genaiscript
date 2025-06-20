// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach } from "vitest";
import { defaultModelConfigurations } from "../src/llms.js";
import { TestHost } from "../src/testhost.js";
import { LARGE_MODEL_ID, SMALL_MODEL_ID, VISION_MODEL_ID } from "../src/constants.js";

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
