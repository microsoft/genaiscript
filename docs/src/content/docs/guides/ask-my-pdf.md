---
title: Ask My PDF
sidebar:
    order: 5
---

The quick-start guide illustrates how to write a GenAIScript that takes input from a pdf file.

1. Put your pdf document in a directory visible in VS Code Explorer
2. Use the `GenAiScript: Create new script...` command in the command palette to create a new script.
3. Define and name the pdf file as an input:

```js
def("PDFSOURCE", env.files, { endsWith: ".pdf" })
```

4. Replace the text "TELL THE LLM WHAT TO DO..." with what you want it to do with your pdf file. Use the name in the def to refer to the file.

```js
// use $ to output formatted text to the prompt
$`You are a helpful assistant.
Summarize the content of PDFSOURCE and critique the document.
`
``` 
6. Right click on the pdf document in VS Code Explorer. Select "Run GenAIScript". Select the script you just wrote. 

7. Output will be displayed in a new buffer

