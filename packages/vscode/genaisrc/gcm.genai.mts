/**
 * git commit flow with auto-generated commit message
 */
script({
    title: "git commit message",
    description: "Generate a commit message for all staged changes",
})

// Check for staged changes and stage all changes if none are staged
const diff = await git.diff({
    staged: true,
    askStageOnEmpty: true,
})
if (!diff) cancel("no staged changes")

// show diff in the console
console.log(diff)

let choice
let message
do {
    // generate a conventional commit message (https://www.conventionalcommits.org/en/v1.0.0/)
    const res = await runPrompt(
        (_) => {
            _.def("GIT_DIFF", diff, { maxTokens: 20000, language: "diff" })
            _.$`Generate a git conventional commit message for the changes in GIT_DIFF.
        - do NOT use markdown syntax
        - do NOT add quotes or code blocks
        - keep it short, maximum 50 characters
        - use emojis`
        },
        { system: ["system.safety_jailbreak", "system.safety_harmful_content"] }
    )
    if (res.error) throw res.error

    message = res.text
    if (!message) {
        console.log("No message generated, did you configure the LLM model?")
        break
    }

    // Prompt user for commit message
    choice = await host.select(message, [
        {
            value: "commit",
            description: "accept message and commit",
        },
        {
            value: "edit",
            description: "edit message and commit",
        },
        {
            value: "regenerate",
            description: "regenerate message",
        },
    ])

    // Handle user choice
    if (choice === "edit") {
        message = await host.input("Edit commit message", {
            required: true,
        })
        choice = "commit"
    }
    // Regenerate message
    if (choice === "commit" && message) {
        console.log(await git.exec(["commit", "-m", message]))
        if (await host.confirm("Push changes?", { default: true }))
            console.log(await git.exec("push"))
        break
    }
} while (choice !== "commit")
