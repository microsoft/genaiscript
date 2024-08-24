---
title: Markdown
sidebar:
    order: 9.2
keywords: markdown, mdx, frontmatter
---

The `MD` class contains several helpers to work with [Markdown](https://www.markdownguide.org/cheat-sheet/) and [frontmatter text](https://jekyllrb.com/docs/front-matter/).

The parser also support markdown variants like [MDX](https://mdxjs.com/).

## `frontmatter`

Extracts and parses the frontmatter text from a markdown file. Returns `undefined` if no frontmatter is not found or the parsing failed. Default format is `yaml`.

```javascript
const frontmatter = MD.frontmatter(text, "yaml")
```

## `content`

Extracts the markdown source without the frontmatter.

```javascript
const content = MD.content(text)
```

## `updateFrontmatter`

Merges frontmatter values into the existing in a markdown file. Use `null` value to delete fields.

```javascript
const updated = MD.updateFrontmatter(text, { title: "New Title" })
```
