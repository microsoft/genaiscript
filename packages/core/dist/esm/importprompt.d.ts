import { TraceOptions } from "./trace.js";
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
export declare function importFile<T = void>(
  filename: string,
  options?: {
    onImported?: (module: any) => Awaitable<T>;
    logCb?: (msg: string) => void;
  } & TraceOptions,
): Promise<T>;
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
export declare function importPrompt(
  ctx0: PromptContext,
  r: PromptScript,
  options?: {
    logCb?: (msg: string) => void;
  } & TraceOptions,
): Promise<void>;
//# sourceMappingURL=importprompt.d.ts.map
