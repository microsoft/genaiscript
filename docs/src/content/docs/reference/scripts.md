---
title: Script Templates
order: 1
description: Learn how to use and customize GenAIScript templates for efficient AI prompt expansion.
keywords: script templates, AI prompts, prompt expansion, OpenAI integration, template customization
---

GenAIScript has a text template engine that is used to expand and assemble prompts before being sent to OpenAI. These templates can be forked and modified.

All prompts are JS files named as `*.genai.js`. You can use the `GenAIScript - Fork a script...` to fork any known prompt.

All `system.*.genai.js` are considered system prompt templates
and are unlisted by default. There is no variable expansion in those.

## Example

```js
script({
    title: "Shorten", // displayed in UI and Copilot Chat
    // also displayed, but grayed out:
    description:
        "A prompt that shrinks the size of text without losing meaning",
})

// you can debug the generation using goo'old logs
console.log("this shows up in the `console output` section of the trace")

// but the variable is appropriately delimited
def("FILE", env.files)

// this appends text to the prompt
$`Shorten the following FILE. Limit changes to minimum. Respond with the new FILE.`
```

## Metadata

Prompts use `script({ ... })` function call
to configure the title and other user interface elements.

```js
script({
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
script({ title: "Shorten" })
```

#### description: string

`description` provides more details and context about the prompt.

```js
script({
    title: "Shorten",
    description:
        "A prompt that shrinks the size of text without losing meaning.",
})
```

### system: prompt_template_id[]

Override the system prompts with a custom prompt.

```js
script({
    title: "Generate code",
    system: ["system.code"],
})
```

### outputFolder

You can specify an output folder using `outputFolder` in the script.

```js
script({
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
The intellisense provided by `genaiscript.g.ts` will help with discovering the list of supported models.

```js
script({
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
script({
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
script({
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
script({
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
script({
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

See `genaiscript.d.ts` in the sources for details.

## JSON output

You can use `system.json` system message to force a single JSON output file. This
enables the [JSON mode](https://platform.openai.com/docs/guides/text-generation/json-mode) of OpenAI.

```js
script({
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

> For a full list with values, run any prompt, click on the "GenAIScript" in the status bar and look at prompt expansion trace.

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

In the genai files, those link you be part of a bulletted list.

### Context/spec file

The file describing the context (or `.gpspec.md` file) is also available as a linked file through, `env.spec`.

It is typically generated automatically but can also be authored manually as a `.gpspec.md` file.

### readFile(filename: string): Promise<string>

Reads the content of a local text file.

```ts
const content = await readFile("/README.md")
defFile("README", content)
```

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

### env.secrets

The `env.secrets` object is used to access secrets from the environment. The secrets are typically stored in the `.env` file in the root of the project (or in the `process.env` for the CLI).
You will need to declare the list of secrets needed in `script({ secrets: ... })`.

```js
script({
    ...
    secrets: ["SECRET_TOKEN"]
})

const token = env.secrets.SECRET_TOKEN
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
genaiscript automatically validates the payload against the schema.

## Images

Images can be added to the prompt for models that support this feature (like `gpt-4-turbo-v`).
Use the `defImages` function to declare the images. Supported images will vary
with models but most likely PNG, JPEG, WEBP and GIF. Local files or URLs are supported.

```js
defImages(env.files)
```

## Parsers

The `parsers` object contains methods to parse various file formats such as JSON5 (friendlier JSON), YAML, TOML and PDF.

```js
const { file, pages } = await parsers.PDF(env.files[0])
```

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

### Running CLIs as functions

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
            args: ["genaiscript/check-syntax.js"],
        }
    }
)
```

## Utilities

### `path`

A `path` library is available to manipulate file paths.

```js
const ext = path.extname(filename)
```

### `parsers`

The `parsers` object contains methods to parse various file formats such as JSON5 and YAML.

## Inline variable

You can inject custom variables in the process by authoring them as markdown comments in your `.gpspec.md` files. The variable are accessible through the `env.vars` field.

```markdown
Lorem ipsum...

<!-- @myvar myvalue -->
```

And somewhere in the GenAiScript:

```js
const myvalue = env.vars["myvar"]
```

### Variables from the CLI

Use the `vars` field in the CLI to override variables. vars takes a sequence of `key=value` pairs.

```bash
node .genaiscript/genaiscript.cjs run ... --vars myvar=myvalue myvar2=myvalue2 ...
```

## Errors, warnings and SARIF

Using the `system.annotations` system prompt, you can have the LLM generate errors, warnings and notes.
GenAIScript will convert those into SARIF files that can be uploaded to GitHub Actions as security reports,
similarly to CodeQL reports. The [SARIF Viewer](https://marketplace.visualstudio.com/items?itemName=MS-SarifVSCode.sarif-viewer)
extension can be used to visualize the reports.

```yaml
# workflow.yml
    - name: Run GenAIScript
      run: node .genaiscript/genaiscript.cjs ... -oa result.sarif
    - name: Upload SARIF file
        if: success() || failure()
        uses: github/codeql-action/upload-sarif@v3
        with:
            sarif_file: result.sarif
```

## Settings

The Visual Studio Code extension has various configuration settings:

### `max cached temperature`

This setting controls the threshold to disable caching for prompts with high temperature; since the temperature increases the randomness
of the response. Default is `0.1`.
