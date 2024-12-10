
import { Code } from "@astrojs/starlight/components"
import source from "../../../../../packages/sample/genaisrc/samples/st.genai.mts?raw"

Search And Replace is a powerful tool in the developer toolbelt that can save you time and effort...
if you can formulate the right regular expression.

**Search and Transform** is a twist on the same concept
but we use an LLM to perform the transformation instead of a simple string replacement.

### 👩‍💻 Understanding the Script Code

```ts
script({
    title: "Search and transform",
    description:
        "Search for a pattern in files and apply an LLM transformation to the match",
    parameters: {
        glob: {
            type: "string",
            description: "The glob pattern to filter files",
            default: "*",
        },
        pattern: {
            type: "string",
            description: "The text pattern (regular expression) to search for",
        },
        transform: {
            type: "string",
            description: "The LLM transformation to apply to the match",
        },
    },
})
```

The script starts by defining its purpose and parameters using the `script` function. Here, we define the title, description, and the three parameters the script will need: `glob` to specify the files, `pattern` for the text to search for, and `transform` for the desired transformation.

### Extracting and Validating Parameters

```ts
const { pattern, glob, transform } = env.vars
if (!pattern) cancel("pattern is missing")
const patternRx = new RegExp(pattern, "g")

if (!transform) cancel("transform is missing")
```

Next, we extract the `pattern`, `glob`, and `transform` parameters from the environment variables and validate them. If `pattern` or `transform` are missing, the script will cancel execution. We then compile the `pattern` into a regular expression object for later use.

### Searching for Files and Matches

```ts
const { files } = await workspace.grep(patternRx, glob)
```

Here, we use the `grep` function from the `workspace` API to search for files that match the `glob` pattern and contain the regex pattern.

### Transforming Matches

```ts
// cached computed transformations
const patches = {}
for (const file of files) {
    console.log(file.filename)
    const { content } = await workspace.readText(file.filename)
    // skip binary files
    if (!content) continue
    // compute transforms
    for (const match of content.matchAll(patternRx)) {
        console.log(`  ${match[0]}`)
        if (patches[match[0]]) continue
```

We initialize an object called `patches` to store the transformations. Then, we loop through each file, read its content, and skip binary files. For each match found in the file's content, we check if we've already computed a transformation for this match to avoid redundant work.

### Generating Prompts for Transformations

```ts
const res = await runPrompt(
    (_) => {
        _.$`
            ## Task
            
            Your task is to transform the MATCH using the following TRANSFORM.
            Return the transformed text.
            - do NOT add enclosing quotes.
            
            ## Context
            `
        _.def("MATCHED", match[0])
        _.def("TRANSFORM", transform)
    },
    { label: match[0], system: [], cache: "search-and-transform" }
)
```

For each unique match, we generate a prompt using the `runPrompt` function. In the prompt, we define the task and context for the transformation, specifying that the transformed text should be returned without enclosing quotes. We also define the matched text and the transformation to apply.

### Applying the Transformation

```ts
        const transformed = res.fences?.[0].content ?? res.text
        if (transformed) patches[match[0]] = transformed
        console.log(`  ${match[0]} -> ${transformed ?? "?"}`)
    }
    // apply transforms
    const newContent = content.replace(
        patternRx,
        (match) => patches[match] ?? match
    )
```

We then extract the transformed text from the prompt result and store it in the `patches` object. Finally, we apply the transformations to the file content using `String.prototype.replace`.

### Saving the Changes

```ts
    if (content !== newContent)
        await workspace.writeText(file.filename, newContent)
}
```

If the file content has changed after applying the transformations, we save the updated content back to the file.

## Running the Script

To run this script, you'll need the GenAIScript CLI. Check out the [installation guide](https://microsoft.github.io/genaiscript/getting-started/installation) if you need to set it up. Once you have the CLI, run the script by executing:

```bash
genaiscript run st
```

## Full source ([GitHub](https://github.com/microsoft/genaiscript/blob/main/packages/sample/genaisrc/samples/st.genai.mts))

<Code code={source} wrap={true} lang="ts" title="st.genai.mts" />

## Content Safety

The following measures are taken to ensure the safety of the generated content.

-   This script includes system prompts to prevent prompt injection and harmful content generation.
    - [system.safety_jailbreak](/genaiscript/reference/scripts/system#systemsafety_jailbreak)
    - [system.safety_harmful_content](/genaiscript/reference/scripts/system#systemsafety_harmful_content)
-   The generated description is saved to a file at a specific path, which allows for a manual review before committing the changes.

Additional measures to further enhance safety would be to run [a model with a safety filter](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter?tabs=warning%2Cuser-prompt%2Cpython-new)
or validate the message with a [content safety service](/genaiscript/reference/scripts/content-safety).

Refer to the [Transparency Note](/genaiscript/reference/transparency-note/) for more information on content safety.
