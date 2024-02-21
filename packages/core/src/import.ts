import { exec } from "./exec"
import { host } from "./host"
import { MarkdownTrace } from "./trace"
import { fileExists } from "./fs"

export async function installImport(id: string, trace?: MarkdownTrace) {
    const cwd = host.installFolder()
    const yarn = await fileExists(host.path.join(cwd, "yarn.lock"))
    const command = yarn ? "yarn" : "npm"
    const args = yarn
        ? ["add", id]
        : ["install", "--no-save", "--ignore-scripts", id]
    const res = await exec(host, {
        trace,
        label: `install ${id}`,
        call: {
            type: "shell",
            command,
            args,
            cwd,
        },
    })
    return res.exitCode === 0
}


export type PromiseType<T extends Promise<any>> =
    T extends Promise<infer U> ? U : never
