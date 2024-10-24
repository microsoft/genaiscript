
This Notebook is a GenAISCript tutorial. It is a Markdown document where each JavaScript code section is a runnable GenAIScript. You can execute each code block individually and see the results in the output section below the code block. To open this notebook in Visual Studio Code, press **F1** and run **GenAIScript: Create GenAIScript Markdown Notebook**.

Follow the steps in [configuration](https://microsoft.github.io/genaiscript/getting-started/configuration) to set up your environment and LLM access.

## Prompt as code

GenAIScript lets you write prompts as a JavaScript program. GenAIScript runs your program; generate chat messages; then handles the remaining interaction with the LLM API.

### Write to prompt `$`

Let's start with a simple hello world program.

```js
$`Say "hello!" in emojis`
```

<!-- genaiscript output start -->

<details>
<summary>👤 user</summary>

```markdown wrap
Say "hello!" in emojis
```

</details>

<details open>
<summary>🤖 assistant </summary>

```markdown wrap
👋😃!
```

</details>

<!-- genaiscript output end -->

The `$` function formats the strings and write them to the user message. This user message is added to the chat messages and sent to the LLM API. Under the snippet, you can review both the **user** message (that our program generated) and the **assistant** (LLM) response.

You can run the code block by clicking the **Execute Cell** button on the top left corner of the code block. It will be default try to use the LLMs from various providers. If you need to use a different model, update the `model` field in the front matter at the start of the document. There are many options documented in [configuration](https://microsoft.github.io/genaiscript/getting-started/configuration).

Once the execution is done, you will also an additional **trace** entry that allows you to dive in the internal details of the GenAIScript execution. This is very helpful to diagnose issues with your prompts. The trace can be quite large so it is not serialized in the markdown file.

You can use the JavaScript `for` loop and sequence multiple `$` calls to append text to the user message. You can also inner expression to generate dynamic content.

```js
// let's give 3 tasks to the LLM
// to get 3 different outputs
for (let i = 1; i <= 3; i++) $`- Say "hello!" in ${i} emojis.`
$`Respond with a markdown list`
```

<!-- genaiscript output start -->

<details>
<summary>👤 user</summary>

```markdown wrap
-   Say "hello!" in 1 emojis.
-   Say "hello!" in 2 emojis.
-   Say "hello!" in 3 emojis.
    Respond with a markdown list
```

</details>

<details open>
<summary>🤖 assistant </summary>

```markdown wrap
-   👋
-   👋😊
-   👋✨😃
```

</details>

<!-- genaiscript output end -->

To recap, the GenAIScript runs and generates a user messages; that gets sent to the LLM. You can review the user message (and others) in the trace.

## `def` and `env.files`

The [`def` function](https://microsoft.github.io/genaiscript/reference/scripts/context/#definition-def) lets you declare and assign **LLM variables**. The concept of variable is most useful to import context data, in particular files, and refer to them in the rest of the prompt.

```js
def("FILE", env.files)
$`Summarize FILE in one short sentence. Respond as plain text.`
```

<!-- genaiscript output start -->

<details>
<summary>👤 user</summary>

````markdown wrap
FILE:

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

Summarize FILE in one short sentence. Respond as plain text.
````

</details>

<details open>
<summary>🤖 assistant </summary>

```markdown wrap
Markdown is a lightweight markup language for formatting plain text, using syntax to indicate formatting elements.
```

</details>

<!-- genaiscript output end -->

In GenAIScript, the [`env.files`](https://microsoft.github.io/genaiscript/reference/scripts/context/#environment-env) variable contains the [list of files in context](https://microsoft.github.io/genaiscript/reference/script/files), which can be determined by a user selection in the UI, CLI arguments, or pre-configured like in this script. You can change the files in `env.files` by editing the `files` field in the front matter at the start of the document.

### Filtering `env.files`

When using GenAIScript from the user interface, it is common to apply a script to an entire folder. This means that you'll get a bunch of files in `env.files` including some unneeded ones. The `def` function provides various options to filter the files, like the `endsWith` option.

`def` also provides `maxTokens` which will trim the content size to a number of tokens. LLM context is finite!

```js
script({ files: "src/**" }) // glob all files under src/samples
def("FILE", env.files, { endsWith: ".md", maxTokens: 1000 }) // only consider markdown files
$`Summarize FILE in one short sentence. Respond as plain text.`
```

<!-- genaiscript output start -->

<details>
<summary>👤 user</summary>

````markdown wrap
FILE:

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

Summarize FILE in one short sentence. Respond as plain text.
````

</details>

<details open>
<summary>🤖 assistant </summary>

```markdown wrap
Markdown is a lightweight markup language for formatting plaintext documents, different from WYSIWYG editors.
```

</details>

<!-- genaiscript output end -->

## Tools

You can register JavaScript functions as tools that the LLM will call as needed.

```js
// requires openai, azure openai or github models
defTool(
    "fetch",
    "Download text from a URL",
    { url: "https://..." },
    ({ url }) => fetchText(url)
)

$`Summarize https://raw.githubusercontent.com/microsoft/genaiscript/main/README.md in 1 sentence.`
```

## Sub-prompt

You can run nested LLMs to execute tasks on other, smaller models.

```js
// summarize each files individually
for (const file of env.files) {
    const { text } = await runPrompt((_) => {
        _.def("FILE", file)
        _.$`Summarize the FILE.`
    })
    def("FILE", { ...file, content: text })
}
// summarize all summaries
$`Summarize FILE.`
```
