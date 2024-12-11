
import { Tabs, TabItem } from "@astrojs/starlight/components"
import { FileTree } from "@astrojs/starlight/components"
import { Steps } from "@astrojs/starlight/components"
import { Content as CreateScript } from "../../../components/CreateScript.mdx"

GenAIScript use stylized JavaScript with minimal syntax.
They are stored as files (`genaisrc/*.genai.mjs` or `genaisrc/*.genai.mts`) in your project.
The execution of a genaiscript creates the prompt that will be sent to the LLM.

<Steps>
<ol>
<li>

<CreateScript />

</li><li>

The resulting file will be placed in the `genaisrc` folder in your project.

<FileTree>

-   …
-   genaisrc scripts are created here by default
    -   genaiscript.d.ts (TypeScript type definitions)
    -   jsconfig.json (TypeScript compiler configuration)
    -   **proofreader.genai.mjs**
    -   …
-   …

</FileTree>

</li>
</ol>
</Steps>

## the Prompt

The execution of the GenAIScript generates a prompt (and more)
that gets sent to the LLM model.

The ` $``...`` ` template string function formats and write the string to the prompt;
which gets sent to the LLM.

```js title="poem.genai.mjs" system=false assistant=true
$`Write a one sentence poem.`
```

{/* genaiscript output start */}

<details>
<summary>👤 user</summary>

```markdown wrap
Write a one sentence poem.
```

</details>

<details open>
<summary>🤖 assistant</summary>

```markdown wrap
Roses bloom, hearts swoon, under the silver moon.
```

</details>

{/* genaiscript output end */}

## the Context

GenAIScript exposes the context through the `env` variable. The context is implicitly defined by the location you start executing the script.

-   you can right click on a folder and the `env.files` will contain all the files nested in that folder.
-   you can right click on or in a file and the `env.files` will contain only that file.
-   you can run the script using the [command line interface](/genaiscript/reference/cli) and specify content of `env.files` in the CLI arguments.

```js title="proofreader.genai.mjs" system=false assistant=false user=true
def("FILES", env.files)
```

{/* genaiscript output start */}

<details open>
<summary>👤 user</summary>

````markdown wrap
FILES:

```md file="src/samples/markdown.md"
---
title: What is Markdown? - Understanding Markdown Syntax
description: Learn about Markdown, a lightweight markup language for formatting plain text, its syntax, and how it differs from WYSIWYG editors.
keywords: Markdown, markup language, formatting, plain text, syntax
sidebar: mydoc_sidebar
---

What is Markdown?
Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by John Gruber in 2004, Markdown is now one of the world’s most popular markup languages.

Using Markdown is different than using a WYSIWYG editor. In an application like Microsoft Word, you click buttons to format words and phrases, and the changes are visible immediately. Markdown isn’t like that. When you create a Markdown-formatted file, you add Markdown syntax to the text to indicate which words and phrases should look different.

For example, to denote a heading, you add a number sign before it (e.g., # Heading One). Or to make a phrase bold, you add two asterisks before and after it (e.g., **this text is bold**). It may take a while to get used to seeing Markdown syntax in your text, especially if you’re accustomed to WYSIWYG applications. The screenshot below shows a Markdown file displayed in the Visual Studio Code text editor....
```
````

</details>

{/* genaiscript output end */}

## the Task

The `$` function is used to build the prompt text, it renders and writes the text to the prompt
(`$` is a [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)).

```js title="proofreader.genai.mjs"
def("FILES", env.files)
$`You are an expert technical writer and proofreader.
Review the documents in FILE and report the 2 most important issues.`
```

{/* genaiscript output start */}

<details>
<summary>👤 user</summary>

````markdown wrap
FILES:

```md file="src/samples/markdown.md"
---
title: What is Markdown? - Understanding Markdown Syntax
description: Learn about Markdown, a lightweight markup language for formatting plain text, its syntax, and how it differs from WYSIWYG editors.
keywords: Markdown, markup language, formatting, plain text, syntax
sidebar: mydoc_sidebar
---

What is Markdown?
Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by John Gruber in 2004, Markdown is now one of the world’s most popular markup languages.

Using Markdown is different than using a WYSIWYG editor. In an application like Microsoft Word, you click buttons to format words and phrases, and the changes are visible immediately. Markdown isn’t like that. When you create a Markdown-formatted file, you add Markdown syntax to the text to indicate which words and phrases should look different.

For example, to denote a heading, you add a number sign before it (e.g., # Heading One). Or to make a phrase bold, you add two asterisks before and after it (e.g., **this text is bold**). It may take a while to get used to seeing Markdown syntax in your text, especially if you’re accustomed to WYSIWYG applications. The screenshot below shows a Markdown file displayed in the Visual Studio Code text editor....
```

