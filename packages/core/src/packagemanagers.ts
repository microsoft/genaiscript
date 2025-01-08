import { resolveCommand } from "package-manager-detector/commands"
import { detect } from "package-manager-detector/detect"

export async function packageResolveInstall(cwd: string) {
    const pm = await detect({ cwd })
    if (!pm) return undefined

    const { command, args } = resolveCommand(pm.agent, "frozen", [])
    return { command, args }
}
