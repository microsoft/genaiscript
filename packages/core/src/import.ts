import { exec } from "./exec"
import { host } from "./host"
import { MarkdownTrace } from "./trace"
import { fileExists } from "./fs"

export async function installImport(
    id: string,
    version: string,
    trace?: MarkdownTrace
) {
    const cwd = host.installFolder()
    const yarn = await fileExists(host.path.join(cwd, "yarn.lock"))
    const command = yarn ? "yarn" : "npm"
    const mod = `${id}@${version}`
    const args = yarn
        ? ["add", mod]
        : ["install", "--no-save", "--ignore-scripts", mod]
    const res = await exec(host, {
        trace,
        label: `install ${mod}`,
        keepOnError: true,
        call: {
            command,
            args,
            cwd,
        },
    })
    return res.exitCode === 0
}

export type PromiseType<T extends Promise<any>> =
    T extends Promise<infer U> ? U : never
