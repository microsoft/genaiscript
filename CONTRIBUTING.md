# Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Developer setup

You can open this repo in GitHub CodeSpace/Docker to get the build environment needed.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=679784368)

-   Go to https://github.com/microsoft/genaiscript
-   Click on **Code**
-   Select Create new Codespace

### Manual setup

-   Install [Node.JS LTS](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
-   Run yarn

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

or start a debug session in VSCode.

-   Start the **Run - sample** Debugger to launch the sample project in debugging mode

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

## Dependencies

-   run `yarn install:force` to refresh the lock file
-   run `yarn gen:licenses` to refresh the 3rd party licenses

## Docs

Run `docs` to launch the documentation site.

```sh
yarn docs
```

GitHub Pages are automatically updated on new release; or thourh manual trigger at
https://github.com/microsoft/genaiscript/actions/workflows/docs.yml .

## Slides

All files `slides/*slides.md` will be compiled and deployed on build.

-   run `slides` to launch the slide show (add the file name or it will default to `slides.md`)

```sh
yarn slides [slides file name]
```

-   visit http://localhost:3030

Learn more about Slidev on [documentations](https://sli.dev/). For diagrams, leverage [mermaid](https://sli.dev/guide/syntax#diagrams) or use draw.io, tldraw.

## GenAI Script

-   Commit with aut-generated message

```sh
yarn gcm
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

## Documentation basics

Start local server

```sh
yarn docs
```

## Local AI

If you are lacking a OpenAI API token, you can use [LocalAI](https://localai.io/basics/getting_started/) to simulate OpenAI access.

-   Create a new Codespace and make sure to create a larger image,
-   launch `localai` to download and start the localai docker image.

```
yarn run localai
```

-   Launch the localai web ui at [http://localhost:8080](http://localhost:8080)
-   create `.env` file with

```dot
# OPENAI_API_KEY=... not needed
OPENAI_API_BASE=http://localhost:8080/v1
```

-   start the debugger and voila!
