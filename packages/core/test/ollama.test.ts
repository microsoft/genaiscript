// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { ollamaParseHostVariable } from "../src/env.js";
import { OLLAMA_API_BASE, OLLAMA_DEFAULT_PORT } from "../src/constants.js";
import { normalizeOllamaModelName, areOllamaModelsEquivalent } from "../src/ollama.js";

describe("parseHostVariable", () => {
  test("parses OLLAMA_HOST environment variable correctly", () => {
    const env = { OLLAMA_HOST: "http://localhost:3000" };
    const result = ollamaParseHostVariable(env);
    assert.strictEqual(result, "http://localhost:3000/");
  });

  test("parses OLLAMA_API_BASE environment variable correctly", () => {
    const env = { OLLAMA_API_BASE: "http://api.ollama.com" };
    const result = ollamaParseHostVariable(env);
    assert.strictEqual(result, "http://api.ollama.com/");
  });

  test("falls back to OLLAMA_API_BASE constant if no environment variable is set", () => {
    const env = {};
    const result = ollamaParseHostVariable(env);
    assert.strictEqual(result, OLLAMA_API_BASE);
  });

  test("parses IP address with port correctly", () => {
    const env = { OLLAMA_HOST: "192.168.1.1:8080" };
    const result = ollamaParseHostVariable(env);
    assert.strictEqual(result, "http://192.168.1.1:8080");
  });

  test("parses IP address without port correctly", () => {
    const env = { OLLAMA_HOST: "192.168.1.1" };
    const result = ollamaParseHostVariable(env);
    assert.strictEqual(result, `http://192.168.1.1:${OLLAMA_DEFAULT_PORT}`);
  });

  test("parses 0.0.0.0 with port correctly", () => {
    const env = { OLLAMA_HOST: "0.0.0.0:4000" };
    const result = ollamaParseHostVariable(env);
    assert.strictEqual(result, "http://0.0.0.0:4000");
  });

  test("parses localhost with port correctly", () => {
    const env = { OLLAMA_HOST: "localhost:4000" };
    const result = ollamaParseHostVariable(env);
    assert.strictEqual(result, "http://localhost:4000");
  });

  test("parses 0.0.0.0 without port correctly", () => {
    const env = { OLLAMA_HOST: "0.0.0.0" };
    const result = ollamaParseHostVariable(env);
    assert.strictEqual(result, `http://0.0.0.0:${OLLAMA_DEFAULT_PORT}`);
  });
});

describe("normalizeOllamaModelName", () => {
  test("adds :latest tag to model without tag", () => {
    assert.strictEqual(normalizeOllamaModelName("llama3.2"), "llama3.2:latest");
  });

  test("preserves existing tag", () => {
    assert.strictEqual(normalizeOllamaModelName("llama3.2:3b"), "llama3.2:3b");
    assert.strictEqual(normalizeOllamaModelName("llama3.2:latest"), "llama3.2:latest");
  });

  test("handles empty input", () => {
    assert.strictEqual(normalizeOllamaModelName(""), "");
  });

  test("handles registry with port correctly", () => {
    assert.strictEqual(normalizeOllamaModelName("registry:5000/model"), "registry:5000/model:latest");
    assert.strictEqual(normalizeOllamaModelName("registry:5000/model:tag"), "registry:5000/model:tag");
  });

  test("handles complex model names", () => {
    assert.strictEqual(normalizeOllamaModelName("hf.co/bartowski/llama3.2"), "hf.co/bartowski/llama3.2:latest");
    assert.strictEqual(normalizeOllamaModelName("hf.co/bartowski/llama3.2:gguf"), "hf.co/bartowski/llama3.2:gguf");
  });
});

describe("areOllamaModelsEquivalent", () => {
  test("recognizes model without tag as equivalent to model with :latest tag", () => {
    assert.strictEqual(areOllamaModelsEquivalent("llama3.2", "llama3.2:latest"), true);
    assert.strictEqual(areOllamaModelsEquivalent("llama3.2:latest", "llama3.2"), true);
  });

  test("recognizes exact matches", () => {
    assert.strictEqual(areOllamaModelsEquivalent("llama3.2", "llama3.2"), true);
    assert.strictEqual(areOllamaModelsEquivalent("llama3.2:latest", "llama3.2:latest"), true);
    assert.strictEqual(areOllamaModelsEquivalent("llama3.2:3b", "llama3.2:3b"), true);
  });

  test("recognizes different models as not equivalent", () => {
    assert.strictEqual(areOllamaModelsEquivalent("llama3.2", "llama3.1"), false);
    assert.strictEqual(areOllamaModelsEquivalent("llama3.2:3b", "llama3.2:7b"), false);
    assert.strictEqual(areOllamaModelsEquivalent("llama3.2", "llama3.2:3b"), false);
  });

  test("handles empty input", () => {
    assert.strictEqual(areOllamaModelsEquivalent("", "llama3.2"), false);
    assert.strictEqual(areOllamaModelsEquivalent("llama3.2", ""), false);
    assert.strictEqual(areOllamaModelsEquivalent("", ""), false);
  });

  test("handles complex model names", () => {
    assert.strictEqual(areOllamaModelsEquivalent("hf.co/bartowski/llama3.2", "hf.co/bartowski/llama3.2:latest"), true);
    assert.strictEqual(areOllamaModelsEquivalent("hf.co/bartowski/llama3.2:gguf", "hf.co/bartowski/llama3.2:latest"), false);
  });
});
