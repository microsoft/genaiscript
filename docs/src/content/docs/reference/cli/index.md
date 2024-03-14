---
title: Overview
sidebar:
    order: 1
description: Comprehensive guide to using the GenAIScript CLI for automating tasks with AI scripts in Node.js environments.
keywords: GenAIScript CLI, Node.js automation, AI scripting, command line interface, JavaScript automation
---

The GenAIScript CLI is a command line packaged as a Node.JS javascript file (`genaiscript.cjs`). It is used to run GenAIScript from the command line.

-   The VS Code extension automatically installs the CLI at `.genaiscript/genaiscript.cjs` in your project.
-   Download `genaiscript.cjs` from the [latest release assets](https://github.com/microsoft/genaiscript/releases/latest).

## Run a string on a file

Runs a genai script on a file and streams the LLM output to stdout.

```sh
node .genaiscript/genaiscript.cjs run <script> [files...]
```

where `<script>` is the id or file path of the tool to run, and `[spec]` is the name of the spec file to run it on.

## Secrets

The CLI will load the secrets from the environment variables or a `./.env` file. You can also specigfy a different `.env` file using the `--env` option.
