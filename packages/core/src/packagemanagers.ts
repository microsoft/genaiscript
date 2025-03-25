import { resolveCommand } from "package-manager-detector/commands"
import { detect } from "package-manager-detector/detect"

/**
 * Resolves the command and arguments required to install
 * a package using the detected package manager in the
 * specified working directory.
 *
 * @param cwd - The current working directory to detect the package manager.
 * @returns An object containing the command and arguments if a package manager is detected; otherwise, returns undefined.
 */
export async function packageResolveInstall(cwd: string) {
    const pm = await detect({ cwd })
    if (!pm) return undefined

    const { command, args } = resolveCommand(pm.agent, "frozen", [])
    return { command, args }
}
