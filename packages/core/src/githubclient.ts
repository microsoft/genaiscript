import type { Octokit } from "@octokit/rest"
import type { PaginateInterface } from "@octokit/plugin-paginate-rest"
import {
    GITHUB_API_VERSION,
    GITHUB_ASSET_BRANCH,
    GITHUB_ASSET_URL_RX,
    GITHUB_PULL_REQUEST_REVIEW_COMMENT_LINE_DISTANCE,
    GITHUB_REST_API_CONCURRENCY_LIMIT,
    GITHUB_REST_PAGE_DEFAULT,
    GITHUB_TOKENS,
    TOOL_ID,
} from "./constants"
import { createFetch } from "./fetch"
import { runtimeHost } from "./host"
import { prettifyMarkdown } from "./markdown"
import { arrayify, assert, ellipse, logError, logVerbose } from "./util"
import { shellRemoveAsciiColors } from "./shell"
import { isGlobMatch } from "./glob"
import { concurrentLimit } from "./concurrency"
import { llmifyDiff } from "./llmdiff"
import { JSON5TryParse } from "./json5"
import { link } from "./mkmd"
import { errorMessage } from "./error"
import { deleteUndefinedValues, normalizeInt } from "./cleaners"
import { diffCreatePatch } from "./diff"
import { GitClient } from "./git"
import { genaiscriptDebug } from "./debug"
import { fetch } from "./fetch"
import { resolveBufferLike } from "./bufferlike"
import { fileTypeFromBuffer } from "./filetype"
import { createHash } from "node:crypto"
import { CancellationOptions, checkCancelled } from "./cancellation"
import { diagnosticToGitHubMarkdown } from "./annotations"
import { TraceOptions } from "./trace"
import { unzip } from "./zip"
import { uriRedact, uriTryParse } from "./url"
const dbg = genaiscriptDebug("github")

export interface GithubConnectionInfo {
    token: string
    apiUrl?: string
    repository: string
    owner: string
    repo: string
    ref?: string
    refName?: string
    sha?: string
    issue?: number
    runId?: string
    runUrl?: string
    commitSha?: string
}

function readGitHubToken(env: Record<string, string>) {
    let token: string
    for (const envName of GITHUB_TOKENS) {
        token = env[envName]
        if (token) {
            dbg(`found %s`, envName)
            break
        }
    }
    return token
}

function githubFromEnv(env: Record<string, string>): GithubConnectionInfo {
    const token = readGitHubToken(env)
    const apiUrl = env.GITHUB_API_URL || "https://api.github.com"
    const repository = env.GITHUB_REPOSITORY
    const [owner, repo] = repository?.split("/", 2) || [undefined, undefined]
    const ref = env.GITHUB_REF
    const refName = env.GITHUB_REF_NAME
    const sha = env.GITHUB_SHA
    const commitSha = env.GITHUB_COMMIT_SHA
    const runId = env.GITHUB_RUN_ID
    const serverUrl = env.GITHUB_SERVER_URL
    const runUrl =
        serverUrl && runId
            ? `${serverUrl}/${repository}/actions/runs/${runId}`
            : undefined
    const issue = normalizeInt(
        env.GITHUB_ISSUE ??
            /^refs\/pull\/(?<issue>\d+)\/merge$/.exec(ref || "")?.groups?.issue
    )

    return deleteUndefinedValues({
        token,
        apiUrl,
        repository,
        owner,
        repo,
        ref,
        refName,
        sha,
        issue,
        runId,
        runUrl,
        commitSha,
    }) satisfies GithubConnectionInfo
}

async function githubGetPullRequestNumber() {
    const res = await runtimeHost.exec(
        undefined,
        "gh",
        ["pr", "view", "--json", "number"],
        {
            label: "github: resolve current pull request number",
        }
    )
    if (res.failed) {
        logVerbose(res.stderr)
        return undefined
    }
    const resj = JSON5TryParse(res.stdout) as { number: number }
    const id = resj?.number
    logVerbose(`github: pull request number: ${isNaN(id) ? "not found" : id}`)
    return id
}

/**
 * Parses GitHub environment variables to construct connection info for API usage.
 *
 * @param env - Environment variables to parse, typically `process.env`.
 * @param options - Optional parameters:
 *   - issue: The issue number to set explicitly.
 *   - resolveIssue: Flag to resolve issue number via the GitHub CLI if not provided.
 *   - owner: Repository owner to override environment variables.
 *   - repo: Repository name to override environment variables.
 * @returns A promise resolving to an object containing parsed GitHub connection information, including owner, repo, repository, issue, and token details.
 *
 * Notes:
 * - If owner, repo, or repository details are missing, attempts to resolve them using the GitHub CLI.
 * - If issue resolution is enabled and not provided, tries to determine the pull request number via the GitHub CLI.
 * - Handles errors gracefully by logging verbose error messages but does not throw.
 */
export async function githubParseEnv(
    env: Record<string, string>,
    options?: {
        issue?: number
        resolveToken?: boolean
        resolveIssue?: boolean
        resolveCommit?: boolean
    } & Partial<Pick<GithubConnectionInfo, "owner" | "repo">> &
        TraceOptions &
        CancellationOptions
): Promise<GithubConnectionInfo> {
    dbg(`resolving connection info`)
    const res = githubFromEnv(env)
    dbg(`found %O`, Object.keys(res).join(","))
    try {
        if (options?.owner && options?.repo) {
            res.owner = options.owner
            dbg(`overriding owner with options.owner: ${options.owner}`)
            res.repo = options.repo
            dbg(`overriding repo with options.repo: ${options.repo}`)
            res.repository = res.owner + "/" + res.repo
        }
        if (!isNaN(options?.issue)) {
            dbg(`overriding issue with options.issue: ${options.issue}`)
            res.issue = options.issue
        }
        if (!res.owner || !res.repo || !res.repository) {
            dbg(
                `owner, repo, or repository missing, attempting to resolve via gh CLI`
            )
            const repoInfo = await runtimeHost.exec(
                undefined,
                "gh",
                ["repo", "view", "--json", "url,name,owner"],
                options
            )
            if (repoInfo.failed) {
                dbg(repoInfo.stderr)
            } else if (!repoInfo.failed) {
                const { name: repo, owner } = JSON.parse(repoInfo.stdout)
                dbg(`retrieved repository info via gh CLI: ${repoInfo.stdout}`)
                res.repo = repo
                res.owner = owner.login
                res.repository = res.owner + "/" + res.repo
            }
        }
        if (isNaN(res.issue) && options?.resolveIssue) {
            dbg(`attempting to resolve issue number`)
            res.issue = await githubGetPullRequestNumber()
        }
        if (!res.commitSha && options?.resolveCommit) {
            res.commitSha = await GitClient.default().lastCommitSha()
        }
        if (!res.token && options?.resolveToken) {
            const auth = await runtimeHost.exec(
                undefined,
                "gh",
                ["auth", "token"],
                options
            )
            if (!auth.failed) {
                dbg(
                    `retrieved token via gh CLI: %s...`,
                    auth.stdout.slice(0, 3)
                )
                res.token = auth.stdout.trim()
            }
        }
    } catch (e) {
        dbg(errorMessage(e))
    }

    deleteUndefinedValues(res)
    dbg(
        `resolved connection info: %O`,
        Object.fromEntries(
            Object.entries(res).map(([k, v]) => [k, k === "token" ? "***" : v])
        )
    )
    return Object.freeze(res)
}

