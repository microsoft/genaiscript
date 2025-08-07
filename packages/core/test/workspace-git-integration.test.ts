import { describe, test, expect } from "vitest";
import { createWorkspace, createWorkspaceFileSystem } from "../src/workspace.js";
import { GitClient } from "../src/git.js";

describe("workspace and git integration", () => {
  test("createWorkspaceFileSystem should still work", () => {
    const fs = createWorkspaceFileSystem();
    expect(fs).toBeDefined();
    expect(typeof fs.findFiles).toBe("function");
    expect(typeof fs.readText).toBe("function");
  });

  test("GitClient should create workspace on demand", () => {
    const git = new GitClient(process.cwd());
    
    expect(git.cwd).toBe(process.cwd());
    // Workspace should be created lazily
    const workspace = git.workspace;
    expect(workspace).toBeDefined();
    expect(typeof workspace.findFiles).toBe("function");
  });

  test("GitClient workspace should be lazily allocated", () => {
    const git = new GitClient(process.cwd());
    
    // Workspace should be allocated on first access
    const workspace1 = git.workspace;
    expect(workspace1).toBeDefined();
    expect(typeof workspace1.readText).toBe("function");
    
    // Subsequent access should return the same instance
    const workspace2 = git.workspace;
    expect(workspace1).toBe(workspace2);
  });

  test("createWorkspace should return filesystem and git with same root", () => {
    const { filesystem, git } = createWorkspace({ cwd: process.cwd() });
    
    expect(filesystem).toBeDefined();
    expect(git).toBeDefined();
    expect(filesystem.root()).toBe(process.cwd());
    expect(git.cwd).toBe(process.cwd());
    expect(git.workspace.root()).toBe(process.cwd());
  });

  test("createWorkspace should work with default options", () => {
    const { filesystem, git } = createWorkspace();
    
    expect(filesystem).toBeDefined();
    expect(git).toBeDefined();
    expect(typeof filesystem.root()).toBe("string");
    expect(typeof git.cwd).toBe("string");
    expect(typeof git.workspace.root()).toBe("string");
  });
});