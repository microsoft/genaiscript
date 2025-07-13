---
title: HTML
description: Découvrez comment utiliser les fonctions d'analyse HTML dans
  GenAIScript pour une manipulation efficace du contenu et l'extraction de
  données.
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
    file: ../../../reference/scripts/html.png

---

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
