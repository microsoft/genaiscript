
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
