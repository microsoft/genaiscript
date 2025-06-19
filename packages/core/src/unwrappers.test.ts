import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  unfence,
  unquote,
  filenameOrFileToContent,
  filenameOrFileToFilename,
  trimNewlines,
} from "./unwrappers";

describe("unwrappers", () => {
  test("unfence removes code fences for specified language", () => {
    const input = "```typescript\nconst x = 1;\n```";
    assert.equal(unfence(input, "typescript"), "const x = 1;");
  });

  test("unfence handles empty input", () => {
    assert.equal(unfence("", "typescript"), "");
  });

  test("unquote removes quotes from string", () => {
    assert.equal(unquote('"hello"'), "hello");
    assert.equal(unquote("'world'"), "world");
    assert.equal(unquote("`test`"), "test");
    assert.equal(unquote("unquoted"), "unquoted");
  });

  test("filenameOrFileToContent extracts content", () => {
    const file = { filename: "test.ts", content: "content" };
    assert.equal(filenameOrFileToContent("string"), "string");
    assert.equal(filenameOrFileToContent(file), "content");
  });

  test("filenameOrFileToFilename extracts filename", () => {
    const file = { filename: "test.ts", content: "content" };
    assert.equal(filenameOrFileToFilename("string"), "string");
    assert.equal(filenameOrFileToFilename(file), "test.ts");
  });

  test("trimNewlines removes leading/trailing newlines", () => {
    assert.equal(trimNewlines("\n\ntext\n\n"), "text");
    assert.equal(trimNewlines("text"), "text");
  });
  test("unfence handles markdown code blocks", () => {
    const input = "```markdown\n# Header\n* List item\n```";
    assert.equal(unfence(input, "markdown"), "# Header\n* List item");

    const multiLine = "```markdown\n# Title\n\nParagraph\n* Item 1\n* Item 2\n```";
    assert.equal(unfence(multiLine, "markdown"), "# Title\n\nParagraph\n* Item 1\n* Item 2");
  });
  test("unfence handles markdown with inner code blocks", () => {
    const input = "```markdown\n# Title\n\n```js\nconst x = 1;\n```\n\nMore text\n```";
    assert.equal(unfence(input, "markdown"), "# Title\n\n```js\nconst x = 1;\n```\n\nMore text");
  });

  test("unfence handles markdown with inner code blocks 2", () => {
    const nested = "```markdown\nText\n```python\nprint('hello')\n```\nEnd\n```";
    assert.equal(unfence(nested, "markdown"), "Text\n```python\nprint('hello')\n```\nEnd");
  });
});
