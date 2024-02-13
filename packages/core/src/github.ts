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
