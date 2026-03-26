import { describe, test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { parseModelIdentifier } from "./models"
import { MODEL_PROVIDER_MINIMAX, MINIMAX_API_BASE } from "./constants"
import { defaultModelConfigurations } from "./llms"
import { TestHost } from "./testhost"
import { resolveLanguageModel } from "./lm"

describe("MiniMax provider", () => {
    beforeEach(async () => {
        TestHost.install()
    })

    describe("parseModelIdentifier", () => {
        test("minimax:MiniMax-M2.7", () => {
            const { provider, model, family } =
                parseModelIdentifier("minimax:MiniMax-M2.7")
            assert.equal(provider, MODEL_PROVIDER_MINIMAX)
            assert.equal(model, "MiniMax-M2.7")
            assert.equal(family, "MiniMax-M2.7")
        })

        test("minimax:MiniMax-M2.7-highspeed", () => {
            const { provider, model, family } = parseModelIdentifier(
                "minimax:MiniMax-M2.7-highspeed"
            )
            assert.equal(provider, MODEL_PROVIDER_MINIMAX)
            assert.equal(model, "MiniMax-M2.7-highspeed")
            assert.equal(family, "MiniMax-M2.7-highspeed")
        })

        test("minimax:MiniMax-M2.5", () => {
            const { provider, model, family } =
                parseModelIdentifier("minimax:MiniMax-M2.5")
            assert.equal(provider, MODEL_PROVIDER_MINIMAX)
            assert.equal(model, "MiniMax-M2.5")
            assert.equal(family, "MiniMax-M2.5")
        })
    })

    describe("constants", () => {
        test("MODEL_PROVIDER_MINIMAX is defined", () => {
            assert.equal(MODEL_PROVIDER_MINIMAX, "minimax")
        })

        test("MINIMAX_API_BASE is correct", () => {
            assert.equal(MINIMAX_API_BASE, "https://api.minimax.io/v1")
        })
    })

    describe("llms.json configuration", () => {
        test("minimax provider is registered", () => {
            const configs = defaultModelConfigurations()
            assert(configs)
            // minimax should contribute aliases for large and small
            const largeConfig = configs.large
            assert(largeConfig)
            assert(largeConfig.candidates)
            const hasMinimax = largeConfig.candidates.some((c: string) =>
                c.startsWith("minimax:")
            )
            assert(hasMinimax, "minimax should be in large candidates")
        })

        test("minimax small alias is registered", () => {
            const configs = defaultModelConfigurations()
            const smallConfig = configs.small
            assert(smallConfig)
            assert(smallConfig.candidates)
            const hasMinimax = smallConfig.candidates.some((c: string) =>
                c.startsWith("minimax:")
            )
            assert(hasMinimax, "minimax should be in small candidates")
        })
    })

    describe("resolveLanguageModel", () => {
        test("minimax resolves to OpenAI-compatible model", () => {
            const lm = resolveLanguageModel(MODEL_PROVIDER_MINIMAX)
            assert(lm)
            assert(lm.completer)
            assert.equal(lm.id, MODEL_PROVIDER_MINIMAX)
        })
    })
})
