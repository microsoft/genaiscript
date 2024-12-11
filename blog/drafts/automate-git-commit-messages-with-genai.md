
## Simplifying Your Git Workflow with GenAI

Coding can be a lot of fun, but let's be honest, sometimes the administrative parts of the process, like crafting the perfect commit message, can be a bit of a drag. 😓 But what if I told you that you could automate that with GenAI? That's right, with a little bit of setup, GenAI can generate commit messages for you, based on your staged changes. 🎉

The script we're discussing can be found [right here on GitHub](https://github.com/microsoft/genaiscript/blob/main/packages/sample/genaisrc/samples/gcm.genai.mts), and it's called `git commit message`. Its purpose is to help you swiftly create commit messages without the mental overhead of crafting them manually every single time.

Let's break down this script, shall we?

### The Script Explained

First off, we define the `script` function, which sets up our GenAI script by providing a title and a description, and specifying the model we'll be using:

```ts
script({
    title: "git commit message",
    description: "Generate a commit message for all staged changes",
    model: "openai:gpt-4o",
})
```

Next up, we check for any staged changes in your Git repository using `git diff --cached`. If there's nothing staged, GenAI kindly offers to stage all changes for you:

```ts
let diff = await host.exec("git diff --cached")
if (!diff.stdout) {
    const stage = await host.confirm("No staged changes. Stage all changes?", {
        default: true,
    })
    if (stage) {
        await host.exec("git add .")
        diff = await host.exec("git diff --cached -- . :!**/genaiscript.d.ts")
    }
    if (!diff.stdout) cancel("no staged changes")
}
```

We then log the diff to the console so you can review what changes are about to be committed:

```ts
console.log(diff.stdout)
```

Here comes the interesting part. We enter a loop where GenAI will generate a commit message for you based on the diff. If you're not satisfied with the message, you can choose to edit it, accept it, or regenerate it:

```ts
let choice
let message
do {
    const res = await runPrompt(
        (_) => {
            _.def("GIT_DIFF", diff, { maxTokens: 20000 })
            _.$`GIT_DIFF is a diff of all staged changes, coming from the command:
\`\`\`
git diff --cached
\`\`\`
Please generate a concise, one-line commit message for these changes.
- do NOT add quotes
`
        },
        { cache: false, temperature: 0.8 }
    )
    // ... handle response and user choices
} while (choice !== "commit")
```

If you choose to commit, GenAI runs the `git commit` command with your message, and if you're feeling super confident, it can even push the changes to your repository right after:

```ts
if (choice === "commit" && message) {
    console.log(
        (await host.exec("git", ["commit", "-m", message, "-n"])).stdout
    )
    if (await host.confirm("Push changes?", { default: true }))
        console.log((await host.exec("git push")).stdout)
}
```

### Running the Script with GenAIScript CLI

Getting this script up and running is a cinch. If you've already installed the [GenAIScript CLI](https://microsoft.github.io/genaiscript/getting-started/installation), you can simply run it with:

```shell
genaiscript run gcm
```

Remember, you'll need to have your changes staged in Git for the script to work its magic. 🧙

So there you have it, a complete breakdown of a script that might just become your new best friend in the Git world. Give it a try and say goodbye to commit message woes! 👋
