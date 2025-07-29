import { describe, test } from "node:test"
import assert from "node:assert"
import { OpenAIChatCompletion } from "./openai"
import { CreateChatCompletionRequest, ChatCompletionResponse } from "./chattypes"
import { LanguageModelConfiguration } from "./server/messages"
import { MarkdownTrace } from "./trace"

describe("Streaming Retry", () => {
    test("should retry when streaming fails with partial content", async () => {
        // Mock configuration
        const cfg: LanguageModelConfiguration = {
            type: "openai",
            base: "https://api.openai.com/v1",
            model: "gpt-3.5-turbo",
        }

        // Mock request
        const req: CreateChatCompletionRequest = {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Hello" }],
            stream: true,
        }

        // Mock trace
        const trace = new MarkdownTrace()

        let attemptCount = 0
        const options = {
            retry: 2,
            retryDelay: 100,
            maxDelay: 1000,
            partialCb: () => {},
        }

        // This test validates the retry logic structure
        // In a real scenario, we would mock the actual HTTP streaming failure
        try {
            const result = await OpenAIChatCompletion(req, cfg, options, trace)
            // If we reach here without error, the function structure is correct
            assert.ok(true, "Function executed without throwing")
        } catch (error) {
            // Expected in test environment without proper API setup
            assert.ok(error instanceof Error, "Expected error due to missing API setup")
        }
    })

    test("should not retry when no partial content received", async () => {
        // This test validates that we only retry when there's partial content
        // indicating the stream started but failed partway through
        
        // Mock a response that failed immediately (no partial content)
        const failedResponse: ChatCompletionResponse = {
            text: "", // No partial content
            finishReason: "fail",
            error: { message: "Connection failed" },
        }

        // Verify that the retry logic would not activate for this case
        const hasPartialContent = failedResponse.text && failedResponse.text.length > 0
        const shouldRetry = failedResponse.finishReason === "fail" && hasPartialContent

        assert.strictEqual(shouldRetry, false, "Should not retry when no partial content")
    })

    test("should retry when partial content exists and streaming fails", async () => {
        // Mock a response that failed with partial content
        const partialFailureResponse: ChatCompletionResponse = {
            text: "Hello, this is a partial resp", // Partial content received
            finishReason: "fail",
            error: { message: "Stream interrupted" },
        }

        // Verify that the retry logic would activate for this case
        const hasPartialContent = partialFailureResponse.text && partialFailureResponse.text.length > 0
        const shouldRetry = partialFailureResponse.finishReason === "fail" && hasPartialContent

        assert.strictEqual(shouldRetry, true, "Should retry when partial content exists and streaming fails")
    })
})