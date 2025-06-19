import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { DOCXTryParse } from "./docx";
import { TestHost } from "./testhost";

describe("DOCXTryParse", () => {
  beforeEach(() => {
    TestHost.install();
  });

  test("parse DOCX to markdown", async () => {
    const file = "../sample/src/rag/Document.docx";
    const result = await DOCXTryParse(file, { format: "markdown" });
    assert(result.file.content.includes("Microsoft"));
  });

  test("parse DOCX to HTML", async () => {
    const file = "../sample/src/rag/Document.docx";
    const result = await DOCXTryParse(file, { format: "html" });
    assert(result.file.content.includes("Microsoft"));
  });

  test("cache hit", async () => {
    const file = "../sample/src/rag/Document.docx";
    const result = await DOCXTryParse(file, { format: "text" });
    const result2 = await DOCXTryParse(file, { format: "text" });
    assert(result2.file.content === result.file.content);
  });
});
