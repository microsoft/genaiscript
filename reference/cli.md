
import { Steps } from "@astrojs/starlight/components"
import { Tabs, TabItem } from "@astrojs/starlight/components"
import DirectoryLinks from "../../../../components/DirectoryLinks.astro"

The GenAIScript CLI **`genaiscript`** runs GenAIScript scripts
outside of Visual Studio and in your [automation](/genaiscript/getting-starting/automating-scripts).

```sh
npx --yes genaiscript ...
```

where `--yes` skips the confirmation prompt to install the package.

## Prerequisites

The CLI is a Node.JS package hosted on [npm](https://www.npmjs.com/package/genaiscript).

-   Install [Node.JS LTS](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (Node.JS includes npm and npx).

## Installation

-   Install locally as a `devDependency` in your project.

<Tabs>
  <TabItem label="npm" icon="seti:npm">

```sh
npm install -D genaiscript
```

  </TabItem>
  <TabItem label="yarn" >

```sh
yarn add -D genaiscript
```

  </TabItem>
</Tabs>

-   Install it globally.

```sh "-g"
npm install -g genaiscript
```

-   Check that your node version is at least 20._ and npm 10._ by running this command.

```sh
node -v
npx -v
```

```text
v20.11.1
10.5.0
```

## No Installation (`npx`)

> `npx` is installed with **Node.JS**.

Using [npx](https://docs.npmjs.com/cli/v10/commands/npx),
you can run the cli without any prior installation steps.
_npx_ will install the tool on demand. npx also takes care of tricky operating
system issues where the tool is not found in the path.

```sh
npx genaiscript ...
```

-   Add `--yes` to skip the confirmation prompt, which is useful in a CI scenario.

```sh "--yes"
npx --yes genaiscript ...
```

-   Specify the version range to avoid unexpected behavior with cached installations of the CLI using npx.

```sh "@^1.16.0"
npx --yes genaiscript@^1.16.0 ...
```

## Configuration

The CLI will load the [secrets](/genaiscript/getting-started/configuration) from the environment variables or a `./.env` file.

You can override the default `.env` file name by adding the `--env myother.env` file.

## Create a new script

Creates a new script file in the `genaisrc` folder.

```sh
npx genaiscript scripts create <name>
```

## Compile scripts

Runs the TypeScript compiler to find errors in the scripts.

```sh
npx genaiscript scripts compile
```

## Run a script

[Run a script](/genaiscript/reference/cli/run) on file
and streams the LLM output to stdout. **Run from the workspace root**.

```sh
npx genaiscript run <script> [files...]
```

where `<script>` is the id or file path of the tool to run, and `[files...]` is the name of the spec file to run it on.

### Listing model configuration

Run the `script model` command to list the available scripts and their model configuration. This can be useful to diagnose configuration issues in CI/CD environments.

```sh
npx genaiscript scripts model [script]
```

where [script] can be a script id or a file path.

## Topics

<DirectoryLinks directory="reference/cli" />
