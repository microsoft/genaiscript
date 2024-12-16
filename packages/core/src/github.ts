import type { Octokit } from "@octokit/rest"
import type { PaginateInterface } from "@octokit/plugin-paginate-rest"
import {
    GITHUB_API_VERSION,
    GITHUB_PULL_REQUEST_REVIEW_COMMENT_LINE_DISTANCE,
    GITHUB_REST_API_CONCURRENCY_LIMIT,
    GITHUB_REST_PAGE_DEFAULT,
    GITHUB_TOKEN,
    TOOL_ID,
} from "./constants"
import { createFetch } from "./fetch"
import { runtimeHost } from "./host"
import { link, prettifyMarkdown } from "./markdown"
import { arrayify, assert, logError, logVerbose, normalizeInt } from "./util"
import { shellRemoveAsciiColors } from "./shell"
import { isGlobMatch } from "./glob"
import { fetchText } from "./fetch"
import { concurrentLimit } from "./concurrency"
import { createDiff, llmifyDiff } from "./diff"
import { JSON5TryParse } from "./json5"
import { resolve } from "node:path"

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

function githubFromEnv(env: Record<string, string>): GithubConnectionInfo {
    const token = env.GITHUB_TOKEN
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

    return {
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
    }
}

async function githubGetPullRequestNumber() {
    const res = await runtimeHost.exec(
        undefined,
        "gh",
        ["pr", "view", "--json", "number"],
        {
            label: "resolve current pull request number",
        }
    )
    const resj = JSON5TryParse(res.stdout) as { number: number }
    return resj?.number
}

export async function githubParseEnv(
    env: Record<string, string>,
    options?: { issue?: number; resolveIssue?: boolean } & Partial<
        Pick<GithubConnectionInfo, "owner" | "repo">
    >
): Promise<GithubConnectionInfo> {
    const res = githubFromEnv(env)
    try {
        if (options?.owner && options?.repo) {
            res.owner = options.owner
            res.repo = options.repo
            res.repository = res.owner + "/" + res.repo
        }
        if (!isNaN(options?.issue)) res.issue = options.issue
        if (!res.owner || !res.repo || !res.repository) {
            const { name: repo, owner } = JSON.parse(
                (
                    await runtimeHost.exec(
                        undefined,
                        "gh",
                        ["repo", "view", "--json", "url,name,owner"],
                        {}
                    )
                ).stdout
            )
            res.repo = repo
            res.owner = owner.login
            res.repository = res.owner + "/" + res.repo
        }
        if (isNaN(res.issue) && options?.resolveIssue)
            res.issue = await githubGetPullRequestNumber()
    } catch (e) {}
    return Object.freeze(res)
}

// https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#update-a-pull-request
export async function githubUpdatePullRequestDescription(
    script: PromptScript,
    info: Pick<
        GithubConnectionInfo,
        "apiUrl" | "repository" | "issue" | "runUrl"
    >,
    text: string,
    commentTag: string
) {
    const { apiUrl, repository, issue } = info
    assert(!!commentTag)

    if (!issue) return { updated: false, statusText: "missing issue number" }
    const token = await runtimeHost.readSecret(GITHUB_TOKEN)
    if (!token) return { updated: false, statusText: "missing github token" }

    text = prettifyMarkdown(text)
    text += generatedByFooter(script, info)

    const fetch = await createFetch({ retryOn: [] })
    const url = `${apiUrl}/repos/${repository}/pulls/${issue}`
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

    if (!r.updated)
        logError(
            `pull request ${resGetJson.html_url} update failed, ${r.statusText}`
        )
    else logVerbose(`pull request ${resGetJson.html_url} updated`)

    return r
}

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

export function generatedByFooter(
    script: PromptScript,
    info: { runUrl?: string },
    code?: string
) {
    return `\n\n> AI-generated content ${link(script.id, info.runUrl)}${code ? ` \`${code}\` ` : ""} may be incorrect\n\n`
}

export function appendGeneratedComment(
    script: PromptScript,
    info: { runUrl?: string },
    annotation: Diagnostic
) {
    const { message, code, severity } = annotation
    return prettifyMarkdown(
        `<!-- genaiscript ${severity} ${code || ""} -->
