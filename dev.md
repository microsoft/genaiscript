GenAIScript welcomes contributions from the community. This document provides guidelines for setting up the development environment, building the project, and contributing to the codebase.

## Setup

You can open this repo in GitHub CodeSpace/Docker to get the build environment needed.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=679784368)

- Go to https://github.com/microsoft/genaiscript
- Click on **Code**
- Select Create new Codespace
- Select the **dev** branch

### Manual setup

- Install [Node.JS LTS](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- Run yarn

```sh
yarn install --frozen-lockfile --prefer-offline
```

## Build

You can do a full compile using esbuild.

```sh
yarn compile
```

or a typecheck using `tsc`.

```sh
yarn typecheck
```

## Pull Requests

You must create pull requests against the `dev` branch. The `main` branch is reserved for releases.
The `dev` branch is the main development branch. It is where all new features and bug fixes are merged before being released to the public.

When creating a pull request, please ensure that your code adheres to the following guidelines:

- Follow the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
- Ensure that your code is well-documented and follows the project's coding style.
- If possible, add tests for any new features or bug fixes.

## Running local scripts

To run a script using the locally built cli,

```sh
yarn genai <scriptid> ...
```

To run a sample script under the `packages/sample` folder:

```sh
yarn run:script <scriptid> ...
```

In this case, it will use the `packages/sample/.env` file for the environment variables and workspace will be rooted at `packages/sample`.

## Debugging local scripts

Open a `JavaScript Debug Terminal` and launch the script using

```sh
yarn genai:debug <scriptid> ...
```

or for samples

```sh
yarn run:script:debug <scriptid> ...
```

## Logging

GenAIScript uses the [debug](https://www.npmjs.com/package/debug) library for logging. You can enable logging by setting the `DEBUG` environment variable to `genai:*`.

```sh
DEBUG=genaiscript:* yarn genai <scriptid> ...
```

## Web viewer

The web application (React 19) is meant to run both as a Visual Studio Code panel and a standalone viewer (**playground**). For testing purposes, standalone is the easiest.

- React 19, currently very little dependeices
- react-markdown + a few plugins to run the markdown
- [vscode-elements](https://vscode-elements.github.io/) is the design system we use as it mimics the vscode look and feel.

Use the following command to start the local web server:

```sh
yarn serve
```

It will start a local server and rebuild the react client on file changes. **It will not rebuild/restart the server on changes.**
There is **no** hot reload, you need to refresh the browser. If some state should be serialized, we should start adding it to the hash.

## Visual Studio Code Extension development

Working on the VSCode involves launching the main project debugger, which opens a second VSCode instance with the GenAIScript extension.

You can set debug breakpoint anywhere in the GenAIScript typescript files and they will resolve.

- uninstall the official GenAIScript extension or it will clash with the locally built one
- open the `Debug` view in Vs Code
- select the **Samples** debugger configuration and click **Run**

Remember that the debugger is only attached to the extension; not the GenAIScript server.

### Caveats

Launching the debugger sometimes fails but still unknown reasons. To work around this, open a terminal
and run `yarn compile` once. Then launch the debugger again.

## Dependencies

- run `yarn install:force` to refresh the lock file

## Docs

Run `docs` to launch the documentation site.

```sh
yarn docs
```

Run this command to catch broken links

```sh
yarn build:docs
```

## Slides

All files `slides/*slides.md` will be compiled and deployed on build.

- run `slides` to launch the slide show (add the file name or it will default to `slides.md`)

```sh
yarn slides [slides file name]
```

Learn more about Slidev on [documentations](https://sli.dev/). For diagrams, leverage [mermaid](https://sli.dev/guide/syntax#diagrams) or use draw.io, tldraw.

## GenAIScripts

- Commit with auto-generated message

```sh
yarn gcm
```

- Add doc to new or updated apis

```sh
yarn genai:docs
```

- Generate images for blog posts

```sh
yarn genai:blog-images
```

## Packaging

To compile and package the Visual Studio Code extension, run the `package` script.

```sh
yarn package
```

You will find the built package files, `genaiscript.vsix`,
in the `packages/vscode` folder.

## Release

Run the `release` script.

```sh
yarn release
```

GitHub Pages are automatically updated on new release; or through manual trigger at
https://github.com/microsoft/genaiscript/actions/workflows/docs.yml .

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