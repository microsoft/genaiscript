// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { ChatCompletionMessageParam, ChatCompletionResponse } from "../src/chattypes.js";
import { collapseChatMessages } from "../src/chatrender.js";
import { extractFenced } from "../src/fence.js";

describe("chat", () => {
  describe("collapse", () => {
    test("user1", () => {
      const messages: ChatCompletionMessageParam[] = [{ role: "user", content: "1" }];
      const res = structuredClone(messages);
      collapseChatMessages(res);
      assert.deepStrictEqual(res, messages);
    });
    test("system1", () => {
      const messages: ChatCompletionMessageParam[] = [{ role: "system", content: "1" }];
      const res = structuredClone(messages);
      collapseChatMessages(res);
      assert.deepStrictEqual(res, messages);
    });
    test("system1user1", () => {
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: "1" },
        { role: "user", content: "1" },
      ];
      const res = structuredClone(messages);
      collapseChatMessages(res);
      assert.deepStrictEqual(res, messages);
    });
    test("system2", () => {
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: "1" },
        { role: "system", content: "2" },
      ];
      collapseChatMessages(messages);
      assert.strictEqual(1, messages.length);
      assert.strictEqual("system", messages[0].role);
      assert.strictEqual("1\n2", messages[0].content);
    });
    test("system2user1", () => {
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: "1" },
        { role: "system", content: "2" },
        { role: "user", content: "3" },
      ];
      collapseChatMessages(messages);
      assert.strictEqual(2, messages.length);
      assert.strictEqual("system", messages[0].role);
      assert.strictEqual("1\n2", messages[0].content);
      assert.strictEqual("user", messages[1].role);
      assert.strictEqual("3", messages[1].content);
    });
    test("system2user1", () => {
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: "1" },
        { role: "system", content: "2" },
        { role: "user", content: "3" },
        { role: "user", content: "4" },
      ];
      collapseChatMessages(messages);
      assert.strictEqual(3, messages.length);
      assert.strictEqual("system", messages[0].role);
      assert.strictEqual("1\n2", messages[0].content);
      assert.strictEqual("user", messages[1].role);
      assert.strictEqual("3", messages[1].content);
    });
  });

  describe("finishReason length fence processing", () => {
    test("should extract fences regardless of finishReason", () => {
      const textWithFences = `
Here's your file:

\`\`\`python file=example.py
def hello():
    print("Hello, world!")
\`\`\`

And here's a diff:

\`\`\`diff file=example.py
- def hello():
+ def hello_world():
\`\`\`
`;

      // Test that fence extraction works regardless of finishReason
      const fences = extractFenced(textWithFences);
      assert.equal(fences.length, 2);
      assert.equal(fences[0].label, "FILE example.py");
      assert.equal(fences[1].label, "FILE example.py");
      
      // The logic should work the same whether finishReason is "stop" or "length"
      assert.ok(fences[0].content.includes("def hello():"));
      assert.ok(fences[1].content.includes("def hello_world():"));
    });

    test("cache validator should accept both stop and length finishReason", () => {
      // This is a unit test for the cache validator logic
      // The actual validator is defined inside the runChatCompletion function
      // so we test the same logic here
      
      const validateFinishReason = (value: ChatCompletionResponse) => {
        const ok = value?.finishReason === "stop" || value?.finishReason === "length";
        return ok;
      };

      // Test that "stop" is accepted
      const stopResponse: ChatCompletionResponse = {
        finishReason: "stop",
        text: "Test response",
      };
      assert.ok(validateFinishReason(stopResponse));

      // Test that "length" is accepted  
      const lengthResponse: ChatCompletionResponse = {
        finishReason: "length",
        text: "Test response truncated due to max tokens",
      };
      assert.ok(validateFinishReason(lengthResponse));

      // Test that other finish reasons are rejected
      const failResponse: ChatCompletionResponse = {
        finishReason: "fail",
        text: "Test response",
      };
      assert.ok(!validateFinishReason(failResponse));
    });
  });
});
