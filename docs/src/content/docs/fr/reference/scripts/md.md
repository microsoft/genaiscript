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
description: Améliorez vos capacités en markdown avec les utilitaires de la
  classe MD pour analyser et gérer efficacement les frontmatters.
hero:
  image:
    alt: "An 8-bit icon with two rectangles: the top one has three colored
      horizontal lines representing YAML frontmatter, the bottom features a
      large stylized “M” for markdown. Abstract arrows point between them to
      indicate extracting and updating data. The graphic is flat, geometric, 2D,
      with five solid corporate colors, no people, text, or decorative effects,
      and measures 128 by 128 pixels."
    file: ../../../reference/scripts/md.png

---

La classe `MD` fournit un ensemble d'utilitaires pour travailler avec [Markdown](https://www.markdownguide.org/cheat-sheet/) et [le texte frontmatter](https://jekyllrb.com/docs/front-matter/).

Le parseur prend également en charge des variantes de markdown comme [MDX](https://mdxjs.com/).

## `frontmatter`

Extrait et analyse le texte frontmatter d'un fichier markdown. Renvoie `undefined` si aucun frontmatter n'est trouvé ou si l'analyse échoue. Le format par défaut est `yaml`.

```javascript
const frontmatter = MD.frontmatter(text, "yaml")
```

## `content`

Extrait la source markdown sans le frontmatter.

```javascript
const content = MD.content(text)
```

## `updateFrontmatter`

Fusionne les valeurs du frontmatter dans le fichier markdown existant. Utilisez la valeur `null` pour supprimer des champs.

```javascript
const updated = MD.updateFrontmatter(text, { title: "New Title" })
```
