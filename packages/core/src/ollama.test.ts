import { describe, test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { TestHost } from "./testhost"
import { normalizeOllamaModelName, areOllamaModelsEquivalent } from "./ollama"

describe("normalizeOllamaModelName", () => {
    beforeEach(() => {
        TestHost.install()
    })

    test("adds :latest tag to model without tag", () => {
        assert.strictEqual(normalizeOllamaModelName("llama3.2"), "llama3.2:latest")
    })

    test("preserves existing tag", () => {
        assert.strictEqual(normalizeOllamaModelName("llama3.2:3b"), "llama3.2:3b")
        assert.strictEqual(normalizeOllamaModelName("llama3.2:latest"), "llama3.2:latest")
    })

    test("handles empty input", () => {
        assert.strictEqual(normalizeOllamaModelName(""), "")
    })

    test("handles registry with port correctly", () => {
        assert.strictEqual(normalizeOllamaModelName("registry:5000/model"), "registry:5000/model:latest")
        assert.strictEqual(normalizeOllamaModelName("registry:5000/model:tag"), "registry:5000/model:tag")
    })

    test("handles complex model names", () => {
        assert.strictEqual(normalizeOllamaModelName("hf.co/bartowski/llama3.2"), "hf.co/bartowski/llama3.2:latest")
        assert.strictEqual(normalizeOllamaModelName("hf.co/bartowski/llama3.2:gguf"), "hf.co/bartowski/llama3.2:gguf")
    })
})

describe("areOllamaModelsEquivalent", () => {
    beforeEach(() => {
        TestHost.install()
    })

    test("recognizes model without tag as equivalent to model with :latest tag", () => {
        assert.strictEqual(areOllamaModelsEquivalent("llama3.2", "llama3.2:latest"), true)
        assert.strictEqual(areOllamaModelsEquivalent("llama3.2:latest", "llama3.2"), true)
    })

    test("recognizes exact matches", () => {
        assert.strictEqual(areOllamaModelsEquivalent("llama3.2", "llama3.2"), true)
        assert.strictEqual(areOllamaModelsEquivalent("llama3.2:latest", "llama3.2:latest"), true)
        assert.strictEqual(areOllamaModelsEquivalent("llama3.2:3b", "llama3.2:3b"), true)
    })

    test("recognizes different models as not equivalent", () => {
        assert.strictEqual(areOllamaModelsEquivalent("llama3.2", "llama3.1"), false)
        assert.strictEqual(areOllamaModelsEquivalent("llama3.2:3b", "llama3.2:7b"), false)
        assert.strictEqual(areOllamaModelsEquivalent("llama3.2", "llama3.2:3b"), false)
    })

    test("handles empty input", () => {
        assert.strictEqual(areOllamaModelsEquivalent("", "llama3.2"), false)
        assert.strictEqual(areOllamaModelsEquivalent("llama3.2", ""), false)
        assert.strictEqual(areOllamaModelsEquivalent("", ""), false)
    })

    test("handles complex model names", () => {
        assert.strictEqual(areOllamaModelsEquivalent("hf.co/bartowski/llama3.2", "hf.co/bartowski/llama3.2:latest"), true)
        assert.strictEqual(areOllamaModelsEquivalent("hf.co/bartowski/llama3.2:gguf", "hf.co/bartowski/llama3.2:latest"), false)
    })
})
