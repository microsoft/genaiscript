/**
 * Evaluates a JavaScript prompt script with the provided context.
 *
 * @param ctx0 - An object representing the execution context. Keys in this object are made available as arguments to the evaluated function.
 * @param r - An object containing the JavaScript source code (`jsSource`) to be evaluated and its associated metadata, such as the filename.
 * @param options - Optional settings.
 *   - sourceMaps - If true, generates and appends source maps for debugging purposes.
 *   - logCb - A callback function for logging debug messages.
 *
 * @returns The result of evaluating the JavaScript prompt script.
 */
export declare function evalPrompt(
  ctx0: PromptContext,
  r: PromptScript,
  options?: {
    sourceMaps?: boolean;
    logCb?: (msg: string) => void;
  },
): Promise<any>;
//# sourceMappingURL=evalprompt.d.ts.map
