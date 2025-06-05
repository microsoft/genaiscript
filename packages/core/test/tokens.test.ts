// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { approximateTokens } from "../src/tokens.js";
import { describe, it, assert } from "vitest";

describe("approximateTokens", () => {
  it("should return 0 for empty text", () => {
    assert.strictEqual(approximateTokens(""), 0);
  });

  it("should normalize whitespace", () => {
    const text = "hello   world";
    const normalizedText = "hello world";
    assert.strictEqual(approximateTokens(text), approximateTokens(normalizedText));
  });

  it("should consider punctuation in estimation", () => {
    const textWithoutPunctuation = "hello world";
    const textWithPunctuation = "hello, world!";
    assert(approximateTokens(textWithPunctuation) > approximateTokens(textWithoutPunctuation));
  });
});
