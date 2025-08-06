import { describe, test, expect, vi } from "vitest";
import { 
  importChatModeInstructions,
  DEFAULT_CHAT_MODE_INSTRUCTION_PATTERNS,
  type ImportChatModeInstructionsResult
} from "../src/importchatmodeinstructions.js";

// Mock the core dependencies
vi.mock("@genaiscript/core", () => ({
  arrayify: vi.fn((input) => Array.isArray(input) ? input : [input]),
  expandFileOrWorkspaceFiles: vi.fn(),
  resolveFileContent: vi.fn(),
  approximateTokens: vi.fn((content) => Math.ceil(content.length / 4)),
}));

describe("importChatModeInstructions", () => {
  test("exports default patterns", () => {
    expect(DEFAULT_CHAT_MODE_INSTRUCTION_PATTERNS).toEqual([
      ".github/copilot-instructions.md",
      ".github/copilot-instructions.txt",
      ".vscode/copilot-instructions.md", 
      ".vscode/copilot-instructions.txt",
      "copilot-instructions.md",
      "copilot-instructions.txt",
    ]);
  });

  test("function exists and is callable", () => {
    expect(typeof importChatModeInstructions).toBe("function");
  });

  test("has correct function signature", async () => {
    // Mock the core functions for this test
    const { expandFileOrWorkspaceFiles, resolveFileContent } = await import("@genaiscript/core");
    
    vi.mocked(expandFileOrWorkspaceFiles).mockResolvedValue([]);
    
    const result = await importChatModeInstructions();
    
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("files");
    expect(result).toHaveProperty("tokens");
    expect(typeof result.content).toBe("string");
    expect(Array.isArray(result.files)).toBe(true);
    expect(typeof result.tokens).toBe("number");
  });

  test("uses default patterns when none provided", async () => {
    const { expandFileOrWorkspaceFiles, arrayify } = await import("@genaiscript/core");
    
    vi.mocked(expandFileOrWorkspaceFiles).mockResolvedValue([]);
    vi.mocked(arrayify).mockImplementation((input) => Array.isArray(input) ? input : [input]);
    
    await importChatModeInstructions();
    
    expect(expandFileOrWorkspaceFiles).toHaveBeenCalledWith(DEFAULT_CHAT_MODE_INSTRUCTION_PATTERNS);
  });

  test("uses custom patterns when provided", async () => {
    const { expandFileOrWorkspaceFiles, arrayify } = await import("@genaiscript/core");
    
    const customPatterns = [".github/my-guidelines.md"];
    vi.mocked(expandFileOrWorkspaceFiles).mockResolvedValue([]);
    vi.mocked(arrayify).mockReturnValue(customPatterns);
    
    await importChatModeInstructions(customPatterns);
    
    expect(arrayify).toHaveBeenCalledWith(customPatterns);
    expect(expandFileOrWorkspaceFiles).toHaveBeenCalledWith(customPatterns);
  });

  test("processes files and returns content", async () => {
    const { expandFileOrWorkspaceFiles, resolveFileContent, approximateTokens } = await import("@genaiscript/core");
    
    const mockFiles = [
      { name: "file1.md", content: "Content 1" },
      { name: "file2.md", content: "Content 2" }
    ];
    
    vi.mocked(expandFileOrWorkspaceFiles).mockResolvedValue(mockFiles);
    vi.mocked(resolveFileContent).mockImplementation((file) => {
      // Simulate content resolution
      return Promise.resolve();
    });
    vi.mocked(approximateTokens).mockReturnValue(100);
    
    const result = await importChatModeInstructions();
    
    expect(result.content).toBe("Content 1\nContent 2");
    expect(result.files).toEqual(mockFiles);
    expect(result.tokens).toBe(100);
    expect(resolveFileContent).toHaveBeenCalledTimes(2);
  });

  test("passes options to resolveFileContent", async () => {
    const { expandFileOrWorkspaceFiles, resolveFileContent } = await import("@genaiscript/core");
    
    const mockFiles = [{ name: "file1.md", content: "Content" }];
    const options = { maxTokens: 1000 };
    
    vi.mocked(expandFileOrWorkspaceFiles).mockResolvedValue(mockFiles);
    vi.mocked(resolveFileContent).mockResolvedValue(undefined);
    
    await importChatModeInstructions(undefined, options);
    
    expect(resolveFileContent).toHaveBeenCalledWith(mockFiles[0], options);
  });
});