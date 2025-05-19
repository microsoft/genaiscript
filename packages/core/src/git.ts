// This file contains the GitClient class, which provides methods to interact with Git repositories.
// It includes functionality to find modified files, execute Git commands, and manage branches.

import { uniq } from "es-toolkit"
import {
    GENAISCRIPTIGNORE,
    GIT_DIFF_MAX_TOKENS,
    GIT_IGNORE_GENAI,
} from "./constants"
import { llmifyDiff } from "./llmdiff"
import { resolveFileContents } from "./file"
import { tryReadText, tryStat } from "./fs"
import { runtimeHost } from "./host"
import { shellParse, shellQuote } from "./shell"
import { arrayify, ellipse, logVerbose } from "./util"
import { approximateTokens } from "./tokens"
import { underscore } from "inflection"
import { rm } from "node:fs/promises"
import { packageResolveInstall } from "./packagemanagers"
import { normalizeInt } from "./cleaners"
import { dotGenaiscriptPath } from "./workdir"
import { join } from "node:path"
import { genaiscriptDebug } from "./debug"
const dbg = genaiscriptDebug("git")

async function checkDirectoryExists(directory: string): Promise<boolean> {
    const stat = await tryStat(directory)
    dbg(`directory exists: ${!!stat?.isDirectory()}`)
    return !!stat?.isDirectory()
}

function appendExtras(
    rest: Record<string, string | number | boolean>,
    args: string[]
) {
    Object.entries(rest)
        .filter(([, v]) => v !== undefined && typeof v !== "object")
        .forEach(([k, v]) =>
            args.push(
                v === true ? `--${underscore(k)}` : `--${underscore(k)}=${v}`
            )
        )
}

/**
 * GitClient class provides an interface to interact with Git.
 */
export class GitClient implements Git {
    readonly cwd: string
    readonly git = "git" // Git command identifier
    private _defaultBranch: string // Stores the default branch name

    constructor(cwd: string) {
        this.cwd = cwd || process.cwd()
    }

    private static _default: GitClient
    static default() {
        if (!this._default) this._default = new GitClient(undefined)
        return this._default
    }

    private async resolveExcludedPaths(options?: {
        excludedPaths?: ElementOrArray<string>
    }): Promise<string[]> {
        dbg(`resolving excluded paths`)
        const { excludedPaths } = options || {}
        const ep = arrayify(excludedPaths, { filterEmpty: true })
        const dp = (await tryReadText(GIT_IGNORE_GENAI))?.split("\n")
        dbg(`reading GENAISCRIPTIGNORE file`)
        const dp2 = (await tryReadText(GENAISCRIPTIGNORE))?.split("\n")
        const ps = [
            ...arrayify(ep, { filterEmpty: true }),
            ...arrayify(dp, { filterEmpty: true }),
            ...arrayify(dp2, { filterEmpty: true }),
        ]
        return uniq(ps)
    }

    /**
     * Retrieves the default branch name.
     * If not already set, it fetches from the Git remote.
     * @returns {Promise<string>} The default branch name.
     */
    async defaultBranch(): Promise<string> {
        if (this._defaultBranch === undefined) {
            dbg(`fetching default branch from remote`)
            const res = await this.exec(["remote", "show", "origin"], {
                valueOnError: "",
            })
            this._defaultBranch =
                /^\s*HEAD branch:\s+(?<name>.+)\s*$/m.exec(res)?.groups?.name ||
                ""
        }
        return this._defaultBranch
    }

    async fetch(
        remote?: OptionsOrString<"origin">,
        branchOrSha?: string,
        options?: {
            prune?: boolean
            all?: boolean
        }
    ): Promise<string> {
        const { prune, all, ...rest } = options || {}
        if (branchOrSha && !remote)
            throw new Error("remote is required when specifying branch or sha")
        const args = ["fetch", "--porcelain"]
        if (remote) args.push(remote)
        if (branchOrSha) args.push(branchOrSha)
        if (prune) args.push("--prune")
        if (all) args.push("--all")
        appendExtras(rest, args)
        return await this.exec(args)
    }

    /**
     * Pull changes from the remote repository.
     */
    async pull(options?: {
        /**
         * Whether to fast-forward the merge (`--ff`)
         */
        ff?: boolean
    }): Promise<string> {
        const { ff, ...rest } = options || {}
        const args = ["pull"]
        if (ff) args.push("--ff")
        appendExtras(rest, args)
        return await this.exec(args)
    }

    /**
     * Gets the current branch
     * @returns
     */
    async branch(): Promise<string> {
        dbg(`fetching current branch`)
        const res = await this.exec(["branch", "--show-current"], {
            valueOnError: "",
        })
        return res.trim()
    }

