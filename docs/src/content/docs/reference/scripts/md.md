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
