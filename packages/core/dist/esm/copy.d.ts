import type { PromptScript } from "./types.js";
/**
 * Copies a prompt script to a new location.
 * Optionally forks the script, ensuring the new filename is unique if needed.
 *
 * @param t - The prompt script object containing the source code.
 * @param options - Configuration options for the copy operation.
 * @param options.fork - Whether to fork the script by appending a unique suffix.
 * @param options.name - Optional new name for the copied script.
 * @param options.javascript - Whether to use the JavaScript file extension.
 * @returns The file path of the copied script.
 * @throws If the file already exists in the target location.
 */
export declare function copyPrompt(t: PromptScript, options: {
    fork: boolean;
    name?: string;
    javascript?: boolean;
}): Promise<string>;
//# sourceMappingURL=copy.d.ts.map