---
title: Files
description: Learn how to perform file system operations using the fs object in your scripts.
keywords: file system, fs object, readText, findFiles, paths
sidebar:
    order: 13
---

## `fs`

The `fs` object gives access to file system operations

### `readText`

Reads the content of a file as text, relative to the workspace root.

```ts
const file = await fs.readText("README.md")
const content = file.content
```

It will automatically convert PDFs and DOCX files to text.

### `findFiles`

Performs a blog search for files under the workspace.

```ts
const mds = await fs.findFiles("**/*.md")
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
