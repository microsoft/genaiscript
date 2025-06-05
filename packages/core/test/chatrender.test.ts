// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import {
  renderShellOutput,
  renderMessageContent,
  lastAssistantReasoning,
  renderMessagesToMarkdown,
  collapseChatMessages,
  assistantText,
} from "../src/chatrender.js";
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionUserMessageParam,
} from "../src/chattypes.js";
import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";

describe("renderShellOutput", () => {
  test("should return stdout if exit code is 0", () => {
    const output = { exitCode: 0, stdout: "success", stderr: "" };
    const result = renderShellOutput(output);
    assert.equal(result, "success");
  });
});

describe("renderMessageContent", () => {
  test("should return the string content directly", async () => {
    const msg: ChatCompletionUserMessageParam = {
      role: "user",
      content: "hello world",
    };
    const result = await renderMessageContent(msg, { textLang: "raw" });
    assert.equal(result, "hello world");
  });
});

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
    ];
    const result = lastAssistantReasoning(messages);
    assert.equal(result, "thinking process");
  });

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
    ];
    const result = lastAssistantReasoning(messages);
    assert.equal(result, undefined);
  });
});

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
    ];
    const result = await renderMessagesToMarkdown(messages);
    assert.ok(result.includes("system message"));
    assert.ok(result.includes("user message"));
    assert.ok(result.includes("assistant message"));
    assert.ok(result.includes("reasoning"));
  });
});

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
    ];
    collapseChatMessages(messages);
    assert.equal(messages[0].content, "system message 1\nsystem message 2");
    assert.equal(messages.length, 2);
  });

  test("should remove empty text contents from user messages", () => {
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: "" },
          { type: "text", text: "hello" },
        ],
      } satisfies ChatCompletionUserMessageParam,
    ];
    collapseChatMessages(messages);
    assert.deepEqual(messages[0].content, [{ type: "text", text: "hello" }]);
  });
  describe("assistantText", () => {
    test("should concatenate string contents from consecutive assistant messages", () => {
      const messages = [
        { role: "user", content: "hi" },
        { role: "assistant", content: "first" },
        { role: "assistant", content: "second" },
      ];
      const result = assistantText(messages as any);
      assert.equal(result, "firstsecond");
    });

    test("should concatenate text parts from array content in assistant messages", () => {
      const messages = [
        {
          role: "assistant",
          content: [
            { type: "text", text: "foo" },
            { type: "text", text: "bar" },
          ],
        },
      ];
      const result = assistantText(messages as any);
      assert.strictEqual(result, "foobar");
    });

    test("should prepend refusal text if present in content array", () => {
      const messages = [
        {
          role: "assistant",
          content: [
            { type: "refusal", refusal: "not allowed" },
            { type: "text", text: "text" },
          ],
        },
      ];
      const result = assistantText(messages as any);
      assert.strictEqual(result, "refusal: not allowed\n");
    });

    test("should stop at last non-assistant message", () => {
      const messages = [
        { role: "assistant", content: "ignore" },
        { role: "user", content: "stop" },
        { role: "assistant", content: "keep" },
      ];
      const result = assistantText(messages as any);
      assert.equal(result, "keep");
    });

    test("should unfence markdown by default", () => {
      const messages = [{ role: "assistant", content: "```markdown\nfoo\n```" }];
      const result = assistantText(messages as any);
      assert.equal(result.trim(), "foo");
    });

    test("should unfence yaml if responseType is 'yaml'", () => {
      const messages = [{ role: "assistant", content: "```yaml\nfoo: bar\n```" }];
      const result = assistantText(messages as any, {
        responseType: "yaml",
      });
      assert.equal(result.trim(), "foo: bar");
    });

    test("should unfence json if responseType starts with 'json'", () => {
      const messages = [{ role: "assistant", content: '```json\n{"a":1}\n```' }];
      const result = assistantText(messages as any, {
        responseType: "json",
      });
      assert.equal(result.trim(), '{"a":1}');
    });

    test("should unfence text if responseType is 'text'", () => {
      const messages = [{ role: "assistant", content: "```text\nplain\n```" }];
      const result = assistantText(messages as any, {
        responseType: "text",
      });
      assert.equal(result.trim(), "plain");
    });

    test("should handle empty messages gracefully", () => {
      const result = assistantText([]);
      assert.equal(result, "");
    });
  });
});
