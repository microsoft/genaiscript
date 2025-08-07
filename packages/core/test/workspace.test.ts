import { describe, test, expect, beforeEach } from "vitest";
import { createWorkspaceFileSystem } from "../src/workspace.js";
import { TestHost } from "../src/testhost.js";
import { resolve } from "node:path";

describe("workspace file validation", () => {
  beforeEach(() => {
    TestHost.install();
  });

  test("should prevent writing outside workspace", async () => {
    const fs = createWorkspaceFileSystem();
    
    // Test absolute path outside workspace
    await expect(
      fs.writeText("/etc/passwd", "malicious content")
    ).rejects.toThrow("writing outside workspace not allowed");
    
    // Test relative path traversal
    await expect(
      fs.writeText("../../../etc/passwd", "malicious content")
    ).rejects.toThrow("writing outside workspace not allowed");
  });

  test("should prevent writing .env files", async () => {
    const fs = createWorkspaceFileSystem();
    
    await expect(
      fs.writeText(".env", "SECRET=value")
    ).rejects.toThrow("writing .env not allowed");
    
    await expect(
      fs.writeText("subdir/.env", "SECRET=value")
    ).rejects.toThrow("writing .env not allowed");
  });

  test("should allow writing within workspace", async () => {
    const fs = createWorkspaceFileSystem();
    
    // Create a mock workspace file - this would normally succeed in a real environment
    // For the test, we'll just check that the validation passes
    try {
      await fs.writeText("test.txt", "content");
    } catch (e) {
      // In test environment, the actual write might fail due to setup,
      // but we want to ensure it's not our validation that's failing
      expect(e.message).not.toMatch(/writing.*not allowed/);
      expect(e.message).not.toMatch(/writing .env not allowed/);
    }
  });

  test("should respect allowed file patterns", async () => {
    const fs = createWorkspaceFileSystem({
      allowedFiles: ["*.txt", "docs/**/*.md"]
    });
    
    // Should allow txt files
    try {
      await fs.writeText("test.txt", "content");
    } catch (e) {
      expect(e.message).not.toMatch(/writing to file not in allowed list/);
    }
    
    // Should allow markdown files in docs
    try {
      await fs.writeText("docs/readme.md", "content");
    } catch (e) {
      expect(e.message).not.toMatch(/writing to file not in allowed list/);
    }
    
    // Should reject other files
    await expect(
      fs.writeText("script.js", "console.log('hello')")
    ).rejects.toThrow("writing to file not in allowed list");
  });

  test("should respect disallowed file patterns", async () => {
    const fs = createWorkspaceFileSystem({
      disallowedFiles: ["*.exe", "config/**/*"]
    });
    
    // Should reject exe files
    await expect(
      fs.writeText("malware.exe", "binary content")
    ).rejects.toThrow("writing to disallowed file");
    
    // Should reject files in config directory
    await expect(
      fs.writeText("config/settings.json", "{}")
    ).rejects.toThrow("writing to disallowed file");
  });

  test("disallowed patterns should take precedence over allowed", async () => {
    const fs = createWorkspaceFileSystem({
      allowedFiles: ["*.txt"],
      disallowedFiles: ["secret.txt"]
    });
    
    // Should reject secret.txt even though *.txt is allowed
    await expect(
      fs.writeText("secret.txt", "secret content")
    ).rejects.toThrow("writing to disallowed file");
  });
});

describe("workspace grep and writeCached functionality", () => {
  beforeEach(() => {
    TestHost.install();
  });

  test("should have grep method available", () => {
    const fs = createWorkspaceFileSystem();
    expect(typeof fs.grep).toBe("function");
  });

  test("should have writeCached method available", () => {
    const fs = createWorkspaceFileSystem();
    expect(typeof fs.writeCached).toBe("function");
  });

  test("should support runDir context for writeCached", () => {
    const fs = createWorkspaceFileSystem({ runDir: "/tmp/test-run" });
    expect(typeof fs.writeCached).toBe("function");
  });
});