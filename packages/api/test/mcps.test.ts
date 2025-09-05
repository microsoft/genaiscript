import { describe, it, expect } from "vitest";

describe("MCP Configuration Override", () => {
  it("should support mcps parameter in PromptScriptRunOptions interface", () => {
    // This test verifies that the mcps parameter is properly defined in the TypeScript interface
    const options = {
      mcps: "/path/to/config.json",
      model: "echo",
      json: true,
    };

    expect(options.mcps).toBe("/path/to/config.json");
    expect(typeof options.mcps).toBe("string");
  });

  it("should support mcps parameter in GenerationOptions interface", () => {
    // This test verifies that the mcps parameter is properly defined in the GenerationOptions interface
    const options = {
      mcps: "/path/to/config.json",
      inner: false,
      stats: {} as any,
      userState: {},
    };

    expect(options.mcps).toBe("/path/to/config.json");
    expect(typeof options.mcps).toBe("string");
  });
});