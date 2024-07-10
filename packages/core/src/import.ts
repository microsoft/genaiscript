import { runtimeHost } from "./host"
import { MarkdownTrace } from "./trace"
import { fileExists } from "./fs"

export async function installImport(
    id: string,
    version: string,
    trace?: MarkdownTrace
) {
    const cwd = runtimeHost.installFolder()
    const yarn = await fileExists(runtimeHost.path.join(cwd, "yarn.lock"))
    const command = yarn ? "yarn" : "npm"
    const mod = `${id}@${version}`
    const args = yarn
        ? ["add", mod]
        : ["install", "--no-save", "--ignore-scripts", mod]
    const res = await runtimeHost.exec(undefined, command, args, {
        cwd,
        trace
    })
    return res.exitCode === 0
}

export type PromiseType<T extends Promise<any>> =
    T extends Promise<infer U> ? U : never
