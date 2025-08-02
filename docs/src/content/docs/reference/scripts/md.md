---
title: Markdown
sidebar:
  order: 9.2
keywords:
  - markdown
  - mdx
  - frontmatter
  - parsing
  - documentation
description: Enhance your markdown capabilities with MD class helpers for
  parsing and managing frontmatter efficiently.
hero:
  image:
    alt: "An 8-bit icon with two rectangles: the top one has three colored
      horizontal lines representing YAML frontmatter, the bottom features a
      large stylized “M” for markdown. Abstract arrows point between them to
      indicate extracting and updating data. The graphic is flat, geometric, 2D,
      with five solid corporate colors, no people, text, or decorative effects,
      and measures 128 by 128 pixels."
    file: ./md.png
llmstxt:
  content: >-
    The `MD` class offers utilities for handling Markdown, frontmatter, and
    MDX. 


    `frontmatter(text, "yaml")`: Extracts and parses frontmatter from Markdown.
    Returns `undefined` if absent or invalid. Default format: YAML.


    `content(text)`: Retrieves Markdown content excluding frontmatter.


    `updateFrontmatter(text, { key: value })`: Updates frontmatter fields. Use
    `null` to remove fields. Example: `updateFrontmatter(text, { title: "New
    Title" })`.
  hash: 6b8bef6bd7910810034495708092d052cd2b1935ad0bc9d75b621fe676c94d81

---

The `MD` class provides a set of utilities to work with [Markdown](https://www.markdownguide.org/cheat-sheet/) and [frontmatter text](https://jekyllrb.com/docs/front-matter/).

The parser also supports markdown variants like [MDX](https://mdxjs.com/).

## `frontmatter`

Extracts and parses the frontmatter text from a markdown file. Returns `undefined` if no frontmatter is found or if parsing fails. The default format is `yaml`.

```javascript
const frontmatter = MD.frontmatter(text, "yaml")
```

## `content`

Extracts the markdown source without the frontmatter.

```javascript
const content = MD.content(text)
```

## `updateFrontmatter`

Merges frontmatter values into the existing markdown file. Use `null` value to delete fields.

```javascript
const updated = MD.updateFrontmatter(text, { title: "New Title" })
```
