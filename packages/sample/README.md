# GPTools - GenAI Scripting

GPTools (formerly CoArch) allows teams, including non-developers, to create and use GenAI-enhanced scripts. GPTools uses LLMs to enable a new kind of scripting that combines traditional code and natural language.

## Overview

The key elements of the gptools framework are:

-   [gptools](./docs/gptools.md): Scripts that use the editor context to create prompts and query a LLM. The scripting environment provides convinient tooling to acheive common tasks
    such as extracting generate code into files, JSON parsing and validation, function calls...
-   [gpspecs](./docs/gpspecs.md): (Optional) Natural language specification documents to define the prompt context.

The tooling supports a short dev loop in VS Code and automated CI/CD pipelines.

-   [Visual Studio Code extension](./docs/vscode.md): User interaction with gptools and conversion of LLM results into workspace edits.
-   [cli](./docs/cli.md): Command line interface to run gptools in a CI/CD pipeline.

GPTools uses hosted AI foundation models (OpenAI, Azure OpenAI, Llama, ...) using a [user-provided token](./docs/token.md) or the LLM provided by Copilot if run from the chat.
To access GPTools from GitHub Copilot Chat, use [Visual Studio Code - Insiders](https://code.visualstudio.com/insiders/).

### GPTool scripts

GPTool scripts use stylized JavaScript with minimal syntax. They are stored as files (`gptools/*.gptool.js`) in your project.

```js
// metadata
gptool({
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

GPTools comes with builtin tools and allows you to fork and customize the AI prompts to your project specific needs.
This leverages VSCode language support (completion, coloring, error checking)
while remaining friendly to people not very familiar with JavaScript.
GPTools also provides detailed expansion logs to help you debug your templates.

Since gptool scripts are stored as files in the project, they can be shared, versioned, collaborated on by the entire development team
using the existing team development cycle.

In the future, we foresee that developers will create libraries of gptools and share them as libraries on their favorite package manager.

-   [Read more about gptools](./docs/gptools.md).

## GPSpec specifications

Natural language documents that instantiate gptools in a particular context. GPTools parses `*.gpspec.md` markdown files as specification (`env.spec`). Links define the content (`env.files`).

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
