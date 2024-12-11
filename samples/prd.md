
import { Code } from "@astrojs/starlight/components"
import source from "../../../../../packages/sample/genaisrc/samples/prd.genai.mts?raw"

Pull requests are an integral part of collaborative software development.
They allow developers to review code changes before merging them into the main codebase.
Creating informative and concise pull request descriptions can be a time-consuming task, especially when dealing with large or complex changes.
This is where GenAI comes in, streamlining the process with a smart script that generates pull request descriptions automatically. 🚀

### Script Metadata

```ts wrap
script({
    title: "Pull Request Descriptor",
    description: "Generate a pull request description from the git diff",
    temperature: 0.5,
    system: [
        "system",
        "system.safety_harmful_content",
        "system.safety_protected_material",
    ],
})
```

The `script` function is used to set up the script's metadata. It's the first thing you'll notice, and here's what each property means:

-   `title`: This is the name of the script, which is "Pull Request Descriptor."
-   `description`: A brief explanation of what the script does.
-   `temperature`: Sets the creativity level for the AI model. A lower temperature means less creativity, and `0.5` is a balanced choice.
-   `system.safety...` injects safety rules into the system message to ensure the AI model is not producing harmful or protected content.

### Gathering Changes with Git

The script captures the difference between the current branch and the `defaultBranch`.

```ts
// compute diff
const defaultBranch = await git.defaultBranch()
const changes = await git.diff({
    base: defaultBranch,
})
console.log(changes)
```

### Defining the Git Diff Output

```ts
def("GIT_DIFF", changes, {
    language: "diff",
    maxTokens: 20000,
})
```

Here, `def` is used to define a variable called `GIT_DIFF` that holds the changes from the git diff command. It specifies that the content is in `diff` format and allows up to `20000` tokens (a measure of content length for the AI model).

### Generating the Pull Request Description

```ts
$`You are an expert software developer and architect.

## Task

- Describe a high level summary of the changes in GIT_DIFF in a way that a software engineer will understand.

## Instructions

- do NOT explain that GIT_DIFF displays changes in the codebase
- try to extract the intent of the changes, don't focus on the details
- use bullet points to list the changes
- use emojis to make the description more engaging
- focus on the most important changes
- ignore comments about imports (like added, remove, changed, etc.)
`
```

The template literal, denoted by `$`, is where the AI model is given a prompt to generate the pull request description. The instructions are clearly laid out: summarize the changes without going into details and make the description easy to understand by using bullet points and emojis.

## Running the Script

To use this script, you need the GenAIScript CLI installed. If you haven't installed it yet, please refer to the [installation guide](https://microsoft.github.io/genaiscript/getting-started/installation).

Once you have the CLI set up, run the following command:

```shell
npx genaiscript run prd
```

Adding the `-prd` flag will automatically update the pull request description on github as well.

```shell
npx genaiscript run prd -prd
```

## Full source ([GitHub](https://github.com/microsoft/genaiscript/blob/main/packages/sample/genaisrc/samples/prd.genai.mts))

<Code code={source} wrap={true} lang="ts" title="prd.genai.mts" />

## Content Safety

The following measures are taken to ensure the safety of the generated content.

-   This script includes system prompts to prevent prompt injection and harmful content generation.
    -   [system.safety_jailbreak](/genaiscript/reference/scripts/system#systemsafety_jailbreak)
    -   [system.safety_harmful_content](/genaiscript/reference/scripts/system#systemsafety_harmful_content)
-   The generated description is saved to a file at a specific path, which allows for a manual review before committing the changes.

Additional measures to further enhance safety would be to run [a model with a safety filter](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter?tabs=warning%2Cuser-prompt%2Cpython-new)
or validate the message with a [content safety service](/genaiscript/reference/scripts/content-safety).

Refer to the [Transparency Note](/genaiscript/reference/transparency-note/) for more information on content safety.
