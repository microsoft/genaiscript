script({
    title: "Issue Chat",
    description: "Responds to a message in the issue chat",
    temperature: 0.5,
    systemSafety: true,
    parameters: {
        base: {
            type: "string",
            description: "The base branch of the pull request",
        },
        maxTokens: {
            type: "number",
            description: "The maximum number of tokens to generate",
            default: 14000,
        },
        commentId: {
            type: "number",
        },
    },
})
const { vars } = env
const { maxTokens, commentId } = vars
const defaultBranch = env.vars.base || (await git.defaultBranch())
const branch = await git.branch()
if (branch === defaultBranch) cancel("you are already on the default branch")

// extrac the content and build the conversation
const issue = await github.getIssue()
const comments = await github.listIssueComments(issue.number)
const comment = comments.at(-1)
if (commentId && comment.id !== commentId) cancel("unknown comment id")

let body = comment.body
const rx = /^\s*\/genai /i
if (!rx.test(body)) cancel("invalid message")
body = body.replace(rx, "")

// ask the agent what to do
