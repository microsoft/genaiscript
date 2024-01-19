import { Octokit, App } from "octokit"
import { throttling } from "@octokit/plugin-throttling"

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

function createClient(conn: GithubConnectionInfo) {
    const { owner, repo, ...rest } = conn
    const ThrottledOctokit = Octokit.plugin(throttling)
    const octokit = new ThrottledOctokit({
        ...rest,
        userAgent: `gptools`,
        throttle: {
            onRateLimit: (retryAfter, options, octokit, retryCount) => {
                octokit.log.warn(
                    `request quota exhausted for ${options.method} ${options.url}`
                )
                return true
            },
            onSecondaryRateLimit: (retryAfter, options, octokit) => {
                // does not retry, only logs a warning
                octokit.log.warn(
                    `secondary rate limit detected for request ${options.method} ${options.url}`
                )
                return true
            },
        },
    })

    return octokit
}

export async function createIssue(
    conn: GithubConnectionInfo,
    title: string,
    body: string
) {
    const { owner, repo } = conn
    const octokit = createClient(conn)
    console.error(
        `searching for issues in ${owner}/${repo} with title "${title}"`
    )
    const existing = await octokit.rest.search.issuesAndPullRequests({
        q: `is:issue in:title ${title} repo:${owner}/${repo}`,
        headers: {
            Accept: "application/vnd.github.v3.text-match+json",
        },
    })
    const n = existing.data.total_count
    if (n > 0) {
        console.log(
            `related open issue already exists: ${existing.data.items[0].html_url}`
        )
    } else {
        const res = await octokit.rest.issues.create({
            owner,
            repo,
            title,
            body,
        })
        console.log(`created issue: ${res.data.html_url}`)
    }
}
