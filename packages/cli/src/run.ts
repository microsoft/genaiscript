// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { delay } from "es-toolkit";
import { githubActionSetOutputs } from "./githubaction.js";
import type { GenerationResult, PromptScriptRunOptions, TraceOptions } from "@genaiscript/core";
import {
  SUCCESS_ERROR_CODE,
  UNRECOVERABLE_ERROR_CODES,
  USER_CANCELLED_ERROR_CODE,
  ensureDotGenaiscriptPath,
  genaiscriptDebug,
  normalizeInt,
  createCancellationController,
} from "@genaiscript/core";
import { runScriptInternal } from "@genaiscript/api";

const dbg = genaiscriptDebug("cli:run");

/**
 * Executes a script with a possible retry mechanism and exits the process with the appropriate code.
 * Ensures necessary setup, handles retries on failure or cancellation, and supports CLI mode.
 *
 * @param scriptId - The identifier of the script to execute.
 * @param files - A list of file paths to use as input for the script.
 * @param options - Configuration options for running the script. Includes retry parameters, trace configuration, cancellation token, and other execution-related settings.
 *
 * Exits with a success code if the script completes successfully, or with an appropriate error code if it fails, is cancelled, or encounters an unrecoverable error.
 */
export async function runScriptWithExitCode(
  scriptId: string,
  files: string[],
  options: Partial<PromptScriptRunOptions> & TraceOptions,
): Promise<void> {
  dbg(`run %s`, scriptId);
  await ensureDotGenaiscriptPath();
  const canceller = createCancellationController();
  const cancellationToken = canceller.token;
  const runRetry = Math.max(1, normalizeInt(options.runRetry) || 1);
  let exitCode = -1;
  let result: GenerationResult;

  // process environment variables from github actions
  const inputFiles = process.env.INPUT_FILES;
  if (inputFiles) {
    dbg(`input files from env: %s`, inputFiles);
    // eslint-disable-next-line no-param-reassign
    files = [
      ...(files || []),
      ...inputFiles
        .split(/\n|;/g)
        .map((f) => f.trim())
        .filter(Boolean),
    ];
  }

  for (let r = 0; r < runRetry; ++r) {
    if (cancellationToken.isCancellationRequested) break;

    const res = await runScriptInternal(scriptId, files, {
      ...options,
      cancellationToken,
      cli: true,
    });
    result = res.result;
    exitCode = res.exitCode;
    if (exitCode === SUCCESS_ERROR_CODE || UNRECOVERABLE_ERROR_CODES.includes(exitCode)) break;

    const delayMs = 2000 * Math.pow(2, r);
    if (runRetry > 1) {
      console.error(
        `error: run failed with ${exitCode}, retry #${r + 1}/${runRetry} in ${delayMs}ms`,
      );
      await delay(delayMs);
    }
  }
  await githubActionSetOutputs(result);
  if (cancellationToken.isCancellationRequested) exitCode = USER_CANCELLED_ERROR_CODE;
  // eslint-disable-next-line n/no-process-exit
  process.exit(exitCode);
}
