---
title: Files
description: Learn how to perform file system operations using the workspace object in your scripts.
keywords: file system, workspace object, readText, findFiles, paths
sidebar:
    order: 13
---

GenAIScript provides access to the file system of workspace and to the selected files in the user interface.

The file path are rooted to the project workspace folder. In Visual Studio Code, this is the root folder opened (multi-root workspaces are not yet supported). Using the command line, the workspace root is the current working directory when launching the CLI.

## `env.files`

The variable `env.files` contains an array of files that have been
selected by the user through the user interface or the command line.

You can pass `env.files` directly in the [def](/genaiscript/reference/script/context)
function and add additional filters to the files.

```js
def("PDFS", env.files, { endsWith: ".pdf" })
```

## `workspace`

The `workspace` object gives access to file system of the workspace.

### `findFiles`

Performs a search for files under the workspace. glob patterns are supported.

```ts
const mds = await workspace.findFiles("**/*.md")
defFile("DOCS", mds)
```

### `readText`

Reads the content of a file as text, relative to the workspace root.

```ts
const file = await workspace.readText("README.md")
const content = file.content
```

It will automatically convert PDFs and DOCX files to text.

### `writeText`

Writes text to a file, relative to the workspace root.

```ts
await workspace.writeText("output.txt", "Hello, world!")
```

## paths

The `paths` object contains helper methods to manipulate file names.

### Current path vs workspace path

By default, files are resolved relative to the workspace root. You can use the `path` object to resolve paths relative to the current spec, `env.spec`.

```ts
const cur = path.dirname(env.spec.filename)
const fs = path.join(cur, "myfile.md)
```
