---
title: Pull Request Descriptor
description: Generate a pull request description
sidebar:
    order: 5
cover:
    alt: 'A retro 8-bit-inspired geometric illustration depicting a folder named
        ".genaisrc" with a file titled "prd.genai.mts" inside. Surrounding the
        folder are symbolic icons: arrows and file comparison lines representing git
        diffs, a GitHub logo, a cloud icon symbolizing GitHub Actions, a gear for
        automation, and a shield for content safety. The artwork integrates five
        corporate colors and maintains simplicity without text or human figures.'
    image: ./prd.png
tags:
    - 1. GitHub Actions Automation
    - 2. Pull Request Description Generator
    - 3. Code Review Script
    - 4. GenAIScript Integration
    - 5. Content Safety Measures
excerpt: >-
    Streamline your pull request process with automated descriptions. In this
    guide, you'll learn how to build a script that generates high-level summaries
    of code changes in pull requests. The script can be run locally for testing
    and refinement, then integrated with GitHub Actions for seamless automation. 


    Key highlights include:

    - Utilizing `git.diff` to extract changes and summarize their intent.

    - Adding safety mechanisms to prevent harmful content generation.

    - Leveraging agents like `fs_read_file` or `agent_fs` for deeper context
    analysis.

    - Automating the process with a GitHub workflow to update pull request
    descriptions dynamically.


    This approach not only improves developer efficiency but also enhances code
    review clarity. Adapt it to fit your workflow and enjoy more streamlined
    collaboration.
---

The following sample shows a script that generate a description of the changes in a pull request.
We will develop the script locally and then create a GitHub Action to run it automatically.

## Add the script

- **Create a new branch** in your repository.
- Add the following script to your repository as `prd.genai.mts` in the `.genaisrc` folder.

```ts title="genaisrc/prd.genai.mts" wrap
script({
    title: "Pull Request Descriptor",
    description: "Generate a description for the current pull request",
    systemSafety: true,
    parameters: {
        base: "",
    },
})
const { dbg, vars } = env
const base = vars.base || (await git.defaultBranch())
const changes = await git.diff({
    base,
    llmify: true,
})
if (!changes) cancel("No changes found in the pull request")
dbg(`changes: %s`, changes)
const gitDiff = def("GIT_DIFF", changes, {
    language: "diff",
    maxTokens: 14000,
    detectPromptInjection: "available",
})
$`## Task

You are an expert code reviewer with great English technical writing skills.

Your task is to generate a high level summary of the changes in ${gitDiff} for a pull request in a way that a software engineer will understand.
This description will be used as the pull request description.

## Instructions

- do NOT explain that GIT_DIFF displays changes in the codebase
- try to extract the intent of the changes, don't focus on the details
- use bullet points to list the changes
- use gitmojis to make the description more engaging
- focus on the most important changes
- do not try to fix issues, only describe the changes
- ignore comments about imports (like added, remove, changed, etc.)
`
```

- run the [GenAIScript cli](/genaiscript/reference/cli/) to add the type definition files and fix the syntax errors in the editor (optional).

```bash
npx --yes genaiscript script fix
```

The script starts with a metadata section (`script({ ... })`) that defines the title, description, and system safety options.
The script then uses the `git` tool to get the diff of the pull request and stores it in the `GIT_DIFF` variable.

The script then uses the `$` template literal to generate a report based on the diff. The report includes best practices for the programming language of each file, and it is important to analyze all the code.
The script also includes a note to use tools to read the entire file content to get more context and to avoid reporting warnings.

## Run the script locally

Make sure to commit your changes to the branch and push it to GitHub. Then **create a new pull request**.

Since you are already in a pull request, you can run with the script and tune the prompting to your needs.
You can use the GenAIScript Visual Studio Code extension or use the cli.

```sh
npx --yes genaiscript run prd
```

You will see an output similar to the following. In the output, you will find links to the run reports (markdown files),
information about the model, preview of the messages and the token usage.

Open the `trace` or `output` reports in your favorite Markdown viewer to inspect the results. This part of the development
is fully local so it's your opportunity to refine the prompting.

