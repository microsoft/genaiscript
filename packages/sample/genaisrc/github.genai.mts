script({
    model: "openai:gpt-3.5-turbo",
    tests: {},
})

const languages = await github.listRepositoryLanguages()
console.log(languages)

const files = await github.getRepositoryContent("", {
    type: "file",
    downloadContent: true,
    maxDownloadSize: 2_000,
})
console.log(
    files.map(({ filename, content }) => ({
        filename,
        content: content?.slice(0, 50),
    }))
)

const issues = await github.listIssues({ per_page: 5 })
console.log(issues.map((i) => i.title))
const issueComments = await github.listIssueComments(issues[0].number)
console.log(issueComments)

const prs = await github.listPullRequests()
console.log(prs.slice(0, 5).map((i) => i.title))

const prcs = await github.listPullRequestReviewComments(prs[0].number)
console.log(prcs.map((i) => i.body))

const pkg = await github.getFile("package.json", "main")
console.log(pkg.content.slice(0, 50) + "...")

const res = await github.searchCode("HTMLToText")
console.log(res)

const runs = await github.listWorkflowRuns("build.yml", { per_page: 5 })
console.log(runs.map((i) => i.status))

const jobs = await github.listWorkflowJobs(runs[0].id)
// redacted job log
console.log(jobs[0].content)
