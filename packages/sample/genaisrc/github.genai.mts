script({
    model: "openai:gpt-3.5-turbo",
    tests: {},
})

const issues = await github.listIssues({ count: 5 })
if (issues.length === 0) throw new Error("No issues found")
console.log(issues.map((i) => i.title))
const issueComments = await github.listIssueComments(issues[0].number)
console.log(issueComments)

const prs = await github.listPullRequests()
console.log(prs.slice(0, 5).map((i) => i.title))
if (prs.length === 0) throw new Error("No PRs found")

const prcs = await github.listPullRequestReviewComments(prs[0].number)
console.log(prcs.map((i) => i.body))

const pkg = await github.getFile("package.json", "main")
console.log(pkg.content.slice(0, 50) + "...")
if (!pkg.content?.length) throw new Error("No package.json found")

const res = await github.searchCode("HTMLToText")
console.log(res)
if (!res.length) throw new Error("No search results found")

const runs = await github.listWorkflowRuns("build.yml", { count: 5 })
console.log(runs.map((i) => i.status))
if (!runs.length) throw new Error("No workflow runs found")

const jobs = await github.listWorkflowJobs(runs[0].id)
console.log(jobs[0].content)
if (!jobs.length) throw new Error("No workflow jobs found")

const languages = await github.listRepositoryLanguages()
console.log(languages)
if (!Object.keys(languages).length) throw new Error("No languages found")

const files = await github.getRepositoryContent("", {
    type: "file",
    downloadContent: true,
    maxDownloadSize: 2_000,
})
if (!files.length) throw new Error("No files found")
console.log(
    files.map(({ filename, content }) => ({
        filename,
        content: content?.slice(0, 50),
    }))
)