/**
 * Updates the description of a pull request on GitHub.
 * Parameters:
 * - script: The script instance used to generate the footer.
 * - info: Object containing apiUrl, repository, issue, and runUrl. The issue field must be provided.
 * - text: The new description text to update. It will be prettified, merged with the existing description, and appended with a footer.
 * - commentTag: Tag used to identify and merge the description. Must be provided.
 * Returns:
 * - An object indicating whether the update was successful and the status text.
 * Notes:
 * - Requires a valid GitHub token to authenticate API requests.
 * - If the issue number is missing, the update will not proceed.
 */
export async function githubUpdatePullRequestDescription(
    script: PromptScript,
    info: GithubConnectionInfo,
    text: string,
    commentTag: string,
    options?: CancellationOptions
) {
    const { cancellationToken } = options ?? {}
    const { apiUrl, repository, issue, token } = info
    assert(!!commentTag)

    if (!issue) {
        dbg(`missing issue number, cannot update pull request description`)
        return { updated: false, statusText: "missing issue number" }
    }
    if (!token) {
        dbg(`missing github token, cannot update pull request description`)
        return { updated: false, statusText: "missing github token" }
    }

    text = prettifyMarkdown(text)
    text += generatedByFooter(script, info)

    const fetch = await createFetch({ retryOn: [], cancellationToken })
    const url = `${apiUrl}/repos/${repository}/pulls/${issue}`
    dbg(`fetching pull request details from URL: ${url}`)
    // get current body
    const resGet = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
        },
    })
    const resGetJson = (await resGet.json()) as {
        body: string
        html_url: string
    }
    const body = mergeDescription(commentTag, resGetJson.body, text)
    dbg(`merging pull request description`)
    const res = await fetch(url, {
        method: "PATCH",
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
        },
        body: JSON.stringify({ body }),
    })
    const r = {
        updated: res.status === 200,
        statusText: res.statusText,
    }

    if (!r.updated) {
        logError(
            `pull request ${resGetJson.html_url} update failed, ${r.statusText}`
        )
    } else {
        logVerbose(`pull request ${resGetJson.html_url} updated`)
    }

    return r
}

/**
 * Merges a new comment or text segment into the existing body, enclosed
 * within the specified comment tags. If tags exist, updates the content
 * between them; otherwise, appends the entire section.
 *
 * @param commentTag - The unique identifier tag used to demarcate the section
 *                     in the body where merging occurs.
 * @param body - The existing text or content to be updated.
 * @param text - The new content to merge into the body.
 * @returns Updated body text with merged and formatted content.
 */
export function mergeDescription(
    commentTag: string,
    body: string,
    text: string
) {
    body = body ?? ""
    const tag = `<!-- genaiscript begin ${commentTag} -->`
    const endTag = `<!-- genaiscript end ${commentTag} -->`
    const sep = "\n\n"

    const start = body.indexOf(tag)
    const end = body.indexOf(endTag)
    const header = "<hr/>"
    if (start > -1 && end > -1 && start < end) {
        body =
            body.slice(0, start + tag.length) +
            header +
            sep +
            text +
            sep +
            body.slice(end)
    } else {
        body = body + sep + tag + header + sep + text + sep + endTag + sep
    }
    return body
}

/**
 * Generates a footer indicating the content was AI-generated.
 *
 * @param script - The script instance responsible for generating the content.
 * @param info - An object containing metadata, such as the URL to the workflow run.
 *   - runUrl - Optional URL to the current workflow or run.
 * @param code - Optional identifier code to be appended to the footer.
 * @returns A formatted string serving as a footer, warning readers about the AI-generated content.
 */
export function generatedByFooter(
    script: PromptScript,
    info: { runUrl?: string },
    code?: string
) {
    return `\n\n> AI-generated content by ${link(script.id, info.runUrl)}${code ? ` \`${code}\` ` : ""} may be incorrect. Use reactions to eval.\n\n`
}

/**
 * Appends an AI-generated comment with diagnostic details to a script.
 *
 * @param script - The script instance where the comment will be appended.
 * @param info - Contains contextual information such as the run URL for generating the footer link.
 *   - runUrl - The URL of the workflow or job run, if available.
 * @param annotation - The diagnostic information to include in the comment.
 *   - message - The diagnostic message to be displayed.
 *   - code - An optional code identifier related to the diagnostic.
 *   - severity - The level of severity (e.g., warning or error) for the diagnostic.
 * @returns A formatted Markdown string representing the AI-generated comment with a footer and diagnostic details.
 */
export function appendGeneratedComment(
    script: PromptScript,
    info: { runUrl?: string; owner: string; repo: string },
    annotation: Diagnostic
) {
    const { message, code, severity, suggestion } = annotation
    const text = prettifyMarkdown(message)
    return `<!-- genaiscript ${severity} ${code || ""} -->
