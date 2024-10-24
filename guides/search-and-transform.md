
import { Code } from "@astrojs/starlight/components"
import source from "../../../../../packages/vscode/genaisrc/st.genai.mjs?raw"

This script is an evolution of the "search and replace" feature from text editor,
where the "replace" step has been replaced by a LLM transformation.

It can be useful to batch apply text transformations that are not easily done with
regular expressions.

For example, when GenAIScript added the ability to use a string command string in
the `exec` command, we needed to convert all script using

```js
host.exec("cmd", ["arg0", "arg1", "arg2"])
```

to

```js
host.exec(`cmd arg0 arg1 arg2`)`
```

While it's possible to match this function call with a regular expression

```regex
host\.exec\s*\([^,]+,\s*\[[^\]]+\]\s*\)
```

it's not easy to formulate the replacement string... unless you can describe it in natural language:

```txt
Convert the call to a single string command shell in TypeScript
```

Here are some example of the transformations where the LLM correctly handled variables.

-   concatenate the arguments of a function call into a single string

```diff wrap
- const { stdout } = await host.exec("git", ["diff"])
+ const { stdout } = await host.exec(`git diff`)
```

-   concatenate the arguments and use the `${}` syntax to interpolate variables

```diff wrap
- const { stdout: commits } = await host.exec("git", [
-     "log",
-     "--author",
-     author,
-     "--until",
-     until,
-     "--format=oneline",
- ])
+ const { stdout: commits } = await host.exec(`git log --author ${author} --until ${until} --format=oneline`)
```

## Search

The search step is done with the [workspace.grep](/genaiscript/reference/scripts/files)
that allows to efficiently search for a pattern in files (this is the same search engine
that powers the Visual Studio Code search).

```js "workspace.grep"
const { pattern, globs } = env.vars
const patternRx = new RegExp(pattern, "g")
const { files } = await workspace.grep(patternRx, { globs })
```

## Compute Transforms

The second step is to apply the regular expression to the file content
and pre-compute the LLM transformation of each match using an [inline prompt](/genaiscript/reference/scripts/inline-prompts).

```js
const { transform } = env.vars
...
const patches = {} // map of match -> transformed
for (const file of files) {
    const { content } = await workspace.readText(file.filename)
    for (const match of content.matchAll(patternRx)) {
        const res = await runPrompt(
            (ctx) => {
                ctx.$`
            ## Task

            Your task is to transform the MATCH with the following TRANSFORM.
            Return the transformed text.
            - do NOT add enclosing quotes.

            ## Context
            `
                ctx.def("MATCHED", match[0])
                ctx.def("TRANSFORM", transform)
            },
            { label: match[0], system: [], cache: "search-and-transform" }
        )
        ...
```

Since the LLM sometimes decides to wrap the answer in quotes, we need to remove them.

```js
    ...
    const transformed = res.fences?.[0].content ?? res.text
    patches[match[0]] = transformed
```

## Transform

Finally, with the transforms pre-computed, we apply a final regex replace to
patch the old file content with the transformed strings.

```js
    const newContent = content.replace(
        patternRx,
        (match) => patches[match] ?? match
    )
    await workspace.writeText(file.filename, newContent)
}
```

## Parameters

The script takes three parameters: a file glob, a pattern to search for, and a LLM transformation to apply.
We declare these parameters in the `script` metadata and extract them from the `env.vars` object.

```js
script({ ...,
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
const { pattern, glob, transform } = env.vars
```

## Full source

<Code code={source} wrap={true} lang="ts" title="st.genai.mts" />

To run this script, you can use the `--vars` option to pass the pattern and the transform.

```sh wrap
genaiscript st --vars 'pattern=host\.exec\s*\([^,]+,\s*\[[^\]]+\]\s*\)' 'transform=Convert the call to a single string command shell in TypeScript'
```
