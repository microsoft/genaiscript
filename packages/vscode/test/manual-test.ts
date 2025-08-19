// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Simple manual test script to demonstrate file logging functionality
 * This would be run in the context of a VSCode extension
 */

import * as vscode from "vscode";
import { VSCodeHost } from "../src/vshost";
import { ExtensionState } from "../src/state";

// This is a conceptual test - in practice this would be integrated into the extension
export async function testFileLogging() {
  // Mock extension context (in real use, this comes from VSCode)
  const mockContext: vscode.ExtensionContext = {
    subscriptions: [],
    workspaceState: {} as any,
    globalState: {} as any,
    extensionPath: "/mock/path",
    storagePath: "/mock/storage",
    globalStoragePath: "/mock/global",
    logPath: "/mock/log",
    extensionUri: vscode.Uri.file("/mock/path"),
    storageUri: vscode.Uri.file("/mock/storage"),
    globalStorageUri: vscode.Uri.file("/mock/global"),
    logUri: vscode.Uri.file("/mock/log"),
    environmentVariableCollection: {} as any,
    asAbsolutePath: (path: string) => `/mock/path/${path}`,
    extension: {} as any,
    secrets: {} as any,
    languageModelAccessInformation: {} as any,
  };

  try {
    // Create extension state with diagnostics enabled
    const state = new ExtensionState(mockContext);
    
    // Override diagnostics to be true for testing
    Object.defineProperty(state, 'diagnostics', {
      get: () => true,
      configurable: true
    });

    // Create VSCode host (this will trigger file logger initialization)
    const host = new VSCodeHost(state);

    // Test basic logging
    console.log("Testing file logging...");
    host.log("info", "Test info message from VSCode host");
    host.log("warn", "Test warning message");
    host.log("error", "Test error message");
    host.log("debug", "Test debug message");

    // Test debug package logging (if available)
    const debug = require("debug");
    const dbg = debug("genaiscript:test");
    dbg("Test debug message from debug package");

    console.log("File logging test completed. Check .genaiscript/vscode/ directory for log files.");
    
    return true;
  } catch (error) {
    console.error("Test failed:", error);
    return false;
  }
}

// Export for potential use in extension activation
export { testFileLogging };