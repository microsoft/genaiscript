// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from "vscode";
import { Utils } from "vscode-uri";
import type { LogLevel } from "../../core/src/server/messages";

export interface FileLoggerOptions {
  projectUri: vscode.Uri;
  diagnostics: boolean;
}

export class FileLogger {
  private _logFile: vscode.Uri | undefined;
  private _sessionId: string;

  constructor(private options: FileLoggerOptions) {
    this._sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    const now = new Date();
    return `vscode-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6)}.txt`;
  }

  private getLogFile(): vscode.Uri | undefined {
    if (!this._logFile) {
      const { projectUri } = this.options;
      if (projectUri) {
        this._logFile = Utils.joinPath(projectUri, ".genaiscript", "vscode", this._sessionId);
      }
    }
    return this._logFile;
  }

  async log(level: LogLevel, message: string): Promise<void> {
    if (!this.options.diagnostics) {
      return;
    }

    const logFile = this.getLogFile();
    if (!logFile) {
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
      
      // Ensure directory exists
      const logDir = Utils.dirname(logFile);
      try {
        await vscode.workspace.fs.stat(logDir);
      } catch {
        await vscode.workspace.fs.createDirectory(logDir);
      }

      // Append to file
      let existingContent = new Uint8Array(0);
      try {
        const rawContent = await vscode.workspace.fs.readFile(logFile);
        existingContent = new Uint8Array(rawContent);
      } catch {
        // File doesn't exist yet, that's fine
      }

      const encoder = new TextEncoder();
      const newContent = new Uint8Array(existingContent.length + encoder.encode(logEntry).length);
      newContent.set(existingContent);
      newContent.set(encoder.encode(logEntry), existingContent.length);

      await vscode.workspace.fs.writeFile(logFile, newContent);
    } catch (error) {
      // Fail silently to avoid breaking the extension if logging fails
      console.error("FileLogger error:", error);
    }
  }

  async logDebug(namespace: string, message: string): Promise<void> {
    const formattedMessage = `[DEBUG:${namespace}] ${message}`;
    await this.log("debug", formattedMessage);
  }
}