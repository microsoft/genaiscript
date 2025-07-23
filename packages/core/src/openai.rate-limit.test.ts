import { strict as assert } from "node:assert"
import { describe, it as test } from "node:test"
import { RequestError, serializeError } from "./error"

describe("Rate Limit Error Handling", () => {
    test("should preserve rate_limited in RequestError message for 429 status", () => {
        // Test the transformation logic we use in OpenAI handler
        function processRateLimitMessage(message: string, status: number): string {
            if (status === 429) {
                if (!message.toLowerCase().includes("rate_limited")) {
                    // First try to replace existing rate limit variations
                    const rateLimitPattern = /(rate[\s\-_]*limit[ed]*)/gi
                    if (rateLimitPattern.test(message)) {
                        return message.replace(rateLimitPattern, "rate_limited")
                    } else {
                        // If no rate limit text found, prepend rate_limited
                        return `rate_limited: ${message}`
                    }
                }
            }
            return message
        }

        const testCases = [
            { input: "Too Many Requests", expected: "rate_limited: Too Many Requests" },
            { input: "Rate limit exceeded", expected: "rate_limited exceeded" },
            { input: "You are rate-limited", expected: "You are rate_limited" },
            { input: "rate_limited: Already formatted", expected: "rate_limited: Already formatted" },
            { input: "RATE LIMIT HIT", expected: "rate_limited HIT" },
        ]

        testCases.forEach(({ input, expected }) => {
            const result = processRateLimitMessage(input, 429)
            assert.strictEqual(result, expected, `Failed for input: "${input}"`)
            assert.ok(result.includes("rate_limited"), `Result should contain "rate_limited": "${result}"`)
        })
    })

    test("should handle RequestError serialization with rate limiting", () => {
        const rateLimitError = new RequestError(
            429,
            "rate_limited: Too Many Requests",
            { error: { message: "Rate limit exceeded" } },
            '{"error": {"message": "Rate limit exceeded"}}',
            60
        )

        const serialized = serializeError(rateLimitError)
        
        // Verify the error message contains "rate_limited"
        assert.ok(serialized.message.includes("rate_limited"), 
            `Error message should contain "rate_limited", got: ${serialized.message}`)
        
        // Verify status is preserved in the RequestError
        assert.strictEqual(rateLimitError.status, 429)
        assert.strictEqual(rateLimitError.retryAfter, 60)
    })

    test("should detect rate limiting patterns", () => {
        const rateLimitPatterns = [
            "rate_limited",
            "rate limited",
            "rate-limited", 
            "ratelimited",
            "RATE_LIMITED",
            "Rate Limit",
            "rate limit exceeded"
        ]

        const rateLimitRegex = /(rate[\s\-_]*limit[ed]*)/gi

        rateLimitPatterns.forEach(pattern => {
            assert.ok(rateLimitRegex.test(pattern), 
                `Should detect rate limiting in: "${pattern}"`)
        })
    })
})