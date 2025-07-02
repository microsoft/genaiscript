// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type {
  Awaitable,
  GenerationResult,
  PromptScriptRunOptions,
  Resource,
} from "@genaiscript/core";
import { Worker } from "node:worker_threads";
import { getModulePaths, tryStat } from "@genaiscript/core";

import debug from "debug";
import { dirname, join } from "node:path";
const dbg = debug("genaiscript:api");

const { __dirname } =
  typeof module !== "undefined" && module.filename
    ? getModulePaths(module)
    : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      getModulePaths(import.meta);

/**
 * Runs a GenAIScript script with the given files and options.
 * This function acts similarly to the `run` command in the CLI.
 * @param scriptId The script identifier or full file path. This parameter is required.
 * @param files List of file paths to run the script on, leave empty if not needed.
 * @param options GenAIScript generation options, including optional environment variables, an abort signal, and additional options. The options may include a label for the worker thread.
 *   - envVars: Environment variables to use for the operation.
 *   - signal: The signal to use for aborting the operation. Terminates the worker thread.
 * @returns A promise that resolves with the generation result or rejects if an error occurs.
 */
export async function run(
  /**
   * The script identifier or full file path.
   */
  scriptId: string,
  /**
   * List of file paths to run the script on, leave empty if not needed.
   */
  files?: string | string[],
  /**
   * GenAIScript generation options.
   */
  options?: Partial<PromptScriptRunOptions> & {
    /**
     * Environment variables to use for the operation.
     */
    envVars?: Record<string, string>;
    /**
     * The signal to use for aborting the operation. Terminates the worker thread.
     */
    signal?: AbortSignal;
    /**
     * Handles messages
     */
    onMessage?: (data: { type: "resourceChange" } & Resource) => Awaitable<void>;
  },
): Promise<GenerationResult> {
  if (!scriptId) throw new Error("scriptId is required");
  dbg(`run ${scriptId}`);
  if (typeof files === "string") files = [files];

  const { signal, onMessage, ...rest } = options || {};
  const workerData = {
    type: "run",
    scriptId,
    files: files || [],
    options: rest,
  };
  dbg(`__dirname: %s`, __dirname);
  const sidebyside = await tryStat(join(__dirname, "worker.js"));
  const workerJs = sidebyside
    ? join(__dirname, "worker.js")
    : join(dirname(__dirname), "dist", "esm", "worker.js");
  dbg(`start ${workerJs}`);
  const worker = new Worker(workerJs, { workerData, name: options?.label });
  return new Promise((resolve, reject) => {
    const abort = () => {
      if (worker) {
        dbg(`abort`);
        reject(new Error("aborted")); // fail early
        worker.terminate(); // don't wait for the worker to finish
      }
    };
    signal?.addEventListener("abort", abort);
    worker.on("message", async (res) => {
      const type = res?.type;
      dbg(type);
      if (type === "run") {
        signal?.removeEventListener("abort", abort);
        resolve(res.result);
      } else if (onMessage) {
        await onMessage(res);
      } else {
        dbg(`unknown message type ${type}`);
      }
    });
    worker.on("error", (reason) => {
      dbg(`error ${reason}`);
      signal?.removeEventListener("abort", abort);
      reject(reason);
    });
  });
}
