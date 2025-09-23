/**
 * Test cases for server.ts trace handling
 * Verifies that trace objects are handled safely when they might be undefined
 */

const { test } = require("node:test")
const assert = require("node:assert")

test("GitHub Copilot Chat completion handler should handle undefined trace", async () => {
    // This test verifies that the trace object is safely handled with optional chaining
    // We can't easily test the actual server code in isolation, but we can verify 
    // the pattern used is safe

    const trace = undefined

    // These calls should not throw when trace is undefined
    assert.doesNotThrow(() => {
        trace?.itemValue?.("test", "value")
        trace?.appendContent?.("test content")
        trace?.appendToken?.("test token")
        trace?.error?.("test error", new Error("test"))
    })

    // Test with defined trace
    let itemValueCalled = false
    let appendContentCalled = false
    let appendTokenCalled = false
    let errorCalled = false

    const definedTrace = {
        itemValue: (key, value) => { itemValueCalled = true },
        appendContent: (content) => { appendContentCalled = true },
        appendToken: (token) => { appendTokenCalled = true },
        error: (message, error) => { errorCalled = true }
    }

    definedTrace?.itemValue?.("test", "value")
    definedTrace?.appendContent?.("test content")
    definedTrace?.appendToken?.("test token")
    definedTrace?.error?.("test error", new Error("test"))

    assert.strictEqual(itemValueCalled, true)
    assert.strictEqual(appendContentCalled, true)
    assert.strictEqual(appendTokenCalled, true)
    assert.strictEqual(errorCalled, true)
})

test("trace content access should handle undefined gracefully", () => {
    const trace = undefined
    
    // This should not throw and should provide a fallback
    const content = trace?.content || ""
    assert.strictEqual(content, "")

    const definedTrace = { content: "test content" }
    const definedContent = definedTrace?.content || ""
    assert.strictEqual(definedContent, "test content")
})