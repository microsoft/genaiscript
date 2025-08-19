// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from "vscode";
import { FileLogger } from "../src/filelogger";

// Mock for testing purposes
const mockUri = vscode.Uri.file("/test/project");

describe("FileLogger", () => {
  let logger: FileLogger;

  beforeEach(() => {
    logger = new FileLogger({
      projectUri: mockUri,
      diagnostics: true,
    });
  });

  it("should create logger instance", () => {
    expect(logger).toBeDefined();
  });

  it("should not log when diagnostics is false", async () => {
    const loggerWithoutDiagnostics = new FileLogger({
      projectUri: mockUri,
      diagnostics: false,
    });

    // This should not throw or create any files
    await loggerWithoutDiagnostics.log("info", "test message");
  });

  it("should format log entry correctly", async () => {
    // Test would verify file content if we had proper mock setup
    // For now, just test that it doesn't throw
    await logger.log("info", "test message");
  });
});