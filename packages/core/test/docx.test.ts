// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach } from "vitest";
import { DOCXTryParse } from "../src/docx.js";
import { TestHost } from "../src/testhost.js";

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
