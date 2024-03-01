---
title: PDF
sidebar:
    order: 9
---

The `def` function will automatically parse PDF files and extract text from them. This is useful for generating prompts from PDF files.

```js
def("DOCS", env.files) // contains some pdfs
```

## Parsers

The `parsers.PDF` function reads a PDF file and attempts to cleanly convert it into a text format
that is friendly to the LLM.

```js
const { file, pages } = await parsers.PDF(env.files[0])
```

Once parse, you can use the `file` and `pages` to generate prompts. If the parsing fails, `file` will be `undefined`.

```js
const { file } = await parsers.PDF(env.files[0])
def("FILE", file)
```

## PDF are messy

The PDF format was never really meant to allow for clean text extraction. The `parsers.PDF` function uses the `pdf-parse` package to extract text from the PDF. This package is not perfect and may fail to extract text from some PDFs. If you have access to the original document, it is recommended to use a more text-friendly format such as markdown or plain text.
