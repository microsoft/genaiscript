---
title: Files
description: Learn how to perform file system operations using the workspace object in your scripts.
keywords: file system, workspace object, readText, findFiles, paths
sidebar:
    order: 13
---

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

### `readText`

Reads the content of a file as text, relative to the workspace root.

```ts
const file = await workspace.readText("README.md")
const content = file.content
```

It will automatically convert PDFs and DOCX files to text.

### `findFiles`

Performs a blog search for files under the workspace.

```ts
const mds = await workspace.findFiles("**/*.md")
defFile("DOCS", mds)
```

## paths

The `paths` object contains helper methods to manipulate file names.

### Current path vs workspace path

By default, files are resolved relative to the workspace root. You can use the `path` object to resolve paths relative to the current spec, `env.spec`.

```ts
const cur = path.dirname(env.spec.filename)
const fs = path.join(cur, "myfile.md)
```
