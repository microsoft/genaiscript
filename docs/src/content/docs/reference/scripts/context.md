---
title: Context
sidebar:
    order: 3
---

The information about the context of the script execution are available in the `env` global object.

## Variable Expansion

Variables are referenced and injected using `env.variableName` syntax.

When you apply a prompt to a given fragment, a number of variables are set including

-   `env.fence` set to a suitable fencing delimiter that will not interfere with the user content delimiters.
-   `env.files` set of linked files and content

> For a full list with values, run any prompt, click on the "GenAIScript" in the status bar and look at prompt expansion trace.

### Fenced variables

As you expand user markdown into your prompt, it is important to properly fence the user code, to prevent (accidental) prompt injection and confusion.

The `env.fence` variable is set to a suitable fencing delimiter that will not interfere with the user content delimiters.

```js
$`
${env.fence}
${env.fragment}
${env.fence}
`
```

The `def("SUMMARY", env.fragment)` is a shorthand to generate a fence variable output.
The "meta-variable" (`SUMMARY` in this example) name should be all uppercase (but can include
additional description, eg. `"This is text before SUMMARY"`).

```js
def("SUMMARY", env.fragment)

// approximately equivalent to:

$`SUMMARY:`
fence(env.fragment)

// approximately equivalent to:

$`SUMMARY:
${env.fence}
${env.fragment}
${env.fence}
`
```

### Linked files

When the markdown references to a local file, the link name and content will be available through `env.files`

```js
Use documentation from DOCS.

def("DOCS", env.files, { endsWith: ".md" })
```

In the genai files, those links should be part of a bulleted list.

### Context/spec file

The file describing the context (or `.gpspec.md` file) is also available as a linked file through, `env.spec`.

It is typically generated automatically but can also be authored manually as a `.gpspec.md` file.
