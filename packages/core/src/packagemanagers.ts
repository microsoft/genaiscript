import { resolveCommand } from "package-manager-detector/commands"
import { detect } from "package-manager-detector/detect"

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
