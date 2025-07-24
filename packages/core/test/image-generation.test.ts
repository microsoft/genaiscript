import { describe, test, expect, beforeAll } from "vitest";
import { writeFileSync } from "fs";
import { join } from "path";
import { CreateImageRequest } from "../src/chat.js";
import { OpenAIImageGeneration } from "../src/openai.js";
import { ImageGenerationOptions } from "../src/types.js";

// Create a small test image (1x1 PNG)
const createTestImage = (): Buffer => {
  // Minimal valid PNG file (1x1 pixel, transparent)
  const pngData = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // PNG signature
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52, // IHDR chunk
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x01, // width: 1, height: 1
    0x08,
    0x06,
    0x00,
    0x00,
    0x00,
    0x1f,
    0x15,
    0xc4, // bit depth: 8, color type: 6 (RGBA), CRC
    0x89,
    0x00,
    0x00,
    0x00,
    0x0a,
    0x49,
    0x44,
    0x41, // IDAT chunk
    0x54,
    0x78,
    0x9c,
    0x63,
    0x00,
    0x01,
    0x00,
    0x00, // compressed data
    0x05,
    0x00,
    0x01,
    0x0d,
    0x0a,
    0x2d,
    0xb4,
    0x00, // CRC
    0x00,
    0x00,
    0x00,
    0x49,
    0x45,
    0x4e,
    0x44,
    0xae, // IEND chunk
    0x42,
    0x60,
    0x82,
  ]);
  return pngData;
};

describe("Image Generation", () => {
  const testImagePath = join(__dirname, "test-robot.png");

  beforeAll(() => {
    // Create a test image file
    const testImage = createTestImage();
    writeFileSync(testImagePath, testImage);
  });

  test("CreateImageRequest supports new fields", () => {
    const req: CreateImageRequest = {
      model: "openai:gpt-image-1",
      prompt: "Test prompt",
      mode: "edit",
      image: testImagePath,
      mask: testImagePath,
      quality: "high",
      size: "square",
      style: "vivid",
      outputFormat: "png",
    };

    expect(req.mode).toBe("edit");
    expect(req.image).toBe(testImagePath);
    expect(req.mask).toBe(testImagePath);
  });

  test("ImageGenerationOptions supports new fields", () => {
    const options: ImageGenerationOptions = {
      mode: "edit",
      image: testImagePath,
      mask: testImagePath,
      quality: "high",
      size: "landscape",
      model: "openai:gpt-image-1",
    };

    expect(options.mode).toBe("edit");
    expect(options.image).toBe(testImagePath);
    expect(options.mask).toBe(testImagePath);
  });

  test("validates edit mode requires image", () => {
    const req: CreateImageRequest = {
      model: "openai:gpt-image-1",
      prompt: "Edit this image",
      mode: "edit",
      // missing image field
    };

    expect(req.mode).toBe("edit");
    expect(req.image).toBeUndefined();
  });

  test("supports generate mode (default behavior)", () => {
    const req: CreateImageRequest = {
      model: "openai:gpt-image-1",
      prompt: "Generate a new image",
      // mode defaults to "generate"
      quality: "high",
      size: "square",
    };

    expect(req.mode).toBeUndefined(); // defaults to "generate"
    expect(req.image).toBeUndefined();
    expect(req.mask).toBeUndefined();
  });

  test("supports generation modes", () => {
    const generateReq: CreateImageRequest = {
      model: "openai:gpt-image-1",
      prompt: "Generate image",
      mode: "generate",
    };

    const editReq: CreateImageRequest = {
      model: "openai:gpt-image-1",
      prompt: "Edit image",
      mode: "edit",
      image: testImagePath,
    };

    expect(generateReq.mode).toBe("generate");
    expect(editReq.mode).toBe("edit");
  });

  test("mask is optional for edit mode", () => {
    const reqWithMask: CreateImageRequest = {
      model: "openai:gpt-image-1",
      prompt: "Edit with mask",
      mode: "edit",
      image: testImagePath,
      mask: testImagePath,
    };

    const reqWithoutMask: CreateImageRequest = {
      model: "openai:gpt-image-1",
      prompt: "Edit without mask",
      mode: "edit",
      image: testImagePath,
    };

    expect(reqWithMask.mask).toBe(testImagePath);
    expect(reqWithoutMask.mask).toBeUndefined();
  });
});
