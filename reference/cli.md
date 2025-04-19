import { Steps } from "@astrojs/starlight/components"
import { Tabs, TabItem } from "@astrojs/starlight/components"
import DirectoryLinks from "../../../../components/DirectoryLinks.astro"
import GenAIScriptCli from "../../../../components/GenAIScriptCli.astro"
import { PackageManagers } from "starlight-package-managers"

The GenAIScript CLI **`genaiscript`** runs GenAIScript scripts
outside of Visual Studio and in your [automation](/genaiscript/getting-started/automating-scripts).

<GenAIScriptCli args="..." />

## Prerequisites

The CLI is a Node.JS package hosted on [npm](https://www.npmjs.com/package/genaiscript).

- Install [Node.JS LTS](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (Node.JS includes npm and npx).

:::tip

You need at least Node.JS v20!

:::

## Installation

- Install locally as a `devDependency` in your project.

<PackageManagers pkg="genaiscript" dev frame="none" />

- Install it globally.

```sh "-g"
npm install -g genaiscript
```

- Check that your node version is at least 20._ and npm 10._ by running this command.

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

- Add `--yes` to skip the confirmation prompt, which is useful in a CI scenario.

```sh "--yes"
npx --yes genaiscript ...
```

- Specify the version range to avoid unexpected behavior with cached installations of the CLI using npx.

```sh "@^1.16.0"
npx --yes genaiscript@^1.16.0 ...
```

## Helper scripts

To make sure that the TypeScript definition files are written and updated,
you can add the following scripts to your `package.json`.

```json title="package.json"
{
    "scripts": {
        "postinstall": "genaiscript scripts fix",
        "postupdate": "genaiscript scripts fix",
        "genaiscript": "genaiscript"
    }
}
```

The `genaiscript` is also a shorthand script that makes it easier to invoke the CLI
using `npm run`:

```sh
npm run genaiscript ...
```

### Working behind a Proxy

Some optional packages used by the CLI do not support an installation behind an HTTP proxy,
which is very common in an enterprise setting.

If your work environment requires going through a proxy,
you should use `npm install --omit=optional`
to have optional packages fail gracefully during the installation.

If your work environment requires going through a proxy,
you can set one of the following environment variables
(`HTTP_PROXY`, `HTTPS_PROXY`, `http_proxy` or `https_proxy`) to have the CLI use a proxy,
e.g. `HTTP_PROXY=http://proxy.acme.com:3128`.

## Configuration

The CLI will load the [secrets](/genaiscript/getting-started/configuration) from the environment variables or a `./.env` file.

You can override the default `.env` file name by adding the `--env .env.local` file,
over even import both.

```sh
npx genaiscript run <script> --env .env .env.local
```

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

The CLI also supports UNIX-style piping.

```sh
cat README.md | genaiscript run summarize > summary.md
```

### Listing model configuration

Run the `script model` command to list the available scripts and their model configuration. This can be useful to diagnose configuration issues in CI/CD environments.

```sh
npx genaiscript scripts model [script]
```

where [script] can be a script id or a file path.

## Using a the CLI as a Node.JS API

The CLI can be imported and [used as an API in your Node.JS application](/genaiscript/reference/api).

## About mixing files and `--vars`

Both `files` and `--vars` are variable command-line arguments. That is, they will consume all the following
entries until a new option starts. Therefore ordering is important when mixing them. It is best to
place the files, then follow with the `--vars` option.

```sh
genaiscript run <script> [files...] --vars key1=value1 key2=value2
```

- [parsing ambiguity](https://github.com/tj/commander.js/blob/HEAD/docs/options-in-depth.md#parsing-ambiguity)

## Topics

<DirectoryLinks directory="reference/cli" />