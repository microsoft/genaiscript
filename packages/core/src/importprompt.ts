import debug from "debug";
const dbg = debug("genaiscript:importprompt");

import { host } from "./host";
import { logError } from "./util";
import { TraceOptions } from "./trace";
import { pathToFileURL } from "node:url";
import { mark } from "./performance";

/**
 * Dynamically imports a JavaScript module from a specified file.
 *
 * @param filename - The path of the file to be imported. Must be a valid string.
 * @param options - Optional parameters:
 *   - onImported: A callback executed after the module is imported. Receives the module as an argument.
 *   - logCb: A callback for logging messages.
 *   - trace: Optional tracing utility for debugging and error tracking.
 * @returns A promise that resolves to the value returned by the `onImported` callback, if provided.
 *
 * @throws An error if the `filename` is not provided or if the module import fails.
 */
export async function importFile<T = void>(
  filename: string,
  options?: {
    onImported?: (module: any) => Awaitable<T>;
    logCb?: (msg: string) => void;
  } & TraceOptions,
): Promise<T> {
  const { trace, onImported } = options || {};
  if (!filename) {
    throw new Error("filename is required");
  }

  let unregister: () => void = undefined;
  try {
    dbg(`resolving module path for filename: ${filename}`);
    const modulePath = pathToFileURL(
      host.path.isAbsolute(filename) ? filename : host.path.join(host.projectFolder(), filename),
    ).toString();
    const parentURL =
      import.meta.url ?? pathToFileURL(__filename ?? host.projectFolder()).toString();

    dbg(`importing module from path: ${modulePath}`);
    const onImport = (file: string) => {
      // trace?.itemValue("📦 import", fileURLToPath(file))
    };
    onImport(modulePath);
    const { tsImport, register } = await import("tsx/esm/api");
    unregister = register({ onImport });
    const module = await tsImport(modulePath, {
      parentURL,
      //tsconfig: false,
      onImport,
    });
    const result = await onImported?.(module);
    unregister?.();

    return result;
  } catch (err) {
    dbg("module imported failed");
    unregister?.();
    logError(err);
    trace?.error(err);
    throw err;
  }
}

/**
 * Imports and executes the default export of a given file as a function.
 *
 * @param ctx0 - The prompt context to pass to the imported function.
 * @param r - The prompt script object containing the filename and system prompt information.
 * @param options - Optional configuration:
 *   - logCb: A callback for logging messages.
 *   - TraceOptions: Additional tracing options.
 *
 * @throws Error if the imported file is a system prompt and does not export a default function.
 * @returns A promise that resolves when the function execution is complete.
 */
export async function importPrompt(
  ctx0: PromptContext,
  r: PromptScript,
  options?: {
    logCb?: (msg: string) => void;
  } & TraceOptions,
) {
  mark("prompt.import");
  const { filename } = r;
  dbg(`importing file: ${filename}`);
  return await importFile(filename, {
    ...(options || {}),
    onImported: async (module) => {
      const main = module.default;
      if (typeof main === "function") {
        dbg(`found default export as function, calling`);
        await main(ctx0);
      } else if (r.isSystem) {
        throw new Error(
          "system prompt using esm JavaScript (mjs, mts) must have a default function.",
        );
      }
    },
  });
}
