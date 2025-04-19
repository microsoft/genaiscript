---
title: DOCX
description: Learn how to parse and extract text from DOCX files for text
  analysis and processing.
keywords: DOCX parsing, text extraction, document conversion, file processing,
  text analysis
sidebar:
  order: 9
hero:
  image:
    alt: A minimalistic 8-bit illustration shows a geometric document file with the
      recognizable DOCX symbol alongside a stylized gear, symbolizing document
      parsing or processing. The file is visually transforming into clean,
      abstract lines of text. The design uses five corporate colors, is flat and
      2D, with no background or gradients, and measures 128x128 pixels. There
      are no people or visible written text.
    file: ./docx.png

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
