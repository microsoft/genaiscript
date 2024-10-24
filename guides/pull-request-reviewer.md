import { Code } from '@astrojs/starlight/components';
import importedCode from "../../../../../packages/sample/genaisrc/pr-review.genai?raw"

The **pull request reviewer** is a GenAIScript that runs in the context of a pull request. 
It can be used to review the changes in the pull request and provide feedback to the author. 
The reviewer can also suggest changes to the code, documentation, or other files in the pull request.

The output of the LLM is inserted as a comment in the pull request conversation 
(and updated as needed to avoid duplicates). 

Here is an [pull request](https://github.com/microsoft/genaiscript/pull/534) in the GenAIScript repository
with genai-generated description, comments and reviews.

## Step 1: The script

You can prototype the pull request reviewer script in a branch with known changes so that you can assess
the quality of the results. As you start using it in your build, you will be able to also refine it later on.

### `git diff`

The script starts by running `git diff` to get the changes in the pull request. Since we also know which folder
to ignore and which file we care about, we can provide additional filters to git to minimize the generated diff.

```js
const { stdout: diff } = await host.exec("git", [
    "diff",
    "main",
    "--",
    "**.ts",
    ":!**/genaiscript.d.ts", // git exclude format
    ":!**/jsconfig.json",
    ":!genaisrc/*",
    ":!.github/*",
    ":!.vscode/*",
    ":!*yarn.lock",
])
```

The diff is then inserted in the prompt using the [def](/genaiscript/reference/scripts/context) function.

```js
def("GIT_DIFF", diff, {
    language: "diff",
    maxTokens: 20000,
})
```

### Task

The second part of the prompt consists of creating the task and the persona for the LLM.

```js
$`You are an expert software developer and architect. You are
an expert in software reliability, security, scalability, and performance.

GIT_DIFF contains the changes the pull request branch. Analyze the changes in GIT_DIFF in your mind.

If the changes look good, respond "LGTM :rocket:". If you have any concerns, provide a brief description of the concerns.
`
```

Since we are reviewing TypeScript, we also pre-load the system prompt that prepares the TypeScript mindset of the LLM.

```js '"system.typescript"'
script({
    ...,
    system: [
        "system",
        "system.typescript",
    ],
})
```

### Access to the file system

The diff is a partial view of the files and the LLM needs to access the full content of the files 
to provide a meaningful review. To enable this scenario, 

```js 'tools: ["fs_find_files", "fs_read_file"]'
script({
    ...,
    tools: ["fs_find_files", "fs_read_file"],
})
```

### All together

<Code code={importedCode} wrap={true} lang="js" title="pr-review.genai.mjs" />

## Step 2: Automation in Github Actions

Add this step to your Github Actions workflow to automate the pull request review process.
The `-prc` flag stands for [--pull-request-comment](/genaiscript/reference/cli/run#pull-request-comment)
and takes care of upserting a comment in the pull request conversation.

```yaml "-prc"
permissions:
    content: read # permission to read the repository
    pull-requests: write # permission to write a comment

...

    - run: npx --yes genaiscript run ... --out ./temp/genai/pr-review -prc --out-trace $GITHUB_STEP_SUMMARY
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        ... # LLM secrets
```