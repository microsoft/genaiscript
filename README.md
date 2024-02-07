# GenAIScript - GenAI Scripting

GenAIScript (formerly GenAIScript, CoArch) allows teams, including non-developers, to create and use GenAI-enhanced scripts. GenAIScript uses LLMs to enable a new kind of scripting that combines traditional code and natural language.

```js
script({ title: "Code XRay" })

def("FILE", env.files.filter(f => !f.filename.endsWith(".xray")))

$`You are an expert at programming in all known languages.
For each FILE, extract the code structure
that ignores the internal details of the implementation.'
```

## Overview

-   🔑 [Building a Azure Bicep Analyzer](https://github.com/microsoft/gptools/assets/4175913/d8e9f080-9e47-4667-b10a-ea5b544b1125)
-   💬 [Copilot Chat to GenAIScript](https://github.com/microsoft/gptools/assets/4175913/7bf8e458-8dac-4021-b820-b95237aad7b8)
-   📑 [Structured Data Extraction](https://github.com/microsoft/gptools/assets/4175913/907ca886-7344-4341-986c-e288148fd501)
-   🎥 [Video transcript converter](https://github.com/microsoft/gptools/assets/4175913/9b49d291-91f2-4739-b8f4-aa4332dc08ac)

The key elements of GenAIScript are:

-   🪄 [gptools](./docs/gptools.md): Scripts that use the editor context to create prompts and query a LLM.
-   🖼 [gpspecs](./docs/gpspecs.md): (Optional) Natural language specification of the prompt context (content, files, ...).

GenAIScript automatically parses the LLM output into various formats:

-   🗂 file edits (full or diffs) with preview support in VSCode
-   📊 structured data extracted with JSON schema definition and validation
-   ⚠️ code annotations compatible with [GitHub Actions](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-error-message) and VS Code
-   🛠️ [OpenAI functions](https://platform.openai.com/docs/guides/function-calling) as JavaScript functions

The tooling supports a short developer loop in VS Code and automation CI/CD pipelines.

-   [Visual Studio Code extension](./docs/vscode.md): User interaction with gptools and conversion of LLM results into workspace edits.
-   [cli](./docs/cli.md): Command line interface to run gptools in a CI/CD pipeline.

GenAIScript uses hosted AI foundation models (OpenAI, Azure OpenAI, Llama, ...) using a [user-provided token](./docs/token.md) or the LLM provided by Copilot if run from the chat.

## Getting started

### Install in Visual Studio Code

These are the instructions to install the latest build of the extension manually in Visual Studio Code.
See Insiders for Copilot Chat integration.

-   install [Visual Studio Code](https://code.visualstudio.com/Download),
-   open the [latest release](https://github.com/microsoft/gptools/releases/latest/),
-   download the `genaiscript.vsix` into your project in VSCode
-   right click on the `.vsix` file and select **Install Extension VSIX...**

Until this extension is in the Marketplace, you will have to repeat these steps each time you want to upgrade the extension.

### Install in Visual Studio Code - Insiders + Copilot Chat

To leverage the Copilot Chat integration, you will need to do the follwing.

-   install [Visual Studio Code - Insiders](https://code.visualstudio.com/insiders/).
-   open the [latest release](https://github.com/microsoft/gptools/releases/latest/),
-   download the `genaiscript.insiders.vsix` into your project in **Visual Studio Code - Insiders**
-   right click on the `.vsix` file and select **Install Extension VSIX...**
-   follow the instructions to install the extension ([more information](https://code.visualstudio.com/api/advanced-topics/using-proposed-api#sharing-extensions-using-the-proposed-api))

Until this extension is in the Marketplace, you will have to repeat these steps each time you want to upgrade the extension.

## GPTool scripts

GPTool scripts use stylized JavaScript with minimal syntax. They are stored as files (`genaiscript/*.genai.js`) in your project.

> Use the `Create a GPTool...` command in the command palette to create a new gptool script.

```js
// metadata
script({
    title: "Technical proofreading",
    description: "Reviews the text as a tech writer.",
})

// the context
def("FILES", env.files)

// the task
$`You are reviewing and updating FILES 
to fix grammatical errors, 
fix spelling errors and make it technical.`
```

GenAIScript comes with builtin tools and allows you to fork and customize the AI prompts to your project specific needs.
This leverages VSCode language support (completion, coloring, error checking)
while remaining friendly to people not very familiar with JavaScript.
GenAIScript also provides detailed expansion logs to help you debug your templates.

Since gptool scripts are stored as files in the project, they can be shared, versioned, collaborated on by the entire development team
using the existing team development cycle.

In the future, we foresee that developers will create libraries of gptools and share them as libraries on their favorite package manager.

-   [Read more about gptools](./docs/gptools.md).

## (Optional) GPSpec specifications

Natural language documents that instantiate gptools in a particular context. GenAIScript parses `*.gpspec.md` markdown files as specification (`env.spec`). Links define the content (`env.files`).

The `.gpspec` context is automatically generate when running a tool on a file or set of files.

```markdown
# email address recognizer

-   [email_validator.py](./email_validator.py)
-   [best practices](./shared/best_practices.md)

Write a function that takes a string
and returns true if the whole string is a valid email address,
false otherwise.
```

-   [Read more about gpspecs](./docs/gpspecs.md).

## Contributing

We accept contributions! Checkout the [CONTRIBUTING](./CONTRIBUTING.md) page for details and developer setup.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
