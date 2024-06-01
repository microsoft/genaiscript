import { GITHUB_API_VERSION } from "./constants"
import { createFetch } from "./fetch"
import { host } from "./host"
import { normalizeInt } from "./util"

export interface GithubConnectionInfo {
    token: string
    apiUrl?: string
    repository: string
    owner: string
    repo: string
    ref?: string
    sha?: string
    issue?: number
}

export function parseGHTokenFromEnv(
    env: Record<string, string>
): GithubConnectionInfo {
    const token = env.GITHUB_TOKEN
    const apiUrl = env.GITHUB_API_URL || "https://api.github.com"
    const repository = env.GITHUB_REPOSITORY
    const [owner, repo] = repository?.split("/", 2) || [undefined, undefined]
    const ref = env.GITHUB_REF
    const sha = env.GITHUB_SHA
    const issue = normalizeInt(
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
    }
}

// https://docs.github.com/en/rest/issues/comments?apiVersion=2022-11-28#create-an-issue-comment
export async function githubCreateIssueComment(
    info: GithubConnectionInfo,
    body: string,
    commentTag?: string
): Promise<{ created: boolean; statusText: string; html_url?: string }> {
    const { apiUrl, repository, issue } = info

    if (!issue) return { created: false, statusText: "missing issue or sha" }

    const token = await host.readSecret("GITHUB_TOKEN")
    if (!token) return { created: false, statusText: "missing token" }

    const fetch = await createFetch()
    const url = `${apiUrl}/repos/${repository}/issues/${issue}/comments`

    if (commentTag) {
        const tag = `<!-- genaiscript ${commentTag} -->`
        body = `${body}\n\n${tag}\n\n`
        // try to find the existing comment
        const resListComments = await fetch(`${url}?per_page=100`, {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${token}`,
                "X-GitHub-Api-Version": GITHUB_API_VERSION,
            },
        })
        if (resListComments.status !== 200)
            return { created: false, statusText: resListComments.statusText }
        const comments = (await resListComments.json()) as {
            id: string
            body: string
        }[]
        const comment = comments.find((c) => c.body.includes(tag))
        console.log({ comments, comment })
        if (comment) {
            const resd = await fetch(`${url}/${comment.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-GitHub-Api-Version": GITHUB_API_VERSION,
                },
            })
            console.log(resd.statusText)
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
    return {
        created: res.status === 201,
        statusText: res.statusText,
        html_url: resp.html_url,
    }
}