```text
┌─💬 github:gpt-4.1 ✉ 2 ~↑729t
┌─📙 system
│## Safety: Jailbreak
│... (18 lines)
│- **Do NOT use function names starting with 'functions.'.
│- **Do NOT respond with multi_tool_use**.
┌─👤 user
│<GIT_DIFF lang="diff">
│--- genaisrc/prd.genai.mts
│+++ genaisrc/prd.genai.mts
│@@ -2,7 +2,7 @@ script({
│[2]      title: "Pull Request Descriptor",
│[3]      description: "Generate a description for the current pull request",
│... (24 lines)
│- try to extract the intent of the changes, don't focus on the details
│- use bullet points to list the changes
│- use gitmojis to make the description more engaging
│- focus on the most important changes
│- do not try to fix issues, only describe the changes
│- ignore comments about imports (like added, remove, changed, etc.)

- 🔒 Removed agent_git tool from both "Pull Request Descriptor" and "Pull Request Reviewer" scripts, leaving only the agent_fs tool enabled
- 🛡️ Maintained systemSafety and general parameter structure unchanged in both scripts

└─🏁  github:gpt-4.1 ✉ 2 1165ms ⇅ 909t ↑844t ↓65t 0.221¢
```

## Automate with GitHub Actions

Using [GitHub Actions](https://docs.github.com/en/actions) and [GitHub Models](https://docs.github.com/en/github-models),
you can automate the execution of the script and creation of the comments.

- Add the following workflow in your GitHub repository.

```yaml title=".github/workflows/genai-prd.yml" wrap
name: genai pull request description
on:
    pull_request:
        types: [ready_for_review, review_requested]
concurrency:
    group: genai-pr-review-${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true
permissions:
    contents: read # permission to read the repository
    pull-requests: write # permission to write a comment
    models: read # permission to use github models
jobs:
    describe:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: "22"
            - name: fetch base branch
              run: git fetch origin ${{ github.event.pull_request.base.ref }}
            - name: genaiscript prd
              continue-on-error: true
              run: npx --yes genaiscript run prd --vars base=origin/${{ github.event.pull_request.base.ref }} --pull-request-description --out-trace $GITHUB_STEP_SUMMARY
              env:
                  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The action triggers when the pull request is marked as `ready_for_review` or when a review is requested.

```yaml
    pull_request:
        types: [ready_for_review, review_requested]
```

The command line uses a special flag to update the generate pull request description:

- `--pull-request-description` to update the description of the pull request

We've also added `continue-on-error: true` so that the workflow does not fail if the script fails.

- Commit the changes, and create a new pull request and start testing the workflow by requesting a review or toggling the `ready_for_review` event.

## Content Safety

The following measures are taken to ensure the safety of the generated content.

- This script includes system prompts to prevent prompt injection and harmful content generation.
    - [system.safety_jailbreak](/genaiscript/reference/scripts/system#systemsafety_jailbreak)
    - [system.safety_harmful_content](/genaiscript/reference/scripts/system#systemsafety_harmful_content)

Additional measures to further enhance safety would be to run [a model with a safety filter](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter?tabs=warning%2Cuser-prompt%2Cpython-new)
or validate the message with a [content safety service](/genaiscript/reference/scripts/content-safety).

Refer to the [Transparency Note](/genaiscript/reference/transparency-note/) for more information on content safety.

## Make it Agentic

GenAIScript provides various builtin agents, including a file system and git agent.
This can be useful for the LLM to read the files in the pull request and analyze them.

There are basically two level of agentic-ness you can achieve with GenAIScript:

### Tools

- add the [fs_read_file](/genaiscript/reference/scripts/system/#systemfs_read_file) to read files to the script.

```ts title="genaisrc/prd.genai.mts" wrap 'tools: ["fs_read"]'
script({
    ...,
    tools: ["fs_read_file"],
})
```

### Agents

- add the [file system agent](/genaiscript/reference/scripts/system/#systemagent_fs) that can respond to more complex queries at the cost of additional tokens.

```ts title="genaisrc/prd.genai.mts" wrap 'tools: ["agent_fs"]'
script({
    ...,
    tools: ["agent_fs"],
})
```