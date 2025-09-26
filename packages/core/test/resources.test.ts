// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach, afterEach } from "vitest";
import { tryResolveResource } from "../src/resources.js";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { rm } from "node:fs/promises";
import { TestHost } from "../src/testhost.js";

describe("resources", async () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "resources-test-"));
    TestHost.install();
  });

  afterEach(async () => {
    // Cleanup is left minimal intentionally
    await rm(tempDir, { recursive: true });
  });

  test("should resolve file URLs", async () => {
    // Create a test file
    const testFilePath = join(tempDir, "test-file.txt");
    const testContent = "test content";
    writeFileSync(testFilePath, testContent);

    const fileUrl = pathToFileURL(testFilePath).href;
    const result = await tryResolveResource(fileUrl);

    assert(result);
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].filename, testFilePath);
  });

  test("should resolve https URL to raw content", async () => {
    const url =
      "https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/main/package.json";
    const result = await tryResolveResource(url);

    assert(result);
    assert.equal(result.files.length, 1);
    assert(result.files[0].content);
    assert(result.files[0].content.includes("GenAIScript"));
  });

  test("should adapt GitHub blob URLs to raw URLs", async () => {
    const url = "https://github.com/microsoft/genaiscript/blob/main/package.json";
    const result = await tryResolveResource(url);

    assert(result);
    assert.equal(result.files.length, 1);
    assert(result.files[0].content);
    assert(result.files[0].content.includes("GenAIScript"));
  });

  /*
  test("should resolve gist URLs", async () => {
    // Using a public test gist
    const url = "https://github.com/pelikhan/7f3f28389b7a9712da340f08cd19cff5/";
    const result = await tryResolveResource(url);

    assert(result);
    assert(result.files.length > 0);
    assert(result.files[0].content.includes("GenAIScript"));
  });
  
  test("should resolve gist URLs (gist.github.com)", async () => {
    // Using a public test gist
    const url = "https://gist.github.com/pelikhan/7f3f28389b7a9712da340f08cd19cff5/";
    const result = await tryResolveResource(url);

    assert(result);
    assert(result.files.length > 0);
    assert(result.files[0].content.includes("GenAIScript"));
  });

  test("should resolve gist URLs with files", async () => {
    // Using a public test gist
    const url = "https://github.com/pelikhan/7f3f28389b7a9712da340f08cd19cff5/readme.md";
    const result = await tryResolveResource(url);

    assert(result);
    assert(result.files.length === 1);
    assert(result.files[0].content.includes("GenAIScript"));
  });

  test("should resolve VSCode gistfs URLs", async () => {
    const url =
      "vscode://vsls-contrib.gistfs/open?gist=7f3f28389b7a9712da340f08cd19cff5&file=readme.md";
    const result = await tryResolveResource(url);

    assert(result);
    assert.equal(result.files.length > 0, true);
    // The first file should be the one specified in the URL
    assert(result.files[0].filename.includes("readme.md"));
  });
  */
  
  await test("should reject Windows-style paths that look like URIs (issue #1504)", async () => {
    // This tests the issue fixed in VSCode extension
    // Windows paths like "c:\Users\..." should not be treated as valid resources
    const windowsPath = "c:\\Users\\test\\file.txt";
    
    const result = await tryResolveResource(windowsPath);
    
    // This should return undefined because it's not a valid resource
    // The fix in VSCode extension ensures we pass file:// URIs instead
    assert.equal(result, undefined);
  });

  await test("should handle proper file URIs correctly (issue #1504 fix)", async () => {
    // This tests what the VSCode extension fix ensures is sent
    const testFilePath = join(tempDir, "test-file.txt");
    writeFileSync(testFilePath, "test content");
    
    // Convert to proper file URI (what VSCode should send after our fix)
    const fileUri = pathToFileURL(testFilePath).href;
    
    const result = await tryResolveResource(fileUri);
    
    assert(result);
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].filename, testFilePath);
  });
});
