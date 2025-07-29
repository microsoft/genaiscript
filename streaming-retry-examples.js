// Example of how the streaming retry would work in practice

const examples = [
    {
        scenario: "Connection Failure - No Retry",
        initialResponse: {
            text: "",
            finishReason: "fail",
            error: { message: "Connection refused" }
        },
        expectRetry: false,
        description: "No partial content means connection failed before streaming started"
    },
    {
        scenario: "Streaming Interruption - Retry",
        initialResponse: {
            text: "The quick brown fox jumps over the la",
            finishReason: "fail", 
            error: { message: "Stream interrupted" }
        },
        expectRetry: true,
        description: "Partial content exists, indicating stream started but failed"
    },
    {
        scenario: "Complete Success - No Retry", 
        initialResponse: {
            text: "The quick brown fox jumps over the lazy dog.",
            finishReason: "stop"
        },
        expectRetry: false,
        description: "Successful completion requires no retry"
    },
    {
        scenario: "Token Limit Reached - No Retry",
        initialResponse: {
            text: "This is a very long response that has reached the maximum token limit and cannot continue further...",
            finishReason: "length"
        },
        expectRetry: false,
        description: "Length limit is expected behavior, not a failure"
    },
    {
        scenario: "Tool Call Completion - No Retry",
        initialResponse: {
            text: "I need to call a function to help you with that.",
            finishReason: "tool_calls"
        },
        expectRetry: false,
        description: "Tool calls are successful completions, not failures"
    }
]

// Simulate the retry decision logic
function shouldRetryStreaming(response, attempt, maxRetries) {
    const hasPartialContent = !!(response.text && response.text.length > 0)
    return response.finishReason === "fail" && hasPartialContent && attempt < maxRetries
}

// Validate our logic against expected behavior
console.log("Streaming Retry Logic Validation:\n")

examples.forEach((example, index) => {
    const shouldRetry = shouldRetryStreaming(example.initialResponse, 0, 6)
    const result = shouldRetry === example.expectRetry ? "✅ PASS" : "❌ FAIL"
    
    console.log(`${index + 1}. ${example.scenario}`)
    console.log(`   Text: "${example.initialResponse.text}"`)
    console.log(`   Finish: ${example.initialResponse.finishReason}`)
    console.log(`   Expected Retry: ${example.expectRetry}`)
    console.log(`   Actual Retry: ${shouldRetry}`)
    console.log(`   ${result} - ${example.description}`)
    console.log()
})

console.log("Key Benefits of This Approach:")
console.log("• Only retries when streaming actually started (partial content exists)")
console.log("• Doesn't retry connection failures (no benefit)")
console.log("• Doesn't retry successful completions")
console.log("• Uses exponential backoff to avoid overwhelming servers")
console.log("• Respects existing retry configuration")
console.log("• Maintains all existing behavior for non-failure cases")