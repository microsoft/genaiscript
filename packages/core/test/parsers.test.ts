// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach } from "vitest";
import { createParsers } from "../src/parsers.js";
import { XLSXParse } from "../src/xlsx.js";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { TestHost } from "../src/testhost.js";
import { writeFile } from "fs/promises";

describe("parsers", async () => {
  let parsers: Parsers;

  beforeEach(async () => {
    parsers = createParsers();
    TestHost.install();
  });

  test("JSON5", () => {
    const result = parsers.JSON5('{"key": "value"}');
    assert.deepStrictEqual(result, { key: "value" });
  });

  test("JSONL", () => {
    const result = parsers.JSONL('{"key": "value"}\n{"key2": "value2"}');
    assert.deepStrictEqual(result[0], { key: "value" });
    assert.deepStrictEqual(result[1], { key2: "value2" });
  });

  test("YAML", () => {
    const result = parsers.YAML("key: value");
    assert.deepStrictEqual(result, { key: "value" });
  });

  test("XML parser", () => {
    const result = parsers.XML("<key>value</key>");
    assert.deepStrictEqual(result, { key: "value" });
  });

  test("TOML", () => {
    const result = parsers.TOML('key = "value"');
    assert.equal(result.key, "value");
  });

  test("PDF", async () => {
    const result = await parsers.PDF({
      filename: "../sample/src/rag/loremipsum.pdf",
    });
    assert(result.file.content.includes("Lorem"));
  });

  test("prompty", async () => {
    const result = await parsers.prompty({
      filename: "../sample/src/chat.prompty",
    });
    assert(result);
    assert(result.messages.length === 2);
  });

  test("PDF-image", async () => {
    const result = await parsers.PDF(
      { filename: "../sample/src/rag/loremipsum.pdf" },
      { renderAsImage: true },
    );
    let i = 1;
    for (const img of result.images) {
      await writeFile(`./loremipsum.temp.${i++}.png`, img);
    }
    assert(result.file.content.includes("Lorem"));
  });

  test("DOCX - markdown", async () => {
    const result = await parsers.DOCX(
      {
        filename: "../sample/src/rag/Document.docx",
      },
      { format: "markdown" },
    );
    assert(result.file.content.includes("Microsoft"));
  });
  test("DOCX - html", async () => {
    const result = await parsers.DOCX(
      {
        filename: "../sample/src/rag/Document.docx",
      },
      { format: "html" },
    );
    assert(result.file.content.includes("Microsoft"));
  });
  test("DOCX - text", async () => {
    const result = await parsers.DOCX(
      {
        filename: "../sample/src/rag/Document.docx",
      },
      { format: "text" },
    );
    assert(result.file.content.includes("Microsoft"));
  });

  test("CSV", () => {
    const result = parsers.CSV("key,value\n1,2");
    assert.deepStrictEqual(result, [{ key: "1", value: "2" }]);
  });

  test("XLSX", async () => {
    const result = await XLSXParse(await readFile(resolve("./test/parsers.test.xlsx")));
    assert.deepStrictEqual(result, [{ name: "Sheet1", rows: [{ key: 1, value: 2 }] }]);
  });

  test("frontmatter", () => {
    const result = parsers.frontmatter("---\nkey: value\n---\n");
    assert.deepStrictEqual(result, { key: "value" });
  });

  test("zip", async () => {
    const result = await parsers.unzip(
      {
        filename: "./test/parsers.test.zip",
        content: undefined,
      },
      { glob: "*.md" },
    );
    assert(result.find((f) => f.filename === "markdown.md"));
    assert(!result.find((f) => f.filename === "loremipsum.pdf"));
  });

  test("math", async () => {
    const res = await parsers.math("1 + 3");
    assert.strictEqual(res, 4);
  });

  test("validateJSON", () => {
    const res = parsers.validateJSON(
      {
        type: "object",
        properties: {
          key: { type: "string" },
        },
        required: ["key"],
      },
      { key: "value" },
    );
    assert.strictEqual(res.pathValid, true);
  });

  // write test about hash
  test("hash", async () => {
    const result = await parsers.hash(
      { test: "test string", arr: [1, 2, "32"], v: new Uint8Array(123) },
      { length: 20, version: false },
    );
    assert.strictEqual(result, "43ebfdc72c65bbf157ff"); // Example hash value
  });

  test("dedent", () => {
    const indentedText = `
            This is an indented line
                This is more indented
            Back to first level
        `;
    const result = parsers.dedent(indentedText);
    assert.strictEqual(
      result,
      `This is an indented line
    This is more indented
Back to first level`,
    );
  });

  test("unthink", () => {
    const text = "I think the answer is 42. <think>Actually, it should be 43</think>";
    const result = parsers.unthink(text);
    assert.strictEqual(result, "I think the answer is 42. ");
  });

  test("transcription", () => {
    const vttContent = `WEBVTT

1
00:00:00.000 --> 00:00:05.000
Hello world

2
00:00:05.500 --> 00:00:10.000
This is a test`;

    const result = parsers.transcription(vttContent);
    assert.deepStrictEqual(result[0], {
      id: "1",
      start: 0,
      end: 5000,
      text: "Hello world",
    });
    assert.deepStrictEqual(result[1], {
      id: "2",
      start: 5500,
      end: 10000,
      text: "This is a test",
    });
  });
  test("unfence", () => {
    const fencedText = '```json\n{"key": "value"}\n```';
    const result = parsers.unfence(fencedText, "json");
    assert.strictEqual(result, '{"key": "value"}');
  });
});
