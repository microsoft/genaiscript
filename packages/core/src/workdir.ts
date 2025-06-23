// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  CONVERTS_DIR_NAME,
  GENAI_ANYTS_REGEX,
  GENAISCRIPT_FOLDER,
  RUNS_DIR_NAME,
  STATS_DIR_NAME,
} from "./constants.js";
import { randomHex } from "./crypto.js";
import { genaiscriptDebug } from "./debug.js";
import { ensureDir } from "./fs.js";
import { gitIgnoreEnsure } from "./gitignore.js";
import { host } from "./host.js";
import { sanitizeFilename } from "./sanitize.js";
const dbg = genaiscriptDebug("dirs");

/**
 * Constructs a resolved file path within the `.genaiscript` directory of the project.
 *
 * @param segments - Additional path segments to append to the `.genaiscript` directory path.
 * @returns The resolved path as a string.
 */
export function dotGenaiscriptPath(...segments: string[]) {
  return host.resolvePath(
    host.projectFolder(),
    GENAISCRIPT_FOLDER,
    ...segments.map((s) => sanitizeFilename(s)),
  );
}

/**
 * Ensures the existence of the base `.genaiscript` directory.
 *
 * This function creates the `.genaiscript` directory at the root of the project folder
 * and ensures that the directory is properly configured by adding a `.gitignore` file
 * to ignore all contents inside this directory.
 *
 * @param None - This function does not accept any parameters.
 * @returns A promise that resolves once the directory is created and configured.
 */
export async function ensureDotGenaiscriptPath() {
  const dir = dotGenaiscriptPath();
  await ensureDir(dir);
  await gitIgnoreEnsure(dir, ["*"]);
}

function friendlyDate() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function createDatedFolder(id: string) {
  const name = friendlyDate() + "-" + id;
  return name;
}

/**
 * Generates the directory path for a specific run under the `.genaiscript` folder structure.
 *
 * @param scriptId - Identifier or file path of the script. The base name of the script will be extracted and processed.
 * @param runId - Unique identifier for the run. It will be combined with a timestamp to name the folder.
 * @returns The resolved path for the specified run directory.
 */
export function getRunDir(scriptId: string, runId: string) {
  dbg(`run: %s %s`, scriptId, runId);
  const name = createDatedFolder(runId);
  const out = dotGenaiscriptPath(
    RUNS_DIR_NAME,
    host.path.basename(scriptId).replace(GENAI_ANYTS_REGEX, ""),
    name,
  );
  dbg("run dir: %s", out);
  return out;
}

export function getTestDir(runId: string) {
  dbg(`test: %s`, runId);
  const name = createDatedFolder(runId);
  const out = dotGenaiscriptPath("tests", name);
  dbg("test dir: %s", out);
  return out;
}

/**
 * Generates a directory path for storing converted files.
 *
 * @param scriptId - Identifier of the script. Used to create a unique directory path.
 *                   The base name of the scriptId is sanitized by removing
 *                   matches to GENAI_ANYTS_REGEX.
 * @returns A string representing the full path of the newly created directory
 *          for the converted files.
 */
export function getConvertDir(scriptId: string) {
  const runId = randomHex(6);
  dbg(`convert: %s %s`, scriptId, runId);
  const name = createDatedFolder(runId);
  const out = dotGenaiscriptPath(
    CONVERTS_DIR_NAME,
    host.path.basename(scriptId).replace(GENAI_ANYTS_REGEX, ""),
    name,
  );
  dbg("convert dir: %s", out);
  return out;
}

/**
 * Creates a directory for storing videos.
 *
 * @returns The path to the created video directory.
 *
 * This function resolves the path for a "videos" directory within the
 * `.genaiscript` folder, appends a timestamped folder name, ensures the
 * directory's existence, and returns the directory path.
 */
export async function createVideoDir() {
  const dir = dotGenaiscriptPath("videos", friendlyDate());
  await ensureDir(dir);
  return dir;
}

/**
 * Creates the statistics directory if it does not already exist.
 *
 * @returns The path to the statistics directory.
 *
 * This function resolves the path to the statistics directory under the
 * predefined `STATS_DIR_NAME` within the `.genaiscript` folder. It ensures
 * the directory exists by creating it if necessary.
 */
export async function createStatsDir() {
  const statsDir = dotGenaiscriptPath(STATS_DIR_NAME);
  await ensureDir(statsDir);
  return statsDir;
}
