import assert from "node:assert/strict"
import test, { describe } from "node:test"
import {
    renderShellOutput,
    renderMessageContent,
    lastAssistantReasoning,
    renderMessagesToMarkdown,
    collapseChatMessages,
} from "./chatrender"
import {
    ChatCompletionAssistantMessageParam,
    ChatCompletionUserMessageParam,
} from "./chattypes"
import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs"

describe("renderShellOutput", () => {
    test("should return stdout if exit code is 0", () => {
        const output = { exitCode: 0, stdout: "success", stderr: "" }
        const result = renderShellOutput(output)
        assert.equal(result, "success")
    })
})

describe("renderMessageContent", () => {
    test("should return the string content directly", async () => {
        const msg: ChatCompletionUserMessageParam = {
            role: "user",
            content: "hello world",
        }
        const result = await renderMessageContent(msg)
        assert.equal(result, "hello world")
    })
})

describe("lastAssistantReasoning", () => {
    test("should return reasoning content of the last assistant message", () => {
        const messages = [
            {
                role: "user",
                content: "hi",
            } satisfies ChatCompletionUserMessageParam,
            {
                role: "assistant",
                reasoning_content: "thinking process",
            } satisfies ChatCompletionAssistantMessageParam,
        ]
        const result = lastAssistantReasoning(messages)
        assert.equal(result, "thinking process")
    })

    test("should return undefined if no assistant reasoning content exists", () => {
        const messages = [
            {
                role: "user",
                content: "hi",
            } satisfies ChatCompletionUserMessageParam,
            {
                role: "assistant",
                content: "hello",
            } satisfies ChatCompletionAssistantMessageParam,
        ]
        const result = lastAssistantReasoning(messages)
        assert.equal(result, undefined)
    })
})

describe("renderMessagesToMarkdown", () => {
    test("should format messages to markdown", async () => {
        const messages = [
            {
                role: "system",
                content: "system message",
            } satisfies ChatCompletionSystemMessageParam,
            {
                role: "user",
                content: "user message",
            } satisfies ChatCompletionUserMessageParam,
            {
                role: "assistant",
                content: "assistant message",
                reasoning_content: "reasoning",
            } satisfies ChatCompletionAssistantMessageParam,
        ]
        const result = await renderMessagesToMarkdown(messages)
        assert.ok(result.includes("system message"))
        assert.ok(result.includes("user message"))
        assert.ok(result.includes("assistant message"))
        assert.ok(result.includes("reasoning"))
    })
})

describe("collapseChatMessages", () => {
    test("should collapse system messages", () => {
        const messages = [
            {
                role: "system",
                content: "system message 1",
            } satisfies ChatCompletionSystemMessageParam,
            {
                role: "system",
                content: "system message 2",
            } satisfies ChatCompletionSystemMessageParam,
            {
                role: "user",
                content: "user message",
            } satisfies ChatCompletionUserMessageParam,
        ]
        collapseChatMessages(messages)
        assert.equal(messages[0].content, "system message 1\nsystem message 2")
        assert.equal(messages.length, 2)
    })

    test("should remove empty text contents from user messages", () => {
        const messages = [
            {
                role: "user",
                content: [
                    { type: "text", text: "" },
                    { type: "text", text: "hello" },
                ],
            } satisfies ChatCompletionUserMessageParam,
        ]
        collapseChatMessages(messages)
        assert.deepEqual(messages[0].content, [{ type: "text", text: "hello" }])
    })
})
