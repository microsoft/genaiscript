// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import {
  RUNS_DIR_NAME,
  SERVER_PORT,
  TRACE_FILENAME,
  dotGenaiscriptPath,
  groupBy,
  runtimeHost,
} from "@genaiscript/core";

/**
 * Collects information about available runs based on the provided options.
 *
 * @param options - Optional filters for collecting runs.
 *   - scriptid - Filters the runs to only include those associated with the specified script ID.
 *
 * @returns An array of run objects containing:
 *   - scriptId: The ID of the associated script.
 *   - name: The run's name.
 *   - runId: The unique identifier for the run.
 *   - dir: The directory path of the run.
 *   - creationTme: The creation time of the run, parsed from its name.
 *   - report: The size of the `res.json` file in the run, or 0 if it does not exist.
 *   - trace: The size of the `trace.md` file in the run, or 0 if it does not exist.
 */
export async function collectRuns(options?: { scriptid?: string }) {
  const { scriptid } = options || {};
  const runsDir = dotGenaiscriptPath(RUNS_DIR_NAME);
  const runsState = await runtimeHost.statFile(runsDir);
  if (runsState?.type !== "directory") return [];

  const scripts = (
    await readdir(runsDir, {
      withFileTypes: true,
    })
  )
    .filter((d) => d.isDirectory())
    .filter((d) => !scriptid || d.name === scriptid);

  const runs: {
    scriptId: string;
    name: string;
    runId: string;
    dir: string;
    creationTme: string;
    report: number;
    trace: number;
  }[] = [];
  for (const sid of scripts) {
    const sdir = join(runsDir, sid.name);
    // Check if the script directory exists
    if ((await runtimeHost.statFile(sdir))?.type !== "directory") continue;
    const reports = (
      await readdir(sdir, {
        withFileTypes: true,
      })
    ).filter((d) => d.isDirectory());
    for (const r of reports) {
      const resjson = await runtimeHost.statFile(join(sdir, r.name, "res.json"));
      const tracemd = await runtimeHost.statFile(join(sdir, r.name, TRACE_FILENAME));
      runs.push({
        scriptId: sid.name,
        runId: r.name.split(/-/g).at(-1),
        creationTme: r.name.split(/-/g).slice(0, -1).join(" "),
        name: r.name,
        dir: join(sdir, r.name),
        report: resjson?.type === "file" ? resjson.size : 0,
        trace: tracemd?.type === "file" ? tracemd.size : 0,
      });
    }
  }
  return runs;
}

/**
 * Resolves the directory path for a specific run of a script.
 *
 * @param scriptId - The identifier of the script.
 * @param runId - The identifier of the run.
 * @returns The file path to the directory containing the run's data.
 */
export function resolveRunDir(scriptId: string, runId: string) {
  return join(dotGenaiscriptPath(RUNS_DIR_NAME), scriptId, runId);
}

/**
 * Lists all runs grouped by script ID and logs them to the console.
 *
 * @param options - Optional configuration object.
 * @param options.scriptid - Filter to list runs only for the specified script ID.
 *
 * This function retrieves and organizes runs into groups based on their script ID.
 * Each run is displayed with its run ID, name, and a URL leading to detailed information.
 */
export async function listRuns(options?: { scriptid?: string }) {
  const runs = await collectRuns(options);
  const groups = groupBy(runs, (r) => r.scriptId);
  for (const sid in groups) {
    console.log(`\n${sid}`);
    for (const rid of groups[sid]) {
      console.log(`  ${rid.runId} ${rid.name} https://localhost:${SERVER_PORT}/#run=${rid.runId}`);
    }
  }
}
