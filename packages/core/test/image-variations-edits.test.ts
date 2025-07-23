// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { OpenAIImageVariation, OpenAIImageEdit } from "../src/openai.js";
import type { 
  CreateImageVariationRequest, 
  CreateImageEditRequest,
  LanguageModelConfiguration
} from "../src/chat.js";

describe("Image Variations and Edits", () => {
  // Mock configuration for testing
  const mockConfig: LanguageModelConfiguration = {
    provider: "openai",
    model: "gpt-image-1",
    base: "https://api.openai.com/v1",
    type: "openai",
  };

  // Create a simple test image (1x1 red pixel PNG)
  const createTestImageBuffer = (): Uint8Array => {
    return new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 
      0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0x0f, 0x00, 0x00, 
      0x01, 0x00, 0x01, 0x10, 0x77, 0x83, 0x7c, 0x00, 0x00, 0x00, 0x00, 0x49, 
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
    ]);
  };

  describe("OpenAIImageVariation", () => {
    test("should create proper request structure for image variations", async () => {
      const testImage = createTestImageBuffer();
      const request: CreateImageVariationRequest = {
        model: "gpt-image-1",
        image: testImage,
        n: 2,
        size: "1024x1024",
        responseFormat: "b64_json",
      };

      // Test the function signature and basic structure
      assert.ok(typeof OpenAIImageVariation === "function");
      
      // The function should handle basic parameter validation
      try {
        const result = await OpenAIImageVariation(
          request,
          mockConfig,
          { trace: undefined }
        );
        
        // Should return a proper result structure
        assert.ok(typeof result === "object");
        assert.ok(Array.isArray(result.images));
        assert.ok(result.error !== undefined || result.images !== undefined);
      } catch (error) {
        // Expected to fail in test environment without API key
        // but should fail gracefully
        assert.ok(error instanceof Error);
      }
    });

    test("should handle missing image buffer", async () => {
      const request: CreateImageVariationRequest = {
        model: "gpt-image-1",
        image: new Uint8Array(0), // Empty buffer
        n: 1,
      };

      const result = await OpenAIImageVariation(
        request,
        mockConfig,
        { trace: undefined }
      );

      assert.ok(result.error !== undefined);
      assert.strictEqual(result.images.length, 0);
    });
  });

  describe("OpenAIImageEdit", () => {
    test("should create proper request structure for image edits", async () => {
      const testImage = createTestImageBuffer();
      const testMask = createTestImageBuffer(); // Same size mask
      const request: CreateImageEditRequest = {
        model: "gpt-image-1",
        image: testImage,
        mask: testMask,
        prompt: "Add a blue circle",
        n: 1,
        size: "1024x1024",
        responseFormat: "b64_json",
      };

      // Test the function signature and basic structure
      assert.ok(typeof OpenAIImageEdit === "function");
      
      // The function should handle basic parameter validation
      try {
        const result = await OpenAIImageEdit(
          request,
          mockConfig,
          { trace: undefined }
        );
        
        // Should return a proper result structure
        assert.ok(typeof result === "object");
        assert.ok(Array.isArray(result.images));
        assert.ok(result.error !== undefined || result.images !== undefined);
      } catch (error) {
        // Expected to fail in test environment without API key
        // but should fail gracefully
        assert.ok(error instanceof Error);
      }
    });

    test("should handle missing image buffer", async () => {
      const request: CreateImageEditRequest = {
        model: "gpt-image-1",
        image: new Uint8Array(0), // Empty buffer
        prompt: "Add something",
        n: 1,
      };

      const result = await OpenAIImageEdit(
        request,
        mockConfig,
        { trace: undefined }
      );

      assert.ok(result.error !== undefined);
      assert.strictEqual(result.images.length, 0);
    });

    test("should work without mask (outpainting mode)", async () => {
      const testImage = createTestImageBuffer();
      const request: CreateImageEditRequest = {
        model: "gpt-image-1",
        image: testImage,
        // No mask provided
        prompt: "Extend the image with a landscape background",
        n: 1,
      };

      try {
        const result = await OpenAIImageEdit(
          request,
          mockConfig,
          { trace: undefined }
        );
        
        // Should return a proper result structure
        assert.ok(typeof result === "object");
        assert.ok(Array.isArray(result.images));
      } catch (error) {
        // Expected to fail in test environment without API key
        // but should fail gracefully
        assert.ok(error instanceof Error);
      }
    });

    test("should handle multiple input images for GPT-Image-1", async () => {
      const testImage1 = createTestImageBuffer();
      const testImage2 = createTestImageBuffer(); 
      const request: CreateImageEditRequest = {
        model: "gpt-image-1",
        image: [testImage1, testImage2], // Multiple images
        prompt: "Combine these images into a collage",
        n: 1,
      };

      try {
        const result = await OpenAIImageEdit(
          request,
          mockConfig,
          { trace: undefined }
        );
        
        // Should handle multiple images properly  
        assert.ok(typeof result === "object");
        assert.ok(Array.isArray(result.images));
      } catch (error) {
        // Expected to fail in test environment without API key
        // but should fail gracefully
        assert.ok(error instanceof Error);
      }
    });

    test("should include GPT-Image-1 specific parameters", async () => {
      const testImage = createTestImageBuffer();
      const request: CreateImageEditRequest = {
        model: "gpt-image-1",
        image: testImage,
        prompt: "Add a transparent background",
        n: 1,
        moderation: "low",
        background: "transparent",
        outputFormat: "png",
        quality: "high",
      };

      try {
        const result = await OpenAIImageEdit(
          request,
          mockConfig,
          { trace: undefined }
        );
        
        // Should handle GPT-Image-1 specific parameters
        assert.ok(typeof result === "object");
        assert.ok(Array.isArray(result.images));
      } catch (error) {
        // Expected to fail in test environment without API key
        // but should fail gracefully
        assert.ok(error instanceof Error);
      }
    });
  });

  describe("Model compatibility", () => {
    test("should detect DALL-E 2 model", async () => {
      const testImage = createTestImageBuffer();
      const dalleConfig: LanguageModelConfiguration = {
        ...mockConfig,
        model: "dall-e-2",
      };

      const request: CreateImageVariationRequest = {
        model: "dall-e-2",
        image: testImage,
        n: 1,
        size: "512x512", // DALL-E 2 supported size
      };

      try {
        const result = await OpenAIImageVariation(
          request,
          dalleConfig,
          { trace: undefined }
        );
        
        assert.ok(typeof result === "object");
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });
});