${text}${suggestion ? `\n\n\`\`\`suggestion\n${suggestion}\n\`\`\`\n` : ""}
${generatedByFooter(script, info, code)}`
}

// https://docs.github.com/en/rest/issues/comments?apiVersion=2022-11-28#create-an-issue-comment
export async function githubCreateIssueComment(
    script: PromptScript,
    info: GithubConnectionInfo,
    body: string,
    commentTag: string,
    options?: CancellationOptions
): Promise<{ created: boolean; statusText: string; html_url?: string }> {
    const { cancellationToken } = options ?? {}
    const { apiUrl, repository, issue, token } = info

    if (!issue) {
        dbg(`missing issue number, cannot create issue comment`)
        return { created: false, statusText: "missing issue number" }
    }
    if (!token) {
        dbg(`missing github token, cannot create issue comment`)
        return { created: false, statusText: "missing github token" }
    }

    const fetch = await createFetch({ retryOn: [], cancellationToken })
    const url = `${apiUrl}/repos/${repository}/issues/${issue}/comments`
    dbg(`creating issue comment at %s`, url)

    body = prettifyMarkdown(body)
    body += generatedByFooter(script, info)

    dbg(`body:\n%s`, body)

    if (commentTag) {
        const tag = `<!-- genaiscript ${commentTag} -->`
        body = `${body}\n\n${tag}\n\n`
        // try to find the existing comment
        const resListComments = await fetch(
            `${url}?per_page=100&sort=updated`,
            {
                headers: {
                    Accept: "application/vnd.github+json",
                    Authorization: `Bearer ${token}`,
                    "X-GitHub-Api-Version": GITHUB_API_VERSION,
                },
            }
        )
        if (resListComments.status !== 200) {
            dbg(`failed to list existing comments`)
            return { created: false, statusText: resListComments.statusText }
        }
        const comments = (await resListComments.json()) as {
            id: string
            body: string
        }[]
        dbg(`comments: %O`, comments)
        const comment = comments.find((c) => c.body.includes(tag))
        if (comment) {
            dbg(`found existing comment %s with tag, deleting it`, comment.id)
            const delurl = `${apiUrl}/repos/${repository}/issues/comments/${comment.id}`
            const resd = await fetch(delurl, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-GitHub-Api-Version": GITHUB_API_VERSION,
                },
            })
            if (!resd.ok) {
                logError(`issue comment delete failed, ` + resd.statusText)
            }
        }
    }

    const res = await fetch(url, {
        method: "POST",
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
        },
        body: JSON.stringify({ body }),
    })
    const resp: { id: string; html_url: string } = await res.json()
    const r = {
        created: res.status === 201,
        statusText: res.statusText,
        html_url: resp.html_url,
    }
    if (!r.created) {
        logError(
            `pull request ${issue} comment creation failed, ${r.statusText} (${res.status})`
        )
        dbg(JSON.stringify(resp, null, 2))
    } else {
        logVerbose(`pull request ${issue} comment created at ${r.html_url}`)
    }

    return r
}

async function githubCreatePullRequestReview(
    script: PromptScript,
    info: Pick<
        GithubConnectionInfo,
        | "apiUrl"
        | "repository"
        | "issue"
        | "runUrl"
        | "commitSha"
        | "owner"
        | "repo"
    >,
    token: string,
    annotation: Diagnostic,
    existingComments: {
        id: string
        path: string
        line: number
        body: string
    }[],
    options?: CancellationOptions
) {
    assert(!!token)
    const { cancellationToken } = options ?? {}
    const { apiUrl, repository, issue, commitSha } = info
    dbg(`creating pull request review comment`)

    const prettyMessage = prettifyMarkdown(annotation.message)
    const line = annotation.range?.[1]?.[0] + 1
    const body = {
        body: appendGeneratedComment(script, info, annotation),
        commit_id: commitSha,
        path: annotation.filename,
        line: normalizeInt(line),
        side: "RIGHT",
    }
    if (
        existingComments.find(
            (c) =>
                c.path === body.path &&
                Math.abs(c.line - body.line) <
                    GITHUB_PULL_REQUEST_REVIEW_COMMENT_LINE_DISTANCE &&
                (annotation.code
                    ? c.body?.includes(annotation.code)
                    : c.body?.includes(prettyMessage))
        )
    ) {
        logVerbose(
            `pull request ${commitSha} comment creation already exists, skipping`
        )
        return { created: false, statusText: "comment already exists" }
    }
    const fetch = await createFetch({ retryOn: [], cancellationToken })
    const url = `${apiUrl}/repos/${repository}/pulls/${issue}/comments`
    dbg(`posting new pull request review comment at URL: ${url}`)
    dbg(`%O`, body)
    const res = await fetch(url, {
        method: "POST",
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
        },
        body: JSON.stringify(body),
    })
    const resp: { id: string; html_url: string } = await res.json()
    const r = {
        created: res.status === 201,
        statusText: res.statusText,
        html_url: resp.html_url,
    }
    if (!r.created) {
        logVerbose(
            `pull request ${commitSha} comment creation failed, ${r.statusText} (${res.status})`
        )
        dbg("prr comment creation failed %O", resp)
    } else {
        logVerbose(`pull request ${commitSha} comment created at ${r.html_url}`)
    }
    return r
}

/**
 * Creates pull request review comments on GitHub for a set of code annotations.
 *
 * @param script - The script instance generating the comments.
 * @param info - Connection details for GitHub, including API URL, repository, pull request issue number, run URL, and commit SHA.
 * @param annotations - List of diagnostics or annotations to provide as review comments on the pull request.
 * @returns A promise resolving to a boolean indicating whether all review comments were successfully created.
 *
 * Notes:
 * - If no annotations are provided, the function skips creating reviews and resolves to true.
 * - If the issue number or commit SHA is missing, the function logs an error and resolves to false.
 * - Retrieves an authentication token from the secrets store to authenticate API requests.
 * - Fetches existing pull request comments to avoid duplication when creating review comments.
 */
export async function githubCreatePullRequestReviews(
    script: PromptScript,
    info: GithubConnectionInfo,
    annotations: Diagnostic[],
    options?: CancellationOptions
): Promise<boolean> {
    const { cancellationToken } = options ?? {}
    const { repository, issue, commitSha, apiUrl, token } = info

    if (!annotations?.length) {
        dbg(`no annotations provided, skipping pull request reviews`)
        return true
    }
    if (!issue) {
        dbg(`missing issue number, cannot create pull request reviews`)
        return false
    }
    if (!commitSha) {
        dbg(`missing commit sha, cannot create pull request reviews`)
        return false
    }
    if (!token) {
        dbg(`missing github token, cannot create pull request reviews`)
        return false
    }

    // query existing reviews
    const fetch = await createFetch({ retryOn: [], cancellationToken })
    const url = `${apiUrl}/repos/${repository}/pulls/${issue}/comments`
    dbg(`fetching existing pull request comments from URL: ${url}`)
    const resListComments = await fetch(`${url}?per_page=100&sort=updated`, {
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
        },
    })
    checkCancelled(cancellationToken)
    if (resListComments.status !== 200) {
        dbg(`failed to fetch existing pull request comments`)
        return false
    }
    const comments = (await resListComments.json()) as {
        id: string
        path: string
        line: number
        body: string
    }[]
    dbg(`existing pull request comments: %O`, comments)
    // code annotations
    const failed: Diagnostic[] = []
    for (const annotation of annotations) {
        dbg(`iterating over annotations to create pull request reviews`)
        checkCancelled(cancellationToken)
        const res = await githubCreatePullRequestReview(
            script,
            info,
            token,
            annotation,
            comments
        )
        if (!res.created) failed.push(annotation)
    }

    if (failed.length) {
        await githubCreateIssueComment(
            script,
            info,
            failed.map((d) => diagnosticToGitHubMarkdown(info, d)).join("\n\n"),
            script.id + "-prr",
            options
        )
    }

    return true
}

async function paginatorToArray<T, R>(
    iterator: AsyncIterable<T>,
    count: number,
    iteratorItem: (item: T) => R[],
    elementFilter?: (item: R) => boolean
): Promise<R[]> {
    const result: R[] = []
    for await (const item of await iterator) {
        let r = iteratorItem(item)
        if (elementFilter) {
            r = r.filter(elementFilter)
        }
        result.push(...r)
        if (result.length >= count) {
            break
        }
    }
    return result.slice(0, count)
}

export class GitHubClient implements GitHub {
    private readonly _info: Pick<GithubConnectionInfo, "owner" | "repo">
    private _connection: Promise<GithubConnectionInfo>
    private _client: Promise<
        | ({
              client: Octokit & {
                  paginate: PaginateInterface
              }
          } & GithubConnectionInfo)
        | undefined
    >

    private static _default: GitHubClient
    static default() {
        if (!this._default) this._default = new GitHubClient(undefined)
        return this._default
    }

    constructor(info: Pick<GithubConnectionInfo, "owner" | "repo">) {
        this._info = info
    }

    private connection(): Promise<GithubConnectionInfo> {
        if (!this._connection) {
            this._connection = githubParseEnv(process.env, {
                ...this._info,
                resolveToken: true,
            })
        }
        return this._connection
    }

    client(owner: string, repo: string) {
        return new GitHubClient({ owner, repo })
    }

    async api() {
        if (!this._client) {
            this._client = new Promise(async (resolve) => {
                const conn = await this.connection()
                const { token, apiUrl } = conn
                const { Octokit } = await import("@octokit/rest")
                const { throttling } = await import(
                    "@octokit/plugin-throttling"
                )
                const { paginateRest } = await import(
                    "@octokit/plugin-paginate-rest"
                )
                //const { retry } = await import("@octokit/plugin-retry")
                const OctokitWithPlugins =
                    Octokit.plugin(paginateRest).plugin(throttling)
                //                    .plugin(retry)
                const res = new OctokitWithPlugins({
                    userAgent: TOOL_ID,
                    auth: token,
                    baseUrl: apiUrl,
                    request: { retries: 3 },
                    throttle: {
                        onRateLimit: (
                            retryAfter: number,
                            options: any,
                            octokit: Octokit,
                            retryCount: number
                        ) => {
                            octokit.log.warn(
                                `Request quota exhausted for request ${options.method} ${options.url}`
                            )
                            if (retryCount < 1) {
                                // only retries once
                                octokit.log.info(
                                    `Retrying after ${retryAfter} seconds!`
                                )
                                return true
                            }
                            return false
                        },
                        onSecondaryRateLimit: (
                            retryAfter: number,
                            options: any,
                            octokit: Octokit
                        ) => {
                            octokit.log.warn(
                                `SecondaryRateLimit detected for request ${options.method} ${options.url}`
                            )
                        },
                    },
                })
                resolve({
                    client: res,
                    ...conn,
                })
            })
        }
        return this._client
    }

    async info(): Promise<GitHubOptions> {
        const {
            apiUrl: baseUrl,
            token: auth,
            repo,
            owner,
            ref,
            refName,
            issue,
        } = await this.connection()
        return Object.freeze({
            baseUrl,
            repo,
            owner,
            auth,
            ref,
            refName,
            issueNumber: issue,
        })
    }

    async repo(): Promise<{
        name: string
        full_name: string
        default_branch: string
    }> {
        const { client, owner, repo } = await this.api()
        const res = await client.rest.repos.get({ owner, repo })
        return res.data
    }

    async getRef(branchName: string): Promise<GitHubRef> {
        const { client, owner, repo } = await this.api()
        try {
            dbg(`get ref %s`, branchName)
            const existing = await client.git.getRef({
                owner,
                repo,
                ref: `heads/${branchName}`,
            })
            return existing.data
        } catch (e) {
            dbg(`ref not found`)
            return undefined
        }
    }

    async getOrCreateRef(
        branchName: string,
        options?: { base?: string; orphaned?: boolean | string }
    ): Promise<GitHubRef> {
        const { client, owner, repo } = await this.api()
        const { base, orphaned } = options ?? {}
        if (!branchName) throw new Error("branchName is required")

        dbg(`checking if branch %s exists`, branchName)
        const existing = await this.getRef(branchName)
        if (existing) {
            dbg(`branch %s already exists`, branchName)
            return existing
        }

        let sha: string
        dbg(`creating branch %s`, branchName)
        if (orphaned) {
            dbg(`creating orphaned`)
            // Step 0: Create a blob for the file content
            const { data: blob } = await client.git.createBlob({
                owner,
                repo,
                content: Buffer.from(
                    typeof orphaned === orphaned
                        ? orphaned
                        : `Orphaned branch created by GenAIScript.`
                ).toString("base64"),
                encoding: "base64",
            })

            // Step 1: Create an empty tree
            const { data: tree } = await client.git.createTree({
                owner,
                repo,
                tree: [
                    {
                        path: "README.md",
                        mode: "100644",
                        type: "blob",
                        sha: blob.sha,
                    },
                ],
            })
            dbg(`created tree %s`, tree.sha)
            // Step 2: Create a commit with NO parents
            const { data: commit } = await client.git.createCommit({
                owner,
                repo,
                message: "Initial commit on orphan branch",
                tree: tree.sha,
                parents: [], // <--- empty parent list = no history
            })
            sha = commit.sha
            dbg(`created commit %s`, commit.sha)
        } else {
            if (!base) {
                dbg(`base is required for non-orphaned branch`)
                const repo = await this.repo()
                sha = repo.default_branch
            } else sha = base
        }

        // Step 3: Create a reference (branch) pointing to the commit
        dbg(`creating reference %s <- %s`, branchName, sha)
        const res = await client.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${branchName}`,
            sha,
        })
        return res.data
    }

    async uploadAsset(
        file: BufferLike,
        options?: { branchName?: string }
    ): Promise<string> {
        const { branchName = GITHUB_ASSET_BRANCH } = options ?? {}
        const { client, owner, repo } = await this.api()
        if (!file) {
            dbg(`no buffer provided, nothing to upload`)
            return undefined
        }
        const buffer = await resolveBufferLike(file)
        if (!buffer) {
            dbg(`failed to resolve buffer, nothing to upload`)
            return undefined
        }
        const base64Content = buffer.toString("base64")
        const fileType = await fileTypeFromBuffer(buffer)
        const hash = createHash("sha256")
        hash.write(base64Content)
        const hashId = hash.digest().toString("hex")
        const uploadPath = hashId + (fileType ? `.${fileType.ext}` : ".txt")
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/${branchName}/${uploadPath}`

        // try to get file
        dbg(`checking %s`, rawUrl)
        const cached = await fetch(rawUrl, { method: "HEAD" })
        if (cached.status === 200) {
            dbg(`asset already exists, skip upload`)
            return rawUrl
        }

        dbg(`uploading asset %s to branch %s`, uploadPath, branchName)
        await this.getOrCreateRef(branchName, { orphaned: true })
        const { data: blob } = await client.git.createBlob({
            owner,
            repo,
            content: base64Content,
            encoding: "base64",
        })
        dbg(`created blob %s`, blob.sha)

        // 3. Get the latest commit (HEAD) of the branch
        const { data: refData } = await client.git.getRef({
            owner,
            repo,
            ref: `heads/${branchName}`,
        })
        const latestCommitSha = refData.object.sha
        dbg(`head ref %s: %s`, refData.ref, latestCommitSha)

        // 4. Get the tree of the latest commit
        const { data: commitData } = await client.git.getCommit({
            owner,
            repo,
            commit_sha: latestCommitSha,
        })
        const baseTreeSha = commitData.tree.sha
        dbg(`base tree sha %s`, baseTreeSha)

        // 5. Create a new tree adding the image
        const { data: newTree } = await client.git.createTree({
            owner,
            repo,
            base_tree: baseTreeSha,
            tree: [
                {
                    path: uploadPath,
                    mode: "100644",
                    type: "blob",
                    sha: blob.sha,
                },
            ],
        })

        dbg("tree created %s", newTree.sha)

        // 6. Create a new commit with the new tree
        const { data: newCommit } = await client.git.createCommit({
            owner,
            repo,
            message: `Upload asset ${uploadPath}`,
            tree: newTree.sha,
            parents: [latestCommitSha],
        })
        dbg("commit created %s", newCommit.sha)

        // 7. Update the branch to point to the new commit
        await client.git.updateRef({
            owner,
            repo,
            ref: `heads/${branchName}`,
            sha: newCommit.sha,
            force: false, // do not force push
        })

        return rawUrl
    }

    async listIssues(
        options?: {
            state?: "open" | "closed" | "all"
            labels?: string
            sort?: "created" | "updated" | "comments"
            direction?: "asc" | "desc"
            creator?: string
            assignee?: string
            since?: string
            mentioned?: string
        } & GitHubPaginationOptions
    ): Promise<GitHubIssue[]> {
        const { client, owner, repo } = await this.api()
        dbg(`listing issues for repository`)
        const { count = GITHUB_REST_PAGE_DEFAULT, ...rest } = options ?? {}
        const ite = client.paginate.iterator(client.rest.issues.listForRepo, {
            owner,
            repo,
            ...rest,
        })
        const res = await paginatorToArray(ite, count, (i) => i.data)
        return res
    }

    async listGists(
        options?: {
            since?: string
            filenameAsResources?: boolean
        } & GitHubPaginationOptions
    ): Promise<GitHubGist[]> {
        const { client } = await this.api()
        dbg(`listing gists for user`)
        const {
            count = GITHUB_REST_PAGE_DEFAULT,
            filenameAsResources,
            ...rest
        } = options ?? {}
        const ite = client.paginate.iterator(client.rest.gists.list, {
            ...rest,
        })
        const res = await paginatorToArray(ite, count, (i) => i.data)
        return res.map(
            (r) =>
                ({
                    id: r.id,
                    description: r.description,
                    created_at: r.created_at,
                    files: Object.values(r.files).map(
                        ({ filename, size }) =>
                            ({
                                filename: filenameAsResources
                                    ? `gist://${r.id}/${filename}`
                                    : filename,
                                size,
                            }) satisfies WorkspaceFile
                    ),
                }) satisfies GitHubGist
        )
    }

    async getGist(gist_id?: string): Promise<GitHubGist | undefined> {
        if (typeof gist_id === "string") {
            gist_id = gist_id.trim()
        }
        const { client, owner } = await this.api()
        dbg(`retrieving gist details for gist ID: ${gist_id}`)
        if (!gist_id) {
            return undefined
        }
        const { data } = await client.rest.gists.get({
            gist_id,
            owner,
        })
        const { files, id, description, created_at, ...rest } = data
        if (
            Object.values(files || {}).some(
                (f) => f.encoding !== "utf-8" && f.encoding != "base64"
            )
        ) {
            dbg(`unsupported encoding for gist files`)
            return undefined
        }
        const res = {
            id,
            description,
            created_at,
            files: Object.values(files).map(
                ({ filename, content, size, encoding }) =>
                    deleteUndefinedValues({
                        filename,
                        content,
                        encoding:
                            encoding === "utf-8"
                                ? undefined
                                : encoding === "base64"
                                  ? "base64"
                                  : undefined,
                        size,
                    }) satisfies WorkspaceFile
            ),
        } satisfies GitHubGist

        dbg(`gist: %d files, %s`, res.files.length, res.description || "")
        return res
    }

    async getIssue(issue_number?: number | string): Promise<GitHubIssue> {
        issue_number = normalizeInt(issue_number)
        const { client, owner, repo } = await this.api()
        dbg(`retrieving issue details for issue number: ${issue_number}`)
        if (isNaN(issue_number)) {
            issue_number = (await this._connection).issue
        }
        if (isNaN(issue_number)) {
            return undefined
        }
        const { data } = await client.rest.issues.get({
            owner,
            repo,
            issue_number,
        })
        return data
    }

    async updateIssue(
        issueNumber: number | string,
        options?: GitHubIssueUpdateOptions
    ): Promise<GitHubIssue> {
        issueNumber = normalizeInt(issueNumber)
        const { client, owner, repo } = await this.api()
        dbg(`updating issue number: ${issueNumber}`)
        if (isNaN(issueNumber)) {
            issueNumber = (await this._connection).issue
        }
        if (isNaN(issueNumber)) {
            return undefined
        }
        const { data } = await client.rest.issues.update({
            owner,
            repo,
            issue_number: issueNumber,
            ...options,
        })
        return data
    }

    async createIssueComment(
        issue_number: number | string,
        body: string
    ): Promise<GitHubComment> {
        issue_number = normalizeInt(issue_number)
        const { client, owner, repo } = await this.api()
        dbg(`creating comment for issue number: ${issue_number}`)
        if (isNaN(issue_number)) {
            issue_number = (await this._connection).issue
        }
        if (isNaN(issue_number)) {
            return undefined
        }
        const { data } = await client.rest.issues.createComment({
            owner,
            repo,
            issue_number,
            body,
        })
        dbg(`created comment %s`, data.id)
        return data
    }

    async updateIssueComment(comment_id: number | string, body: string) {
        const { client, owner, repo } = await this.api()
        dbg(`updating comment %s`, comment_id)
        const { data } = await client.rest.issues.updateComment({
            owner,
            repo,
            comment_id: normalizeInt(comment_id),
            body,
        })
        dbg(`updated comment %s`, data.id)
        return data
    }

    async listPullRequests(
        options?: {
            state?: "open" | "closed" | "all"
            sort?: "created" | "updated" | "popularity" | "long-running"
            direction?: "asc" | "desc"
        } & GitHubPaginationOptions
    ): Promise<GitHubPullRequest[]> {
        const { client, owner, repo } = await this.api()
        dbg(`listing pull requests for repository`)
        const { count = GITHUB_REST_PAGE_DEFAULT, ...rest } = options ?? {}
        const ite = client.paginate.iterator(client.rest.pulls.list, {
            owner,
            repo,
            ...rest,
        })
        const res = await paginatorToArray(ite, count, (i) => i.data)
        return res
    }

    async getPullRequest(
        pull_number?: number | string
    ): Promise<GitHubPullRequest> {
        pull_number = normalizeInt(pull_number)
        const { client, owner, repo } = await this.api()
        dbg(`retrieving pull request details for pull number: ${pull_number}`)
        if (isNaN(pull_number)) {
            pull_number = (await this._connection).issue
        }
        if (isNaN(pull_number)) {
            return undefined
        }

        const { data } = await client.rest.pulls.get({
            owner,
            repo,
            pull_number,
        })
        return data
    }

    async listPullRequestReviewComments(
        pull_number: number,
        options?: GitHubPaginationOptions
    ): Promise<GitHubComment[]> {
        const { client, owner, repo } = await this.api()
        dbg(`listing review comments for pull request number: ${pull_number}`)
        const { count = GITHUB_REST_PAGE_DEFAULT, ...rest } = options ?? {}
        const ite = client.paginate.iterator(
            client.rest.pulls.listReviewComments,
            {
                owner,
                repo,
                pull_number,
                ...rest,
            }
        )
        const res = await paginatorToArray(ite, count, (i) => i.data)
        return res
    }

    async listIssueComments(
        issue_number: number,
        options?: { reactions?: boolean } & GitHubPaginationOptions
    ): Promise<GitHubComment[]> {
        const { client, owner, repo } = await this.api()
        dbg(`listing comments for issue number: ${issue_number}`)
        const {
            reactions,
            count = GITHUB_REST_PAGE_DEFAULT,
            ...rest
        } = options ?? {}
        const ite = client.paginate.iterator(client.rest.issues.listComments, {
            owner,
            repo,
            issue_number,
            ...rest,
        })
        const res = await paginatorToArray(ite, count, (i) => i.data)
        return res
    }

    async listReleases(
        options?: GitHubPaginationOptions
    ): Promise<GitHubRelease[]> {
        const { client, owner, repo } = await this.api()
        dbg(`listing releases for repository`)
        const { count = GITHUB_REST_PAGE_DEFAULT, ...rest } = options ?? {}
        const ite = client.paginate.iterator(client.rest.repos.listReleases, {
            owner,
            repo,
            ...rest,
        })
        const res = await paginatorToArray(ite, count, (i) => i.data)
        return res
    }

    async workflowRun(runId: number | string): Promise<GitHubWorkflowRun> {
        const { client, owner, repo } = await this.api()
        dbg(`retrieving workflow run details for run ID: ${runId}`)
        const { data } = await client.rest.actions.getWorkflowRun({
            owner,
            repo,
            run_id: normalizeInt(runId),
        })
        dbg(`workflow run: %O`, data)
        return data
    }

    async listWorkflowRuns(
        workflowIdOrFilename: string | number,
        options?: {
            branch?: string
            status?: GitHubWorkflowRunStatus
        } & GitHubPaginationOptions
    ): Promise<GitHubWorkflowRun[]> {
        const { client, owner, repo } = await this.api()
        dbg(
            `listing workflow runs for workflow ID or filename: ${workflowIdOrFilename}`
        )
        const { count = GITHUB_REST_PAGE_DEFAULT, ...rest } = options ?? {}
        const ite = client.paginate.iterator(
            workflowIdOrFilename
                ? client.rest.actions.listWorkflowRuns
                : client.rest.actions.listWorkflowRunsForRepo,
            {
                owner,
                repo,
                workflow_id: workflowIdOrFilename,
                per_page: 100,
                ...rest,
            }
        )
        const res = await paginatorToArray(
            ite,
            count,
            (i) => i.data,
            ({ conclusion }) => conclusion !== "skipped"
        )
        dbg(`workflow runs: %O`, res)
        return res
    }

    /**
     * List artifacts for a given workflow run
     * @param runId
     */
    async listWorkflowRunArtifacts(
        runId: number | string,
        options?: GitHubPaginationOptions
    ): Promise<GitHubArtifact[]> {
        const { client, owner, repo } = await this.api()
        dbg(`listing artifacts for workflow run ID: ${runId}`)
        const { count = GITHUB_REST_PAGE_DEFAULT, ...rest } = options ?? {}
        const ite = client.paginate.iterator(
            client.rest.actions.listWorkflowRunArtifacts,
            {
                owner,
                repo,
                run_id: normalizeInt(runId),
                per_page: 100,
                ...rest,
            }
        )
        const res = await paginatorToArray(ite, count, (i) => i.data)
        dbg(`workflow run artifacts: %O`, res)
        return res
    }

    /**
     * Gets the files of a GitHub Action workflow run artifact
     * @param artifactId
     */
    async artifact(artifactId: number | string): Promise<GitHubArtifact> {
        const { client, owner, repo } = await this.api()
        dbg(`retrieving artifact details for artifact ID: ${artifactId}`)
        const { data } = await client.rest.actions.getArtifact({
            owner,
            repo,
            artifact_id: normalizeInt(artifactId),
        })

        return data
    }

    async resolveAssetUrl(url: string) {
        if (!uriTryParse(url)) return undefined // unknown format
        if (!GITHUB_ASSET_URL_RX.test(url)) return undefined // not a github asset
        const { client, owner, repo } = await this.api()
        dbg(`asset: resolving url for %s`, uriRedact(url))
        const { data, status } = await client.rest.markdown.render({
            owner,
            repo,
            context: `${owner}/${repo}`, // force html with token
            text: `![](${url})`,
            mode: "gfm",
        })
        dbg(`asset: resolution %s`, status)
        const { resolved } =
            /<img src="(?<resolved>[^"]+)"/i.exec(data)?.groups || {}
        if (!resolved) dbg(`markdown:\n%s`, data)

        return resolved
    }

    async downloadArtifactFiles(
        artifactId: number | string
    ): Promise<WorkspaceFile[]> {
        const { client, owner, repo } = await this.api()
        dbg(`downloading artifact files for artifact ID: ${artifactId}`)
        const { url } = await client.rest.actions.downloadArtifact({
            owner,
            repo,
            artifact_id: normalizeInt(artifactId),
            archive_format: "zip",
        })
        dbg(`received url, downloading...`)
        const fetch = await createFetch()
        const res = await fetch(url)
        if (!res.ok) throw new Error(res.statusText)
        const buffer = await res.arrayBuffer()
        const files = await unzip(new Uint8Array(buffer))
        return files
    }

    async listWorkflowJobs(
        run_id: number,
        options?: { filter?: "all" | "latest" } & GitHubPaginationOptions
    ): Promise<GitHubWorkflowJob[]> {
        // Get the jobs for the specified workflow run
        dbg(`listing jobs for workflow run ID: ${run_id}`)
        const { client, owner, repo } = await this.api()
        const {
            filter,
            count = GITHUB_REST_PAGE_DEFAULT,
            ...rest
        } = options ?? {}
        const ite = client.paginate.iterator(
            client.rest.actions.listJobsForWorkflowRun,
            {
                owner,
                repo,
                run_id,
                filter,
            }
        )
        const jobs = await paginatorToArray(ite, count, (i) => i.data)

        const res: GitHubWorkflowJob[] = []
        dbg(`processing workflow jobs`)
        for (const job of jobs) {
            if (
                job.conclusion === "skipped" ||
                job.conclusion === "cancelled"
            ) {
                continue
            }
            const { url: logs_url } =
                await client.rest.actions.downloadJobLogsForWorkflowRun({
                    owner,
                    repo,
                    job_id: job.id,
                })
            const logsRes = await fetch(logs_url)
            const text = await logsRes.text()
            res.push({
                ...job,
                logs_url,
                logs: text,
                content: parseJobLog(text),
            })
        }
        dbg(`workflow jobs: %O`, res)
        return res
    }

    /**
     * Downloads a GitHub Action workflow run log
     * @param jobId
     */
    async downloadWorkflowJobLog(
        job_id: number,
        options?: { llmify?: boolean }
    ): Promise<string> {
        const { client, owner, repo } = await this.api()
        const { url: logs_url } =
            await client.rest.actions.downloadJobLogsForWorkflowRun({
                owner,
                repo,
                job_id,
            })
        const logsRes = await fetch(logs_url)
        let text = await logsRes.text()
        if (options?.llmify) {
            text = parseJobLog(text)
        }
        return text
    }

    private async downloadJob(job_id: number) {
        const { client, owner, repo } = await this.api()
        dbg(`downloading job log for job ID: ${job_id}`)
        const filename = `job-${job_id}.log`
        const { url } = await client.rest.actions.downloadJobLogsForWorkflowRun(
            {
                owner,
                repo,
                job_id,
            }
        )
        const res = await fetch(url)
        const content = await res.text()
        return { filename, url, content }
    }

    async diffWorkflowJobLogs(job_id: number, other_job_id: number) {
        const job = await this.downloadJob(job_id)
        dbg(
            `diffing workflow job logs for job IDs: ${job_id} and ${other_job_id}`
        )
        const other = await this.downloadJob(other_job_id)
        const justDiff = diffCreatePatch(job, other)

        // try compressing
        job.content = parseJobLog(job.content)
        other.content = parseJobLog(other.content)
        const parsedDiff = diffCreatePatch(job, other)
        const diff = justDiff.length < parsedDiff.length ? justDiff : parsedDiff

        return llmifyDiff(diff)
    }

    async getFile(filename: string, ref: string): Promise<WorkspaceFile> {
        const { client, owner, repo } = await this.api()
        dbg(`retrieving file content for filename: ${filename} and ref: ${ref}`)
        const { data: content } = await client.rest.repos.getContent({
            owner,
            repo,
            path: filename,
            ref,
        })
        if ("content" in content) {
            return {
                filename,
                content: Buffer.from(content.content, "base64").toString(
                    "utf-8"
                ),
            }
        } else {
            return undefined
        }
    }

    async searchCode(
        query: string,
        options?: GitHubPaginationOptions
    ): Promise<GitHubCodeSearchResult[]> {
        const { client, owner, repo } = await this.api()
        dbg(`searching code with query: ${query}`)
        const q = query + `+repo:${owner}/${repo}`
        const { count = GITHUB_REST_PAGE_DEFAULT, ...rest } = options ?? {}
        const ite = client.paginate.iterator(client.rest.search.code, {
            q,
            ...(options ?? {}),
        })
        const items = await paginatorToArray(ite, count, (i) => i.data)
        return items.map(
            ({ name, path, sha, html_url, score, repository }) => ({
                name,
                path,
                sha,
                html_url,
                score,
                repository: repository.full_name,
            })
        )
    }

    async workflow(workflowId: number | string): Promise<GitHubWorkflow> {
        const { client, owner, repo } = await this.api()
        dbg(`retrieving workflow details for workflow ID: ${workflowId}`)
        const { data } = await client.rest.actions.getWorkflow({
            owner,
            repo,
            workflow_id: workflowId,
        })
        dbg(`workflow: %O`, data)
        return data
    }

    async listWorkflows(
        options?: GitHubPaginationOptions
    ): Promise<GitHubWorkflow[]> {
        const { client, owner, repo } = await this.api()
        dbg(`listing workflows for repository`)
        const { count = GITHUB_REST_PAGE_DEFAULT, ...rest } = options ?? {}
        const ite = client.paginate.iterator(
            client.rest.actions.listRepoWorkflows,
            {
                owner,
                repo,
                ...(options ?? {}),
            }
        )
        const workflows = await paginatorToArray(ite, count, (i) => i.data)
        dbg(`workflows: %O`, workflows)
        return workflows.map(({ id, name, path }) => ({
            id,
            name,
            path,
        }))
    }

    async listBranches(options?: GitHubPaginationOptions): Promise<string[]> {
        dbg(`listing branches for repository`)
        const { client, owner, repo } = await this.api()
        const { count = GITHUB_REST_PAGE_DEFAULT, ...rest } = options ?? {}
        const ite = client.paginate.iterator(client.rest.repos.listBranches, {
            owner,
            repo,
            ...(options ?? {}),
        })
        const branches = await paginatorToArray(ite, count, (i) => i.data)
        return branches.map(({ name }) => name)
    }

    async listRepositoryLanguages(): Promise<Record<string, number>> {
        const { client, owner, repo } = await this.api()
        dbg(`listing languages for repository`)
        const { data: languages } = await client.rest.repos.listLanguages({
            owner,
            repo,
        })
        return languages
    }

    async getRepositoryContent(
        path: string,
        options?: {
            ref?: string
            glob?: string
            downloadContent?: boolean
            maxDownloadSize?: number
            type?: string
        }
    ): Promise<GitHubFile[]> {
        const { client, owner, repo } = await this.api()
        dbg(`retrieving repository content for path: ${path}`)
        const { ref, type, glob, downloadContent, maxDownloadSize } =
            options ?? {}
        const { data: contents } = await client.rest.repos.getContent({
            owner,
            repo,
            path,
            ref,
        })
        const res = arrayify(contents)
            .filter((c) => !type || c.type === type)
            .filter((c) => !glob || isGlobMatch(c.path, glob))
            .map((content) => ({
                filename: content.path,
                type: content.type,
                size: content.size,
                content:
                    content.type === "file" && content.content
                        ? Buffer.from(content.content, "base64").toString(
                              "utf-8"
                          )
                        : undefined,
            }))
        if (downloadContent) {
            const limit = concurrentLimit(
                "github",
                GITHUB_REST_API_CONCURRENCY_LIMIT
            )
            await Promise.all(
                res
                    .filter((f) => f.type === "file" && !f.content)
                    .filter(
                        (f) => !maxDownloadSize || f.size <= maxDownloadSize
                    )
                    .map((f) => {
                        const filename = f.filename
                        return async () => {
                            const { data: fileContent } =
                                await client.rest.repos.getContent({
                                    owner,
                                    repo,
                                    path: filename,
                                    ref,
                                })
                            f.content = Buffer.from(
                                arrayify(fileContent)[0].content,
                                "base64"
                            ).toString("utf8")
                        }
                    })
                    .map((p) => limit(p))
            )
        }
        return res
    }
}

