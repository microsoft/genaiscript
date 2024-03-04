---
title: Context
sidebar:
    order: 3
---

The information about the context of the script execution are available in the `env` global object.

## `env.files`

The `env.files` is an array of all the files in the context. The context is defined implicitely
by the user based on the UI location to start the tool or from the CLI arguments.

```js
def("FILE", env.files)
```

Or filtered,

```js
def("DOCS", env.files, { endsWith: ".md" })
def("CODE", env.files, { endsWith: ".py" })
```

## Definition (`def`)

The `def("FILE", file)` is a shorthand to generate a fence variable output.
The "meta-variable" (`FILE` in this example) name should be all uppercase (but can include
additional description, eg. `"This is text before FILE"`).

```js
def("FILE", file)
```

approximately equivalent to:

````js
$`FILE ${file.filename}:
```
${env.file.content}
```
````


## Fencing

As you expand user markdown into your prompt, it is important to properly fence the user code, to prevent (accidental) prompt injection and confusion.

The `env.fence` variable is set to a suitable fencing delimiter that will not interfere with the user content delimiters.

```js
$`
${env.fence}
...
${env.fence}
`
```

## Linked files

When the markdown references to a local file, the link name and content will be available through `env.files`

```js
def("DOCS", env.files, { endsWith: ".md" })

$`Use documentation from DOCS.`
```

### Context/spec file

The file describing the context (or `.gpspec.md` file) is also available as a linked file through, `env.spec`.

It is typically generated automatically but can also be authored manually as a `.gpspec.md` file.
