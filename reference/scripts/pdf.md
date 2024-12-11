
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

## Rendering to images

Add the `renderAsImage` option to also reach each page to a PNG image (as a buffer). This buffer can be used with a vision model to perform
an OCR operation.

```js wrap
const { images } = await parsers.PDF(env.files[0], 
  { renderAsImage: true })
```

## PDFs are messy

The PDF format was never really meant to allow for clean text extraction. The `parsers.PDF` function uses the `pdf-parse` package to extract text from PDFs. This package is not perfect and may fail to extract text from some PDFs. If you have access to the original document, it is recommended to use a more text-friendly format such as markdown or plain text.
