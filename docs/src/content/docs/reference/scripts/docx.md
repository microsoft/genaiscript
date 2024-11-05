---
title: DOCX
description: Learn how to parse and extract text from DOCX files for text analysis and processing.
keywords: DOCX parsing, text extraction, document conversion, file processing, text analysis
sidebar:
    order: 9
---

The `def` function will automatically parse DOCX files and extract text from them:

```javascript
def("DOCS", env.files, { endsWith: ".docx" })
```

## Parsers

The `parsers.DOCX` function reads a DOCX file and attempts to convert it cleanly into a text format
suitable for the LLM.

```js
const { file } = await parsers.DOCX(env.files[0])

def("FILE", file)
```
