---
title: HTML
description: Learn how to use HTML parsing functions in GenAIScript for effective content manipulation and data extraction.
keywords: HTML parsing, content manipulation, data extraction, HTML to text, HTML to markdown
sidebar:
  order: 18
---

# HTML in GenAIScript

HTML processing in GenAIScript enables you to manipulate and extract data from HTML content effectively. Below you can find guidelines on using the HTML-related APIs available in GenAIScript.

## Overview

HTML processing functions allow you to convert HTML content to text or markdown, helping in content extraction and manipulation for various automation tasks.

## API Reference

### `HTMLToText`

Converts HTML content into plain text. This is useful for extracting readable text from web pages.

#### Example

```js
const htmlContent = "<p>Hello, world!</p>";
const text = HTML.HTMLToText(htmlContent);
// Output will be: "Hello, world!"
```

### `HTMLToMarkdown`

Converts HTML into Markdown format. This function is handy for content migration projects or when integrating web content into markdown-based systems.

#### Example

```js
const htmlContent = "<p>Hello, <strong>world</strong>!</p>";
const markdown = HTML.HTMLToMarkdown(htmlContent);
// Output will be: "Hello, **world**!"
```

For more details on related APIs, refer to the [GenAIScript documentation](https://microsoft.github.io/genaiscript/).
