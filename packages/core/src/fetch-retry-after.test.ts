import assert from "node:assert/strict"
import test, { describe } from "node:test"

// Extract parseRetryAfter function from fetch.ts for testing
function parseRetryAfter(retryAfterHeader: string): number | null {
    if (!retryAfterHeader) return null
    
    // Try to parse as seconds (integer)
    const seconds = parseInt(retryAfterHeader.trim(), 10)
    if (!isNaN(seconds) && seconds >= 0) {
        return seconds
    }
    
    // Try to parse as HTTP date
    try {
        const date = new Date(retryAfterHeader.trim())
        if (!isNaN(date.getTime())) {
            const now = new Date()
            const delayMs = date.getTime() - now.getTime()
            const delaySeconds = Math.max(0, Math.ceil(delayMs / 1000))
            return delaySeconds
        }
    } catch (e) {
        console.log(`failed to parse retry-after header as date: ${retryAfterHeader}`)
    }
    
    console.log(`failed to parse retry-after header: ${retryAfterHeader}`)
    return null
}

describe("parseRetryAfter", () => {
    test("parses seconds correctly", () => {
        assert.strictEqual(parseRetryAfter("120"), 120)
        assert.strictEqual(parseRetryAfter("60"), 60)
        assert.strictEqual(parseRetryAfter("0"), 0)
        assert.strictEqual(parseRetryAfter("  30  "), 30) // with whitespace
    })

    test("parses HTTP dates correctly", () => {
        const futureDate = new Date(Date.now() + 5000) // 5 seconds from now
        const retryAfterSeconds = parseRetryAfter(futureDate.toUTCString())
        
        // Should be approximately 5 seconds (allow some tolerance)
        assert(retryAfterSeconds >= 4 && retryAfterSeconds <= 6, 
               `Expected ~5 seconds, got ${retryAfterSeconds}`)
    })

    test("handles invalid input", () => {
        assert.strictEqual(parseRetryAfter(""), null)
        assert.strictEqual(parseRetryAfter("invalid"), null)
        assert.strictEqual(parseRetryAfter("not-a-date"), null)
    })

    test("handles negative seconds", () => {
        assert.strictEqual(parseRetryAfter("-10"), null)
    })

    test("handles past dates", () => {
        const pastDate = new Date(Date.now() - 5000) // 5 seconds ago
        const retryAfterSeconds = parseRetryAfter(pastDate.toUTCString())
        
        // Should return 0 for past dates
        assert.strictEqual(retryAfterSeconds, 0)
    })
})