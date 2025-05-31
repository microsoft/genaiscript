import debug from "debug"
import { genaiscriptDebug } from "../../core/src/debug"

const dbg = genaiscriptDebug("github:action")

// https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#default-environment-variables

export async function githubActionSetOutputs(res: GenerationOutput) {
    if (!isGitHubAction() || !process.env.GITHUB_OUTPUT) return

    dbg(`setting outputs`)
    const { setOutput } = await import("@actions/core")
    setOutput("text", res.text || "")
    if (res.json) setOutput("data", JSON.stringify(res.json))
}

export function isGitHubAction() {
    return (
        !!process.env.CI &&
        process.env.GITHUB_ACTIONS === "true" &&
        !!process.env.GITHUB_ACTION
    )
}

export function githubActionConfigure() {
    if (!isGitHubAction()) return {}
    const d = process.env.INPUT_DEBUG
    if (d) debug.enable(d)
    // https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/troubleshooting-workflows/enabling-debug-logging#enabling-step-debug-logging
    const actionDebug = process.env.ACTIONS_STEP_DEBUG === "true"
    if (actionDebug) debug.enable("*")
    const actionId = process.env.GITHUB_ACTION
    dbg(`action: %s`, actionId)
    const workflow = process.env.GITHUB_WORKFLOW
    dbg(`workflow: %s`, workflow)
    const workspaceDir = process.env.GITHUB_WORKSPACE
    dbg(`workspace: %s`, workspaceDir)
    return {
        actionId,
        workflow,
        workspaceDir,
    }
}
