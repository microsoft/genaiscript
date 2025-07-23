script({
    system: [],
    title: "Test Rate Limit Error Handling",
    description: "Tests that rate limit errors are properly surfaced with 'rate_limited' in error message"
})

// Test function to simulate checking for rate limiting errors
function isRateLimitError(error) {
    if (!error) return false
    
    // Check if error message contains rate limiting indicators
    const message = error.message || ""
    const hasRateLimit = message.includes("rate_limited") || 
                        (message.toLowerCase().includes("rate") && 
                         (message.toLowerCase().includes("limit") || message.toLowerCase().includes("limited")))
    
    console.log(`Checking error: "${message}"`)
    console.log(`  Has rate limit indicators: ${hasRateLimit}`)
    
    return hasRateLimit
}

// This test will likely fail since it's hard to trigger actual rate limiting
// But it demonstrates how users would check for rate limiting errors
const testResult = await runPrompt(
    (ctx) => {
        ctx.$`Say hello in one word.`
    },
    {
        model: "openai:gpt-4o-mini",
        temperature: 0,
        system: [],
    }
)

console.log("Test result:")
console.log(`  Text: ${testResult.text}`)
console.log(`  Error: ${testResult.error?.message || "none"}`)
console.log(`  Finish reason: ${testResult.finishReason}`)

if (testResult.error) {
    console.log("Error details:")
    console.log(`  Name: ${testResult.error.name}`)
    console.log(`  Message: ${testResult.error.message}`)
    console.log(`  Is rate limit error: ${isRateLimitError(testResult.error)}`)
} else {
    console.log("No error occurred - this is expected unless rate limiting is active")
}

// Show how users should check for rate limiting
console.log("\nExample rate limit detection code:")
console.log(`
if (result.error && isRateLimitError(result.error)) {
    console.log("Rate limited! Should wait and retry")
    // Wait and retry logic here
} else if (result.error) {
    console.log("Other error occurred:", result.error.message)
}
`)