
In the world of software development, making consistent and informative commit messages is crucial but often overlooked.
This task can become tedious, especially when you are in the flow of coding.
To help with this, we've crafted a [script tailored to automate generating Git commit messages](https://github.com/microsoft/genaiscript/blob/main/genaisrc/gcm.genai.mts),
ensuring they are meaningful and save you time.

The script acts as a regular node.js automation script and uses [runPrompt](/genaiscript/reference/scripts/inner-prompts)
to issue calls to the LLM and ask the user to confirm the generated text.

## Explaining the Script

First, we check if there are any staged changes in the Git repository:

```ts
let { stdout } = await host.exec("git", ["diff", "--cached"])
```

If no changes are staged, we ask the user if they want to stage all changes. If the user confirms, we stage all changes. Otherwise, we bail out.

```ts
const stage = await host.confirm("No staged changes. Stage all changes?", {
    default: true,
})
if (stage) {
    await host.exec("git", ["add", "."])
    stdout = (await host.exec("git", ["diff", "--cached"])).stdout
}
if (!stdout) cancel("no staged changes")
```

We generate an initial commit message using the staged changes:

```ts
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
        { cache: false, temperature: 0.8 }
    )
).text
```

The prompt configuration above indicates that the message should be concise,
related to the "git diff --cached" output, and should not include quotes.

User chooses how to proceed with the generated message:

```ts
    choice = await host.select(
        message,
        [{ name: "commit", value: "commit", description: "accept message and commit" },
            ...],
    )
```

Options are given to edit or regenerate the message. If the user chooses to edit the message, we ask them to input a new message:

```ts
if (choice === "edit") {
    message = await host.input("Edit commit message", { required: true })
    choice = "commit"
}
```

If the user chooses to commit the message, we commit the changes:

```ts
if (choice === "commit" && message) {
    console.log((await host.exec("git", ["commit", "-m", message])).stdout)
}
```

## Running the Script

You can run this script using the [CLI](/genaiscript/reference/cli).

```bash
npx --yes genaiscript run gcm
```

You can wrap this command in a `gcm.sh` file or in your package `script` section in `package.json`:

```json '"gcm": "genaiscript run gcm"'
{
    "devDependencies": {
        "genaiscript": "*"
    },
    "scripts": {
        "gcm": "genaiscript run gcm"
    }
}
```

Then you can run the script using:

```bash
npm run gcm
```

## Using git hooks

You can also attach to the [commit-msg](https://git-scm.com/docs/githooks#_commit_msg) git hook to run the message generation on demand.
Using the [huksy](https://typicode.github.io/husky/) framework, we can register the execution
of genaiscript in the `.husky/commit-msg` file.

The `commit-msg` hook receives a file location where the message is stored. We pass this parameter to the script
so that it gets populated in the `env.files` variable.

```bash title=".husky/commit-msg"
npx --yes genaiscript run commit-msg "$1"
```

In the script, we check if the content of the file already has a user message, otherwize generate a new message.

```js title="commit-msg.genai.mts"
const msg = env.files[0] // file created by git to hold the message
const msgContent = msg.content // check if the user added any message
    ?.split(/\n/g)
    .filter((l) => l && !/^#/.test(l)) // filter out comments
    .join("\n")
if (msgContent) cancel("commit message already exists")

...

await host.writeText(msg.filename, message)
```

## Acknowledgements

This script was inspired from Karpathy's
[commit message generator](https://gist.github.com/karpathy/1dd0294ef9567971c1e4348a90d69285).
