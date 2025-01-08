// This file contains the GitClient class, which provides methods to interact with Git repositories.
// It includes functionality to find modified files, execute Git commands, and manage branches.

import { uniq } from "es-toolkit"
import { GIT_DIFF_MAX_TOKENS, GIT_IGNORE_GENAI } from "./constants"
import { llmifyDiff } from "./diff"
import { resolveFileContents } from "./file"
import { readText } from "./fs"
import { host, runtimeHost } from "./host"
import { shellParse } from "./shell"
import { arrayify, dotGenaiscriptPath } from "./util"
import { estimateTokens, truncateTextToTokens } from "./tokens"
import { resolveTokenEncoder } from "./encoders"
import { underscore } from "inflection"
import { rm, lstat } from "node:fs/promises"
import { packageResolveInstall } from "./packagemanagers"

async function checkDirectoryExists(directory: string): Promise<boolean> {
    try {
        const stats = await lstat(directory)
        return stats.isDirectory()
    } catch {
        return false
    }
}

/**
 * GitClient class provides an interface to interact with Git.
 */
export class GitClient implements Git {
    readonly cwd: string
    readonly git = "git" // Git command identifier
    private _defaultBranch: string // Stores the default branch name
    private _branch: string // Stores the current branch name

    constructor(cwd: string) {
        this.cwd = cwd
    }

