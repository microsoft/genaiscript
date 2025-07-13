// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { ChatCompletionMessageParam } from "../src/chattypes.js";
import { collapseChatMessages } from "../src/chatrender.js";

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
});
