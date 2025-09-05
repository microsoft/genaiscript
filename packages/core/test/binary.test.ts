// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { isBinaryMimeType } from "../src/binary.js";

describe("isBinaryMimeType", () => {
  test("should identify common binary types", () => {
    assert(isBinaryMimeType("image/jpeg"));
    assert(isBinaryMimeType("image/png"));
    assert(isBinaryMimeType("audio/mp3"));
    assert(isBinaryMimeType("video/mp4"));
  });

  test("should identify document binary types", () => {
    assert(isBinaryMimeType("application/pdf"));
    assert(isBinaryMimeType("application/msword"));
    assert(
      isBinaryMimeType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    );
  });

  test("should identify archive binary types", () => {
    assert(isBinaryMimeType("application/zip"));
    assert(isBinaryMimeType("application/x-rar-compressed"));
    assert(isBinaryMimeType("application/x-7z-compressed"));
  });

  test("should identify executable binary types", () => {
    assert(isBinaryMimeType("application/octet-stream"));
    assert(isBinaryMimeType("application/x-msdownload"));
    assert(isBinaryMimeType("application/java-archive"));
  });

  test("should return false for non-binary types", () => {
    assert.equal(isBinaryMimeType("text/plain"), false);
    assert.equal(isBinaryMimeType("text/html"), false);
    assert.equal(isBinaryMimeType("application/json"), false);
    assert.equal(isBinaryMimeType("text/css"), false);
  });
});
