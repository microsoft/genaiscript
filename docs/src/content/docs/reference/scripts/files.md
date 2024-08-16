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

## file output

Use [defFileOutput](/genaiscript/reference/scripts/file-output) to specify allow file output paths and the description
of the purpose of those files.

```js
defFileOutput("src/*.md", "Product documentation in markdown format")
```

## `workspace`

The `workspace` object gives access to file system of the workspace.

### `findFiles`

Performs a search for files under the workspace. glob patterns are supported.

```ts
const mds = await workspace.findFiles("**/*.md")
def("DOCS", mds)
```

### `grep`

Performs a regex 'grep' search for files under the workspace using [ripgrep](https://github.com/BurntSushi/ripgrep). The pattern can be a string or a regex.

```ts
const { files } = await workspace.grep("monkey", "**/*.md")
def("FILE", files)
```

The pattern can also be a regex in which case sensitivy follows the regex option.

```ts
const { files } = await workspace.grep(/[a-z]+\d/i, "**/*.md")
def("FILE", files)
```

### `readText`

Reads the content of a file as text, relative to the workspace root.

```ts
const file = await workspace.readText("README.md")
const content = file.content
```

It will automatically convert PDFs and DOCX files to text.

### `readJSON`

Reads the content of a file as JSON (using a [JSON5](https://json5.org/) parser)

```ts
const data = await workspace.readJSON("data.json")
```

### `readXML`

Reads the content of a file as XML.

```ts
const data = await workspace.readXML("data.xml")
```

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

### globs

File path "globs" are patterns used to match file and directory names. They are commonly used in Unix-like operating systems and programming languages to specify sets of filenames with wildcard characters. This tutorial will cover the basics of using globs in file paths with workspace.findFiles.

Glob patterns can have the following syntax:

-   `*` to match zero or more characters in a path segment
-   `?` to match on one character in a path segment
-   `**` to match any number of path segments, including none
-   `{}` to group conditions (e.g. `**/*.{ts,js}` matches all TypeScript and JavaScript files)
-   `[]` to declare a range of characters to match in a path segment (e.g., `example.[0-9]` to match on example.0, example.1, …)
-   `[!...]` to negate a range of characters to match in a path segment (e.g., `example.[!0-9]` to match on example.a, example.b, but not example.0)

Note: a backslash (`\`\``) is not valid within a glob pattern. If you have an existing file path to match against, consider to use the relative pattern support that takes care of converting any backslash into slash. Otherwise, make sure to convert any backslash to slash when creating the glob pattern.
