import { Octokit } from "octokit"
import {
    GITHUB_API_VERSION,
    GITHUB_PULL_REQUEST_REVIEW_COMMENT_LINE_DISTANCE,
    GITHUB_TOKEN,
    TOOL_ID,
} from "./constants"
import { createFetch } from "./fetch"
import { runtimeHost } from "./host"
import { link, prettifyMarkdown } from "./markdown"
import { assert, logError, logVerbose, normalizeInt } from "./util"

export interface GithubConnectionInfo {
    token: string
    apiUrl?: string
    repository: string
    owner: string
    repo: string
    ref?: string
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
        sha,
        issue,
        runId,
        runUrl,
        commitSha,
    }
}

export async function githubParseEnv(
    env: Record<string, string>,
    options?: { issue?: number }
): Promise<GithubConnectionInfo> {
    const res = githubFromEnv(env)
    try {
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
        if (!isNaN(options?.issue)) res.issue = options.issue
        if (!res.issue) {
            const { number: issue } = JSON.parse(
                (
                    await runtimeHost.exec(
                        undefined,
                        "gh",
                        ["pr", "view", "--json", "number"],
                        {}
                    )
                ).stdout
            )
            if (!isNaN(issue)) res.issue = issue
        }
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
    const resGetJson = (await resGet.json()) as { body: string }
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
            `pull request ${info.repository}/pull/${info.issue} update failed, ${r.statusText}`
        )
    else
        logVerbose(`pull request ${info.repository}/pull/${info.issue} updated`)

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
    return `\n\n> generated by ${link(script.id, info.runUrl)}${code ? ` \`${code}\` ` : ""}\n\n`
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

export class GitHubClient implements GitHub {
    private _connection: Promise<GithubConnectionInfo>
    private _client: Promise<
        { client: Octokit; owner: string; repo: string } | undefined
    >

    constructor() {}

    private connection(): Promise<Omit<GithubConnectionInfo, "issue">> {
        if (!this._connection) {
            this._connection = githubParseEnv(process.env)
        }
        return this._connection
    }

    private async client() {
        if (!this._client) {
            this._client = new Promise(async (resolve) => {
                const conn = await this.connection()
                const res = new Octokit({ userAgent: TOOL_ID, ...conn })
                resolve({ client: res, owner: conn.owner, repo: conn.repo })
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
        } = await this.connection()
        return Object.freeze({
            baseUrl,
            repo,
            owner,
            auth,
        })
    }

    async listIssues(options?: {
        state?: "open" | "closed" | "all"
        labels?: string
        sort?: "created" | "updated" | "comments"
        direction?: "asc" | "desc"
        per_page?: number
        page?: number
    }): Promise<GitHubIssue[]> {
        const { client, owner, repo } = await this.client()
        const { data: issues } = await client.rest.issues.listForRepo({
            owner,
            repo,
            ...(options || {}),
        })
        const i = issues[0]
        return issues
    }

    async listComments(
        issue_number: number,
        options?: { per_page?: number; page?: number }
    ): Promise<GitHubComment[]> {
        const { client, owner, repo } = await this.client()
        const { data: comments } = await client.rest.issues.listComments({
            owner,
            repo,
            issue_number,
            ...(options || {}),
        })
        return comments
    }

    async listWorkflowRuns(
        workflow_id: string | number,
        options?: {
            branch?: string
            per_page?: number
            status?: GitHubWorkflowRunStatus
        }
    ): Promise<GitHubWorkflowRun[]> {
        const { client, owner, repo } = await this.client()
        const {
            data: { workflow_runs },
        } = await client.rest.actions.listWorkflowRuns({
            owner,
            repo,
            workflow_id,
            per_page: 100,
            ...(options || {}),
        })
        const runs = workflow_runs.filter(
            ({ conclusion }) => conclusion !== "skipped"
        )
        return runs
    }

    async listWorkflowJobs(run_id: number): Promise<GitHubWorkflowJob[]> {
        // Get the jobs for the specified workflow run
        const { client, owner, repo } = await this.client()
        const {
            data: { jobs },
        } = await client.rest.actions.listJobsForWorkflowRun({
            owner,
            repo,
            run_id,
        })

        const res: GitHubWorkflowJob[] = []
        for (const job of jobs) {
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
                    f.title
                        ? `##[group]${f.title}\n${f.text}\n##[endgroup]`
                        : f.text
                )
                .join("\n")
        }

        function cleanLog(text: string) {
            return text
                .replace(
                    // timestamps
                    /^﻿?\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{2,}Z /gm,
                    ""
                )
                .replace(/\x1b\[[0-9;]*m/g, "") // ascii colors
        }
    }
}
