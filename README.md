# GPTools - AI-Enhanced Workflows for Teams

GPTools (formerly CoArch) is a framework that empowers teams, including non-developers, to create and use AI-enhanced scripts to support their workflows. The framework leverages foundation models (specifically LLMs) to enable a new kind of scripting that combines traditional code and natural language.

> Don't forget to turn on the sound.

https://github.com/microsoft/gptools/assets/4175913/74517b81-4b9c-47d9-8a5c-a15362b0d4db

## Key Objectives and Technical Elements

The main objectives of gptools are to improve automation, collaboration, and accessibility in the creation, understanding, and maintenance of complex GPT artifacts.
The key elements of the gptools framework are:

-   [gptools](./docs/gptools.md): Scripts that integrate traditional code and natural language, leveraging foundation models in their execution.
-   [gpspecs](./docs/gpspecs.md): Natural language documents that instantiate gptools in a particular context.
-   **gpvm**: A framework and runtime system that executes gpspecs and gptools.
-   [VS Code extension](./packages/vscode/README.md): Supporting seamless user interaction with gptools.

GPTools access AI foundation models (OpenAI, Azure OpenAI, Llama, ...) using a [user-provided token](./docs/token.md).

The **gptools** framework is designed to be modular and reusable, allowing for easier understanding and customization by non-developers. It enables users to author and maintain gpspecs and gptools at various levels of expertise, from professional developers to non-develop

## Install manually

These are the instructions to install the latest build of the extension manually in Visual Studio Code.

-   open the [latest release](https://github.com/microsoft/gptools/releases/latest/),
-   download the `gptools.vsix` file
-   open Visual Studio Code
-   open the command palette and type **Extensions: Install from VSIX...**
-   load the `gptools.vsix` file

Until this extension is in the Marketplace, you will have to repeat these steps each time you want to upgrade the extension.

### GPTool scripts

GPTool scripts use stylized JavaScript with minimal syntax. They are stored as files (`gptools/*.gptool.js`) in your project.

```js
gptool({
    title: "Technical proofreading",
    description: "Reviews the text as a technical document writer.",
})

def("TEXT", env.file)

$`You are reviewing and updating TEXT to fix grammatical errors, fix spelling errors and make it technical.`
```

GPTools comes with builtin tools and allows you to fork and customize the AI prompts to your project specific needs.
This leverages VSCode language support (completion, coloring, error checking)
while remaining friendly to people not very familiar with JavaScript.
GPTools also provides detailed expansion logs to help you debug your templates.

Since gptool scripts are stored as files in the project, they can be shared, versioned, collaborated on by the entire development team
using the existing team development cycle.

In the future, we foresee that developers will create libraries of gptools and share them as libraries on their favorite package manager.

-   Read more about [gptools](./docs/gptools.md).

## GPSpec specifications

Natural language documents that instantiate gptools in a particular context. GPTools parses `*.gpspec.md` markdown files as specification.

```markdown A sample GPSpec document.
# email address recognizer

Write a function that takes a string argument
and returns true if the whole string is a valid email address, false otherwise.
```

-   Read more about [gpspecs](./docs/gpspecs.md).

## User experience

```mermaid
sequenceDiagram
participant User
participant VSCode
participant gpspec
participant gptool
participant gpvm
User->>VSCode: Create/Edit gpspec
VSCode->>gpspec: Save gpspec
User->>VSCode: Invoke gptool
VSCode->>gptool: Execute gptool with gpspec + workspace
gptool->>gpvm: Request foundation model execution
gpvm->>gptool: Return AI-generated output
gptool->>VSCode: Update workspace with output
VSCode->>User: Display updated workspace
```

This diagram demonstrates the AI-enhanced workflow process in gptools. The gpspec starts the `gptool`, which reads the `gpspec`, interacts with the gpvm and foundation model.
The AI-generated output is used to update the workspace, and the user interacts with the updated workspace through the gptools extension to VS code.

## Samples

The extension contains a few gptools, and the following samples can also be consulted.

-   [hello world](https://github.com/microsoft/gptools/tree/main/packages/helloworld)

## Contributing

We accept contributions! Checkout the [CONTRIBUTING](./CONTRIBUTING.md) page for details and developer setup.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
