import { describe, test, expect, beforeEach } from "vitest";
import { TestHost } from "../src/testhost.js";
import { resolveGlobal } from "../src/global.js";
import { installGlobals, resetGlobalsInstallation } from "../src/globals.js";

describe("globals workspace mounting", () => {
  beforeEach(() => {
    // Clear globals before each test to ensure clean state
    const glb = resolveGlobal();
    delete glb.workspace;
    // Reset globals installation flag
    resetGlobalsInstallation();
  });

  test("should mount workspace from runtime host during installGlobals", () => {
    // Install test host which sets up runtime host
    TestHost.install();
    
    // Check that workspace is available in global context
    const glb = resolveGlobal();
    expect(glb.workspace).toBeDefined();
    expect(typeof glb.workspace.readText).toBe("function");
    expect(typeof glb.workspace.writeText).toBe("function");
    expect(typeof glb.workspace.findFiles).toBe("function");
  });

  test("should handle missing runtime host gracefully", () => {
    // Install globals without runtime host
    installGlobals();
    
    // Should not throw error, workspace may be undefined
    // This is expected behavior - workspace might not be available
    // if runtime host is not initialized yet
  });

  test("workspace should be accessible after TestHost.install", () => {
    TestHost.install();
    
    const glb = resolveGlobal();
    expect(glb.workspace).toBeDefined();
    
    // Verify basic workspace functionality
    expect(glb.workspace.root).toBeDefined();
    expect(typeof glb.workspace.root()).toBe("string");
  });
});