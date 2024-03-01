---
title: Scripts
sidebar:
    order: 0
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
    // also displayed but grayed out:
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
    // also displayed but grayed out:
    description:
        "A prompt that shrinks the size of text without losing meaning",
    categories: ["shorten"], // see Inline prompts later
})
```

-   Read the full [metadata reference](/genaisrc/reference/scripts/metadata)

## Logging

Use `console.log` and friends to debug your prompts.

### readFile(filename: string): Promise<string>

Reads the content of a local text file.

```ts
const content = await readFile("/README.md")
defFile("README", content)
```

### fetchText(url: string | LinkedFile): Promise<{ ok: boolean; status: number; statusText: string; text?: string; file: LinkedFile }>

Use `fetchText` to issue GET requests and download text from the internet.

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

## Parsers

The `parsers` object contains methods to parse various file formats such as JSON5 (friendlier JSON), YAML, TOML and PDF.

```js
const { file, pages } = await parsers.PDF(env.files[0])
```

## Utilities

### `path`

A `path` library is available to manipulate file paths.

```js
const ext = path.extname(filename)
```

### `parsers`

The `parsers` object contains methods to parse various file formats such as JSON5 and YAML.
