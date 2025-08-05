import type { GenerationOutput } from "@genaiscript/core";
export declare function githubActionSetOutputs(res: GenerationOutput): Promise<void>;
/**
 * Determines if the current process is executing within a GitHub Actions environment.
 *
 * Verifies the presence and value of relevant environment variables to confirm execution under GitHub Actions.
 *
 * @returns True if running as a GitHub Action; otherwise, false.
 */
export declare function isGitHubAction(): boolean;
/**
 * Configures GitHub Actions environment settings for the current process.
 *
 * Checks if the current environment is running in a GitHub Action.
 * Enables debug logging if the INPUT_DEBUG or ACTIONS_STEP_DEBUG environment variables are set.
 * Logs action, workflow, and workspace environment variables via debug.
 *
 * @returns An object containing:
 *   - actionId: The current GitHub Action identifier.
 *   - workflow: The name of the current workflow.
 *   - workspaceDir: The GitHub Actions workspace directory.
 *   Returns an empty object if not running in a GitHub Action.
 */
export declare function githubActionConfigure(): {
    actionId?: undefined;
    workflow?: undefined;
    workspaceDir?: undefined;
} | {
    actionId: string;
    workflow: string;
    workspaceDir: string;
};
//# sourceMappingURL=githubaction.d.ts.map