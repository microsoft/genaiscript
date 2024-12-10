
import { Code } from "@astrojs/starlight/components"
import source from "../../../../../packages/sample/genaisrc/samples/sc.genai.mts?raw"

Automating and improving the efficiency of proofreading documents is a common need among developers and writers. This script addresses this need by checking and correcting spelling and grammar in Markdown files.

## Code Explanation

Starting at the top of the script, we see that it's a GenAI script, which is evident from the `.mts` extension and the `script` function call.

```ts
script({
    title: "Spell checker",
    system: ["system", "system.files", "system.diff"],
    temperature: 0.1,
})
```

This block sets the title of the script to "Spell checker" and specifies that it uses several system prompts, such as file operations and diff generation. The `temperature` is set to `0.1`, indicating that the script will generate output with low creativity, thus favoring precision.

### Fetching Files for Checking

Next, we check for files to process, first from the environment and then from Git if none are provided.

```ts
let files = env.files
if (files.length === 0) {
    const gitStatus = await host.exec("git diff --name-only --cached")
    files = await Promise.all(
        gitStatus.stdout
            .split(/\r?\n/g)
            .filter((filename) => /\.(md|mdx)$/.test(filename))
            .map(async (filename) => await workspace.readText(filename))
    )
}
```

In this block, we're assigning files from the `env` variable, which would contain any files passed to the script. If no files are provided, we execute a Git command to get a list of all cached (staged) modified files and filter them to include only `.md` and `.mdx` files. We then read the content of these files for processing.

### Defining the File Types to Work on

Following this, there's a `def` call:

```ts
def("FILES", files, { endsWith: [".md", ".mdx"] })
```

This line defines `FILES` to be the array of files we gathered. The options object `{ endsWith: [".md", ".mdx"] }` tells GenAI that we're only interested in files ending with `.md` or `.mdx`.

The `$`-prefixed backtick notation is used to write the prompt template:

```ts
$`Fix the spelling and grammar of the content of FILES. Use diff format for small changes.

- do NOT fix the frontmatter
- do NOT fix code regions
- do NOT fix \`code\` and \`\`\`code\`\`\`
- in .mdx files, do NOT fix inline typescript code
`
```

This prompt instructs GenAI to fix spelling and grammar in the content of the defined `FILES`, outputting small changes in diff format. It also specifies constraints, such as not fixing the frontmatter, code regions, inline code in markdown, and inline TypeScript code in MDX files.

Finally, there is a `defFileOutput` call:

```ts
defFileOutput(files, "fixed markdown or mdx files")
```

This call declares the intent that the script will generate "fixed markdown or mdx files" based on the input files.

## How to Run the Script with GenAIScript CLI

Running this spell checker script is straightforward with the GenAIScript CLI. First, ensure you have the CLI installed by following the instructions in the [GenAIScript documentation](https://microsoft.github.io/genaiscript/getting-started/installation).

Once you have the CLI installed, navigate to your local copy of the script in your terminal or command line interface. Run the following command to execute the spell checker:

```shell
genaiscript run sc
```

Remember, you do not need to specify the `.genai.mts` extension when using the `run` command.

And there you have it—a detailed walkthrough of a GenAI spell checker script for markdown files. Happy coding and perfecting your documents!

## Full source ([GitHub](https://github.com/microsoft/genaiscript/blob/main/packages/sample/genaisrc/sc.genai.mts))

<Code code={source} wrap={true} lang="ts" title="sc.genai.mts" />

## Content Safety

The following measures are taken to ensure the safety of the generated content.

-   This script includes system prompts to prevent prompt injection and harmful content generation.
    - [system.safety_jailbreak](/genaiscript/reference/scripts/system#systemsafety_jailbreak)
    - [system.safety_harmful_content](/genaiscript/reference/scripts/system#systemsafety_harmful_content)
-   The generated description is saved to a file at a specific path, which allows for a manual review before committing the changes.

Additional measures to further enhance safety would be to run [a model with a safety filter](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter?tabs=warning%2Cuser-prompt%2Cpython-new)
or validate the message with a [content safety service](/genaiscript/reference/scripts/content-safety).

Refer to the [Transparency Note](/genaiscript/reference/transparency-note/) for more information on content safety.
