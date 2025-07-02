// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Import the 'ignore' library to handle .gitignore file parsing and filtering
import ignorer from "ignore";
import { tryReadText, writeText } from "./fs.js";
import { GENAISCRIPTIGNORE, GIT_IGNORE, GIT_IGNORE_GENAI } from "./constants.js";
import { host } from "./host.js";
import { logVerbose } from "./util.js";
import { genaiscriptDebug } from "./debug.js";
import { GitIgnorer, WorkspaceFile } from "./types.js";
import { filenameOrFileToFilename } from "./unwrappers.js";
const dbg = genaiscriptDebug("files:gitignore");

/**
 * Creates a function to filter files based on patterns defined in .gitignore files.
 * Combines multiple .gitignore files (.gitignore, .gitignore.genai, and .genaiscriptignore)
 * into a single filtering logic.
 *
 * @returns A function that takes a list of files and returns only the files not ignored.
 */
export async function createGitIgnorer(options?: { extraFiles?: string[] }): Promise<GitIgnorer> {
  const { extraFiles = [] } = options || {};
  dbg(`extra .gitignore files: ${extraFiles.join(", ")}`);
  return await createIgnorer([GIT_IGNORE, GIT_IGNORE_GENAI, GENAISCRIPTIGNORE, ...extraFiles]);
}

export async function createIgnorer(files: string[]): Promise<GitIgnorer> {
  const gitignores = (await Promise.all(files.map((f) => tryReadText(f)))).filter(Boolean);
  if (!gitignores.length) {
    dbg("no .gitignore files found");
    dbg(`%O`, files);
    return (fs) => fs?.map(filenameOrFileToFilename)?.slice(0);
  }

  // Create an ignorer instance and add the .gitignore patterns to it
  dbg("creating ignorer instance");
  const ig = ignorer({ allowRelativePaths: true });
  for (const gitignore of gitignores) {
    ig.add(gitignore);
  }
  return (files: readonly (string | WorkspaceFile)[]) =>
    files ? ig.filter(files?.map(filenameOrFileToFilename)) : [];
}

/**
 * Filters a list of files based on the patterns specified in .gitignore files.
 * Utilizes the 'ignore' library to determine which files should be excluded.
 *
 * @param files - An array of file paths to be filtered.
 * @returns An array of files that are not ignored according to the .gitignore patterns.
 */
export async function filterGitIgnore(files: string[]) {
  const ignorer = await createGitIgnorer();
  const newFiles = ignorer(files);
  dbg(`files ${files.length} -> ${newFiles.length}`);
  return newFiles;
}

/**
 * Ensures specified entries are present in the .gitignore file within the given directory.
 * If any of the entries are missing, they are appended to the file.
 *
 * @param dir - Directory path where the .gitignore file is located.
 * @param entries - List of patterns or file paths to ensure are included in the .gitignore file.
 */
export async function gitIgnoreEnsure(dir: string, entries: string[]) {
  const fn = host.path.join(dir, GIT_IGNORE);
  dbg(`reading file ${fn}`);
  let src = (await tryReadText(fn)) || "";
  const oldsrc = src;
  const newline = /\r\n/.test(src) ? "\r\n" : "\n";
  const lines = src.split(/\r?\n/g);
  for (const entry of entries) {
    dbg(`checking entry ${entry} in lines`);
    if (!lines.some((l) => l.startsWith(entry))) {
      if (src) {
        src += newline;
      }
      src += entry;
    }
  }
  if (oldsrc !== src) {
    logVerbose(`updating ${fn}`);
    await writeText(fn, src);
  }
}