function parseJobLog(text: string) {
    const lines = cleanLog(text).split(/\r?\n/g)
    const groups: { title: string; text: string }[] = []
    let current = groups[0]
    for (const line of lines) {
        if (line.startsWith("##[group]")) {
            current = {
                title: line.slice("##[group]".length),
                text: "",
            }
        } else if (line.startsWith("##[endgroup]")) {
            if (current) {
                groups.push(current)
            }
            current = undefined
        } else if (line.includes("Post job cleanup.")) {
            break // ignore cleanup typically
        } else {
            if (!current) {
                current = { title: "", text: "" }
            }
            current.text += line + "\n"
        }
    }
    if (current) {
        groups.push(current)
    }

    const ignoreSteps = [
        "Runner Image",
        "Fetching the repository",
        "Checking out the ref",
        "Setting up auth",
        "Setting up auth for fetching submodules",
        "Getting Git version info",
        "Initializing the repository",
        "Determining the checkout info",
        "Persisting credentials for submodules",
    ]
    return groups
        .filter(({ title }) => !ignoreSteps.includes(title))
        .map((f) =>
            f.title ? `##[group]${f.title}\n${f.text}\n##[endgroup]` : f.text
        )
        .join("\n")
}

export function cleanLog(text: string) {
    return shellRemoveAsciiColors(
        text.replace(
            // timestamps
            /^﻿?\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{2,}Z /gm,
            ""
        )
    )
}
