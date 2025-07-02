// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { uniq } from "es-toolkit";
import { dirname } from "node:path";
import { arrayify } from "./cleaners.js";
import { GENAI_ANYJS_GLOB, GENAISCRIPT_FOLDER, GENAI_ANY_REGEX } from "./constants.js";
import { genaiscriptDebug } from "./debug.js";
import { runtimeHost } from "./host.js";
import { parseProject } from "./parser.js";
import { getModulePaths } from "./pathUtils.js";

const dbg = genaiscriptDebug("cli:build");

const { __dirname } =
  typeof module !== "undefined" && module.filename
    ? getModulePaths(module)
    : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      getModulePaths(import.meta);

/**
 * Asynchronously builds a project by parsing tool files.
 *
 * @param options - Optional configuration for building the project.
 * @param options.toolFiles - Specific tool files to include in the build.
 * @param options.toolsPath - Path or paths to search for tool files if none are provided.
 * @returns A promise that resolves to the newly parsed project structure.
 */
export async function buildProject(options?: {
  toolFiles?: string[];
  toolsPath?: string | string[];
}) {
  const installDir = dirname(dirname(__dirname)); // Use __dirname to resolve the installation directory
  const { toolFiles, toolsPath } = options || {};
  let scriptFiles: string[] = [];
  if (toolFiles?.length) {
    scriptFiles = toolFiles;
  } else {
    let tps = arrayify(toolsPath).map((pattern) => ({
      pattern,
      applyGitIgnore: true,
    }));
    if (!tps?.length) {
      const config = await runtimeHost.config;
      tps = [];
      if (config.ignoreCurrentWorkspace) {
        dbg(`ignoring current workspace scripts`);
      } else tps.push({ pattern: GENAI_ANYJS_GLOB, applyGitIgnore: true });
      tps.push(
        ...arrayify(config.include).map((pattern) =>
          typeof pattern === "string"
            ? { pattern, applyGitIgnore: false }
            : {
                pattern: pattern.pattern,
                applyGitIgnore: !pattern.ignoreGitIgnore,
              },
        ),
      );
    }
    tps = arrayify(tps);
    scriptFiles = [];
    for (const tp of tps) {
      dbg(`searching %s .gitignore: %s`, tp.pattern, tp.applyGitIgnore);
      const fs = await runtimeHost.findFiles(tp.pattern, {
        ignore: `**/${GENAISCRIPT_FOLDER}/**`,
        applyGitIgnore: tp.applyGitIgnore,
      });
      if (!fs?.length) {
        dbg(`no files found`);
      }
      scriptFiles.push(...fs);
    }
    dbg(`found script files: %O`, scriptFiles);
  }

  // filter out unwanted files
  scriptFiles = scriptFiles.filter((f) => GENAI_ANY_REGEX.test(f));

  // Ensure that the script files are unique
  scriptFiles = uniq(scriptFiles);

  // Parse the project using the determined script files
  const newProject = await parseProject({
    installDir,
    scriptFiles,
  });

  // Return the newly parsed project structure
  return newProject;
}
