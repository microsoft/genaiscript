import { describe, test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { parseTokenFromEnv } from "./env"
import { MODEL_PROVIDER_MINIMAX, MINIMAX_API_BASE } from "./constants"
import { TestHost } from "./testhost"

describe("MiniMax integration", () => {
    beforeEach(async () => {
        TestHost.install()
    })

    describe("parseTokenFromEnv", () => {
        test("resolves MINIMAX_API_KEY and base URL", async () => {
            const env: Record<string, string> = {
                MINIMAX_API_KEY: "test-minimax-key",
            }
            const result = await parseTokenFromEnv(
                env,
                "minimax:MiniMax-M2.7",
                {}
            )
            assert(result)
            assert.equal(result.provider, MODEL_PROVIDER_MINIMAX)
            assert.equal(result.model, "MiniMax-M2.7")
            assert.equal(result.token, "test-minimax-key")
            assert.equal(result.base, MINIMAX_API_BASE)
            assert.equal(result.type, "openai")
            assert.equal(result.source, "env: MINIMAX_API_...")
        })

        test("uses custom MINIMAX_API_BASE when set", async () => {
            const env: Record<string, string> = {
                MINIMAX_API_KEY: "test-key",
                MINIMAX_API_BASE: "https://custom.minimax.io/v1",
            }
            const result = await parseTokenFromEnv(
                env,
                "minimax:MiniMax-M2.5",
                {}
            )
            assert(result)
            assert.equal(result.base, "https://custom.minimax.io/v1")
        })

        test("throws when MINIMAX_API_KEY is missing", async () => {
            const env: Record<string, string> = {}
            await assert.rejects(
                () => parseTokenFromEnv(env, "minimax:MiniMax-M2.7", {}),
                { message: "MINIMAX_API_KEY not configured" }
            )
        })
    })
})
