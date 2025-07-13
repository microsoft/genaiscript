// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach } from "vitest";
import { dirname, join } from "node:path";
import { stat, readdir, rm } from "fs/promises";
import { existsSync } from "fs";
import {
  fileCacheImage,
  fileWriteCached,
  fileWriteCachedJSON,
  patchCachedImages,
} from "../src/filecache.js";
import { TestHost } from "../src/testhost.js";
import { readFile } from "node:fs/promises";

describe("fileWriteCached", () => {
  const tempDir = join(dirname(__filename), "temp");

  beforeEach(async () => {
    TestHost.install();
    if (existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("should write buffer to cache and return correct filename", async () => {
    const buffer: BufferLike = Buffer.from("test content");
    const filePath = await fileWriteCached(tempDir, buffer);

    const files = await readdir(tempDir);
    assert.equal(files.length, 1);
    const writtenFile = join(tempDir, files[0]);

    const stats = await stat(writtenFile);
    assert(stats.isFile());

    assert.equal(filePath, writtenFile);
  });
  test("should write JSON to cache and return correct filename", async () => {
    const testData = { test: "content" };
    const filePath = await fileWriteCachedJSON(tempDir, testData);

    const files = await readdir(tempDir);
    assert.equal(files.length, 1);
    const writtenFile = join(tempDir, files[0]);

    const stats = await stat(writtenFile);
    assert(stats.isFile());
    assert.equal(filePath, writtenFile);

    const content = JSON.parse(await readFile(writtenFile, "utf-8"));
    assert.deepEqual(content, testData);
  });

  test("fileCacheImage should return empty string for falsy input", async () => {
    assert.equal(await fileCacheImage(""), "");
    assert.equal(await fileCacheImage(null), "");
    assert.equal(await fileCacheImage(undefined), "");
  });

  test("fileCacheImage should return URL unchanged when input is HTTPS URL", async () => {
    const url = "https://example.com/image.jpg";
    assert.equal(await fileCacheImage(url), url);
  });

  test("fileCacheImage should cache local image and return relative path", async () => {
    const imageBuffer = Buffer.from("fake image data");
    const result = await fileCacheImage(imageBuffer, { dir: tempDir });

    assert(result.startsWith("./"));
    const files = await readdir(tempDir);
    assert.equal(files.length, 1);
  });

  test("patchCachedImages should replace image paths", () => {
    const input = "![alt](.genaiscript/images/test.jpg)";
    const output = patchCachedImages(input, (url) => "newpath/" + url);
    assert.equal(output, "![alt](newpath/.genaiscript/images/test.jpg)");
  });
});
