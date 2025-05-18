script({
    model: "small",
    title: "Output tester",
    description: "Generation various outputs",
    group: "mcp",
    accept: "none",
})
const { output } = env

for (let i = 1; i <= 6; i++) output.heading(i, "heading " + i)

$`Write 2 word poem`

output.warn("this is a warning")
output.caution("this is a caution")
output.item("this is an item")
output.itemValue("item", "value")
output.note("this is a note")
output.diff(
    `A
B
C`,
    `AA
B`
)
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
output.item(`- testing broken mermaid chart`)
output.fence(`A -> B`, "mermaid")

output.appendContent(`$$
E = mc^2
$$`)
output.fence(`unknown language`, "unknown")
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
await output.image(
    "https://github.com/microsoft/genaiscript/blob/main/docs/public/images/favicon.png?raw=true",
    "icon"
)

output.detailsFenced("A", "AAA")
output.detailsFenced("B", "BBB")
output.detailsFenced("C", "CCC")
output.detailsFenced("D", "DDD")

output.table([
    { a: 1, b: 2 },
    { a: 3, b: 4 },
])
output.appendContent("<XML>hello</XML>\n")

output.appendContent("☺️".repeat(50000))

await output.image("packages/sample/src/robots.jpg")
