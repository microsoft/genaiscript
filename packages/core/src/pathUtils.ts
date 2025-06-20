// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

export function getModulePaths(metaOrModule: { url?: string; filename?: string }) {
  if (metaOrModule && "url" in metaOrModule && metaOrModule.url) {
    // ESM: pass import.meta
    const __filename = fileURLToPath(metaOrModule.url);
    const __dirname = dirname(__filename);
    return { __filename, __dirname };
  } else if (metaOrModule && "filename" in metaOrModule && metaOrModule.filename) {
    // CJS: pass module
    const __filename = metaOrModule.filename;
    const __dirname = dirname(__filename);
    return { __filename, __dirname };
  }
  throw new Error("Invalid module context: pass import.meta (ESM) or module (CJS)");
}

/**
 * Resolves modules in CommonJS and ESM environments.
 * @param moduleName
 * @returns
 */
export function moduleResolve(moduleName: string): string {
  const isoRequire =
    typeof require !== "undefined"
      ? require
      : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        createRequire(import.meta.url);
  return isoRequire.resolve(moduleName);
}
