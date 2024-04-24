import test, { describe } from "node:test"
import { parseModelIdentifier } from "./models"
import assert from "node:assert"

// generate unit tests for parseModelIdentifier
describe("parseModelIdentifier", () => {
    test("aici:gpt-3.5:en", () => {
        const { provider, model, tag, modelId } =
            parseModelIdentifier("aici:gpt-3.5:en")
        assert(provider === "aici")
        assert(model === "gpt-3.5")
        assert(tag === "en")
        assert(modelId === "gpt-3.5:en")
    })
    test("ollama:phi3", () => {
        const { provider, model, tag, modelId } =
            parseModelIdentifier("ollama:phi3")
        assert(provider === "ollama")
        assert(model === "phi3")
        assert(modelId === "phi3")
    })
    test("gpt4", () => {
        const { provider, model, modelId } = parseModelIdentifier("gpt4")
        assert(provider === "openai")
        assert(model === "gpt4")
        assert(modelId === "gpt4")
    })
})
