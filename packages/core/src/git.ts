import { resolveFileContents } from "./file"
import { isGlobMatch } from "./glob"
import { runtimeHost } from "./host"
import { shellParse } from "./shell"
import { arrayify } from "./util"

export class GitClient implements Git {
    readonly git = "git"
    private _defaultBranch: string

    async defaultBranch(): Promise<string> {
        if (!this._defaultBranch) {
            const res = (
                await this.exec(
                    ["symbolic-ref", "refs/remotes/origin/HEAD"],
                    {}
                )
            )
                .replace("refs/remotes/origin/", "")
                .trim()
            this._defaultBranch = res
        }
        return this._defaultBranch
    }

    async exec(
        args: string | string[],
        options?: { label?: string }
    ): Promise<string> {
        const res = await runtimeHost.exec(
            undefined,
            this.git,
            Array.isArray(args) ? args : shellParse(args),
            options
        )
        return res.stdout
    }

    async findModifiedFiles(
        scope: "base" | "staged" | "modified",
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
        if (scope === "base" || scope === "staged") {
            const args = ["diff", "--name-only", "--diff-filter=AM"]
            if (scope === "base") {
                const base = options?.base || (await this.defaultBranch())
                args.push(base)
            } else args.push("--cached")
            GitClient.addFileFilters(paths, excludedPaths, args)
            const res = await this.exec(args, {
                label: `git list modified files in ${scope}`,
            })
            filenames = res.split("\n").filter((f) => f)
        } else {
            // ignore deleted files
            const rx = /^\s*(A|M|\?{1,2})\s+/gm
            const args = ["status", "--porcelain"]
            const res = await this.exec(args, {
                label: `git list modified files`,
            })
            filenames = res
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

    private static addFileFilters(
        paths: string[],
        excludedPaths: string[],
        args: string[]
    ) {
        if (paths.length > 0 || excludedPaths.length > 0) {
            if (!paths.length) paths.push(".")
            args.push("--")
            args.push(...paths)
            args.push(
                ...excludedPaths.map((p) => (p.startsWith(":!") ? p : ":!" + p))
            )
        }
    }

    async diff(options?: {
        staged?: boolean
        askStageOnEmpty?: boolean
        base?: string
        head?: string
        paths?: ElementOrArray<string>
        excludedPaths?: ElementOrArray<string>
        unified?: number
    }): Promise<string> {
        const paths = arrayify(options?.paths).filter((f) => !!f)
        const excludedPaths = arrayify(options?.excludedPaths).filter(
            (f) => !!f
        )
        const { staged, base, head, unified, askStageOnEmpty } = options || {}
        const args = ["diff"]
        if (staged) args.push("--staged")
        args.push("--ignore-all-space")
        if (unified > 0) args.push(`--unified=${unified}`)
        if (base && !head) args.push(base)
        else if (head && !base) args.push(`${head}^..${head}`)
        else if (base && head) args.push(`${base}..${head}`)
        GitClient.addFileFilters(paths, excludedPaths, args)
        let res = await this.exec(args)
        if (!res && staged && askStageOnEmpty) {
            const stage = await host.confirm(
                "No staged changes. Stage all changes?",
                {
                    default: true,
                }
            )
            if (stage) {
                await this.exec(["add", "."])
                res = await this.diff(options)
            }
        }
        return res
    }
}
