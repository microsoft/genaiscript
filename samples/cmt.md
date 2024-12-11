
import { Code } from "@astrojs/starlight/components"
import source from "../../../../../packages/sample/genaisrc/samples/cmt.genai.mts?raw"

This sample automates the process of adding comments to source code using an LLM
and validates that the changes haven't introduced any code modifications.

To achieve this, we could use a combination of tools to validate the transformation: source formatters,
compilers, linters, or LLM-as-judge.

The algorithm could be summarized as follows:

```txt
for each file of files
    // generate
    add comments using GenAI

    // validate validate validate!
    format generated code (optional) -- keep things consistent
    build generated -- let's make sure it's still valid code
    check that only comments were changed -- LLM as a judge

// and more validate
final human code review
```

Let's get started with analyzing the script.

### Getting Files to Process

The user can select which files to comment on or, if none are selected, we'll use Git to find all modified files.

```ts
let files = env.files
if (files.length === 0)
    // no files selected, use git to find modified files
    files = await ..."git status --porcelain"... // details in sources
```

### Processing Each File

We process each file separately to avoid overwhelming the token context and to keep the AI focused. We can use [inline prompts](/genaiscript/reference/scripts/inline-prompts) to make inner queries.

```ts
for (const file of files) {
    ... add comments
    ... format generated code (optional) -- keep things consistent
    ... build generated -- let's make sure it's still valid code
    ... check that only comments were changed -- LLM as judge
    ... save changes
}
```

### The Prompt for Adding Comments

Within the `addComments` function, we prompt GenAI to add comments.
We do this twice to increase the likelihood of generating useful comments,
as the LLM might have been less effective on the first pass.

```ts
const res = await runPrompt(
    (ctx) => {
        ctx.$`You can add comments to this code...` // prompt details in sources
    },
    { system: ["system", "system.files"] }
)
```

We provide a detailed set of instructions to the AI on how to analyze and comment on the code.

### Format, build, lint

At this point, we have source code modified by an LLM. We should try to use all available tools to validate the changes. It is best to start with formatters and compilers, as they are deterministic and typically fast.

### Judge results with LLM

We issue one more prompt to judge the modified code (`git diff`) and make sure the code is not modified.

```ts
async function checkModifications(filename: string): Promise<boolean> {
    const diff = await host.exec(`git diff ${filename}`)
    if (!diff.stdout) return false
    const res = await runPrompt(
        (ctx) => {
            ctx.def("DIFF", diff.stdout)
            ctx.$`You are an expert developer at all programming languages.
        
        Your task is to analyze the changes in DIFF and make sure that only comments are modified. 
        Report all changes that are not comments and print "<MODIFIED>".
        `
        },
        {
            cache: "cmt-check",
        }
    )
    return res.text?.includes("<MODIFIED>")
}
```

## How to Run the Script

To run this script, you'll first need to install the GenAIScript CLI. [Follow the installation guide here](https://microsoft.github.io/genaiscript/getting-started/installation).

```sh
genaiscript run cmt
```

## Format and build

One important aspect is to normalize and validate the AI-generated code. The user can provide a `format` command to run a formatter
and a `build` command to check if the code is still valid.

```ts

script({...,
    parameters: {
        format: {
            type: "string",
            description: "Format source code command",
        },
        build: {
            type: "string",
            description: "Build command",
        },
    },
})

const { format, build } = env.vars.build
```

```sh
genaiscript run cmt --vars "build=npm run build" "format=npm run format"
```

## Full source ([GitHub](https://github.com/microsoft/genaiscript/blob/main/packages/sample/genaisrc/samples/cmt.genai.mts))

<Code code={source} wrap={true} lang="ts" title="cmt.genai.mts" />

## Content Safety

The following measures are taken to ensure the safety of the generated content:

-   This script includes system prompts to prevent prompt injection and harmful content generation.
    -   [system.safety_jailbreak](/genaiscript/reference/scripts/system#systemsafety_jailbreak)
    -   [system.safety_harmful_content](/genaiscript/reference/scripts/system#systemsafety_harmful_content)
-   The generated description is saved to a file at a specific path, which allows for a manual review before committing the changes.

Additional measures to further enhance safety would be to run [a model with a safety filter](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter?tabs=warning%2Cuser-prompt%2Cpython-new)
or validate the message with a [content safety service](/genaiscript/reference/scripts/content-safety).

Refer to the [Transparency Note](/genaiscript/reference/transparency-note/) for more information on content safety.
