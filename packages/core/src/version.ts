// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { readFileSync, existsSync } from "node:fs";
import { getModulePaths } from "./pathUtils.js";
import { dirname, join } from "node:path";

const { __dirname } =
  typeof module !== "undefined" && module.filename
    ? getModulePaths(module)
    : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      getModulePaths(import.meta);

/**
 * Returns true if the package.json is a "tshy" file (only { "type": ... }).
 */
function isTshyPackageJson(path: string): boolean {
  try {
    const pkg = JSON.parse(readFileSync(path, "utf8"));
    const keys = Object.keys(pkg);
    return keys.length === 1 && keys[0] === "type";
  } catch {
    return false;
  }
}

/**
 * Walks up from the current directory to find the first non-tshy package.json.
 * Throws if not found.
 */
function findRealPackageJson(startDir: string): { path: string; json: any } {
  let dir = startDir;
  let pkgPath: string | undefined;
  while (dir !== "/") {
    pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      if (!isTshyPackageJson(pkgPath)) {
        return { path: pkgPath, json: JSON.parse(readFileSync(pkgPath, "utf8")) };
      }
    }
    dir = dirname(dir);
  }
  throw new Error("No real package.json found");
}

const { json: packageJson } = findRealPackageJson(__dirname);

/**
 * The current version of the core package.
 */
export const CORE_VERSION = packageJson.version;
export const VSCODE_CLI_VERSION = CORE_VERSION;

/**
 * GitHub repository URL.
 */
export const GITHUB_REPO = packageJson.repository;
export const PDFJS_DIST_VERSION = packageJson.dependencies?.["pdfjs-dist"];
export const RIPGREP_DIST_VERSION = packageJson.optionalDependencies?.["@lvce-editor/ripgrep"];

/**
 * Usage example (ESM):
 *   import { CORE_VERSION } from "./version.js";
 *   console.log(CORE_VERSION);
 *
 * Usage example (CJS):
 *   const { CORE_VERSION } = require("./version.js");
 *   console.log(CORE_VERSION);
 */
