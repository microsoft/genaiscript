import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  lookupMime,
  TYPESCRIPT_MIME_TYPE,
  CSHARP_MIME_TYPE,
  PYTHON_MIME_TYPE,
  ASTRO_MIME_TYPE,
  MARKDOWN_MIME_TYPE,
  FSTAR_MIME_TYPE,
} from "./mime";

describe("mime", () => {
  test("should return empty string for falsy input", () => {
    assert.equal(lookupMime(""), "");
    assert.equal(lookupMime(null as unknown as string), "");
    assert.equal(lookupMime(undefined as unknown as string), "");
  });

  test("should handle TypeScript files", () => {
    assert.equal(lookupMime("file.ts"), TYPESCRIPT_MIME_TYPE);
    assert.equal(lookupMime("path/to/file.ts"), TYPESCRIPT_MIME_TYPE);
    assert.equal(lookupMime("FILE.TS"), TYPESCRIPT_MIME_TYPE);
  });

  test("should handle C# files", () => {
    assert.equal(lookupMime("file.cs"), CSHARP_MIME_TYPE);
    assert.equal(lookupMime("path/to/file.cs"), CSHARP_MIME_TYPE);
    assert.equal(lookupMime("FILE.CS"), CSHARP_MIME_TYPE);
  });

  test("should handle Python files", () => {
    assert.equal(lookupMime("file.py"), PYTHON_MIME_TYPE);
    assert.equal(lookupMime("path/to/file.py"), PYTHON_MIME_TYPE);
    assert.equal(lookupMime("FILE.PY"), PYTHON_MIME_TYPE);
  });

  test("should handle Astro files", () => {
    assert.equal(lookupMime("file.astro"), ASTRO_MIME_TYPE);
    assert.equal(lookupMime("path/to/file.astro"), ASTRO_MIME_TYPE);
    assert.equal(lookupMime("FILE.ASTRO"), ASTRO_MIME_TYPE);
  });

  test("should handle Markdown files", () => {
    assert.equal(lookupMime("file.md"), MARKDOWN_MIME_TYPE);
    assert.equal(lookupMime("path/to/file.md"), MARKDOWN_MIME_TYPE);
    assert.equal(lookupMime("FILE.MD"), MARKDOWN_MIME_TYPE);
    assert.equal(lookupMime("file.prompty"), MARKDOWN_MIME_TYPE);
    assert.equal(lookupMime("FILE.PROMPTY"), MARKDOWN_MIME_TYPE);
  });

  test("should handle F* files", () => {
    assert.equal(lookupMime("file.fst"), FSTAR_MIME_TYPE);
    assert.equal(lookupMime("path/to/file.fsti"), FSTAR_MIME_TYPE);
    assert.equal(lookupMime("FILE.FST"), FSTAR_MIME_TYPE);
    assert.equal(lookupMime("FILE.FSTI"), FSTAR_MIME_TYPE);
  });

  test("should use mime.getType for other file types", () => {
    assert.equal(lookupMime("file.json"), "application/json");
    assert.equal(lookupMime("file.html"), "text/html");
    assert.equal(lookupMime("file.css"), "text/css");
    assert.equal(lookupMime("file.js"), "application/javascript");
  });

  test("should return empty string for unknown file types", () => {
    assert.equal(lookupMime("file.unknown"), "");
  });
});
