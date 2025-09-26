Le traitement HTML vous permet d'analyser efficacement le contenu HTML. Vous trouverez ci-dessous des instructions sur l'utilisation des API liées au HTML disponibles dans GenAIScript.

## Aperçu

Les fonctions de traitement HTML vous permettent de convertir du contenu HTML en texte ou en markdown, facilitant ainsi l'extraction et la manipulation du contenu pour diverses tâches d'automatisation.

## `convertToText`

Convertit le contenu HTML en texte brut. Cela s'avère utile pour extraire du texte lisible à partir de pages web.

```js
const htmlContent = "<p>Hello, world!</p>"
const text = HTML.HTMLToText(htmlContent)
// Output will be: "Hello, world!"
```

## `convertToMarkdown`

Convertit du HTML en format Markdown. Cette fonction est pratique pour les projets de migration de contenu ou lors de l'intégration de contenu web dans des systèmes basés sur le markdown.

```js
const htmlContent = "<p>Hello, <strong>world</strong>!</p>"
const markdown = HTML.HTMLToMarkdown(htmlContent)
// Output will be: "Hello, **world**!"
```

Par défaut, le convertisseur génère du markdown au format GitHub. Vous pouvez désactiver ce comportement en définissant le paramètre `disableGfm` à `true`.

```js ", { disableGfm: true }"
const markdown = HTML.HTMLToMarkdown(htmlContent, { disableGfm: true })
```

## `convertTablesToJSON`

Cette fonction est spécialisée dans l'extraction des tableaux du contenu HTML et leur conversion en format JSON. Elle est utile pour les tâches d'extraction de données sur des pages web.

```js
const tables = await HTML.convertTablesToJSON(htmlContent)
const table = tables[0]

defData("DATA", table)
```