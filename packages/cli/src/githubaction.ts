import debug from "debug";
import { genaiscriptDebug } from "../../core/src/debug";

const dbg = genaiscriptDebug("github:action");

// https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#default-environment-variables

export async function githubActionSetOutputs(res: GenerationOutput) {
  if (!isGitHubAction() || !process.env.GITHUB_OUTPUT) return;

  dbg(`setting outputs`);
  const { setOutput } = await import("@actions/core");
  setOutput("text", res.text || "");
  if (res.json) setOutput("data", JSON.stringify(res.json));
}

/**
 * Determines if the current process is executing within a GitHub Actions environment.
 *
 * Verifies the presence and value of relevant environment variables to confirm execution under GitHub Actions.
 *
 * @returns True if running as a GitHub Action; otherwise, false.
 */
export function isGitHubAction() {
  return !!process.env.CI && process.env.GITHUB_ACTIONS === "true" && !!process.env.GITHUB_ACTION;
}

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
export function githubActionConfigure() {
  if (!isGitHubAction()) return {};
  const d = process.env.INPUT_DEBUG;
  if (d) debug.enable(d);
  // https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/troubleshooting-workflows/enabling-debug-logging#enabling-step-debug-logging
  const actionDebug = process.env.ACTIONS_STEP_DEBUG === "true";
  if (actionDebug) debug.enable("*");
  const actionId = process.env.GITHUB_ACTION;
  dbg(`action: %s`, actionId);
  const workflow = process.env.GITHUB_WORKFLOW;
  dbg(`workflow: %s`, workflow);
  const workspaceDir = process.env.GITHUB_WORKSPACE;
  dbg(`workspace: %s`, workspaceDir);
  return {
    actionId,
    workflow,
    workspaceDir,
  };
}
