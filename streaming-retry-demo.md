# Streaming LLM Retry Demonstration

This document demonstrates how the streaming retry logic works.

## Problem Statement

When an LLM starts streaming responses but fails partway through, the system should automatically retry the request.

## Solution Implemented

### Key Detection Logic

The retry system activates when:
1. `finishReason === "fail"` (streaming failed)
2. `result.text && result.text.length > 0` (partial content was received)
3. `attempt < retry` (within retry limit)
4. `!cancellationToken?.isCancellationRequested` (not cancelled)

### Example Scenarios

#### Scenario 1: Connection Failure (No Retry)
```typescript
// Network fails immediately, no streaming started
const response = {
    text: "",              // No partial content
    finishReason: "fail",  // Failed
    error: { message: "Connection refused" }
}

// hasPartialContent = false
// shouldRetry = false (no partial content)
// Result: No retry, return error immediately
```

#### Scenario 2: Streaming Failure (Retry Triggered)
```typescript
// Network fails after receiving partial response
const response = {
    text: "Hello, this is a partial resp", // Partial content received
    finishReason: "fail",                  // Failed during streaming
    error: { message: "Stream interrupted" }
}

// hasPartialContent = true
// shouldRetry = true (has partial content and failed)
// Result: Retry with exponential backoff
```

#### Scenario 3: Successful Completion (No Retry)
```typescript
const response = {
    text: "Hello, this is a complete response.",
    finishReason: "stop",  // Completed successfully
    usage: { /* usage stats */ }
}

// shouldRetry = false (not a failure)
// Result: Return successful response
```

## Retry Behavior

### Exponential Backoff
- Uses same formula as existing fetch retries
- `delay = min(maxDelay, GROWTH_FACTOR^attempt * retryDelay) * (1 + jitter)`
- Default: 6 retries, 2s initial delay, 120s max delay, 1.5x growth factor

### Logging
- Traces retry attempts: `streaming retry: attempt 2/6 in 3s`
- Maintains existing trace structure

## Configuration

Uses existing `RetryOptions`:
```typescript
{
    retry: 6,           // Number of retry attempts
    retryDelay: 2000,   // Initial delay (ms)
    maxDelay: 120000    // Maximum delay (ms)
}
```

## Implementation Details

### OpenAI Provider
- Wrapped in `executeWithStreamingRetry` function
- Preserves all existing behavior for successful streams
- Only adds retry logic for partial failures

### Anthropic Provider  
- Same pattern as OpenAI
- Maintains Anthropic-specific features (caching, etc.)

## Backward Compatibility

- No changes to public APIs
- Existing retry configuration works unchanged
- No impact on successful streaming requests
- Only activates for the specific case of partial streaming failures

## Testing Strategy

Basic unit tests validate:
1. No retry when no partial content (connection failures)
2. Retry when partial content exists and streaming fails
3. Respect retry limits and cancellation tokens
4. Proper exponential backoff calculation

## Benefits

1. **Improved Reliability**: Automatic recovery from network interruptions
2. **User Experience**: Reduces need for manual retries
3. **Minimal Overhead**: Only retries when beneficial (partial content exists)
4. **Configurable**: Uses existing retry configuration
5. **Observable**: Retry attempts logged in traces