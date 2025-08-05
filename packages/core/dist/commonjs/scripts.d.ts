import type { Project } from "./server/messages.js";
import type { PromptScript } from "./types.js";
/**
 * Creates a new script object based on the provided name and optional template.
 *
 * @param name - The name of the script.
 * @param options - Optional parameters for creating the script.
 * @param options.template - A template object to initialize the script content. Defaults to a basic empty template.
 * @param options.title - A custom title for the script. Defaults to the provided name.
 * @returns A new script object with the specified or default attributes.
 */
export declare function createScript(name: string, options?: {
    template: PromptScript;
    title?: string;
}): PromptScript;
/**
 * Updates prompt definition files based on the project configuration.
 *
 * Iterates through the project's collected folders and updates the corresponding
 * configuration and definition files (e.g., `genaiscript.d.ts`, `tsconfig.json`, `jsconfig.json`).
 * System and tool identifiers within the `genaiscript` TypeScript definition file
 * are dynamically updated with the systems and tools from the project scripts.
 *
 * @param project - The project configuration containing scripts and folder structure.
 *   - `project.scripts`: An array of scripts from the project, where system scripts determine tool usage.
 *   - `project.folders`: A set of folder data collected with relevant directory and file details.
 */
export declare function fixPromptDefinitions(project: Project, options?: {
    force?: boolean;
}): Promise<void>;
/**
 * Updates custom prompts and related files with new definitions and data.
 *
 * @param options - Options for customizing prompt behavior.
 * @param options.githubCopilotPrompt - If true, writes the GitHub Copilot custom prompt file.
 * @param options.docs - If true, fetches and writes updated documentation files.
 *
 * Writes the TypeScript definition file (`genaiscript.d.ts`) and manages files within the
 * `.genaiscript` directory. Optionally, creates GitHub Copilot prompt and documentation files
 * based on the provided options. Fetches external content for documentation updates if applicable.
 * Ensures `.gitignore` is updated to ignore all files in the `.genaiscript` directory.
 * Fetches and processes external documentation content if required.
 */
export declare function fixGitHubCopilotInstructions(options?: {
    githubCopilotInstructions?: boolean;
    docs?: boolean;
}): Promise<void>;
//# sourceMappingURL=scripts.d.ts.map