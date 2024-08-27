import { select, input, confirm } from "@inquirer/prompts"

const model = env.vars.model || "openai:gpt-4"

// Check for staged changes and stage all changes if none are staged
let { stdout } = await host.exec("git", ["diff", "--cached"])
if (!stdout) {
    const stage = await confirm({
        message: "No staged changes. Stage all changes?",
        default: true,
    })
    if (stage) {
        await host.exec("git", ["add", "."])
        stdout = (await host.exec("git", ["diff", "--cached"])).stdout
    }
    if (!stdout) cancel("no staged changes")
}

console.log(stdout)

let choice
let message
do {
    // Generate commit message
    message = (
        await runPrompt(
            (_) => {
                _.def("GIT_DIFF", stdout, { maxTokens: 20000 })
                _.$`GIT_DIFF is a diff of all staged changes, coming from the command:
\`\`\`
git diff --cached
\`\`\`
Please generate a concise, one-line commit message for these changes.
- do NOT add quotes`
            },
            { model, cache: false, temperature: 0.8 }
        )
    ).text

    // Prompt user for commit message
    choice = await select({
        message,
        choices: [
            {
                name: "commit",
                value: "commit",
                description: "accept message and commit",
            },
            {
                name: "edit",
                value: "edit",
                description: "edit message and commit",
            },
            {
                name: "regenerate",
                value: "regenerate",
                description: "regenerate message",
            },
        ],
    })

    // Handle user choice
    if (choice === "edit") {
        message = await input({
            message: "Edit commit message",
            required: true,
        })
        choice = "commit"
    }
    // Regenerate message
    if (choice === "commit" && message) {
        console.log((await host.exec("git", ["commit", "-m", message])).stdout)
    }
} while (choice !== "commit")
