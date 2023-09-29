# CoArch

An iterative, refining copilot experience designed for Visual Studio Code.

## Features

CoArch lets you apply AI transformation to various parts of your project
while taking into account the tree structure of your documents.

CoArch tightly integrate the prompt engineering cycle inside Visual Studio Code
infrastructure to provide a augmented, tooled, prompting experience.

### Prompt Files

CoArch prompts use stylized JavaScript with minimal syntax. They are stored as files (`prompts/*.prompt.js`) in your project.

CoArch comes with builtin prompts and allows you to fork and customize the AI prompts to your project specific needs.
This leverages VSCode language support (completion, coloring, error checking)
while remaining friendly to people not very familiar with JavaScript.
CoArch also provides detailed expansion logs to help you debug your templates.

Since prompts are stored as files in the project, they can be shared, versioned, collaborated on by the entire development team
using the existing team development cycle.

In the future, we foresee that developers will create libraries of prompts and share them as libraries on their favorite package manager.

### Specification Files

CoArch parses `*.coarch.md` markdown files and uses the markdown headings (`#`, `##`, ...) as the base structure of the document. Each element of the document is considered a node and sub section are considered children; similarly to most document object models.

Once the specification files are parsed, CoArch will automatically suggest which prompt can be applied to each fragment.

### Editor integration

CoArch leverages the VSCode editor integration point to provide a rich auditing user experience, as well as an assisted prompt authoring experience through various editor extensions.

### Samples

The extension contains a few prompts, and the following samples can also be consulted.

-   [blackjack game generator](https://github.com/microsoft/coarch/tree/main/packages/blackjack)
-   [mywordle](https://github.com/microsoft/coarch/tree/main/packages/mywordle)
-   [mystory](https://github.com/microsoft/coarch/tree/main/packages/mystory)

## Authoring

To start using CoArch, create a new `.coarch.md` file and start adding content as markdown. You can either use the CodeAction QuickFix light bulb to access the prompts or open the CoArch view to examine the tree.

<!-- Text editor with QuickFix menu opened](./images/quickfix.png) -->

CoArch uses the header structure of the document (`#`, `##`, ...) to build a tree of text fragments.

```markdown A sample CoArch document.
# Image resize {#YU34}

A command line application that takes a file name, a size, and an output file name, resizes the image using the best algorithm, and saves the resized image. Use node.js LTS.

## Parse command line arguments {#UV61}

Extract file name, size, and output file name from the command line input.

## Validate Input {#QY23}

Ensure all arguments are present.
Verify the input file exists and is in a valid image format. Validate the dimensions and output file name.

...
```

When an AI transformation is computed, a code preview will be shown to confirm the changes. Click on each line of the change tree to see individual diff views. This is the same user experience as a refactoring.

<!-- Preview of transformation changes](./images/preview.png) -->

You can accept or cancel the changes using the buttons at the bottom of the view. CoArch does **not** apply any changes to your content automatically; all changes have to be reviewed and approved by the user.

### OpenAI or Llama Token

CoArch will automatically ask you for a token when needed and will store it in the workspace secret storage. The token is **never** stored in the clear or shared outside the project.

<!-- Requesting the OpenAI request](./images/token.png) -->

The token will be cleared once we detect it expired; but you can also _forget_ the token by using the `CoArch: Clear OpenAI Token` command.

<!-- Command to clear the token](./images/cleartoken.png) -->

Following token formats are supported:

