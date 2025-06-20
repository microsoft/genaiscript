// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { readFileSync, existsSync } from "node:fs";
import { __dirname } from "./utils/pathUtils.js";
import { dirname, join } from "node:path";

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

// This file exports specific versions of dependencies and engines from package.json

/**
 * The minimum required Node.js version for this package.
 * Retrieved from the "engines" field in package.json.
 */
export const NODE_MIN_VERSION = packageJson.engines.node;

/**
 * The version of the 'promptfoo' peer dependency.
 */
export const PROMPTFOO_VERSION = "0.112.7";

/**
 * The version of the 'typescript' dependency.
 * Retrieved from the "dependencies" field in package.json.
 */
export const TYPESCRIPT_VERSION = "5.8.3";
