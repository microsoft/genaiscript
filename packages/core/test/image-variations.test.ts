// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it, expect } from "vitest";
import { ImageGenerationOptions } from "../src/types.js";

describe("image variations", () => {
  it("should accept single image input in ImageGenerationOptions", () => {
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

  it("should accept multiple images input in ImageGenerationOptions", () => {
    // Test multiple string images
    const optionsWithStrings: ImageGenerationOptions = {
      images: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
      ],
      model: "dall-e-2",
      size: "256x256",
    };

    expect(optionsWithStrings.images).toBeDefined();
    expect(Array.isArray(optionsWithStrings.images)).toBe(true);
    expect(optionsWithStrings.images?.length).toBe(2);

    // Test multiple WorkspaceFile images
    const optionsWithFiles: ImageGenerationOptions = {
      images: [
        {
          filename: "test1.png",
          content: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          encoding: "base64",
        },
        {
          filename: "test2.png", 
          content: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          encoding: "base64",
        }
      ],
      model: "dall-e-2",
      size: "256x256",
    };

    expect(optionsWithFiles.images).toBeDefined();
    expect(Array.isArray(optionsWithFiles.images)).toBe(true);
    expect(optionsWithFiles.images?.length).toBe(2);
  });

  it("should accept mixed string and WorkspaceFile images", () => {
    const optionsWithMixed: ImageGenerationOptions = {
      images: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        {
          filename: "test.png",
          content: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          encoding: "base64",
        }
      ],
      model: "dall-e-2",
      size: "512x512",
    };

    expect(optionsWithMixed.images).toBeDefined();
    expect(Array.isArray(optionsWithMixed.images)).toBe(true);
    expect(optionsWithMixed.images?.length).toBe(2);
    expect(typeof optionsWithMixed.images?.[0]).toBe("string");
    expect(typeof optionsWithMixed.images?.[1]).toBe("object");
  });

  it("should work without image input for traditional generation", () => {
    const options: ImageGenerationOptions = {
      model: "dall-e-3",
      quality: "high",
      size: "1024x1024",
      style: "vivid",
    };

    expect(options.image).toBeUndefined();
    expect(options.images).toBeUndefined();
    expect(options.model).toBe("dall-e-3");
  });

  it("should handle both single image and images array for backward compatibility", () => {
    const optionsWithBoth: ImageGenerationOptions = {
      image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      images: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
      ],
      model: "dall-e-2",
      size: "256x256",
    };

    // Both should be defined but images array should take precedence in actual usage
    expect(optionsWithBoth.image).toBeDefined();
    expect(optionsWithBoth.images).toBeDefined();
    expect(Array.isArray(optionsWithBoth.images)).toBe(true);
  });
});