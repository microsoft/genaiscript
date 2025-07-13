// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { CreateImageRequest } from "../src/chat.js";
import { ImageGenerationOptions } from "../src/types.js";

describe("generateImage", () => {
  describe("CreateImageRequest", () => {
    test("basic request", () => {
      const req: CreateImageRequest = {
        model: "openai:gpt-image-1",
        prompt: "A cute robot cat",
        size: "1024x1024",
        quality: "high",
        style: "natural",
        outputFormat: "png",
      };

      assert.strictEqual(req.model, "openai:gpt-image-1");
      assert.strictEqual(req.prompt, "A cute robot cat");
      assert.strictEqual(req.size, "1024x1024");
      assert.strictEqual(req.quality, "high");
      assert.strictEqual(req.style, "natural");
      assert.strictEqual(req.outputFormat, "png");
    });

    test("request with edit operation", () => {
      const imageBytes = new Uint8Array([1, 2, 3, 4]);
      const req: CreateImageRequest = {
        model: "openai:gpt-image-1",
        prompt: "Transform this image into a banner",
        operation: "edit",
        images: [imageBytes],
        size: "1792x1024",
        quality: "high",
        outputFormat: "png",
      };

      assert.strictEqual(req.operation, "edit");
      assert.strictEqual(req.images?.length, 1);
      assert.deepStrictEqual(req.images?.[0], imageBytes);
    });

    test("request with variations operation", () => {
      const imageBytes = new Uint8Array([1, 2, 3, 4]);
      const req: CreateImageRequest = {
        model: "openai:gpt-image-1",
        prompt: "Create variations of this image",
        operation: "variations",
        images: [imageBytes],
        size: "1024x1024",
        quality: "high",
        outputFormat: "png",
      };

      assert.strictEqual(req.operation, "variations");
      assert.strictEqual(req.images?.length, 1);
      assert.deepStrictEqual(req.images?.[0], imageBytes);
    });

    test("request with multiple images", () => {
      const imageBytes1 = new Uint8Array([1, 2, 3, 4]);
      const imageBytes2 = new Uint8Array([5, 6, 7, 8]);
      const req: CreateImageRequest = {
        model: "openai:gpt-image-1",
        prompt: "Combine these images",
        operation: "edit",
        images: [imageBytes1, imageBytes2],
        size: "1024x1024",
        quality: "high",
        outputFormat: "png",
      };

      assert.strictEqual(req.operation, "edit");
      assert.strictEqual(req.images?.length, 2);
      assert.deepStrictEqual(req.images?.[0], imageBytes1);
      assert.deepStrictEqual(req.images?.[1], imageBytes2);
    });
  });

  describe("ImageGenerationOptions", () => {
    test("basic options", () => {
      const options: ImageGenerationOptions = {
        model: "openai:gpt-image-1",
        size: "1024x1024",
        quality: "high",
        style: "natural",
        outputFormat: "png",
      };

      assert.strictEqual(options.model, "openai:gpt-image-1");
      assert.strictEqual(options.size, "1024x1024");
      assert.strictEqual(options.quality, "high");
      assert.strictEqual(options.style, "natural");
      assert.strictEqual(options.outputFormat, "png");
    });

    test("options with operation", () => {
      const options: ImageGenerationOptions = {
        model: "openai:gpt-image-1",
        operation: "edit",
        size: "1792x1024",
        quality: "high",
        outputFormat: "png",
      };

      assert.strictEqual(options.operation, "edit");
      assert.strictEqual(options.size, "1792x1024");
    });

    test("options with variations operation", () => {
      const options: ImageGenerationOptions = {
        model: "openai:gpt-image-1",
        operation: "variations",
        size: "1024x1024",
        quality: "high",
        outputFormat: "png",
      };

      assert.strictEqual(options.operation, "variations");
    });

    test("backward compatibility - no operation specified", () => {
      const options: ImageGenerationOptions = {
        model: "openai:dall-e-3",
        size: "1024x1024",
        quality: "high",
        style: "vivid",
        outputFormat: "png",
      };

      // Should work without operation field
      assert.strictEqual(options.model, "openai:dall-e-3");
      assert.strictEqual(options.size, "1024x1024");
      assert.strictEqual(options.quality, "high");
      assert.strictEqual(options.style, "vivid");
      assert.strictEqual(options.outputFormat, "png");
      assert.isUndefined(options.operation); // Should be undefined for backward compatibility
    });
  });
});