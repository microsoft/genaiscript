// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  dirname,
  extname,
  basename,
  join,
  normalize,
  relative,
  resolve,
  isAbsolute,
  parse,
} from "node:path";
import { changeext } from "./fs.js";
import { fileURLToPath } from "node:url";
import { sanitizeFilename } from "./sanitize.js";
import type { Path } from "./types.js";

/**
 * Creates a frozen object that provides various path manipulation functions.
 * Includes methods for operations such as getting directory names, extensions, basename, joining paths, normalizing paths, resolving paths, checking if a path is absolute, and changing file extensions.
 * @returns A frozen object with methods for path handling.
 */
export function createNodePath(): Path {
  // Return a frozen object containing path manipulation functions.
  // These functions are imported from node:path and facilitate
  // various operations on file paths.

  return Object.freeze({
    parse,
    dirname, // Get the directory name of a path
    extname, // Get the extension of a path
    basename, // Get the basename of a path
    join, // Join multiple path segments
    normalize, // Normalize a path to remove redundant separators
    relative, // Get the relative path between two paths
    resolve, // Resolve a sequence of paths to an absolute path
    isAbsolute, // Check if a path is absolute
    changeext,
    resolveFileURL: fileURLToPath,
    sanitize: sanitizeFilename,
  } satisfies Path);
}
