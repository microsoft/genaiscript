import { describe, test, expect } from "vitest";
import { 
  createImportChatModeInstructions, 
  type PromptImportChatModeInstructions 
} from "../src/promptdom.js";

describe("importChatModeInstructions", () => {
  test("createImportChatModeInstructions creates correct node", () => {
    const node = createImportChatModeInstructions();
    expect(node.type).toBe("importChatModeInstructions");
    expect(node.patterns).toBeUndefined();
    expect(node.options).toBeUndefined();
  });

  test("createImportChatModeInstructions with patterns", () => {
    const patterns = [".github/copilot-instructions.md"];
    const node = createImportChatModeInstructions(patterns);
    expect(node.type).toBe("importChatModeInstructions");
    expect(node.patterns).toEqual(patterns);
  });

  test("createImportChatModeInstructions with multiple patterns", () => {
    const patterns = [".github/copilot-instructions.md", ".vscode/copilot-instructions.txt"];
    const options = { maxTokens: 1000 };
    const node = createImportChatModeInstructions(patterns, options);
    expect(node.type).toBe("importChatModeInstructions");
    expect(node.patterns).toEqual(patterns);
    expect(node.options).toEqual(options);
  });

  test("node structure follows expected interface", () => {
    const node = createImportChatModeInstructions();
    
    // Ensure it satisfies the PromptImportChatModeInstructions interface
    const typedNode: PromptImportChatModeInstructions = node;
    expect(typedNode.type).toBe("importChatModeInstructions");
    
    // Should be a valid PromptNode with the expected properties
    expect(node).toHaveProperty("type");
    expect(node).toHaveProperty("patterns");
    expect(node).toHaveProperty("options");
  });
});