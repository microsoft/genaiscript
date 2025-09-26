La fonction `def` analysera automatiquement les fichiers XML et en extraira le texte.

```js wrap
def("DOCS", env.files) // contains some xml files
def("XML", env.files, { endsWith: ".xml" }) // only xml
```

## `parse`

La fonction globale `XML.parse` lit un fichier XML et le convertit en un objet JSON.

```js "XML.parse"
const res = XML.parse('<xml attr="1"><child /></xml>')
```

Les noms d'attributs sont précédés de "@\_".

```json
{
    "xml": {
        "@_attr": "1",
        "child": {}
    }
}
```

## RSS

Vous pouvez utiliser `XML.parse` pour analyser un flux RSS en un objet.

```js "XML.parse"
const res = await fetch("https://dev.to/feed")
const { rss } = XML.parse(await res.text())
// channel -> item[] -> { title, description, ... }
```

Étant donné que les flux RSS renvoient généralement une description en HTML rendu, vous pouvez utiliser `parsers.HTMLToText` pour la convertir en texte brut.

```js
const articles = items.map(({ title, description }) => ({
    title,
    description: parsers.HTMLToText(description)
}))
```