script({
    system: [],
    title: "Rate Limit Error Handling Demo",
    description: "Demonstrates how to detect and handle rate limiting errors in GenAIScript"
})

// Helper function to check if an error is a rate limiting error
function isRateLimitError(error) {
    if (!error) return false
    
    // Check if error message contains the standardized "rate_limited" indicator
    const message = error.message || ""
    const isRateLimit = message.includes("rate_limited")
    
    return isRateLimit
}

// Helper function to extract retry delay from error
function getRetryDelay(error) {
    // For RequestError objects, retryAfter might be available
    // This would only be accessible if we had the original error object
    // In serialized form, we'd need to parse from message or use default
    
    // Default retry delays in seconds
    const defaultDelays = [60, 120, 300, 600] // 1min, 2min, 5min, 10min
    return defaultDelays[Math.min(3, Math.floor(Math.random() * 4))]
}

// Function to simulate retry logic (for demonstration)
async function withRateLimitRetry(promptFn, options = {}, maxRetries = 3) {
    const { retryDelay = 60 } = options
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            console.log(`Attempt ${attempt}...`)
            
            const result = await runPrompt(promptFn, {
                model: "openai:gpt-4o-mini",
                temperature: 0,
                system: [],
                ...options
            })
            
            // Check for rate limiting
            if (result.error && isRateLimitError(result.error)) {
                console.log(`❌ Rate limited on attempt ${attempt}`)
                console.log(`   Error: ${result.error.message}`)
                console.log(`   Finish reason: ${result.finishReason}`)
                
                if (attempt <= maxRetries) {
                    const delay = getRetryDelay(result.error)
                    console.log(`   ⏱️  Waiting ${delay} seconds before retry...`)
                    
                    // In a real scenario, you'd wait:
                    // await new Promise(resolve => setTimeout(resolve, delay * 1000))
                    console.log(`   (Skipping actual wait in demo)`)
                    continue
                } else {
                    console.log(`   🚫 Max retries exceeded`)
                    return result
                }
            } else if (result.error) {
                console.log(`❌ Non-rate-limit error: ${result.error.message}`)
                return result
            } else {
                console.log(`✅ Success on attempt ${attempt}`)
                console.log(`   Response: ${result.text}`)
                return result
            }
            
        } catch (error) {
            console.log(`❌ Unexpected error on attempt ${attempt}:`, error.message)
            if (attempt > maxRetries) throw error
        }
    }
}

// Demo: Try a simple prompt that's unlikely to hit rate limits
console.log("=== Rate Limit Error Handling Demo ===\n")

const result = await withRateLimitRetry(
    (ctx) => {
        ctx.$`Say "Hello from GenAIScript!" in exactly 3 words.`
    },
    {
        model: "openai:gpt-4o-mini",
        temperature: 0
    },
    2 // Max 2 retries
)

console.log("\n=== Final Result ===")
console.log("Text:", result.text || "none")
console.log("Error:", result.error?.message || "none") 
console.log("Finish reason:", result.finishReason)

if (result.error) {
    console.log("\n=== Error Analysis ===")
    console.log("Is rate limit error:", isRateLimitError(result.error))
    console.log("Error name:", result.error.name)
    console.log("Full error object keys:", Object.keys(result.error))
}

console.log("\n=== Integration Notes ===")
console.log("✓ Rate limiting errors now contain 'rate_limited' in the message")
console.log("✓ Works across OpenAI, Azure OpenAI, Ollama, LM Studio, and Anthropic")
console.log("✓ Backward compatible with existing error handling")
console.log("✓ Users can implement robust retry logic")

console.log("\n=== Example Code Pattern ===")
console.log(`
// Recommended pattern for handling rate limits:
const result = await runPrompt(/* ... */)

if (result.error) {
    if (result.error.message.includes("rate_limited")) {
        console.log("Rate limited - implement retry logic")
        // await delay(60000) // Wait 1 minute
        // retry...
    } else {
        console.log("Other error:", result.error.message)
        // Handle other errors
    }
} else {
    console.log("Success:", result.text)
}
`)