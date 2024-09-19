---
title: "Search and Transform with GenAI"
date: 2024-09-19
authors: genaiscript
draft: true
tags: ["genai", "scripting", "automation"]
canonical_url: https://microsoft.github.io/genaiscript/blog/search-transform-genai
---

## Introduction

Have you ever found yourself in a situation where you need to search through multiple files in your project, find a specific pattern, and then apply a transformation to it? It can be a tedious task, but fear not! In this blog post, I'll walk you through a GenAIScript that does just that, automating the process and saving you time. 🕒💡

The script we'll be examining is a powerful tool that can search for text patterns in files using regular expressions and apply a transformation to each match using language models. We will look at the script step-by-step to understand how it works. Let's get started!

## The Script Explained

First things first, you can find the script on GitHub at [st.genai.mts](https://github.com/microsoft/genaiscript/blob/main/packages/vscode/genaisrc/st.genai.mts). Now, let's break down the script.

### Setting Up the Script

```ts
script({
    title: "Search and transform",
    description:
        "Search for a pattern in files and apply a LLM transformation the match",
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
            
            Your task is to transform the MATCH with the following TRANSFORM.
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

Be sure to replace `st` with the actual name of your script if you've named it differently.

## Conclusion

This script is a fantastic example of how GenAIScript can simplify complex tasks like searching and transforming text across multiple files. By following the steps outlined, you can create your own scripts to automate your workflows and boost your productivity. Happy scripting! 🚀

Remember to check out the script on GitHub and tweak it to suit your needs. If you have any questions or want to share your own scripting experiences, feel free to leave a comment below!
