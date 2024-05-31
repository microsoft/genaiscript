import { GITHUB_API_VERSION } from "./constants"
import { createFetch } from "./fetch"
import { host } from "./host"
import { TraceOptions } from "./trace"

export interface GithubConnectionInfo {
    auth: string
    baseUrl?: string
    owner: string
    repo: string
}

export function parseGHTokenFromEnv(
    env: Record<string, string>
): GithubConnectionInfo {
    const auth = env.GITHUB_TOKEN
    if (!auth) throw new Error("GITHUB_TOKEN is not set in the environment")
    const baseUrl = env.GITHUB_API_URL
    const rep = env.GITHUB_REPOSITORY
    if (!rep) throw new Error(`GITHUB_REPOSITORY is not set in the environment`)
    const [owner, repo] = rep.split("/", 2)

    return {
        auth,
        baseUrl,
        owner,
        repo,
    }
}

export interface GitHubComment {
    id: string
    html_url: string
    body: string
}

// https://docs.github.com/en/rest/issues/comments?apiVersion=2022-11-28#create-an-issue-comment
export async function createComment(
    options: {
        repository: string
        issue: number
        body: string
    } & TraceOptions
): Promise<GitHubComment> {
    const { repository, issue, body, trace } = options
    const fetch = await createFetch({ trace })
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
    return (await res.json()) as {
        id: string
        html_url: string
        body: string
    }
}
