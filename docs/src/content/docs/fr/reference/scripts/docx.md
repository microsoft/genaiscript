---
title: DOCX
description: Apprenez à analyser et extraire le texte des fichiers DOCX pour
  l'analyse et le traitement de texte.
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
    file: ../../../reference/scripts/docx.png

---

La fonction `def` analysera automatiquement les fichiers DOCX et en extraira le texte :

```javascript
def("DOCS", env.files, { endsWith: ".docx" })
```

## Analyseurs

La fonction `parsers.DOCX` lit un fichier DOCX et tente de le convertir proprement en un format texte adapté au LLM.

```js
const { file } = await parsers.DOCX(env.files[0])

def("FILE", file)
```
