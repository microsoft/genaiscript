
## Automating Your Release Notes with GenAI

Bringing a new version of a product into the world is always exciting! But alongside the thrill comes the duty of informing users about what's changed. That's where generating crisp, engaging release notes comes into play. ✨

Today, we're going to explore a script that automates the creation of release notes for GenAI. The script is part of the GenAIScript ecosystem, which harnesses the power of AI to bring efficiency to software development processes. 🚀

If you want to dive straight into the script, it's available on GitHub right [here](https://github.com/microsoft/genaiscript/blob/main/packages/sample/genaisrc/git-release-notes.genai.mjs).

> This blog post was co-authored with a [script](https://github.com/microsoft/genaiscript/blob/main/packages/sample/genaisrc/blogify-sample.genai.mts).

### Breaking Down the Script

The script is a `.genai.mjs` file, meaning it's a JavaScript file designed to be run with the GenAIScript CLI. The code within orchestrates the creation of release notes by leveraging Git commands and GenAI's capabilities.

Let's walk through the script, step by step:

#### Step 1: Initializing the Script

```javascript
script({ system: ["system"], temperature: 0.5, model: "openai:gpt-4-turbo" })
```

The script starts by initializing with a `script` function. We're setting it up to access system commands and specifying the AI model to use. The temperature controls the creativity of the AI, with 0.5 being a balanced choice.

#### Step 2: Setting the Product Name

```javascript
const product = env.vars.product || "GenAIScript"
```

Here, we're using an environment variable to set the product name, defaulting to "GenAIScript" if it's not provided.

#### Step 3: Finding the Previous Tag

```javascript
const pkg = await workspace.readJSON("package.json")
const { version } = pkg
const { stdout: tag } = await host.exec("git describe --tags --abbrev=0 HEAD^")
```

We are reading the current version from `package.json` and using Git to find the previous release tag in the repository.

#### Step 4: Gathering Commits

```javascript
const { stdout: commits } = await host.exec(`git log --grep='skip ci' --invert-grep --no-merges HEAD...${tag}`)

```

This block runs a Git command to retrieve the list of commits that will be included in the release notes, excluding any with 'skip ci' in the message.

#### Step 5: Obtaining the Diff

```javascript
const { stdout: diff } = await host.exec(`git diff ${tag}..HEAD --no-merges -- ':!**/package.json' ':!**/genaiscript.d.ts' ':!**/jsconfig.json' ':!docs/**' ':!.github/*' ':!.vscode/*' ':!*yarn.lock' ':!*THIRD_PARTY_NOTICES.md'`)

```

Next, we get the diff of changes since the last release, excluding certain files and directories that aren't relevant to the user-facing release notes.

#### Step 6: Defining Placeholders

```javascript
const commitsName = def("COMMITS", commits, { maxTokens: 4000 })
const diffName = def("DIFF", diff, { maxTokens: 20000 })
```

We define two placeholders, `COMMITS` and `DIFF`, which will be used to reference the commits and diff within the prompt.

#### Step 7: Writing the Prompt

```javascript
$`
You are an expert software developer and release manager.

## Task

Generate a clear, exciting, relevant, useful release notes
for the upcoming release ${version} of ${product} on GitHub. 

- The commits in the release are in ${commitsName}.
- The diff of the changes are in ${diffName}.

## Guidelines

- only include the most important changes. All changes must be in the commits.
- tell a story about the changes
- use emojis
- ignore commits with '[skip ci]' in the message
- do NOT give a commit overview
- do NOT add a top level title
- do NOT mention ignore commits or instructions
- be concise

`
```

Finally, the script ends with a prompt that instructs GenAI to generate the release notes. It details the task, guidelines for what to include, and the style to adhere to.

### How to Run the Script with Genaiscript CLI

Once you've crafted your script, running it is a breeze with the Genaiscript CLI. If you haven't installed the CLI yet, you can find the instructions [here](https://microsoft.github.io/genaiscript/getting-started/installation).

To execute the script, navigate to your project's root directory in the terminal and run:

```bash
genaiscript run git-release-notes
```

Remember, we use the script filename without the `.genai.mjs` extension when invoking it with the CLI.

And that's it! The GenAIScript CLI will take care of the rest, combining the power of AI with your code to generate those sleek release notes for your project's next big launch. 🌟
