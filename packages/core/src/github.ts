import { GITHUB_API_VERSION } from "./constants"
import { createFetch } from "./fetch"
import { host } from "./host"
import { MarkdownTrace, TraceOptions } from "./trace"

export interface GithubConnectionInfo {
    auth: string
    baseUrl?: string
    repository: string
    owner: string
    repo: string
    ref: string
    issue?: number
}

export function parseGHTokenFromEnv(
    env: Record<string, string>
): GithubConnectionInfo {
    const token = env.GITHUB_TOKEN
    const baseUrl = env.GITHUB_API_URL
    const repository = env.GITHUB_REPOSITORY
    const [owner, repo] = repository?.split("/", 2) || [undefined, undefined]
    const ref = env.GITHUB_REF
    const issue = parseInt(
        /^refs\/pull\/(?<issue>\d+)\/merge$/.exec(ref || "")?.groups?.issue ||
            ""
    )

    return {
        auth: token,
        baseUrl,
        repository,
        owner,
        repo,
        ref,
        issue,
    }
}

// https://docs.github.com/en/rest/issues/comments?apiVersion=2022-11-28#create-an-issue-comment
export async function githubCreateComment(
    info: GithubConnectionInfo,
    body: string
) {
    const { repository, issue } = info
    const fetch = await createFetch()
    const token = await host.readSecret("GITHUB_TOKEN")
    const url = `https://api.github.com/repos/${repository}/issues/${issue}/comments`
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
    return {
        created: res.status === 201,
        status: res.status,
        statusText: res.statusText,
        ...resp,
    }
}
