// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach } from "vitest";
import { TestHost } from "../src/testhost.js";
import { fetchText } from "../src/fetchtext.js";

describe("fetch", () => {
  beforeEach(async () => {
    TestHost.install();
  });

  test("fetchText llms.txt", async () => {
    const res = await fetchText("https://microsoft.github.io/genaiscript/llms.txt");
    assert(res.ok);
    assert(res.text.includes("GenAIScript"));
  });
});
