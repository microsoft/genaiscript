import { resolveFileContents } from "./file"
import { isGlobMatch } from "./glob"
import { runtimeHost } from "./host"
import { arrayify } from "./util"

export class GitClient implements Git {
    readonly git = "git"
    private _defaultBranch: string

    async defaultBranch(): Promise<string> {
        if (!this._defaultBranch) {
            const res = (
                await runtimeHost.exec(
                    undefined,
                    this.git,
                    ["symbolic-ref", "refs/remotes/origin/HEAD"],
                    {}
                )
            ).stdout
                .replace("refs/remotes/origin/", "")
                .trim()
            this._defaultBranch = res
        }
        return this._defaultBranch
    }

    async findModifiedFiles(
        scope: "branch" | "staged" | "modified",
        options?: {
            base?: string
            paths?: ElementOrArray<string>
            excludedPaths?: ElementOrArray<string>
        }
    ): Promise<WorkspaceFile[]> {
        const paths = arrayify(options?.paths).filter((f) => !!f)
        const excludedPaths = arrayify(options?.excludedPaths).filter(
            (f) => !!f
        )
        let filenames: string[]
        if (scope === "branch" || scope === "staged") {
            const args = ["diff", "--name-only", "--diff-filter=AM"]
            if (scope === "branch") {
                const base = options?.base || (await this.defaultBranch())
                args.push(base)
            } else args.push("--cached")
            if (paths.length > 0 || excludedPaths.length > 0) {
                if (!paths.length) paths.push(".")
                args.push("--")
                args.push(...paths)
                args.push(...excludedPaths.map((p) => ":!" + p))
            }
            const res = await runtimeHost.exec(undefined, this.git, args, {
                label: `git list modified files in ${scope}`,
            })
            filenames = res.stdout.split("\n").filter((f) => f)
        } else {
            // ignore deleted files
            const rx = /^\s*(A|M|\?{1,2})\s+/gm
            const args = ["status", "--porcelain"]
            const res = await runtimeHost.exec(undefined, this.git, args, {
                label: `git list modified files`,
            })
            filenames = res.stdout
                .split("\n")
                .filter((f) => rx.test(f))
                .map((f) => f.replace(rx, "").trim())
            if (paths.length)
                filenames = filenames.filter((f) => isGlobMatch(f, paths))
            if (excludedPaths.length)
                filenames = filenames.filter(
                    (f) => !isGlobMatch(f, excludedPaths)
                )
        }

        const files = filenames.map((filename) => ({ filename }))
        await resolveFileContents(files)
        return files
    }
}
