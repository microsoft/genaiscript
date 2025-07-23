// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { parseTokenFromEnv } from "../src/env.js";
import { describe, test, assert } from "vitest";

describe("OpenAI Responses API", () => {
  test("supports openai_responses type in OPENAI_API_TYPE", async () => {
    const env = {
      OPENAI_API_KEY: "test-key",
      OPENAI_API_TYPE: "openai_responses",
    };
    
    const result = await parseTokenFromEnv(env, "openai:gpt-4", {});
    
    assert.equal(result.type, "openai_responses");
    assert.equal(result.provider, "openai");
    assert.equal(result.token, "test-key");
  });

  test("defaults to openai_responses when OPENAI_DEFAULT_RESPONSES_API is true", async () => {
    const env = {
      OPENAI_API_KEY: "test-key",
      OPENAI_DEFAULT_RESPONSES_API: "true",
    };
    
    const result = await parseTokenFromEnv(env, "openai:gpt-4", {});
    
    assert.equal(result.type, "openai_responses");
    assert.equal(result.provider, "openai");
    assert.equal(result.token, "test-key");
  });

  test("stays with openai type when OPENAI_DEFAULT_RESPONSES_API is not set", async () => {
    const env = {
      OPENAI_API_KEY: "test-key",
    };
    
    const result = await parseTokenFromEnv(env, "openai:gpt-4", {});
    
    assert.equal(result.type, "openai");
    assert.equal(result.provider, "openai");
    assert.equal(result.token, "test-key");
  });

  test("explicit OPENAI_API_TYPE overrides OPENAI_DEFAULT_RESPONSES_API", async () => {
    const env = {
      OPENAI_API_KEY: "test-key",
      OPENAI_API_TYPE: "openai",
      OPENAI_DEFAULT_RESPONSES_API: "true",
    };
    
    const result = await parseTokenFromEnv(env, "openai:gpt-4", {});
    
    assert.equal(result.type, "openai");
    assert.equal(result.provider, "openai");
    assert.equal(result.token, "test-key");
  });

  test("throws error for invalid OPENAI_API_TYPE", async () => {
    const env = {
      OPENAI_API_KEY: "test-key",
      OPENAI_API_TYPE: "invalid_type",
    };
    
    try {
      await parseTokenFromEnv(env, "openai:gpt-4", {});
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(error.message, "OPENAI_API_TYPE must be");
      assert.include(error.message, "openai_responses");
    }
  });
});