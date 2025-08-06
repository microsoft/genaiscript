import { describe, test, expect } from "vitest";

describe("exports verification", () => {
  test("can import new workspace functions from core", async () => {
    const { createWorkspace, createWorkspaceFileSystem, WorkspaceContext } = await import("../src/workspace.js");
    
    expect(createWorkspace).toBeDefined();
    expect(typeof createWorkspace).toBe("function");
    
    expect(createWorkspaceFileSystem).toBeDefined();
    expect(typeof createWorkspaceFileSystem).toBe("function");
    
    // Test they work together
    const { filesystem, git } = createWorkspace();
    expect(filesystem).toBeDefined();
    expect(git).toBeDefined();
    expect(git.workspace).toBe(filesystem);
  });

  test("can import from index", async () => {
    const { createWorkspace, createWorkspaceFileSystem, GitClient } = await import("../src/index.js");
    
    expect(createWorkspace).toBeDefined();
    expect(createWorkspaceFileSystem).toBeDefined();
    expect(GitClient).toBeDefined();
    
    // Test integration
    const { filesystem, git } = createWorkspace();
    expect(git).toBeInstanceOf(GitClient);
    expect(git.workspace).toBe(filesystem);
  });
});