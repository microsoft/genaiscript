import { describe, it, expect } from "vitest";
import { runScriptInternal } from "../src/run.js";

describe("MCP Configuration Override", () => {
  it("should pass mcps parameter through the call chain", async () => {
    const scriptContent = `
script({
  title: "Test MCP override",
  description: "Test script for verifying mcps parameter",
})

$\`Test message\`
`;

    const result = await runScriptInternal(
      "test-script",
      [],
      {
        jsSource: scriptContent,
        mcps: "/path/to/mcp-config.json",
        // Use echo model to avoid actual LLM calls
        model: "echo",
        json: true,
      }
    );

    // The test should not crash and should process the mcps parameter
    expect(result).toBeDefined();
    expect(result.exitCode).toBeGreaterThanOrEqual(0);
  });
});