    async listBranches(): Promise<string[]> {
        dbg(`listing all branches`)
        const res = await this.exec(["branch", "--list"], { valueOnError: "" })
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
        options?: { label?: string; valueOnError?: string }
    ): Promise<string> {
        const { valueOnError } = options || {}
        const opts: ShellOptions = {
            ...(options || {}),
            cwd: this.cwd,
            env: {
                LC_ALL: "en_US",
            },
        }
        const eargs = Array.isArray(args) ? args : shellParse(args)
        dbg(`exec`, shellQuote(eargs))
        const res = await runtimeHost.exec(undefined, this.git, eargs, opts)
        dbg(`exec: exit code ${res.exitCode}`)
        if (res.stdout) dbg(res.stdout)
        if (res.exitCode !== 0) {
            dbg(`error: ${res.stderr}`)
            if (valueOnError !== undefined) return valueOnError
            throw new Error(res.stderr)
        }
        return res.stdout
    }

    /**
     * Finds modified files in the Git repository based on the specified scope.
     * @param scope The scope of modifications to find: "modified-base", "staged", or "modified". Default is "modified".
     * @param options Optional settings such as base branch, paths, and exclusions.
     * @returns {Promise<WorkspaceFile[]>} List of modified files.
     */
    async listFiles(
        scope?: "modified-base" | "staged" | "modified",
        options?: {
            base?: string
            paths?: ElementOrArray<string>
            excludedPaths?: ElementOrArray<string>
            askStageOnEmpty?: boolean
        }
    ): Promise<WorkspaceFile[]> {
        dbg(`listing files with scope: ${scope}`)
        scope = scope || "modified"
        const { askStageOnEmpty } = options || {}
        const paths = arrayify(options?.paths, { filterEmpty: true })
        const excludedPaths = await this.resolveExcludedPaths(options)

        let filenames: string[]
        if (scope === "modified-base" || scope === "staged") {
            dbg(`listing modified or staged files`)
            const args = ["diff", "--name-only", "--diff-filter=AM"]
            if (scope === "modified-base") {
                const base =
                    options?.base || `origin/${await this.defaultBranch()}`
                dbg(`using base branch: %s`, base)
                args.push(base)
            } else {
                dbg(`listing staged files`)
                args.push("--cached")
            }
            GitClient.addFileFilters(paths, excludedPaths, args)
            const res = await this.exec(args, {
                label: `git list modified files in ${scope}`,
            })
            filenames = res.split("\n").filter((f) => f)
            if (!filenames.length && scope == "staged" && askStageOnEmpty) {
                dbg(`asking to stage all changes`)
                // If no staged changes, optionally ask to stage all changes
                const stage = await runtimeHost.confirm(
                    "No staged changes. Stage all changes?",
                    {
                        default: true,
                    }
                )
                if (stage) {
                    dbg(`staging all changes`)
                    await this.exec(["add", "."])
                    filenames = (await this.exec(args))
                        .split("\n")
                        .filter((f) => f)
                }
            }
        } else {
            dbg(`listing modified files`)
            // For "modified" scope, ignore deleted files
            const rx = /^\s*(A|M|\?{1,2})\s+/gm
            const args = ["status", "--porcelain"]
            GitClient.addFileFilters(paths, excludedPaths, args)
            dbg(`executing git status`)
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
            if (!paths.length) {
                args.push(".")
            } else {
                args.push(...paths)
            }
            args.push(
                ...excludedPaths.map((p) => (p.startsWith(":!") ? p : ":!" + p))
            )
        }
    }

    async lastTag(): Promise<string> {
        dbg(`fetching last tag`)
        const res = await this.exec([
            "describe",
            "--tags",
            "--abbrev=0",
            "HEAD^",
        ])
        return res.split("\n")[0]
    }

