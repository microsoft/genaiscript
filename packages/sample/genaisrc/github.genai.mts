script({
    model: "openai:gpt-3.5-turbo",
    tests: {},
})
const issues = await github.listIssues()
console.log(issues.slice(0, 5).map((i) => i.title))
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
