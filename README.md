# GPTools - AI-Enhanced Workflows for Teams

GPTools (formerly CoArch)  is a framework that empowers teams, including non-developers, to create and use AI-enhanced scripts to support their workflows. The framework leverages foundation models (specifically LLMs) to enable a new kind of scripting that combines traditional code and natural language.

> Don't forget to turn on the sound.

https://github.com/microsoft/gptools/assets/4175913/74517b81-4b9c-47d9-8a5c-a15362b0d4db

## Key Objectives and Technical Elements

The main objectives of gptools are to improve automation, collaboration, and accessibility in the creation, understanding, and maintenance of complex artifacts. The key elements of the gptools framework are:

- **gptools**: Scripts that integrate traditional code and natural language, leveraging foundation models in their execution.
- **gpspecs**: Natural language documents that instantiate gptools in a particular context.
- **gpvm**: A framework and runtime system that executes gpspecs and gptools.
- **VS Code extension**: Supporting seamless user interaction with gptools.

The gptools framework is designed to be modular and reusable, allowing for easier understanding and customization by non-developers. It enables users to author and maintain gpspecs and gptools at various levels of expertise, from professional developers to non-develop

-   **Read the [Visual Studio Code Extension README](./packages/vscode/README.md) for user documentation.**

## Install manually

These are the instructions to install the latest build of the extension manually in Visual Studio Code.

-   open the [latest release](https://github.com/microsoft/gptools/releases/latest/),
-   download the `gptools.vsix` file
-   open Visual Studio Code
-   open the command palette and type **Extensions: Install from VSIX...**
-   load the `gptools.vsix` file

Until this extension is in the Marketplace, you will have to repeat these steps each time you want to upgrade the extension.

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.

## Developer setup

You can open this repo in a codespace to get the build environment needed.

-   Install Node.JS 16+
-   Run yarn

```bash
yarn install --frozen-lockfile
```

-   Press F5 to launch VS Code in debugging mode

## Release

Run the `release` script.

```bash
yarn release
```
