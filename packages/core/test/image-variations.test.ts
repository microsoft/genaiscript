// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it, expect } from "vitest";
import { ImageGenerationOptions, BufferLike } from "../src/types.js";

describe("image variations", () => {
  it("should accept single image input in ImageGenerationOptions", () => {
    // Test string image input (base64)
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

    // Test Buffer input
    const buffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
    const optionsWithBuffer: ImageGenerationOptions = {
      image: buffer,
      model: "dall-e-2",
      size: "256x256",
    };

    expect(optionsWithBuffer.image).toBeDefined();
    expect(Buffer.isBuffer(optionsWithBuffer.image)).toBe(true);

    // Test Uint8Array input
    const uint8Array = new Uint8Array(buffer);
    const optionsWithUint8Array: ImageGenerationOptions = {
      image: uint8Array,
      model: "dall-e-2", 
      size: "256x256",
    };

    expect(optionsWithUint8Array.image).toBeDefined();
    expect(optionsWithUint8Array.image instanceof Uint8Array).toBe(true);
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

    // Test multiple BufferLike types (mixed)
    const buffer1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
    const uint8Array2 = new Uint8Array(buffer1);

    const optionsWithBuffers: ImageGenerationOptions = {
      images: [buffer1, uint8Array2],
      model: "dall-e-2",
      size: "256x256",
    };

    expect(optionsWithBuffers.images).toBeDefined();
    expect(Array.isArray(optionsWithBuffers.images)).toBe(true);
    expect(optionsWithBuffers.images?.length).toBe(2);
    expect(Buffer.isBuffer(optionsWithBuffers.images?.[0])).toBe(true);
    expect(optionsWithBuffers.images?.[1] instanceof Uint8Array).toBe(true);
  });

  it("should accept mixed BufferLike types", () => {
    const buffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
    
    const optionsWithMixed: ImageGenerationOptions = {
      images: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        {
          filename: "test.png",
          content: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          encoding: "base64",
        },
        buffer,
        new Uint8Array(buffer)
      ],
      model: "dall-e-2",
      size: "512x512",
    };

    expect(optionsWithMixed.images).toBeDefined();
    expect(Array.isArray(optionsWithMixed.images)).toBe(true);
    expect(optionsWithMixed.images?.length).toBe(4);
    expect(typeof optionsWithMixed.images?.[0]).toBe("string");
    expect(typeof optionsWithMixed.images?.[1]).toBe("object");
    expect(Buffer.isBuffer(optionsWithMixed.images?.[2])).toBe(true);
    expect(optionsWithMixed.images?.[3] instanceof Uint8Array).toBe(true);
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
    const buffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
    
    const optionsWithBoth: ImageGenerationOptions = {
      image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      images: [
        buffer,
        {
          filename: "test2.png", 
          content: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          encoding: "base64",
        }
      ],
      model: "dall-e-2",
      size: "256x256",
    };

    // Both should be defined but images array should take precedence in actual usage
    expect(optionsWithBoth.image).toBeDefined();
    expect(optionsWithBoth.images).toBeDefined();
    expect(Array.isArray(optionsWithBoth.images)).toBe(true);
    expect(typeof optionsWithBoth.image).toBe("string");
    expect(Buffer.isBuffer(optionsWithBoth.images?.[0])).toBe(true);
  });

  it("should support all BufferLike types individually", () => {
    const testData = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    const buffer = Buffer.from(testData, "base64");
    const uint8Array = new Uint8Array(buffer);
    const arrayBuffer = buffer.buffer;
    
    // Test Buffer
    const bufferOptions: ImageGenerationOptions = {
      image: buffer,
      model: "dall-e-2",
    };
    expect(Buffer.isBuffer(bufferOptions.image)).toBe(true);
    
    // Test Uint8Array 
    const uint8ArrayOptions: ImageGenerationOptions = {
      image: uint8Array,
      model: "dall-e-2",
    };
    expect(uint8ArrayOptions.image instanceof Uint8Array).toBe(true);
    
    // Test ArrayBuffer
    const arrayBufferOptions: ImageGenerationOptions = {
      image: arrayBuffer,
      model: "dall-e-2", 
    };
    expect(arrayBufferOptions.image instanceof ArrayBuffer).toBe(true);
    
    // Test string (data URI)
    const stringOptions: ImageGenerationOptions = {
      image: `data:image/png;base64,${testData}`,
      model: "dall-e-2",
    };
    expect(typeof stringOptions.image).toBe("string");
    
    // Test WorkspaceFile
    const workspaceFileOptions: ImageGenerationOptions = {
      image: {
        filename: "test.png",
        content: testData,
        encoding: "base64",
      },
      model: "dall-e-2",
    };
    expect(typeof workspaceFileOptions.image).toBe("object");
    expect((workspaceFileOptions.image as any).filename).toBe("test.png");
  });
});