# Authoring GPTool scripts

GPTools has a text template engine that is used to expand and assemble prompts before being sent to OpenAI. These templates can be forked and modified.

All prompts are JS files named as `*.gptool.js`. You can use the `GPTools - Fork a gptool...` to fork any known prompt.

All `system.*.gptool.js` are considered system prompt templates
and are unlisted by default. There is no variable expansion in those.

## Example

```js
gptool({
    title: "Shorten", // displayed in UI
    // also displayed, but grayed out:
    description:
        "A prompt that shrinks the size of text without losing meaning",
    categories: ["shorten"], // see Inline prompts later
})

// you can debug the generation using goo'old logs
console.log("this shows up in the `console output` section of the trace")

// but the variable is appropriately delimited
def("FILE", env.spec)

// this appends text to the prompt
$`Shorten the following FILE. Limit changes to minimum. Respond with the new FILE.`
```

## Samples

The section links to various samples of gptools; most of which are shipped with the extension.

-   [code optimizer](https://github.com/microsoft/gptools/blob/main/packages/core/src/gptools/code-optimizer.gptool.js)
-   [code xray](https://github.com/microsoft/gptools/blob/main/packages/core/src/gptools/code-xray.gptool.js)
-   [BDD feature generator](https://github.com/microsoft/gptools/blob/main/packages/core/src/gptools/bdd-feature.gptool.js)
-   [front matter generator](https://github.com/microsoft/gptools/blob/main/packages/core/src/gptools/front-matter.gptool.js)
-   [slides](https://github.com/microsoft/gptools/blob/main/packages/core/src/gptools/slides.gptool.js)
-   [peer review](https://github.com/microsoft/gptools/blob/main/packages/core/src/gptools/peer-review.gptool.js)
-   [more samples...](https://github.com/microsoft/gptools/tree/main/packages/core/src/gptools)

## Metadata

Prompts use `gptool({ ... })` function call
to configure the title and other user interface elements.

```js
gptool({
    title: "Shorten", // displayed in UI
    // also displayed, but grayed out:
    description:
        "A prompt that shrinks the size of text without losing meaning",
    categories: ["shorten"], // see Inline prompts later
})
```

### title: string

`title` is used as the prompt name, displayed in the light-bulb UI

```js
gptool({ title: "Shorten" })
```

#### description: string

`description` provides more details and context about the prompt.

```js
gptool({
    title: "Shorten",
    description:
        "A prompt that shrinks the size of text without losing meaning.",
})
```

### system: prompt_template_id[]

Override the system prompts with a custom prompt.

```js
gptool({
    title: "Generate code",
    system: ["system.code"],
})
```

### outputFolder

You can specify an output folder using `outputFolder` in the script.

```js
gptool({
    ...,
    outputFolder: "src",
})
```

You can specify the output folder using `outputFolder` variable in the gpspec file.

```markdown
<!-- @outputFolder

mysrc

-->
```

### model

You can specify the LLM `model` identifier in the script. The default is `gpt-4`.
The intellisense provided by `gptools.g.ts` will help with discovering the list of supported models.

```js
gptool({
    ...,
    model: "gpt-4-32k",
})
```

You can specify the temperate using `model` variable in the gpspec file.

```markdown
<!-- @model gpt-4-32k -->
```

### maxTokens

You can specify the LLM `max tokens` in the script. The default is unspecified.

```js
gptool({
    ...,
    maxTokens: 2000,
})
```

You can specify the maxTokens using `maxTokens` variable in the gpspec file.

```markdown
<!-- @maxTokens 2000 -->
```

### temperature

You can specify the LLM `temperature` in the script. The default is `0.2`.

```js
gptool({
    ...,
    temperature: 0.8,
})
```

You can specify the temperate using `temperature` variable in the gpspec file.

```markdown
<!-- @temperature 0.8 -->
```

### top_p

You can specify the LLM `top_p` in the script. The default is not specified

```js
gptool({
    ...,
    top_p: 0.5,
})
```

You can specify the temperate using `top_p` variable in the gpspec file.

```markdown
<!-- @top_p 0.4 -->
```

### seed

For some models,You can specify the LLM `seed` in the script, for models that support it. The default is not specified.

```js
gptool({
    ...,
    seed: 12345678,
})
```

You can specify the seed using `seed` variable in the gpspec file.

```markdown
<!-- @seed 12345678 -->
```

### fileMerge: (label, before, generated) => string

A function that merges the generated content with the original content. The default is to replace the original content with the generated content. This function can be used to implement custom merge strategies.

### Other parameters

-   `unlisted: true`, don't show it to the user in lists. Template `system.*` are automatically unlisted.

See `gptools.d.ts` in the sources for details.

## JSON output

You can use `system.json` system message to force a single JSON output file. This
enables the [JSON mode](https://platform.openai.com/docs/guides/text-generation/json-mode) of OpenAI.

```js
gptool({
    ...,
    system: ["system.json"],
})
```

The generated file name will be `[spec].[template].json`.

## Logging

Use `console.log` and friends to debug your prompts.

## Variable Expansion

Variables are referenced and injected using `env.variableName` syntax.

When you apply a prompt to a given fragment, a number of variables are set including

-   `env.fence` set to a suitable fencing delimiter that will not interfere with the user content delimiters.
-   `env.links` set of linked files and content

> For a full list with values, run any prompt, click on the "GPTools" in the status bar and look at prompt expansion trace.

### Fenced variables

As you expand user markdown into your prompt, it is important to properly fence the user code, to prevent (accidental) prompt injection and confusion.

The `env.fence` variable is set to a suitable fencing delimiter that will not interfere with the user content delimiters.

```js
$`
${env.fence}
${env.fragment}
${env.fence}
`
```

The `def("SUMMARY", env.fragment)` is a shorthand to generate a fence variable output.
The "meta-variable" (`SUMMARY` in this example) name should be all uppercase (but can include
additional description, eg. `"This is text before SUMMARY"`).

```js
def("SUMMARY", env.fragment)

// approximately equivalent to:

$`SUMMARY:`
fence(env.fragment)

// approximately equivalent to:

$`SUMMARY:
${env.fence}
${env.fragment}
${env.fence}
`
```

### Linked files

When the markdown references to a local file, the link name and content will be available through `env.links`

```js
Use documentation from DOCS.

def("DOCS", env.links.filter(f => f.filename.endsWith(".md")))
```

In the coarch files, those link you be part of a bulletted list.

### Context/spec file

The file describing the context (or `.gpspec.md` file) is also available as a linked file through, `env.spec`.

It is typically generated automatically but can also be authored manually as a `.gpspec.md` file.

### fetchText(url: string | LinkedFile): Promise<{ ok: boolean; status: number; statusText: string; text?: string; file: LinkedFile }>

Use `fetchText` to to issue GET requests and download text from the internet.

```ts
const { text, file } = await fetchText("https://....")
if (text) $`And also ${text}`

def("FILE", file)
```

fetchText will also resolve the contents of file in the current workspace if the url is a relative path.

```ts
const { file } = await fetchText("README.md")
def("README", file)
```

## JSON Schema

Use `defSchema` to define a JSON schema for the prompt output.

```js
$`Use the TARGET_SCHEMA for the JSON schema.`

defSchema("TARGET_SCHEMA", {
    type: "array",
    description: "An array of targets",
    items: {
        description: "A target that is impacted by the actions in the file",
        type: "object",
        properties: {
            name: {
                description: "Identifier of the target",
                type: "string",
            },
            source: {
                description: "Path of the file defining the target",
                type: "string",
            },
            action: {
                description: "What is being done on the cloud resource",
                type: "string",
            },
        },
    },
})
```

When a JSON/YAML payload is generated with the schema identifier,
gptools automatically validates the payload against the schema.

## Functions

You can register functions that the LLM may decide to call as part of assembling the answer.
See [OpenAI functions](https://platform.openai.com/docs/guides/function-calling).

```js
defFunction(
    "get_current_weather",
    "get the current weather",
    {
        type: "object",
        properties: {
            location: {
                type: "string",
                description: "The city and state, e.g. San Francisco, CA",
            },
        },
        required: ["location"],
    },
    (args) => {
        const { location } = args
        if (location === "Brussels") return "sunny"
        else return "variable"
    }
)
```

### Running scripts as functions

A function may also return a request to run a native tool in a terminal. The `stdout` output of the tool
will be used as the function result.

```js
defFunction(
    "check_syntax",
    "Checks code for syntax errors",
    {
        type: "object",
        properties: {
            code: {
                type: "string",
                description: "Code to check.",
            },
        },
        required: ["code"],
    },
    (args) => {
        const { code } = args
        return {
            type: "shell",
            stdin: code,
            command: "node",
            args: ["gptools/check-syntax.js"],
        }
    }
)
```

## Inline variable

You can inject custom variables in the process by authoring them as markdown comments in your `.gpspec.md` files. The variable are accessible through the `env.vars` field.

```markdown
Lorem ipsum...

<!-- @myvar myvalue -->
```

And somewhere in the GPTool:

```js
const myvalue = env.vars["myvar"]
```

## Settings

The Visual Studio Code extension has various configuration settings:

### `max cached temperature`

This setting controls the threshold to disable caching for prompts with high temperature; since the temperature increases the randomness
of the response. Default is `0.1`.
