---
title: Specs
description: Learn how to create and execute markdown-based specifications for AI-assisted code refactoring.
keywords: AI scripting, code refactoring, markdown specifications, automation, documentation
sidebar:
  order: 100
---

To start using GenAIScript, create a new `.gpspec.md` file and start adding content as markdown. Right click and run "Run GenAIScript" to see the results.

```markdown
A sample GenAIScript document.
# email address recognizer
# email address recognizer
Write a function that takes a string argument and returns true if the whole string is a valid email address, false otherwise.

...
```

When an AI transformation is computed, a refactoring code preview will be shown to confirm the changes. Click on each line of the change tree to see individual diff views. This is the same user experience as a refactoring.

You can accept or cancel the changes using the buttons at the bottom of the view.

## Linked documents

You can link other local documents using the markdown link syntax. These documents are accessible during the GenAiScript
execution through the `env.files` variable.

```markdown A sample GenAIScript document.
# email address recognizer

-   [email_validator.py](./email_validator.py)

Write a function that takes a string argument and returns true if the whole string is a valid email address, false otherwise.

...
```

and somewhere in the GenAiScript:

```js
def(
    "FILES",
    env.files.filter((f) => f.filename.endsWith(".py"))
)
```

You can also link to `https://` resource that will automatically be download and inline.

```markdown
-   [driver.ts](https://github.com/microsoft/devicescript/blob/main/packages/drivers/src/driver.ts)
```

> For GitHub.com source files, GenAiScript will automatically update the URL to point to the raw file.

## Variables

You can inject custom variables as markdown comments in your .gpspec.md files. The variable are accessible through the `env.vars` field.

```markdown
Lorem ipsum...

<!-- @myvar myvalue -->
```

and somewhere in the script:

```js
const myvalue = env.vars.myvar
```
For example, if you want to customize a GenAiScript to focus on a particular file mentioned in the GPSpec file, you can do the following in the GPSpec file:

```markdown
<!-- @focusdoc
my-focus-doc.md
-->
```
and refer to that variable in the GenAiScript as follows:

```js
const focusFileName = env.vars.focusdoc
def("FOCUSDOC", env.files.filter(f => f.filename.endsWith(focusFileName)))
```
Note that the variable reference in the GPSpec file is treated as a string and does not need to be quoted.