You are an expert technical writer and proofreader.
Review the documents in FILE and report the 2 most important issues.
````

</details>

<details open>
<summary>🤖 assistant</summary>

```markdown wrap
I reviewed the document in "src/samples/markdown.md" and found the following two important issues:

1. **Missing Consistency in Heading Styles**: The document lacks consistency in heading styles, which can make the structure of the content unclear. For instance, it should use either the "atx-style" (with # symbols for headings) or the "setext-style" (with underlining for headings) consistently throughout the document to maintain a clear visual hierarchy.

2. **Lack of Examples**: The document describes Markdown syntax but lacks concrete examples to illustrate how to use Markdown for formatting. Including examples would enhance the reader's understanding of the syntax and its practical application.

These are the two most important issues that need to be addressed in the document.
```

</details>

{/* genaiscript output end */}

## the Metadata

You can add a call to the `script` function to provides metadata about the script
and the model. The metadata is used to display the script in the UI and configure the LLM model.

```js title="proofreader.genai.mjs"
// the metadata
script({
    // user interface
    title: "Technical proofreading",
    description: "Reviews the text as a tech writer.",
    group: "documentation",
    // model configuration
    model: "large",
    temperature: 0,
})
def("FILES", env.files)
$`You are an expert technical writer and proofreader.
Review the documents in FILE and report the 2 most important issues.`
```

{/* genaiscript output start */}

<details>
<summary>👤 user</summary>

````markdown wrap
FILES:

```md file="src/samples/markdown.md"
---
title: What is Markdown? - Understanding Markdown Syntax
description: Learn about Markdown, a lightweight markup language for formatting plain text, its syntax, and how it differs from WYSIWYG editors.
keywords: Markdown, markup language, formatting, plain text, syntax
sidebar: mydoc_sidebar
---

What is Markdown?
Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by John Gruber in 2004, Markdown is now one of the world’s most popular markup languages.

Using Markdown is different than using a WYSIWYG editor. In an application like Microsoft Word, you click buttons to format words and phrases, and the changes are visible immediately. Markdown isn’t like that. When you create a Markdown-formatted file, you add Markdown syntax to the text to indicate which words and phrases should look different.

For example, to denote a heading, you add a number sign before it (e.g., # Heading One). Or to make a phrase bold, you add two asterisks before and after it (e.g., **this text is bold**). It may take a while to get used to seeing Markdown syntax in your text, especially if you’re accustomed to WYSIWYG applications. The screenshot below shows a Markdown file displayed in the Visual Studio Code text editor....
```

You are an expert technical writer and proofreader.
Review the documents in FILE and report the 2 most important issues.
````

</details>

<details open>
<summary>🤖 assistant</summary>

```markdown wrap
File src/samples/markdown.md:

1. **Missing Consistency in Heading Styles**: The document lacks consistency in heading styles. For instance, it uses both "What is Markdown?" and "What is Markdown" as headings. Consistency in heading styles is crucial for a professional and polished document.

2. **Lack of Visual Examples**: While the document explains Markdown syntax, it would benefit from visual examples to illustrate the formatting. Visual examples can enhance understanding, especially for readers who are new to Markdown.

These are the two most important issues in the document.
```

</details>

{/* genaiscript output end */}

The `title`, `description`, and `group` properties are used to display the script in the UI
and can be helpful when the user is searching for a script.

![A screenshot of a text editor showing a task labeled "Technical proofreading" with the description "Reviews the text as a tech writer." A hyperlink labeled "documentation" is on the right.](../../../assets/vscode-select-script.png)

## Next steps

-   Follow the [Prompt As Code guide](/genaiscript/guides/prompt-as-code) to dive deeper in programmatically generating prompts
-   [Run your script](/genaiscript/getting-started/running-scripts) from Visual Studio Code.