${message}
${generatedByFooter(script, info, code)}`
    )
}

// https://docs.github.com/en/rest/issues/comments?apiVersion=2022-11-28#create-an-issue-comment
export async function githubCreateIssueComment(
    script: PromptScript,
    info: Pick<
        GithubConnectionInfo,
        "apiUrl" | "repository" | "issue" | "runUrl"
    >,
    body: string,
    commentTag: string
): Promise<{ created: boolean; statusText: string; html_url?: string }> {
    const { apiUrl, repository, issue } = info

    if (!issue) return { created: false, statusText: "missing issue number" }
    const token = await runtimeHost.readSecret(GITHUB_TOKEN)
    if (!token) return { created: false, statusText: "missing github token" }

    const fetch = await createFetch({ retryOn: [] })
    const url = `${apiUrl}/repos/${repository}/issues/${issue}/comments`

    body += generatedByFooter(script, info)

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
        if (resListComments.status !== 200)
            return { created: false, statusText: resListComments.statusText }
        const comments = (await resListComments.json()) as {
            id: string
            body: string
        }[]
        const comment = comments.find((c) => c.body.includes(tag))
        if (comment) {
            const delurl = `${apiUrl}/repos/${repository}/issues/comments/${comment.id}`
            const resd = await fetch(delurl, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-GitHub-Api-Version": GITHUB_API_VERSION,
                },
            })
            if (!resd.ok)
                logError(`issue comment delete failed, ` + resd.statusText)
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
    if (!r.created)
        logError(
            `pull request ${issue} comment creation failed, ${r.statusText}`
        )
    else logVerbose(`pull request ${issue} comment created at ${r.html_url}`)

    return r
}

async function githubCreatePullRequestReview(
    script: PromptScript,
    info: Pick<
        GithubConnectionInfo,
        "apiUrl" | "repository" | "issue" | "runUrl" | "commitSha"
    >,
    token: string,
    annotation: Diagnostic,
    existingComments: { id: string; path: string; line: number; body: string }[]
) {
    assert(!!token)
    const { apiUrl, repository, issue, commitSha } = info

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
    const fetch = await createFetch({ retryOn: [] })
    const url = `${apiUrl}/repos/${repository}/pulls/${issue}/comments`
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
            `pull request ${commitSha} comment creation failed, ${r.statusText}`
        )
    } else
        logVerbose(`pull request ${commitSha} comment created at ${r.html_url}`)
    return r
}

export async function githubCreatePullRequestReviews(
    script: PromptScript,
    info: Pick<
        GithubConnectionInfo,
        "apiUrl" | "repository" | "issue" | "runUrl" | "commitSha"
    >,
    annotations: Diagnostic[]
): Promise<boolean> {
    const { repository, issue, commitSha, apiUrl } = info

    if (!annotations?.length) return true
    if (!issue) {
        logError("missing pull request number")
        return false
    }
    if (!commitSha) {
        logError("missing commit sha")
        return false
    }
    const token = await runtimeHost.readSecret(GITHUB_TOKEN)
    if (!token) {
        logError("missing github token")
        return false
    }

    // query existing reviews
    const fetch = await createFetch({ retryOn: [] })
    const url = `${apiUrl}/repos/${repository}/pulls/${issue}/comments`
    const resListComments = await fetch(`${url}?per_page=100&sort=updated`, {
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
        },
    })
    if (resListComments.status !== 200) return false
    const comments = (await resListComments.json()) as {
        id: string
        path: string
        line: number
        body: string
    }[]
    // code annotations
    for (const annotation of annotations) {
        await githubCreatePullRequestReview(
            script,
            info,
            token,
            annotation,
            comments
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
        if (elementFilter) r = r.filter(elementFilter)
        result.push(...r)
        if (result.length >= count) break
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

    constructor(info: Pick<GithubConnectionInfo, "owner" | "repo">) {
        this._info = info
    }

    private connection(): Promise<GithubConnectionInfo> {
        if (!this._connection)
            this._connection = githubParseEnv(process.env, this._info)
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
                            retryAfter,
                            options,
                            octokit,
                            retryCount
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
                            retryAfter,
                            options,
                            octokit
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
        const { count = GITHUB_REST_PAGE_DEFAULT, ...rest } = options ?? {}
        const ite = client.paginate.iterator(client.rest.issues.listForRepo, {
            owner,
            repo,
            ...rest,
        })
        const res = await paginatorToArray(ite, count, (i) => i.data)
        return res
    }

    async getIssue(issue_number?: number | string): Promise<GitHubIssue> {
        if (typeof issue_number === "string")
            issue_number = parseInt(issue_number)
        const { client, owner, repo } = await this.api()
        if (isNaN(issue_number)) issue_number = (await this._connection).issue
        if (isNaN(issue_number)) return undefined
        const { data } = await client.rest.issues.get({
            owner,
            repo,
            issue_number,
        })
        return data
    }

    async createIssueComment(
        issue_number: number | string,
        body: string
    ): Promise<GitHubComment> {
        if (typeof issue_number === "string")
            issue_number = parseInt(issue_number)
        const { client, owner, repo } = await this.api()
        if (isNaN(issue_number)) issue_number = (await this._connection).issue
        if (isNaN(issue_number)) return undefined
        const { data } = await client.rest.issues.createComment({
            owner,
            repo,
            issue_number,
            body,
        })
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
        if (typeof pull_number === "string") pull_number = parseInt(pull_number)
        const { client, owner, repo } = await this.api()
        if (isNaN(pull_number)) pull_number = (await this._connection).issue
        if (isNaN(pull_number)) return undefined

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

    async listWorkflowRuns(
        workflowIdOrFilename: string | number,
        options?: {
            branch?: string
            status?: GitHubWorkflowRunStatus
        } & GitHubPaginationOptions
    ): Promise<GitHubWorkflowRun[]> {
        const { client, owner, repo } = await this.api()
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
        return res
    }

    async listWorkflowJobs(
        run_id: number,
        options?: { filter?: "all" | "latest" } & GitHubPaginationOptions
    ): Promise<GitHubWorkflowJob[]> {
        // Get the jobs for the specified workflow run
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
        for (const job of jobs) {
            if (job.conclusion === "skipped" || job.conclusion === "cancelled")
                continue
            const { url: logs_url } =
                await client.rest.actions.downloadJobLogsForWorkflowRun({
                    owner,
                    repo,
                    job_id: job.id,
                })
            const { text } = await fetchText(logs_url)
            res.push({
                ...job,
                logs_url,
                logs: text,
                content: parseJobLog(text),
            })
        }
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
        let { text } = await fetchText(logs_url)
        if (options?.llmify) text = parseJobLog(text)
        return text
    }

    private async downladJob(job_id: number) {
        const { client, owner, repo } = await this.api()
        const filename = `job-${job_id}.log`
        const { url } = await client.rest.actions.downloadJobLogsForWorkflowRun(
            {
                owner,
                repo,
                job_id,
            }
        )
        const { text: content } = await fetchText(url)
        return { filename, url, content }
    }

    async diffWorkflowJobLogs(job_id: number, other_job_id: number) {
        const job = await this.downladJob(job_id)
        const other = await this.downladJob(other_job_id)

        job.content = parseJobLog(job.content)
        other.content = parseJobLog(other.content)

        const diff = createDiff(job, other)
        return llmifyDiff(diff)
    }

    async getFile(filename: string, ref: string): Promise<WorkspaceFile> {
        const { client, owner, repo } = await this.api()
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

    async listWorkflows(
        options?: GitHubPaginationOptions
    ): Promise<GitHubWorkflow[]> {
        const { client, owner, repo } = await this.api()
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
        return workflows.map(({ id, name, path }) => ({
            id,
            name,
            path,
        }))
    }

    async listBranches(options?: GitHubPaginationOptions): Promise<string[]> {
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
            if (current) groups.push(current)
            current = undefined
        } else if (line.includes("Post job cleanup.")) {
            break // ignore cleanup typically
        } else {
            if (!current) current = { title: "", text: "" }
            current.text += line + "\n"
        }
    }
    if (current) groups.push(current)

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

function cleanLog(text: string) {
    return shellRemoveAsciiColors(
        text.replace(
            // timestamps
            /^﻿?\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{2,}Z /gm,
            ""
        )
    )
}
