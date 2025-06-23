script({
    title: "Issue Bot",
    description: "A bot that can't stop answering issues.",
    responseType: "markdown",
    systemSafety: true,
    group: "actions",
})

const info = await github.info()
console.log(info)
const { title, body, number } = await github.getIssue()
const comments = await github.listIssueComments(number, { count: 100 })

def("TITLE", title)
def("BODY", body)
def(
    "COMMENTS",
    comments.map((c) => `@${c.user.login}:\n${c.body}\n---\n`).join("\n"),
    {
        maxTokens: 12000,
    }
)

$`## Role
You are an expert developer.

## Task
Summarize the issue and the comments and provide useful summary.
- do NOT provide a solution.
`
