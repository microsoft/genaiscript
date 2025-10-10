import { describe, test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE } from "./constants"

describe("CI detection", () => {
    let originalEnv: string | undefined

    beforeEach(() => {
        // Save original environment variable
        originalEnv = process.env[GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE]
    })

    afterEach(() => {
        // Restore original environment variable
        if (originalEnv !== undefined) {
            process.env[GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE] = originalEnv
        } else {
            delete process.env[GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE]
        }
    })

    await test("getIsCI can be disabled via environment variable", async () => {
        // Set the disable flag
        process.env[GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE] = "true"
        
        // Import the module to get the function
        const { getIsCI } = await import("./ci")
        
        // When disabled, getIsCI() should return false
        assert.strictEqual(getIsCI(), false)
    })

    await test("getIsCI respects ci-info when not disabled", async () => {
        // Remove the disable flag
        delete process.env[GENAISCRIPT_DISABLE_GITHUB_ACTIONS_MODE]
        
        // Import the module to get the function
        const { getIsCI, ci } = await import("./ci")
        
        // When not disabled, getIsCI() should match ci-info's value
        assert.strictEqual(getIsCI(), ci.isCI)
    })
})
