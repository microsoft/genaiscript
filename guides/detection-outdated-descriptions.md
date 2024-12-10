
Developer documentation typically includes a description in each file. This descriptions can become outdated, leading to confusion and incorrect information. To prevent this, you can automate the detection of outdated descriptions in your documentation using GenAIScript.

## Markdown and frontmatter

Many documentation systems use the markdown format to write documentation and a 'frontmatter' header to store metadata. Here’s an example of a markdown file with frontmatter:

```markdown
---
title: "My Document"
description: "This is a sample document."
---

# My Document

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
```

The goal is to create a script that detects when the `description` field in the frontmatter is outdated.

## The script

GenAIScript is meant to run on files and provides a special variable `env.files` that contains the list of files to be analyzed. You can use this variable to include the files in the context using the [def](/genaiscript/reference/scripts/context) function. We limit each file to 2000 tokens to avoid exploding the content on large files.

```js title="detect-outdated-descriptions.genai.mjs"
// Define the file to be analyzed
def("DOCS", env.files, { endsWith: ".md", maxTokens: 2000 })
```

The next step is to give a task to the script. In this case to check that the content and `description` field in the frontmatter match.

```js
// Analyze the content to detect outdated descriptions
$`Check if the 'description' field in the front matter in DOCS is outdated.`
```

Finally, we leverage the built-in diagnostics generation feature to create an error for each outdated description.

```js
// enable diagnostics generation
$`Generate an error for each outdated description.`
```

## Running in Visual Studio Code

Once you save this script in your workspace, you will be able to execute it on a file or a folder through the context menu
by selecting **Run GenAIScript...**.

![A code editor window displays a markdown file with metadata for a documentation page titled "Containers". The description and keywords fields are highlighted. Below, there are warnings in the problems tab indicating outdated descriptions.](../../../assets/detect-outdated-descriptions.png)

## Automation

You can automatically run this tool on your documentation files to identify outdated descriptions using the [cli](/genaiscript/reference/cli).

```sh
npx --yes genaiscript run detect-outdated-descriptions **/*.md
```

This script can be integrated into your CI/CD pipeline to automate the detection process.