    async lastCommitSha(): Promise<string> {
        dbg(`fetching last commit`)
        const res = await this.exec(["rev-parse", "HEAD"])
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

        dbg(`building git log command arguments`)
        const args = ["log", "--pretty=format:%h %ad %s", "--date=short"]
        if (!merges) {
            args.push("--no-merges")
        }
        if (author) {
            args.push(`--author`, author)
        }
        if (until) {
            args.push("--until", until)
        }
        if (after) {
            args.push("--after", after)
        }
        if (excludedGrep) {
            dbg(`excluding grep pattern: ${excludedGrep}`)
            const pattern =
                typeof excludedGrep === "string"
                    ? excludedGrep
                    : excludedGrep.source
            args.push(`--grep='${pattern}'`, "--invert-grep")
        }
        if (!isNaN(count)) {
            dbg(`limiting log to ${count} entries`)
            args.push(`-n`, String(count))
        }
        if (base && head) {
            dbg(`log range: ${base}..${head}`)
            args.push(`${base}..${head}`)
        }
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
     * Runs git blame in a file, line.
     * @param filename
     * @param line
     * @returns
     */
    async blame(filename: string, line: number): Promise<string> {
        const args = [
            "blame",
            filename,
            "-p",
            "-L",
            "-w",
            "--minimal",
            `${line},${line}`,
        ]
        const res = await this.exec(args)
        // part git blame porcelain format
        // The porcelain format includes the sha, line numbers, and original line
        const match = /^(?<sha>[a-f0-9]{40})\s+.*$/m.exec(res)
        return match?.groups?.sha || ""
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
        algorithm?: "patience" | "minimal" | "histogram" | "myers"
        extras?: string[]
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
            algorithm = "minimal",
            extras,
        } = options || {}
        const args = ["diff"]
        if (staged) {
            dbg(`including staged changes`)
            args.push("--staged")
        }
        if (unified > 0) {
            args.push("--ignore-all-space")
            args.push(`--unified=${unified}`)
        }
        if (nameOnly) {
            args.push("--name-only")
        }
        if (algorithm) {
            args.push(`--diff-algorithm=${algorithm}`)
        }
        if (extras?.length) {
            args.push(...extras)
        }
        if (base && !head) {
            dbg(`diff base: ${base}`)
            args.push(base)
        } else if (head && !base) {
            dbg(`diff head: ${head}`)
            args.push(`${head}^..${head}`)
        } else if (base && head) {
            dbg(`diff range: ${base}..${head}`)
            args.push(`${base}..${head}`)
        }
        GitClient.addFileFilters(paths, excludedPaths, args)
        let res = await this.exec(args)
        dbg(`executing diff command`)
        if (!res && staged && askStageOnEmpty) {
            // If no staged changes, optionally ask to stage all changes
            dbg(`asking to stage all changes`)
            const stage = await runtimeHost.confirm(
                "No staged changes. Stage all changes?",
                {
                    default: true,
                }
            )
            if (stage) {
                dbg(`staging all changes`)
                await this.exec(["add", "."])
                res = await this.exec(args)
            }
        }
        if (!nameOnly && llmify) {
            dbg(`llmifying diff`)
            res = llmifyDiff(res)
            dbg(`encoding diff`)
            const tokens = approximateTokens(res)
            if (tokens > maxTokensFullDiff) {
                dbg(`truncating diff due to token limit`)
                res = `## Diff
Truncated diff to large (${tokens} tokens). Diff files individually for details.

${ellipse(res, maxTokensFullDiff * 3)}
...

## Files
${await this.diff({ ...options, nameOnly: true })}
`
            }
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
             * branch to clone
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

            /**
             * Number of commits to fetch
             */
            depth?: number
            /**
             * Path to the directory to clone into
             */
            directory?: string
        }
    ): Promise<GitClient> {
        dbg(`cloning repository: ${repository}`)
        let { branch, force, install, depth, directory, ...rest } =
            options || {}
        depth = normalizeInt(depth)
        if (isNaN(depth)) depth = 1

        // normalize short github url
        // check if the repository is in the form of `owner/repo`
        if (/^(\w|-)+\/(\w|-)+$/.test(repository)) {
            repository = `https://github.com/${repository}`
        }
        const url = new URL(repository)
        if (!directory) {
            const sha = (
                await this.exec(["ls-remote", repository, branch || "HEAD"])
            ).split(/\s+/)[0]
            directory = dotGenaiscriptPath(
                "git",
                ...url.pathname.split(/\//g).filter((s) => !!s),
                branch || `HEAD`,
                sha
            )
        }
        logVerbose(`git: shallow cloning ${repository} to ${directory}`)
        if (await checkDirectoryExists(directory)) {
            if (!force && !install) {
                dbg(`directory already exists`)
                return new GitClient(directory)
            }
            dbg(`removing existing directory`)
            await rm(directory, { recursive: true, force: true })
        }
        const args = ["clone", "--depth", String(Math.max(1, depth))]
        if (branch) args.push("--branch", branch)
        appendExtras(rest, args)
        args.push(repository, directory)
        await this.exec(args)

        if (install) {
            dbg(`running install command after cloning`)
            const { command, args } = await packageResolveInstall(directory)
            if (command) {
                const res = await runtimeHost.exec(undefined, command, args, {
                    cwd: directory,
                })
                if (res.exitCode !== 0) {
                    throw new Error(res.stderr)
                }
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
