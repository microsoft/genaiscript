const { output } = env

for (let i = 1; i <= 6; i++) output.heading(i, "heading " + i)

$`Write a poem`

output.fence(
    `---
title: What is Markdown? - Understanding Markdown Syntax
description: Learn about Markdown, a lightweight markup language for formatting plain text, its syntax, and how it differs from WYSIWYG editors.
keywords: Markdown, markup language, formatting, plain text, syntax
sidebar: mydoc_sidebar
---
What is Markdown?
 Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by John Gruber in 2004, Markdown is now one of the world’s most popular markup languages. 

Using Markdown is different than using a WYSIWYG editor. In an application like Microsoft Word, you click buttons to format words and phrases, and the changes are visible immediately. Markdown isn’t like that. When you create a Markdown-formatted file, you add Markdown syntax to the text to indicate which words and phrases should look different.

For example, to denote a heading, you add a number sign before it (e.g., # Heading One). Or to make a phrase bold, you add two asterisks before and after it (e.g., **this text is bold**). It may take a while to get used to seeing Markdown syntax in your text, especially if you’re accustomed to WYSIWYG applications. The screenshot below shows a Markdown file displayed in the Visual Studio Code text editor....
`,
    "md"
)

output.fence(`let x = "abc"`, "js")
output.itemValue("item", "value")
output.fence("This is a fence")
output.fence(
    [
        { a: 1, b: 2 },
        { a: 3, b: 4 },
    ],
    "md"
)
output.fence(
    [
        { a: 1, b: 2 },
        { a: 3, b: 4 },
    ],
    "csv"
)
output.fence(`A --> B`, "mermaid")
output.fence(`A -> B`, "mermaid")
output.appendContent(`$$
E = mc^2
$$`)
output.fence(`unknown language`, "asdfasdfsdf")
output.fence(
    `
sequenceDiagram
    Alice ->> Bob: Hello Bob, how are you?
    Bob-->>John: How about you John?
    Bob--x Alice: I am good thanks!
    Bob-x John: I am good thanks!
    Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.

    Bob-->Alice: Checking with John...
    Alice->John: Yes... John, how are you?

    `,
    "mermaid"
)
output.image(
    "https://github.com/microsoft/genaiscript/blob/main/docs/public/images/favicon.png?raw=true",
    "icon"
)
