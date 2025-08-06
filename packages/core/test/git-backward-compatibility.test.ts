import { describe, test, expect } from "vitest";
import { GitClient } from "../src/git.js";

describe("GitClient backward compatibility", () => {
  test("default GitClient singleton still works", () => {
    const git = GitClient.default();
    expect(git).toBeDefined();
    expect(typeof git.cwd).toBe("string");
    expect(git.workspace).toBeUndefined(); // Default should not have workspace
  });

  test("GitClient constructor with only cwd still works", () => {
    const git = new GitClient("/some/path");
    expect(git.cwd).toBe("/some/path");
    expect(git.workspace).toBeUndefined();
  });

  test("GitClient.client() with only cwd still works", () => {
    const git = GitClient.default();
    const newGit = git.client("/another/path");
    expect(newGit.cwd).toBe("/another/path");
    expect(newGit.workspace).toBeUndefined();
  });

  test("all existing GitClient methods are available", () => {
    const git = new GitClient("/test");
    
    // Check key methods exist
    expect(typeof git.defaultBranch).toBe("function");
    expect(typeof git.branch).toBe("function");
    expect(typeof git.exec).toBe("function");
    expect(typeof git.fetch).toBe("function");
    expect(typeof git.pull).toBe("function");
    expect(typeof git.listBranches).toBe("function");
    expect(typeof git.listFiles).toBe("function");
    expect(typeof git.diff).toBe("function");
    expect(typeof git.log).toBe("function");
    expect(typeof git.client).toBe("function");
    expect(typeof git.toString).toBe("function");
  });
});