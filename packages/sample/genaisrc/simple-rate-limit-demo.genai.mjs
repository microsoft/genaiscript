script({
    system: [],
    title: "Simple Rate Limit Detection",
    description: "Simple example showing how to detect rate limiting errors"
})

console.log("Testing rate limit error detection...")

// Make a simple API call
const result = await runPrompt(
    (ctx) => ctx.$`Say "Hello!" in one word.`,
    { 
        model: "openai:gpt-4o-mini",
        temperature: 0
    }
)

// Show the result
console.log("Result:")
console.log("- Text:", result.text || "(none)")
console.log("- Error:", result.error?.message || "(none)")
console.log("- Finish reason:", result.finishReason)

// Demonstrate rate limit detection
if (result.error) {
    const isRateLimit = result.error.message.includes("rate_limited")
    console.log("\nError Analysis:")
    console.log("- Is rate limit error:", isRateLimit)
    console.log("- Error type:", result.error.name)
    
    if (isRateLimit) {
        console.log("🔴 RATE LIMITED - Would implement retry logic here")
    } else {
        console.log("🟡 OTHER ERROR - Would handle differently")
    }
} else {
    console.log("\n✅ SUCCESS - No error occurred")
}

// Show the pattern users should use
console.log("\n" + "=".repeat(50))
console.log("RECOMMENDED PATTERN:")
console.log("=".repeat(50))
console.log(`
// In your GenAIScript:
const result = await runPrompt(/* your prompt */)

if (result.error) {
    if (result.error.message.includes("rate_limited")) {
        // Rate limited - wait and retry
        console.log("Rate limited, waiting before retry...")
        // await new Promise(r => setTimeout(r, 60000)) // Wait 1 minute
        // Then retry the request
    } else {
        // Other error - handle appropriately  
        console.log("Other error:", result.error.message)
    }
} else {
    // Success - use the result
    console.log("Success:", result.text)
}
`)

console.log("✓ Rate limiting errors now reliably contain 'rate_limited'")
console.log("✓ Works with OpenAI, Azure OpenAI, Anthropic, Ollama, etc.")
console.log("✓ Enable robust error handling and retry logic")