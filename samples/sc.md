This example showcases updating files and pushing a commit with the changes
in a GitHub Action using GitHub Models.

## Add the script

- Open your GitHub repository and start a new pull request.
- Add the following script to your repository as `sc.genai.mts` in the `genaisrc` folder.

```ts title="genaisrc/sc.genai.mts" wrap
script({
    title: "Spell checker",
    system: ["system.output_plaintext", "system.assistant", "system.files"],
    responseType: "text",
    systemSafety: false,
    temperature: 0.2,
    parameters: {
        base: "",
    },
})
const { vars } = env
const base = vars.base || "HEAD~1"
console.debug(`base: ${base}`)
let files = env.files.length
    ? env.files
    : await git.listFiles("modified-base", { base })
files = files.filter((f) => /\.mdx?$/.test(f.filename))
console.debug(`files: ${files.map((f) => f.filename).join("\n")}`)

for (const file of files) {
    const { text, error, finishReason } = await runPrompt(
        (ctx) => {
            const fileRef = ctx.def("FILES", file)
            ctx.$`Fix the spelling and grammar of the content of ${fileRef}. Return the full file with corrections.
If you find a spelling or grammar mistake, fix it. 
If you do not find any mistakes, respond <NO> and nothing else.

- only fix major errors
- use a technical documentation tone
- minimize changes; do NOT change the meaning of the content
- if the grammar is good enough, do NOT change it
- do NOT modify the frontmatter. THIS IS IMPORTANT.
- do NOT modify code regions. THIS IS IMPORTANT.
- do NOT modify URLs
- do NOT fix \`code\` and \`\`\`code\`\`\` sections
- in .mdx files, do NOT fix inline TypeScript code
`
        },
        { label: file.filename }
    )
    if (
        !text ||
        file.content === text ||
        error ||
        finishReason !== "stop" ||
        /<NO>/i.test(text)
    )
        continue
    console.debug(`update ${file.filename}`)
    await workspace.writeText(file.filename, text)
}
```

- run the [GenAIScript cli](/genaiscript/reference/cli/) to add the type definition files and fix the syntax errors in the editor (optional).

```bash
npx --yes genaiscript script fix
```

The script collects the list of modified files in the last commit and filters them to only include `.md` and `.mdx` files.
It then runs a prompt for each file, asking the LLM to fix spelling and grammar mistakes while preserving the content.

The prompt includes instructions to avoid modifying the frontmatter, code regions, URLs, and inline TypeScript code in `.mdx` files.
The script uses the `runPrompt` function to execute the prompt and handle the response.
The response is then written back to the file if there are any changes.
The script also includes a `system` section that defines the system prompts to be used in the script.

## Run the script locally

You can run with the script and tune the prompting to your needs.
You can use the GenAIScript Visual Studio Code extension or use the cli.

```sh
npx --yes genaiscript run sc **/*.md
```

You will see an output similar to the following. In the output, you will find links to the run reports (markdown files),
information about the model, preview of the messages and the token usage.

Open the `trace` or `output` reports in your favorite Markdown viewer to inspect the results. This part of the development
is fully local so it's your opportunity to refine the prompting.

````text wrap
docs/src/content/docs/samples/prd.md
┌─💬 github:gpt-4.1 ✉ 2 ~↑2.3kt
┌─📙 system
│## Safety: Jailbreak
│... (10 lines)
│- do NOT respond in JSON.
│- **do NOT wrap response in a 'markdown' code block!**
┌─👤 user
│<FILES lang="md" file="docs/src/content/docs/samples/prd.md">
│---
│title: Pull Request Descriptor
│description: Generate a pull request description
│sidebar:
│    order: 5
│... (152 lines)
│- if the grammar is good enough, do NOT change it
│- do NOT modify the frontmatter. THIS IS IMPORTANT.
│- do NOT modify code regions. THIS IS IMPORTANT.
│- do NOT modify URLs
│- do NOT fix `code` and ```code``` sections
│- in .mdx files, do NOT fix inline typescript code


---
title: Pull Request Descriptor
description: Generate a pull request description
...
````

## Automate with GitHub Actions

Using [GitHub Actions](https://docs.github.com/en/actions) and [GitHub Models](https://docs.github.com/en/github-models),
you can automate the execution of the script. It will run on all modified markdown files outside the `main` branch.

- Add the following workflow in your GitHub repository.

```yaml title=".github/workflows/genai-sc.yml" wrap
name: genai sc
on:
    push:
        branches-ignore:
            - main
        paths:
            - '**/*.md'
            - '**/*.mdx'
concurrency:
    group: genai-sc-{{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true
permissions:
    contents: write # permission to read the repository
    models: read # permission to use github models
jobs:
    review:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: "22"
            - name: fetch previous commit
              run: git fetch origin ${{ github.event.before }} --depth=1
            - name: genaiscript sc
              run: npx --yes genaiscript run sc --vars base="${{ github.event.before }}" --out-trace $GITHUB_STEP_SUMMARY
              env:
                  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            - name: Commit and push changes
              run: |
                  git config user.name "github-actions[bot]"
                  git config user.email "github-actions[bot]@users.noreply.github.com"
                  git add -u
                  if git diff --cached --quiet; then
                    echo "No changes to commit."
                  else
                    git commit -m "fix: spellcheck markdown files [genai]"
                    git pull origin $(git rev-parse --abbrev-ref HEAD) --ff-only
                    git push
                  fi
```

## Content Safety

The following measures are taken to ensure the safety of the generated content.

- This script includes system prompts to prevent prompt injection and harmful content generation.
    - [system.safety_jailbreak](/genaiscript/reference/scripts/system#systemsafety_jailbreak)
    - [system.safety_harmful_content](/genaiscript/reference/scripts/system#systemsafety_harmful_content)

Additional measures to further enhance safety would be to run [a model with a safety filter](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter?tabs=warning%2Cuser-prompt%2Cpython-new)
or validate the message with a [content safety service](/genaiscript/reference/scripts/content-safety).

Refer to the [Transparency Note](/genaiscript/reference/transparency-note/) for more information on content safety.