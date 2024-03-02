---
title: Ask My Image
sidebar:
    order: 6
---

The quick-start guide illustrates how to write a GenAIScript that takes input from an image file.

1. Put your image in a directory visible in VS Code Explorer
2. Use the `GenAiScript: Create new script...` command in the command palette to create a new script.
3. Update the model in the script header to refer to a model that understands images:

```js
script({
    title: "Apply a script to an image",
    model: "gpt-4-turbo-v",
})
```

3. Use [defImages](/genaiscript/reference/scripts/images/) to ingest the image file into the model context:

```js
defImages(env.files, { detail: "low" })
```

4. Replace the text `"TELL THE LLM WHAT TO DO..."` with what you want it to do with your image file.

```js
$`You are a helpful assistant. Your goal is to look at the image of a chart provided
and extract the data it is presented in a tabular format.
`
```

6. Right click on the image file in VS Code Explorer. Select "Run GenAIScript". Select the script you just wrote.

7. The Output will be displayed in a new document tab.
