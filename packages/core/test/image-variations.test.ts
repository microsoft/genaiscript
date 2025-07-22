// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it, expect } from "vitest";
import { ImageGenerationOptions } from "../src/types.js";

describe("image variations", () => {
  it("should accept image input in ImageGenerationOptions", () => {
    // Test string image input
    const optionsWithString: ImageGenerationOptions = {
      image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      model: "dall-e-2",
      size: "256x256",
    };

    expect(optionsWithString.image).toBeDefined();
    expect(typeof optionsWithString.image).toBe("string");

    // Test WorkspaceFile image input
    const optionsWithFile: ImageGenerationOptions = {
      image: {
        filename: "test.png",
        content: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        encoding: "base64",
      },
      model: "dall-e-2",
      size: "256x256",
    };

    expect(optionsWithFile.image).toBeDefined();
    expect(typeof optionsWithFile.image).toBe("object");
    expect((optionsWithFile.image as any).filename).toBe("test.png");
  });

  it("should work without image input for traditional generation", () => {
    const options: ImageGenerationOptions = {
      model: "dall-e-3",
      quality: "high",
      size: "1024x1024",
      style: "vivid",
    };

    expect(options.image).toBeUndefined();
    expect(options.model).toBe("dall-e-3");
  });
});