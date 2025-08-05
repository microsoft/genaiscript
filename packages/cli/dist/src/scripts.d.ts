import type { ScriptFilterOptions } from "@genaiscript/core";
/**
 * Lists all the scripts in the project.
 * Displays id, title, group, filename, and system status.
 * Generates this list by first building the project.
 * Filters scripts based on provided ids and options.
 * Outputs the list in plain text or JSON format based on the json option.
 * @param ids - An array of script IDs to filter.
 * @param options - Additional filtering options, including whether to output in JSON format.
 *                 If not provided, defaults to plain text output.
 */
export declare function listScripts(ids: string[], options?: ScriptFilterOptions & {
    json?: boolean;
}): Promise<void>;
/**
 * Retrieves detailed information about a specific script by its ID.
 * Outputs metadata such as its title, file location, and accepted input types.
 * Also displays the script's function signature, including its input schema and file handling capabilities.
 *
 * @param scriptId - The unique identifier of the script to locate.
 *
 * The function checks if the script exists in the project. If found, it prints
 * metadata and the script's function signature. If not found, it logs an error message.
 */
export declare function scriptInfo(scriptId: string): Promise<void>;
/**
 * Creates a new script.
 * Prompts the user for the script name if not provided.
 * Calls the core function to create a script and copies prompt definitions.
 * Compiles the newly created script immediately after creation.
 * Logs the location of the created script.
 * @param name - The name of the script to be created. If not provided, the user will be prompted to enter it.
 * @param options - Options for script creation, including whether to use TypeScript.
 */
export declare function createScript(name: string, options: {
    typescript: boolean;
}): Promise<void>;
/**
 * Fixes prompt definitions and custom prompts in the project.
 * Used to correct any issues in the prompt definitions.
 * Accesses project information by building the project first.
 *
 * @param options - Optional settings to fix specific types of prompts, such as GitHub Copilot prompts or custom prompts.
 */
export declare function fixScripts(options?: {
    githubCopilotInstructions?: boolean;
    docs?: boolean;
    force?: boolean;
}): Promise<void>;
//# sourceMappingURL=scripts.d.ts.map