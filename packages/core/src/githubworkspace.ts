// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { join } from "node:path";
import type { WorkspaceFileSystem } from "./types.js";
import { createWorkspaceFileSystem } from "./workspace.js";
import { grepSearch } from "./grep.js";
import { fileWriteCached } from "./filecache.js";
import { dotGenaiscriptPath } from "./workdir.js";

/**
 * Creates a GitHub-specific workspace filesystem that extends the base workspace
 * with additional methods like grep and writeCached.
 */
export function createGitHubWorkspace(): WorkspaceFileSystem {
  const baseWorkspace = createWorkspaceFileSystem({ root: process.cwd() });
  
  // Create a complete WorkspaceFileSystem by extending the base with missing methods
  return {
    ...baseWorkspace,
    grep: async (
      query: string | RegExp,
      grepOptions?: string | any,
      grepOptions2?: any,
    ) => {
      if (typeof grepOptions === "string") {
        const path = grepOptions.replace(/(^|\/)\*\*$/, "");
        const glob = grepOptions;
        grepOptions = {
          path: path || undefined,
          glob: glob || undefined,
          ...(grepOptions2 || {}),
        };
      }
      const { path, glob, ...rest } = grepOptions || {};
      const { files, matches } = await grepSearch(query, {
        path,
        glob,
        ...rest,
      });
      return { files, matches };
    },
    writeCached: async (file: any, options?: any) => {
      const { scope } = options || {};
      const dir = scope === "run" 
        ? join(process.cwd(), ".genaiscript", "tmp", "files")
        : dotGenaiscriptPath("cache", "files");
      return await fileWriteCached(dir, file, options || {});
    },
  };
}