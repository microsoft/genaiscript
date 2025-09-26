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