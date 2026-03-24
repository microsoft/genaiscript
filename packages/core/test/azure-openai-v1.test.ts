import { describe, test, expect } from "vitest";
import { isAzureOpenAIV1Base, trimTrailingSlash } from "../src/cleaners.js";

describe("isAzureOpenAIV1Base", () => {
  test("detects /openai/v1 endpoint", () => {
    expect(isAzureOpenAIV1Base("https://myresource.openai.azure.com/openai/v1")).toBe(true);
  });

  test("detects /openai/v1/ with trailing slash", () => {
    expect(isAzureOpenAIV1Base("https://myresource.openai.azure.com/openai/v1/")).toBe(true);
  });

  test("case insensitive", () => {
    expect(isAzureOpenAIV1Base("https://myresource.openai.azure.com/OpenAI/V1")).toBe(true);
  });

  test("returns false for old Azure endpoint", () => {
    expect(isAzureOpenAIV1Base("https://myresource.openai.azure.com")).toBe(false);
  });

  test("returns false for /openai/deployments", () => {
    expect(isAzureOpenAIV1Base("https://myresource.openai.azure.com/openai/deployments")).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(isAzureOpenAIV1Base("")).toBe(false);
  });

  test("returns false for OpenAI endpoint", () => {
    expect(isAzureOpenAIV1Base("https://api.openai.com/v1")).toBe(false);
  });

  test("returns false for /openai/v1 in middle of path", () => {
    expect(isAzureOpenAIV1Base("https://myresource.openai.azure.com/openai/v1/some/path")).toBe(false);
  });
});

describe("Azure OpenAI v1 URL construction", () => {
  test("old Azure endpoint: chat completions URL includes deployment and api-version", () => {
    // For old endpoints, base = .../openai/deployments
    const base = "https://myresource.openai.azure.com/openai/deployments";
    const family = "gpt-4o";
    const version = "2025-04-01-preview";
    const url = trimTrailingSlash(base) + "/" + family + `/chat/completions?api-version=${version}`;
    expect(url).toBe(
      "https://myresource.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-04-01-preview",
    );
  });

  test("new /openai/v1 endpoint: chat completions URL follows OpenAI pattern", () => {
    const base = "https://myresource.openai.azure.com/openai/v1";
    const url = trimTrailingSlash(base) + "/chat/completions";
    expect(url).toBe("https://myresource.openai.azure.com/openai/v1/chat/completions");
  });

  test("new /openai/v1 endpoint: models listing URL follows OpenAI pattern", () => {
    const base = "https://myresource.openai.azure.com/openai/v1";
    const url = trimTrailingSlash(base) + "/models";
    expect(url).toBe("https://myresource.openai.azure.com/openai/v1/models");
  });

  test("new /openai/v1 endpoint: embeddings URL follows OpenAI pattern", () => {
    const base = "https://myresource.openai.azure.com/openai/v1";
    const url = `${base}/embeddings`;
    expect(url).toBe("https://myresource.openai.azure.com/openai/v1/embeddings");
  });

  test("new /openai/v1 endpoint: image generation URL follows OpenAI pattern", () => {
    const base = "https://myresource.openai.azure.com/openai/v1";
    const url = trimTrailingSlash(base) + "/images/generations";
    expect(url).toBe("https://myresource.openai.azure.com/openai/v1/images/generations");
  });
});