-   `sk-???` will use https://api.openai.com/v1/
-   `https://???.openai.azure.com#key=???` will use Azure OpenAI endpoint
-   in fact, `https://???.???#key=???` will also assume Azure OpenAI endpoint
-   you can also paste a `curl` or similar invocation and we'll try to parse it out
-   if you use `https://???.???#tgikey=???` we'll assume
    [HuggingFace Text Generation Inference](https://github.com/huggingface/text-generation-inference),
    currently only Llama Instruct models are supported; the key is sent as `api-key` header

## Custom prompt templates

Internally, CoArch has a text template engine that is used to expand and assemble prompts before being sent to OpenAI. These templates can be forked and modified.

All prompts are JS files named as `*.prompt.js`. You can use the `CoArch - Fork a prompt...` to fork any known prompt.

All `system.*.prompt.js` are considered system prompt templates
and are unlisted by default. There is no variable expansion in those.

### Example

```js
prompt({
    title: "Shorten", // displayed in UI
    // also displayed, but grayed out:
    description:
        "A prompt that shrinks the size of text without losing meaning",
    categories: ["shorten"], // see Inline prompts later
})

// this appends text to the prompt
$`Shorten the following SUMMARY. Limit changes to minimum.`

// you can debug the generation using goo'old logs
console.log({ fragment: env.fragment })

// this is similar to $`SUMMARY: ${env.fragment}`
// but the variable is appropriately delimited
def("SUMMARY", env.fragment)

// more text appended to prompt
$`Respond with the new SUMMARY.`
```

### Front matter

Prompts use `prompt({ ... })` function call
to configure the title and other user interface elements.

```js
prompt({
    title: "Shorten", // displayed in UI
    // also displayed, but grayed out:
    description:
        "A prompt that shrinks the size of text without losing meaning",
    categories: ["shorten"], // see Inline prompts later
})
```

#### title: string

`title` is used as the prompt name, displayed in the light-bulb UI

```js
prompt({ title: "Shorten" })
```

#### description: string

`description` provides more details and context about the prompt.

```js
prompt({
    title: "Shorten",
    description:
        "A prompt that shrinks the size of text without losing meaning.",
})
```

#### system: prompt_template_id[]

Override the system prompt with a custom prompt.
There is no variable expansion in system prompts.

```js
prompt({
    title: "Generate code",
    system: ["system.code"],
})
```

This setting also supports multiple template names:

```js
prompt({
    title: "Generate code",
    system: ["system.code"],
})
```

#### output: .ext

Forces to store the output in a **single** nested file `./filenameN.ext`. This is useful to store the output in a different format than markdown.
CoArch will automatically mangle the prompt id, and extension to create a unique file name
that is cross linked to the source.

You can specify an output folder using `outputFolder`.

```js
prompt({
    output: ".py",
    outputFolder: "src",
})
```

#### Multiple file output

You can specify the output folder using `system.multifile.outputFolder` variable.

```markdown
<!-- @system.multifile.outputFolder

mysrc

-->
```

#### audit: true | false

Specifies that the prompt is an auditing prompt and should produce `VALID` or `ERROR` in the output.
Auditing prompts can be batch executed over the entire repository to automate the process of auditing nodes.

```js
prompt({
    ...
    audit: true,
})
```

#### LLM parameters

These are taken from prompt, or from system prompt, or set to default.

-   `temperature: 1`, makes the model more "creative", defaults to 0.2
-   `model: "gpt-4"`, changes default model
-   `maxTokens: 800`, sets the maximum response size

#### Other parameters

-   `prePost: true`, if `true`, include `subtreePre`, `subtreePost`, and possibly `outputPre` and `outputPost` variables if `output` is set.
-   `outputLinkName: Output`, sets the name of the link to the output file
-   `outputContentType: ...` sets the content type of the output file when rendered in the markdown log. Defaults to the output file extension or `markdown`.
-   `unlisted: true`, don't show it to the user in lists. Template `system.*` are automatically unlisted.

See `prompt_template.ts` in the sources for details.

### Logging

Use `console.log` and friends to debug your prompts.

### Variable Expansion

Variables are referenced and injected using `env.variableName` syntax.

When you apply a prompt to a given fragment, a number of variables are set including

-   `env.fence` set to a suitable fencing delimiter that will not interfere with the user content delimiters.
-   `env.links` set of linked files and content

> For a full list with values, run any prompt, click on the "CoArch" in the status bar and look at prompt expansion trace.

#### Fenced variables

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

#### Linked files

When the markdown references to a local file, the link name and content will be available through `env.links`

```js
Use documentation from DOCS.

def("DOCS", env.links.filter(f => f.filename.endsWith(".md")))
```

In the coarch files, those link you be part of a bulletted list.

#### Current file

The current file is also available as a linked file through, `env.file`

### Conditional expansion

You can use regular JavaScript `if` statements.

```js
if (env.output) def("CODE", env.output)
```

````

### Inline variable

You can inject custom variables in the process by authoring them as markdown comments in your `.coarch.md` files. The variable are accessible through the `env.vars` field.

```markdown
Lorem ipsum...

<!-- @myvar

myvalue
-->
```

And somewhere in the prompt

```js
const myvalue = env.vars["myvar"]
```

### Inline prompts

You can inject prompt in the process by authoring them as markdown comments in your `.coarch.md` files. Essentially, you are defining variables that will be expanded in the prompt templates.

This example defines a prompt instruction that will be injected in all prompts (that refer to that variable).

```markdown
Lorem ipsum...

<!-- @prompt

Avoid acronyms.
-->
```

Another prompt just for the summaries.

```markdown
Lorem ipsum...

<!-- @prompt.summarize
Keep it short.
-->
```

The prompts have to reference the variable, that is the `summarize.prompt.js` has to include `"summarize"`
as one of it's `categories` (otherwise, only `@prompt` is inserted).
The expansion of these variables is scoped. If you include `"bar.baz"` category,
it will insert variables `{{@prompt}}`, `{{@prompt.bar}}`, and `{{@prompt.bar.baz}}` (in this order, skipping any missing variables).

The inline prompts have to occur at the end of the body of a fragment.

```markdown
# Image resize {#OI62}

A command line that takes a file name, a size, and an output file name, resizes the image using the best algorithm, and saves the resized image. Use node.js LTS.

<!-- @prompt

Use the writing style of software technical writer.

-->
```
````

## Settings

The Visual Studio Code extension has various configuration settings:

### `max cached temperature`

This setting controls the threshold to disable caching for prompts with high temperature; since the temperature increases the randomness
of the response. Default is `0.1`.
