script({
    title: "Issue Bot",
    description: "A bot that can't stop answering issues.",
    responseType: "markdown",
    systemSafety: true,
    tools: ["fs_find_files", "fs_read_file"],
    group: "actions",
    parameters: {
        issue: {
            type: "integer",
            description: "The issue number to answer.",
            required: false,
        },
    },
})

const { title, body, number } = await github.getIssue(env.vars.issue)
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
Review the current issue and respond to the conversation.

- The <TITLE>, <BODY>, and <COMMENTS> are provided below.
- do NOT suggest start a pull request.
`