    private async resolveExcludedPaths(options?: {
        excludedPaths?: ElementOrArray<string>
    }): Promise<string[]> {
        const { excludedPaths } = options || {}
        const ep = arrayify(excludedPaths, { filterEmpty: true })
        const dp = (await readText(GIT_IGNORE_GENAI))?.split("\n")
        const ps = [
            ...arrayify(ep, { filterEmpty: true }),
            ...arrayify(dp, { filterEmpty: true }),
        ]
        return uniq(ps)
    }

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
        if (!this._branch) {
            const res = await this.exec(["branch", "--show-current"])
            this._branch = res.trim()
        }
        return this._branch
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
        const opts = {
            ...(options || {}),
            cwd: this.cwd,
        }
        const res = await runtimeHost.exec(
            undefined,
            this.git,
            Array.isArray(args) ? args : shellParse(args),
            opts
        )
        if (res.exitCode !== 0) throw new Error(res.stderr)
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
            excludedPaths?: ElementOrArray<string>
            askStageOnEmpty?: boolean
        }
    ): Promise<WorkspaceFile[]> {
        const { askStageOnEmpty } = options || {}
        const paths = arrayify(options?.paths, { filterEmpty: true })
        const excludedPaths = await this.resolveExcludedPaths(options)

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
            GitClient.addFileFilters(paths, excludedPaths, args)
            const res = await this.exec(args, {
                label: `git list modified files`,
            })
            filenames = res
                .split("\n")
                .filter((f) => rx.test(f))
                .map((f) => f.replace(rx, "").trim())
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
            args.push("--")
            if (!paths.length) args.push(".")
            else args.push(...paths)
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
        author?: string
        until?: string
        after?: string
        count?: number
        excludedGrep?: string | RegExp
        paths?: ElementOrArray<string>
        excludedPaths?: ElementOrArray<string>
    }): Promise<GitCommit[]> {
        const {
            base,
            head,
            merges,
            excludedGrep,
            count,
            author,
            until,
            after,
        } = options || {}
        const paths = arrayify(options?.paths, { filterEmpty: true })
        const excludedPaths = await this.resolveExcludedPaths(options)

        const args = ["log", "--pretty=format:%h %ad %s", "--date=short"]
        if (!merges) args.push("--no-merges")
        if (author) args.push(`--author`, author)
        if (until) args.push("--until", until)
        if (after) args.push("--after", after)
        if (excludedGrep) {
            const pattern =
                typeof excludedGrep === "string"
                    ? excludedGrep
                    : excludedGrep.source
            args.push(`--grep='${pattern}'`, "--invert-grep")
        }
        if (!isNaN(count)) args.push(`-n`, String(count))
        if (base && head) args.push(`${base}..${head}`)
        GitClient.addFileFilters(paths, excludedPaths, args)
        const res = await this.exec(args)
        const commits = res
            .split("\n")
            .map(
                (line) =>
                    /^(?<sha>[a-z0-9]{6,40})\s+(?<date>\d{4,4}-\d{2,2}-\d{2,2})\s+(?<message>.*)$/.exec(
                        line
                    )?.groups
            )
            .filter((g) => !!g)
            .map(
                (g) =>
                    <GitCommit>{
                        sha: g?.sha,
                        date: g?.date,
                        message: g?.message,
                    }
            )
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
        nameOnly?: boolean
        llmify?: boolean
        /**
         * Maximum of tokens before returning a name-only diff
         */
        maxTokensFullDiff?: number
    }): Promise<string> {
        const paths = arrayify(options?.paths, { filterEmpty: true })
        const excludedPaths = await this.resolveExcludedPaths(options)
        const {
            staged,
            base,
            head,
            unified,
            askStageOnEmpty,
            nameOnly,
            maxTokensFullDiff = GIT_DIFF_MAX_TOKENS,
            llmify,
        } = options || {}
        const args = ["diff"]
        if (staged) args.push("--staged")
        args.push("--ignore-all-space")
        if (unified > 0) args.push(`--unified=${unified}`)
        if (nameOnly) args.push("--name-only")
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
        if (!nameOnly && llmify) {
            res = llmifyDiff(res)
            const { encode: encoder } = await resolveTokenEncoder(
                runtimeHost.modelAliases.large.model
            )
            const tokens = estimateTokens(res, encoder)
            if (tokens > maxTokensFullDiff)
                res = `## Diff
Truncated diff to large (${tokens} tokens). Diff files individually for details.

${truncateTextToTokens(res, maxTokensFullDiff, encoder)}
...

## Files
${await this.diff({ ...options, nameOnly: true })}
`
        }
        return res
    }

    /**
     * Create a shallow git clone
     * @param repository URL of the remote repository
     * @param options various clone options
     */
    async shallowClone(
        repository: string,
        options?: {
            /**
             * Brnach to clone
             */
            branch?: string

            /**
             * Do not reuse previous clone
             */
            force?: boolean

            /**
             * Runs install command after cloning
             */
            install?: boolean
        }
    ): Promise<GitClient> {
        let { branch, force, install, ...rest } = options || {}

        // normalize short github url
        // check if the repository is in the form of `owner/repo`
        if (/^(\w|-)+\/(\w|-)+$/.test(repository)) {
            repository = `https://github.com/${repository}`
        }
        const url = new URL(repository)
        const sha = (
            await this.exec(["ls-remote", repository, branch || "HEAD"])
        ).split(/\s+/)[0]
        let directory = dotGenaiscriptPath(
            "git",
            ...url.pathname.split(/\//g).filter((s) => !!s),
            branch || `HEAD`,
            sha
        )
        if (branch) directory = host.path.join(directory, branch)
        if (await checkDirectoryExists(directory)) {
            if (!force) return new GitClient(directory)
            await rm(directory, { recursive: true, force: true })
        }
        const args = ["clone", "--depth", "1"]
        if (branch) args.push("--branch", branch)
        Object.entries(rest).forEach(([k, v]) =>
            args.push(
                v === true ? `--${underscore(k)}` : `--${underscore(k)}=${v}`
            )
        )
        args.push(repository, directory)
        await this.exec(args)

        if (install) {
            const { command, args } = await packageResolveInstall(directory)
            if (command) {
                const res = await runtimeHost.exec(undefined, command, args, {
                    cwd: directory,
                })
                if (res.exitCode !== 0) throw new Error(res.stderr)
            }
        }

        return new GitClient(directory)
    }

    client(cwd: string) {
        return new GitClient(cwd)
    }

    toString() {
        return `git ${this.cwd || ""}`
    }
}
