import { describe, test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE } from "./constants"

describe("CI detection", () => {
    let originalEnv: string | undefined

    beforeEach(() => {
        // Save original environment variable
        originalEnv = process.env[GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE]
        // Clear the module cache to reload the ci module
        delete require.cache[require.resolve("./ci")]
    })

    afterEach(() => {
        // Restore original environment variable
        if (originalEnv !== undefined) {
            process.env[GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE] = originalEnv
        } else {
            delete process.env[GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE]
        }
        // Clear the module cache
        delete require.cache[require.resolve("./ci")]
    })

    await test("isCI can be disabled via environment variable", async () => {
        // Set the disable flag
        process.env[GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE] = "true"
        
        // Re-import the module to get the new value
        const { isCI } = await import("./ci")
        
        // When disabled, isCI should be false
        assert.strictEqual(isCI, false)
    })

    await test("isCI respects ci-info when not disabled", async () => {
        // Remove the disable flag
        delete process.env[GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE]
        
        // Re-import the module to get the original behavior
        const { isCI, ci } = await import("./ci")
        
        // When not disabled, isCI should match ci-info's value
        assert.strictEqual(isCI, ci.isCI)
    })
})
