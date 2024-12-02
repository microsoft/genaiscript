script({
    title: "Issue Reviewer",
    description: "Review issues and provide feedback",
})

const { GITHUB_ISSUE } = process.env
const issue = await github.getIssue(parseInt(GITHUB_ISSUE))
if (!issue) throw new Error(`Issue ${GITHUB_ISSUE} not found`)

const { title, body } = issue

$`## Tasks

You are an expert developer and have been asked to review an issue. 

Review the TITLE and BODY and report your feedback that will be added as a comment to the issue.
`.role("system")
def("TITLE", title)
def("BODY", body)
