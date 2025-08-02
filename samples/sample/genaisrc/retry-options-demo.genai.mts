script({
    title: "Retry Options Demo",
    description: "Demonstrates the use of retry options in script configuration and runPrompt",
    model: "small",
    // Script-level retry configuration
    retries: 3,
    retryDelay: 1000,       // 1 second initial delay
    maxDelay: 5000,         // Maximum 5 seconds between retries
    maxRetryAfter: 10000,   // Maximum 10 seconds total retry-after delay
    retryOn: [429, 500, 502, 503, 504], // Retry on rate limits and server errors
    files: [],
})

// Demonstrate script-level retry configuration
$`This script is configured with retry options:
- retries: 3 (will retry up to 3 times on failure)
- retryDelay: 1000ms (initial delay between retries)
- maxDelay: 5000ms (maximum delay between retries with exponential backoff)
- maxRetryAfter: 10000ms (maximum total time to respect retry-after headers)
- retryOn: [429, 500, 502, 503, 504] (HTTP status codes that trigger retries)

Generate a short explanation of how retry mechanisms help with API reliability.`

// Demonstrate runPrompt with custom retry options
const { text } = await runPrompt(
    (_) => {
        _.$`Explain the benefits of exponential backoff in distributed systems. Be concise.`
    },
    {
        model: "small",
        // Override retry options for this specific runPrompt call
        retries: 2,
        retryDelay: 500,        // Faster initial retry for this call
        maxDelay: 3000,         // Lower maximum delay
        retryOn: [429, 503],    // Only retry on rate limits and service unavailable
    }
)

def("EXPONENTIAL_BACKOFF", text)

$`Based on the EXPONENTIAL_BACKOFF explanation, provide practical recommendations for using retry options in GenAIScript.`