// This file contains the GitClient class, which provides methods to interact with Git repositories.
// It includes functionality to find modified files, execute Git commands, and manage branches.

import { llmifyDiff } from "./diff"
import { resolveFileContents } from "./file"
import { isGlobMatch } from "./glob"
import { runtimeHost } from "./host"
import { shellParse } from "./shell"
import { arrayify } from "./util"

/**
 * GitClient class provides an interface to interact with Git.
 */
export class GitClient implements Git {
    readonly git = "git" // Git command identifier
    private _defaultBranch: string // Stores the default branch name

    /**
     * Retrieves the default branch name.
     * If not already set, it fetches from the Git remote.
     * @returns {Promise<string>} The default branch name.
     */
    async defaultBranch(): Promise<string> {
        if (!this._defaultBranch) {
            const res = await this.exec(["remote", "show", "origin"], {})
            this._defaultBranch = /^\s*HEAD branch:\s+(?<name>.+)\s*$/m.exec(
                res
            )?.groups?.name
        }
        return this._defaultBranch
    }

    /**
     * Gets the current branch
     * @returns
     */
    async branch(): Promise<string> {
        const res = await this.exec(["branch", "--show-current"])
        return res.trim()
    }

    async listBranches(): Promise<string[]> {
        const res = await this.exec(["branch", "--list"])
        return res
            .split("\n")
            .map((b) => b.trim())
            .filter((f) => !!f)
    }

    /**
     * Executes a Git command with given arguments.
     * @param args Git command arguments.
     * @param options Optional command options with a label.
     * @returns {Promise<string>} The standard output from the command.
     */
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

    /**
     * Finds modified files in the Git repository based on the specified scope.
     * @param scope The scope of modifications to find: "modified-base", "staged", or "modified".
     * @param options Optional settings such as base branch, paths, and exclusions.
     * @returns {Promise<WorkspaceFile[]>} List of modified files.
     */
    async listFiles(
        scope: "modified-base" | "staged" | "modified",
        options?: {
            base?: string
            paths?: ElementOrArray<string>
            askStageOnEmpty?: boolean
            excludedPaths?: ElementOrArray<string>
        }
    ): Promise<WorkspaceFile[]> {
        const { askStageOnEmpty } = options || {}
        const paths = arrayify(options?.paths, { filterEmpty: true })
        const excludedPaths = arrayify(options?.excludedPaths, {
            filterEmpty: true,
        })

        let filenames: string[]
        if (scope === "modified-base" || scope === "staged") {
            const args = ["diff", "--name-only", "--diff-filter=AM"]
            if (scope === "modified-base") {
                const base = options?.base || (await this.defaultBranch())
                args.push(base)
            } else args.push("--cached")
            GitClient.addFileFilters(paths, excludedPaths, args)
            const res = await this.exec(args, {
                label: `git list modified files in ${scope}`,
            })
            filenames = res.split("\n").filter((f) => f)
            if (!filenames.length && scope == "staged" && askStageOnEmpty) {
                // If no staged changes, optionally ask to stage all changes
                const stage = await runtimeHost.confirm(
                    "No staged changes. Stage all changes?",
                    {
                        default: true,
                    }
                )
                if (stage) {
                    await this.exec(["add", "."])
                    filenames = (await this.exec(args))
                        .split("\n")
                        .filter((f) => f)
                }
            }
        } else {
            // For "modified" scope, ignore deleted files
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

    /**
     * Adds file path filters to Git command arguments.
     * @param paths Paths to include.
     * @param excludedPaths Paths to exclude.
     * @param args Git command arguments.
     */
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

    async lastTag(): Promise<string> {
        const res = await this.exec([
            "describe",
            "--tags",
            "--abbrev=0",
            "HEAD^",
        ])
        return res.split("\n")[0]
    }

    async log(options?: {
        base?: string
        head?: string
        merges?: boolean
        excludedGrep?: string | RegExp
        paths?: ElementOrArray<string>
        excludedPaths?: ElementOrArray<string>
    }): Promise<GitCommit[]> {
        const { base, head, merges, excludedGrep } = options || {}
        const paths = arrayify(options?.paths, { filterEmpty: true })
        const excludedPaths = arrayify(options?.excludedPaths, {
            filterEmpty: true,
        })

        const args = ["log", "--pretty=oneline"]
        if (!merges) args.push("--no-merges")
        if (excludedGrep) {
            const pattern =
                typeof excludedGrep === "string"
                    ? excludedGrep
                    : excludedGrep.source
            args.push(`--grep='${pattern}'`, "--invert-grep")
        }
        if (base && head) args.push(`${base}..${head}`)
        GitClient.addFileFilters(paths, excludedPaths, args)
        const res = await this.exec(args)
        const commits = res
            .split("\n")
            .map(
                (line) =>
                    /^(?<sha>[a-z0-9]{40,40})\s+(?<message>.*)$/.exec(line)
                        ?.groups
            )
            .filter((g) => !!g)
            .map((g) => <GitCommit>{ sha: g?.sha, message: g?.message })
        return commits
    }

    /**
     * Generates a diff of changes based on provided options.
     * @param options Options such as staged flag, base, head, paths, and exclusions.
     * @returns {Promise<string>} The diff output.
     */
    async diff(options?: {
        staged?: boolean
        askStageOnEmpty?: boolean
        base?: string
        head?: string
        paths?: ElementOrArray<string>
        excludedPaths?: ElementOrArray<string>
        unified?: number
        llmify?: boolean
    }): Promise<string> {
        const paths = arrayify(options?.paths, { filterEmpty: true })
        const excludedPaths = arrayify(options?.excludedPaths, {
            filterEmpty: true,
        })
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
            // If no staged changes, optionally ask to stage all changes
            const stage = await runtimeHost.confirm(
                "No staged changes. Stage all changes?",
                {
                    default: true,
                }
            )
            if (stage) {
                await this.exec(["add", "."])
                res = await this.exec(args)
            }
        }
        if (options?.llmify) res = llmifyDiff(res)
        return res
    }
}
