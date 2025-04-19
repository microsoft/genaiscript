---
title: HTML
description: Learn how to use HTML parsing functions in GenAIScript for
  effective content manipulation and data extraction.
keywords: HTML parsing, content manipulation, data extraction, HTML to text,
  HTML to markdown
sidebar:
  order: 18
hero:
  image:
    alt: "A small, flat 8-bit style icon divided into three vertical parts: the left
      shows a plain paper with HTML angle brackets, the middle depicts a
      document with horizontal text lines transitioning into lines and a hashtag
      for Markdown, and the right displays a table grid blending into curly
      brackets for JSON; all elements use geometric shapes and five bold
      corporate colors on a plain background."
    file: ./html.png

---

HTML processing enables you to parse HTML content effectively. Below you can find guidelines on using the HTML-related APIs available in GenAIScript.

## Overview

HTML processing functions allow you to convert HTML content to text or markdown, aiding in content extraction and manipulation for various automation tasks.

## `convertToText`

Converts HTML content into plain text. This is useful for extracting readable text from web pages.

```js
const htmlContent = "<p>Hello, world!</p>"
const text = HTML.HTMLToText(htmlContent)
// Output will be: "Hello, world!"
```

## `convertToMarkdown`

Converts HTML into Markdown format. This function is handy for content migration projects or when integrating web content into markdown-based systems.

```js
const htmlContent = "<p>Hello, <strong>world</strong>!</p>"
const markdown = HTML.HTMLToMarkdown(htmlContent)
// Output will be: "Hello, **world**!"
```

By default, the converter produces GitHub-flavored markdown. You can disable this behavior by setting the `disableGfm` parameter to `true`.

```js ", { disableGfm: true }"
const markdown = HTML.HTMLToMarkdown(htmlContent, { disableGfm: true })
```

## `convertTablesToJSON`

This function specializes in extracting tables from HTML content and converting them into JSON format. It is useful for data extraction tasks on web pages.

```js
const tables = await HTML.convertTablesToJSON(htmlContent)
const table = tables[0]

defData("DATA", table)
```
