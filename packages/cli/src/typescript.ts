// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// This file contains functions to manage and compile project scripts,
// including listing, creating, fixing, and compiling scripts.

import { buildProject, genaiscriptDebug } from "@genaiscript/core";
import {
  RUNTIME_ERROR_CODE,
  collectFolders,
  fixPromptDefinitions,
  logInfo,
  runtimeHost,
  logVerbose,
} from "@genaiscript/core";
const dbg = genaiscriptDebug("compile");

/**
 * Compiles scripts in specified folders or all if none specified.
 * Fixes prompt definitions before compiling.
 * Handles both JavaScript and TypeScript compilation based on folder content.
 * Logs errors and verbose output during the compilation process.
 * Exits process with error code if any compilation fails.
 *
 * @param folders - An array of folder names to compile. If empty, compiles all available script folders.
 */
export async function compileScript(folders: string[]) {
  const project = await buildProject();
  await fixPromptDefinitions(project);

  const scriptFolders = collectFolders(project);
  const foldersToCompile = (folders?.length ? folders : scriptFolders.map((f) => f.dirname))
    .map((f) => scriptFolders.find((sf) => sf.dirname === f))
    .filter((f) => f);

  if (!foldersToCompile.length) return;

  const ts = await import("typescript");
  let errors = 0;
  for (const folder of foldersToCompile) {
    const { dirname, js, ts: isTypeScript } = folder;
    if (js) {
      logInfo(`compiling ${dirname}/*.js`);
      const configPath = runtimeHost.path.resolve(dirname, "jsconfig.json");
      const config = ts.readConfigFile(configPath, ts.sys.readFile);
      if (config.error) {
        logInfo(config.error.messageText.toString());
        errors++;
        continue;
      }

      const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname);
      if (parsed.errors.length > 0) {
        parsed.errors.forEach((error) => logInfo(error.messageText.toString()));
        errors++;
        continue;
      }
      parsed.options.noEmit = true;
      dbg(`config: %O`, parsed);

      const program = ts.createProgram(parsed.fileNames, parsed.options);
      const emitResult = program.emit();
      const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

      allDiagnostics.forEach((diagnostic) => {
        if (diagnostic.file) {
          const { line, character } = ts.getLineAndCharacterOfPosition(
            diagnostic.file,
            diagnostic.start!,
          );
          const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
          logVerbose(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        } else {
          logVerbose(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
        }
      });

      if (emitResult.emitSkipped) {
        errors++;
      }
    }
    if (isTypeScript) {
      logInfo(`compiling ${dirname}/*.{mjs,.mts}`);
      const configPath = runtimeHost.path.resolve(dirname, "tsconfig.json");
      const config = ts.readConfigFile(configPath, ts.sys.readFile);
      if (config.error) {
        logVerbose(config.error.messageText.toString());
        errors++;
        continue;
      }

      const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname);
      if (parsed.errors.length > 0) {
        parsed.errors.forEach((error) => logVerbose(error.messageText.toString()));
        errors++;
        continue;
      }
      parsed.options.noEmit = true;
      dbg(`config: %O`, parsed);

      const program = ts.createProgram(parsed.fileNames, parsed.options);
      const emitResult = program.emit();
      const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

      allDiagnostics.forEach((diagnostic) => {
        if (diagnostic.file) {
          const { line, character } = ts.getLineAndCharacterOfPosition(
            diagnostic.file,
            diagnostic.start!,
          );
          const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
          logVerbose(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        } else {
          logVerbose(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
        }
      });

      if (emitResult.emitSkipped) {
        errors++;
      }
    }
  }

  if (errors) process.exit(RUNTIME_ERROR_CODE);
}
