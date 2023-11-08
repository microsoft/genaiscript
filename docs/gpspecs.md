# Authoring GPSpecs

To start using GPTools, create a new `.gpspec.md` file and start adding content as markdown. You can use the CodeAction QuickFix light bulb to launch the gptools on this file.

```markdown A sample CoArch document.
# email address recognizer

Write a function that takes a string argument and returns true if the whole string is a valid email address, false otherwise.

...
```

When an AI transformation is computed, a refactoring code preview will be shown to confirm the changes. Click on each line of the change tree to see individual diff views. This is the same user experience as a refactoring.

You can accept or cancel the changes using the buttons at the bottom of the view.

## Linked documents

You can link other local documents using the markdown link syntax. These documents are accessible during the GPTool
execution through the `env.links` variable.

```markdown A sample CoArch document.
# email address recognizer

-   [email_validator.py](./email_validator.py)

Write a function that takes a string argument and returns true if the whole string is a valid email address, false otherwise.

...
```

and somewhere in the GPTool:

```js
def(
    "FILES",
    env.links.filter((f) => f.filename.endsWith(".py"))
)
```

You can also link to `https://` resource that will automatically be download and inline.

```markdown
-   [driver.ts](https://github.com/microsoft/devicescript/blob/main/packages/drivers/src/driver.ts)
```

> For GitHub.com source files, GPTool will automatically update the URL to point to the raw file.

## Variables

You can inject custom variables as markdown comments in your .gpspec.md files. The variable are accessible through the `env.vars` field.

```markdown
Lorem ipsum...

<!-- @myvar myvalue -->
```

and somewhere in the GPtool:

```js
const myvalue = env.vars.myvar
```

## GPSpec Refinement

If you need to "influence" the answer of the LLM, you can click on the **Refine GPSpec** button in the status dialog (click on the statub bar icon) to refine the gpspec file
by adding a line. This flow provides an iterative, chat like experience to evolve your gpspec file.

## Running next GPTool

Once you have used a GPTool on a GPSpec file, this file becomes the "active GPSpec"
and you can use the GPTools status bar to launch the next GPTool without having
to open the gpspec file.
