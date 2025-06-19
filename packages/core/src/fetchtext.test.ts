import assert from "node:assert/strict";
import test, { beforeEach, describe } from "node:test";
import { TestHost } from "./testhost";
import { fetchText } from "./fetchtext";

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
