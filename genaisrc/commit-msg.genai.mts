const msg = env.files[0]
const msgContent = msg.content
    ?.split(/\n/g)
    .filter((l) => l && !/^# /.test(l))
    .join("\n")
if (!msgContent) cancel("commit message already exists")

// Check for staged changes and stage all changes if none are staged
let diff = await host.exec("git", ["diff", "--cached"])
if (!diff.stdout) cancel("no staged changes")
// Generate commit message
const res = await runPrompt(
    (_) => {
        _.def("GIT_DIFF", diff, { maxTokens: 20000 })
        _.$`GIT_DIFF is a diff of all staged changes, coming from the command:
\`\`\`
git diff --cached
\`\`\`
Please generate a concise, one-line commit message for these changes.
- do NOT add quotes`
    },
    { cache: false, temperature: 0.8 }
)

if (res.error) throw res.error
const message = res.text
if (!message) cancel("no message generated")
await workspace.writeText(msg.filename, message)
