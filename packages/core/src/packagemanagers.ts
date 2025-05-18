import { resolveCommand, detect, Agent } from "package-manager-detector"
import { genaiscriptDebug } from "./debug"
const dbg = genaiscriptDebug("pkg")

/**
 * Resolves the install command for the detected package manager in a given directory.
 *
 * @param cwd - The current working directory where the package manager should be detected.
 * @returns The resolved command and arguments for a "frozen" install mode, or undefined if no package manager is detected.
 */
export async function packageResolveInstall(cwd: string) {
    const pm = await detect({ cwd })
    if (!pm) return undefined

    const { command, args } = resolveCommand(pm.agent, "frozen", [])
    return { command, args }
}

export async function packageResolveExecute(
    cwd: string,
    args: string[],
    options?: {
        agent?: "npm" | "yarn" | "pnpm" | "auto"
    }
): Promise<{
    command: string
    args: string[]
}> {
    dbg(`resolving`)
    args = args.filter((a) => a !== undefined)
    let agent: Agent = options?.agent === "auto" ? undefined : options?.agent
    if (!agent) {
        const pm = await detect({ cwd })
        if (
            pm &&
            (pm.agent === "npm" ||
                pm.agent === "pnpm" ||
                pm.agent === "pnpm@6" ||
                pm.agent === "yarn" ||
                pm.agent === "yarn@berry")
        )
            agent = pm.agent
    }
    agent = agent || "npm"
    dbg(`agent: %s`, agent)
    if (agent === "npm") args.unshift("--yes")
    const resolved = resolveCommand(
        agent,
        "execute",
        args.filter((a) => a !== undefined)
    )
    dbg(`resolved: %o`, resolved)
    return resolved
}
