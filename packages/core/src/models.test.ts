import test, { describe } from "node:test"
import { parseModelIdentifier } from "./models"
import assert from "node:assert"
import {
    MODEL_PROVIDER_AICI,
    MODEL_PROVIDER_LLAMAFILE,
    MODEL_PROVIDER_OLLAMA,
    MODEL_PROVIDER_OPENAI,
} from "./constants"

// generate unit tests for parseModelIdentifier
describe("parseModelIdentifier", () => {
    test("aici:gpt-3.5:en", () => {
        const { provider, model, tag, family } =
            parseModelIdentifier("aici:gpt-3.5:en")
        assert(provider === MODEL_PROVIDER_AICI)
        assert(family === "gpt-3.5")
        assert(tag === "en")
        assert(model === "gpt-3.5:en")
    })
    test("ollama:phi3", () => {
        const { provider, model, tag, family } =
            parseModelIdentifier("ollama:phi3")
        assert(provider === MODEL_PROVIDER_OLLAMA)
        assert(model === "phi3")
        assert(family === "phi3")
    })
    test("llamafile", () => {
        const { provider, model } = parseModelIdentifier("llamafile")
        assert(provider === MODEL_PROVIDER_LLAMAFILE)
        assert(model === "*")
    })
    test("gpt4", () => {
        const { provider, model, family } = parseModelIdentifier("gpt4")
        assert(provider === MODEL_PROVIDER_OPENAI)
        assert(model === "gpt4")
        assert(family === "gpt4")
    })
})
