---
title: Unlocking the Power of Prompts - A Gentle Introduction to GenAIScript 🚀
published: true
description: Learn how to use GenAIScript for prompt generation and more with this engaging introduction.
tags: [GenAIScript, JavaScript, TypeScript, AI, LLM, Prompt Engineering]
date: 2024-08-20
author: 
    name: GenAIScript
---

Ever wondered how to leverage the power of AI and Large Language Models (LLMs) in your projects? Look no further! This post will introduce you to GenAIScript, a tool designed to simplify the creation of prompts and interactions with LLMs. Let's dive in! 🌊

## What is GenAIScript?

GenAIScript uses a stylized version of JavaScript to generate prompts, which are then sent to an LLM. Scripts are stored as files (`genaisrc/*.genai.mjs`) and executed to produce the prompt text.

## Getting Started

Here's a simple example to get you started. Create a file named `poem.genai.mjs` in the `genaisrc` folder and add the following code:

```js
$`Write a one sentence poem.`
```

When executed, this script will generate the following prompt:

<details>
<summary>👤 User</summary>

```markdown
Write a one sentence poem.
```

</details>

<details open>
<summary>🤖 Assistant</summary>

```markdown
Roses bloom, hearts swoon, under the silver moon.
```

</details>

## Adding Context

GenAIScript can also use context variables, allowing you to interact with files or other data sources. Let's see an example where we define a context variable using `env.files`:

```js
def("FILES", env.files)
$`You are an expert technical writer and proofreader.
Review the documents in FILES and report the 2 most important issues.`
```

Execute this script to see the generated user message and the assistant's response. The context variable `FILES` will contain the list of files in the environment.

<details>
<summary>👤 User</summary>

``````markdown
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
``````

</details>

<details open>
<summary>🤖 Assistant</summary>

```markdown
I reviewed the document in "src/samples/markdown.md" and found the following two important issues:

1. **Missing Consistency in Heading Styles**: The document lacks consistency in heading styles, which can make the structure of the content unclear. For instance, it should use either the "atx-style" (with # symbols for headings) or the "setext-style" (with underlining for headings) consistently throughout the document to maintain a clear visual hierarchy.

2. **Lack of Examples**: The document describes Markdown syntax but lacks concrete examples to illustrate how to use Markdown for formatting. Including examples would enhance the reader's understanding of the syntax and its practical application.

These are the two most important issues that need to be addressed in the document.
```

</details>

## Metadata and Script Configuration

You can add metadata to your script using the `script` function. This helps in organizing and configuring the script, including specifying the model and other parameters.

```js
script({
    title: "Technical proofreading",
    description: "Reviews the text as a tech writer.",
    group: "documentation",
    model: "openai:gpt-3.5-turbo",
    temperature: 0,
})
def("FILES", env.files)
$`You are an expert technical writer and proofreader.
Review the documents in FILES and report the 2 most important issues.`
```

<details>
<summary>👤 User</summary>

``````markdown
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
``````

</details>

<details open>
<summary>🤖 Assistant</summary>

```markdown
File src/samples/markdown.md:

1. **Missing Consistency in Heading Styles**: The document lacks consistency in heading styles. For instance, it uses both "What is Markdown?" and "What is Markdown" as headings. Consistency in heading styles is crucial for a professional and polished document.

2. **Lack of Visual Examples**: While the document explains Markdown syntax, it would benefit from visual examples to illustrate the formatting. Visual examples can enhance understanding, especially for readers who are new to Markdown.

These are the two most important issues in the document.
```

</details>

## Next Steps

- Explore more advanced scripts by following the [Prompt As Code guide](https://microsoft.github.io/genaiscript/guides/prompt-as-code).
- Learn how to [run your script](https://microsoft.github.io/genaiscript/getting-started/running-scripts) from Visual Studio Code.

There you have it! A gentle introduction to GenAIScript to get you started on your prompt engineering journey. Happy scripting! 💻✨

