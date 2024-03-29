---
title: Running scripts
description: Discover how to run scripts in your development environment, manage script execution, and interpret the results for enhanced productivity.
keywords: script execution, script management, result analysis, development automation, script workflow
sidebar:
    order: 4
---

:::caution

Script are executed in the context of your environment.
**Only run trusted scripts.**

:::

In Visual Studio Code, the location where you start running a script determines the entries in the [`env.files`](/genaiscript/reference/scripts/context) variable.

## Single file

-   Right click on a file in the Explorer and select `Run GenAIScript`.
-   Or right click in a file editor and select `Run GenAIScript`.

The `env.files` will contain a single element with the selected file.

## Folder

-   Right click on a folder in the Explorer and select `Run GenAIScript`.

The `env.files` will contain all nested files under that folder.

## Analyze results

By default, GenAIScript opens the output preview which shows a rendered view of the LLM output (assuming the LLM produces markdown).

You can also use the **Trace** to review the each transformation step of the script execution.

-   Click on the GenAIScript status bar and select `Trace`

## Next steps

[Debug](./debugging-scripts.mdx) your scripts using the Visual Studio Code Debugger!