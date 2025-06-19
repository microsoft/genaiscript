import { workerData, parentPort } from "node:worker_threads";
import { runScriptInternal } from "./run";
import { NodeHost } from "./nodehost";
import { delay } from "es-toolkit";
import { overrideStdoutWithStdErr } from "../../core/src/stdio";
import { runtimeHost } from "../../core/src/host";
import { Resource } from "../../core/src/mcpresource";
import { RESOURCE_CHANGE } from "../../core/src/constants";

/**
 * Handles worker thread execution based on the provided data type.
 *
 * Parameters:
 *     - type: Specifies the type of operation to execute. For now, supports "run".
 *     - scriptId: Identifier of the script to be executed (provided when type is "run").
 *     - files: List of file paths required for script execution (provided when type is "run").
 *     - options: Additional configuration options for script execution (provided when type is "run").
 *
 * Notes:
 *     - Redirects stdout to stderr.
 *     - Installs NodeHost with environment options.
 *     - Handles resource change events and communicates them to the parent thread.
 *     - Ensures compatibility with Windows by setting the SystemRoot environment variable.
 */
export async function worker() {
  overrideStdoutWithStdErr();
  const { type, ...data } = workerData as {
    type: string;
  };
  await NodeHost.install(undefined, undefined); // Install NodeHost with environment options
  if (process.platform === "win32") {
    // https://github.com/Azure/azure-sdk-for-js/issues/32374
    process.env.SystemRoot = process.env.SYSTEMROOT;
  }

  runtimeHost.resources.addEventListener(RESOURCE_CHANGE, (ev) => {
    const cev = ev as CustomEvent<Resource>;
    const { reference, content } = cev.detail;
    parentPort.postMessage({
      type: RESOURCE_CHANGE,
      reference,
      content,
    } satisfies Resource & { type: string });
  });

  switch (type) {
    case "run": {
      const { scriptId, files, options } = data as {
        scriptId: string;
        files: string[];
        options: object;
      };
      const { result } = await runScriptInternal(scriptId, files, options);
      await delay(0); // flush streams
      parentPort.postMessage({ type: "run", result });
      break;
    }
  }
}
