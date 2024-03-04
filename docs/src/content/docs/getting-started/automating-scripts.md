---
title: Automating scripts
sidebar:
    order: 5
---

Once you have a script that you are happy with, you can automate it using the [command line interface](/genaiscript/reference/cli).

## Installation

The CLI, `.genaiscript/genaiscript.cjs` is copied as part of loading the GenAIScript extension. If you have not already installed the extension, you can do so by following the [installation instructions](/genaiscript/getting-started/installation).

## Running a script using the CLI

The basic usage of the CLI is to [run](/genaiscript/reference/cli/run/) a script with a tool name and a list of files.

```sh
node .genaiscript/genaiscript.cjs run <toolname> <...files>
```

The CLI will use the secrets in the `.env` file and emit the output to the standard output.

:::tip

The **Trace** contains an _automation_ section with the command line arguments to run the script.

:::

## CI/CD

You can use the CLI to run your scripts in a CI/CD pipeline. The CLI will return a non-zero exit code if the script fails, which can be used to fail the pipeline.

Make sure that the LLM credentials are available in the environment variables or that a `.env` file is present in the working directory.

:::tip

Use [annotations](/genaiscript/reference/scripts/annotations) to generate SARIF files that can be uploaded to GitHub Actions as security reports.

:::
