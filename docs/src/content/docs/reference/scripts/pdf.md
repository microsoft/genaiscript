---
title: PDF
description: Learn how to extract text from PDF files for prompt generation using GenAIScript's PDF parsing capabilities.
sidebar:
    order: 9
keywords: PDF parsing, text extraction, pdf-parse, document conversion, prompt generation
---

The `def` function will automatically parse PDF files and extract text from them. This is useful for generating prompts from PDF files.

```javascript
def("DOCS", env.files) // contains some pdfs
def("PDFS", env.files, { endsWith: ".pdf" }) // only pdfs
```

## Parsers

The `parsers.PDF` function reads a PDF file and attempts to cleanly convert it into a text format
that is friendly to the LLM.

```js
const { file, pages } = await parsers.PDF(env.files[0])
```

Once parsed, you can use the `file` and `pages` to generate prompts. If the parsing fails, `file` will be `undefined`.

```js
const { file, pages } = await parsers.PDF(env.files[0])

// inline the entire file
def("FILE", file)

// or analyze page per page, filter pages
pages.slice(0, 2).forEach((page, i) => {
    def(`PAGE_${i}`, page)
})
```

## PDFs are messy

The PDF format was never really meant to allow for clean text extraction. The `parsers.PDF` function uses the `pdf-parse` package to extract text from PDFs. This package is not perfect and may fail to extract text from some PDFs. If you have access to the original document, it is recommended to use a more text-friendly format such as markdown or plain text.
