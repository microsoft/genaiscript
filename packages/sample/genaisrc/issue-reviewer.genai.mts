script({
    title: "Issue Reviewer",
    description: "Review issues and provide feedback",
})

const { title, body } = await github.getIssue()

$`## Tasks

You are an expert developer and have been asked to review an issue. 

Review the TITLE and BODY and report your feedback that will be added as a comment to the issue.
`.role("system")
def("TITLE", title)
def("BODY", body)
