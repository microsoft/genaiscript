// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import debug from "debug";
const dbg = debug("genaiscript:node:package");
import { tryReadJSON } from "./fs.js";

export interface NodePackage {
  type?: string;
  name?: string;
  version?: string;
  description?: string;
  main?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  bundledDependencies?: string[];
  engines?: Record<string, string>;
  os?: string[];
  cpu?: string[];
  private?: boolean;
  publishConfig?: Record<string, string>;
  repository?: Record<string, string>;
  author?: string;
  license?: string;
  bugs?: Record<string, string>;
  homepage?: string;
  keywords?: string[];
  displayName?: string;
}

/**
 * Reads and parses the `package.json` file located in the current directory.
 *
 * @returns A promise that resolves with the parsed contents of the `package.json` file as a NodePackage object.
 *          If the file cannot be read or parsed, the promise may reject with an error.
 */
export async function nodeTryReadPackage(): Promise<NodePackage> {
  return await tryReadJSON("package.json");
}

/**
 * Determines if the package is of type "module" by reading the package.json file.
 *
 * @returns A promise that resolves to a boolean indicating if the package type is "module".
 */
export async function nodeIsPackageTypeModule() {
  const pkg = await nodeTryReadPackage();
  dbg(`type: ${pkg?.type || ""}`);
  const isModule = pkg?.type === "module";
  return isModule;
}
