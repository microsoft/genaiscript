---
title: Getting Started
sidebar:
    order: 0
description: A short introducation on GenAIScript.
---

## Install in Visual Studio Code

GenAiScript is available as a Visual Studio Code Extension. It is not yet available in the marketplace or npm as it is not public yet. These are the manual steps to install the extension:

-   install [Visual Studio Code](https://code.visualstudio.com/Download),
-   open the [latest release](https://github.com/microsoft/genaiscript/releases/latest/) on GitHub (if you are getting a 404 page, you need to sign in),
-   download the `genaiscript.vsix` into your project in VSCode
-   right click on the `.vsix` file and select **Install Extension VSIX...**

Repeat these steps each time you need to upgrade (annoying, I know).

## Your first GenAI script

GenAIScript use stylized JavaScript with minimal syntax. They are stored as files (`genaiscript/*.genai.js`) in your project. The execution of a genaiscript creates the prompt that will be sent to the LLM.

:::tip
Use the `GenAiScript: Create new script...` command in the command palette to create a new script.
:::

### the Metadata

A script must start with a call to the `script` function that provides metadata about the script
and the model. The metadata is used to display the script in the UI and configure the LLM model.

```js
// the metadata
script({
    title: "Technical proofreading",
    description: "Reviews the text as a tech writer.",
})
```

### the Context

GenAIScript exposes the context through the `env` variable. The context is implicitely defined by the location you start executing the script.

-   you can right click on a folder and the `env.files` will contain all the files nested in that folder.
-   you can right click on or in a file and the `env.files` will contain only that file.
-   you can define [spec](/genaisrc/reference/spec) files to define a context
-   you can run the script using the [command line interface](/genaisrc/reference/cli) and specify content of `env.files` in the CLI arguments.

```js
// the context
def("FILES", env.files)
```

The `def` function inlines the content of `env.files` in the final prompt in a LLM friendly way. It also has a number of additional options to control precisely how the content should be inlined.

```js
def("FILES", env.files, {
    // line numbers help with generating diffs
    lineNumber: true,
    // filter .md files only
    endsWith: ".md",
})
```

### the Task

The `$` function is used to build the prompt text. The `$` renders and writes the text to the prompt. You can reference the LLM variable defined with `def` freely in the text as well.

```js
// the task
$`You are an expert technical writer and proofreader.

Review the documents in FILE and report the 5 most important issues.`
```

:::tip
Use the **Trace** to review the each transformation step of the script execution. Ultimately,
the final prompt sent to the LLM is the "truth" of what the LLM model will do.
:::

## Run script with a context

Right click on a file or folder in the explorer and select `Run GenAIScript` to execute the script with the context of the file or folder. This defines the content.

Select the tool you want to run... and it'll most likely stop because we haven't configured the LLM authorization yet.

### Configure your authorization token

The first time you run will need to configure the LLM connection and authorizion secrets. GenAIScript uses a `.env` file to store the secrets (this file should never be commited to your source control!)

```txt
OPENAI_API_KEY="..."
```

GenAiScript supports OpenAI, Azure OpenAI, as well as locally-hosted models. See [authorization information](/genaiscript/reference/token).

Run again and the tool should start producing results!

## Analyze results

By default, GenAIScript opens the output preview which shows a rendered view of the LLM output (assuming the LLM produces markdown).

You can also use the **Trace** to review the each transformation step of the script execution.

-   Click on the GenAIScript status bar and select `Trace`
