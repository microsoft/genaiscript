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

## run a tool on a file

Runs a genai script on a file and streams the LLM output to stdout.

```sh
node .genaiscript/genaiscript.cjs run <tool> [files...]
```

where `<tool>` is the id or file path of the tool to run, and `[spec]` is the name of the spec file to run it on.
