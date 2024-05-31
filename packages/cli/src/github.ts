export function infoFromEnv() {
    const { env } = process
    const ci = !!env.CI
    const repository = env.GITHUB_REPOSITORY
    const sha = env.GITHUB_SHA
    const apiUrl = env.GITHUB_API_URL
    const ref = env.GITHUB_REF
    const issue = parseInt(
        /^refs\/pull\/(?<issue>\d+)\/merge$/.exec(ref || "")?.groups?.issue ||
            ""
    )
    return {
        ci,
        apiUrl,
        repository,
        sha,
        issue: isNaN(issue) ? undefined : issue,
    }
}
