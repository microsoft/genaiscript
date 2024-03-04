---
title: Running scripts
sidebar:
    order: 4
---

The location where you start running a script determines the entries in the `env.files` variable.

## Single file

- Right click on a file in the Explorer and select `Run GenAIScript`.
- Or right click in a file editor and select `Run GenAIScript`.

The `env.files` will contain a single element with the selected file.

## Folder

- Right click on a folder in the Explorer and select `Run GenAIScript`.

The `env.files` will contain all nested files under that folder.

## Analyze results

By default, GenAIScript opens the output preview which shows a rendered view of the LLM output (assuming the LLM produces markdown).

You can also use the **Trace** to review the each transformation step of the script execution.

-   Click on the GenAIScript status bar and select `Trace`
