// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { parseModelIdentifier } from "../src/models.js";
import {
  MODEL_PROVIDER_GITHUB,
  MODEL_PROVIDER_LLAMAFILE,
  MODEL_PROVIDER_OLLAMA,
  MODEL_PROVIDER_OPENAI,
} from "../src/constants.js";

// generate unit tests for parseModelIdentifier
describe("parseModelIdentifier", () => {
  test("ollama:phi3", () => {
    const { provider, model, tag, family } = parseModelIdentifier("ollama:phi3");
    assert(provider === MODEL_PROVIDER_OLLAMA);
    assert(model === "phi3");
    assert(family === "phi3");
  });
  test("ollama:gemma2:2b", () => {
    const { provider, model, tag, family } = parseModelIdentifier("ollama:gemma2:2b");
    assert(provider === MODEL_PROVIDER_OLLAMA);
    assert(model === "gemma2:2b");
    assert(family === "gemma2");
  });
  test("llamafile", () => {
    const { provider, model, family } = parseModelIdentifier("llamafile");
    assert(provider === MODEL_PROVIDER_LLAMAFILE);
    assert(family === "*");
    assert(model === "*");
  });
  test("github:gpt4", () => {
    const { provider, model, family } = parseModelIdentifier("github:gpt4");
    assert(provider === MODEL_PROVIDER_GITHUB);
    assert(model === "gpt4");
    assert(family === "gpt4");
  });
  test("openai:gpt4", () => {
    const { provider, model, family } = parseModelIdentifier("openai:gpt4");
    assert(provider === MODEL_PROVIDER_OPENAI);
    assert(model === "gpt4");
    assert(family === "gpt4");
  });
  test("anthropic_bedrock:anthropic.claude-3-7-sonnet-20250219-v1:0", () => {
    const res = parseModelIdentifier("anthropic_bedrock:anthropic.claude-3-7-sonnet-20250219-v1:0");
    assert.deepEqual(res, {
      provider: "anthropic_bedrock",
      family: "anthropic.claude-3-7-sonnet-20250219-v1",
      model: "anthropic.claude-3-7-sonnet-20250219-v1:0",
      tag: "0",
    });
  });
  test("anthropic_bedrock:anthropic.claude-3-7-sonnet-20250219-v1:0:high", () => {
    const res = parseModelIdentifier(
      "anthropic_bedrock:anthropic.claude-3-7-sonnet-20250219-v1:0:high",
    );
    assert.deepEqual(res, {
      provider: "anthropic_bedrock",
      family: "anthropic.claude-3-7-sonnet-20250219-v1",
      model: "anthropic.claude-3-7-sonnet-20250219-v1:0",
      tag: "0",
      reasoningEffort: "high",
    });
  });
  test("anthropic:claude-3-7-sonnet-latest", () => {
    const res = parseModelIdentifier("anthropic:claude-3-7-sonnet-latest");
    assert.deepEqual(res, {
      provider: "anthropic",
      family: "claude-3-7-sonnet-latest",
      model: "claude-3-7-sonnet-latest",
    });
  });
  test("anthropic:claude-3-7-sonnet-latest:high", () => {
    const res = parseModelIdentifier("anthropic:claude-3-7-sonnet-latest:high");
    assert.deepEqual(res, {
      provider: "anthropic",
      family: "claude-3-7-sonnet-latest",
      model: "claude-3-7-sonnet-latest",
      reasoningEffort: "high",
    });
  });
});
