---
title: Automatisation du navigateur
sidebar:
  order: 30
description: Découvrez comment GenAIScript s'intègre à Playwright pour les
  tâches de scraping web et d'automatisation de navigateur.
tags:
  - GenAIScript
  - Playwright
  - web scraping
  - automation
  - browser
hero:
  image:
    alt: A bold, minimalistic 8-bit icon features a web browser window with a basic
      table of columns and rows, a floating geometric film strip and play button
      to indicate video recording, a gear for automation, and a diamond or
      chevron for data parsing. The image uses five corporate colors, has flat,
      simple shapes, no people or text, and a transparent background.
    file: ../../../reference/scripts/browser.png

---

GenAIScript fournit une API simplifiée pour interagir avec un navigateur sans interface graphique en utilisant [Playwright](https://playwright.dev/) .
Cela vous permet d'interagir avec des pages web, d'extraire des données et d'automatiser des tâches.

```js
const page = await host.browse(
    "https://github.com/microsoft/genaiscript/blob/main/packages/sample/src/penguins.csv"
)
const table = page.locator('table[data-testid="csv-table"]')
const csv = parsers.HTMLToMarkdown(await table.innerHTML())
def("DATA", csv)
$`Analyze DATA.`
```

## Installation

Playwright doit [installer les navigateurs et les dépendances](https://playwright.dev/docs/browsers#install-system-dependencies) avant l'exécution. GenAIScript tentera de les installer automatiquement si le chargement du navigateur échoue.
Cependant, vous pouvez également le faire manuellement en utilisant la commande suivante :

```bash
npx playwright install --with-deps chromium
```

Si vous voyez ce message d'erreur, il se peut que vous deviez installer les dépendances manuellement.

```text
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     yarn playwright install                                             ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

## `host.browse`

Cette fonction lance une nouvelle instance de navigateur et navigue éventuellement vers une page. Les pages sont automatiquement fermées à la fin du script.

```js
const page = await host.browse(url)
```

### `incognito`

Le paramètre `incognito: true` crée un contexte de navigateur isolé et non persistant. Les contextes non persistants ne stockent aucune donnée de navigation sur le disque.

```js
const page = await host.browse(url, { incognito: true })
```

### `recordVideo`

Playwright peut enregistrer une vidéo de chaque page dans la session du navigateur. Vous pouvez l'activer en passant l'option `recordVideo`.
L'enregistrement vidéo implique aussi le mode `incognito` puisqu'il nécessite la création d'un nouveau contexte de navigation.

```js
const page = await host.browse(url, { recordVideo: true })
```

Par défaut, la taille de la vidéo sera de 800x600, mais vous pouvez la modifier en passant les dimensions dans l'option `recordVideo`.

```js
const page = await host.browse(url, {
    recordVideo: { width: 500, height: 500 },
})
```

La vidéo sera enregistrée dans un répertoire temporaire sous `.genaiscript/videos/<timestamp>/` une fois que la page est fermée.
**Vous devez fermer la page avant d'accéder au fichier vidéo.**

```js
await page.close()
const videoPath = await page.video().path()
```

Le fichier vidéo peut ensuite être traité avec des outils vidéo.

### `connectOverCDP`

Vous pouvez fournir un point de terminaison qui utilise le [Chrome DevTools Protocol](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp) avec l'option `connectOverCDP`.

```js
const page = await host.browse(url, { connectOverCDP: "endpointurl" })
```

## Localisateurs

Vous pouvez sélectionner des éléments sur la page en utilisant la méthode `page.get...` ou `page.locator`.

```js
// select by Aria roles
const button = page.getByRole("button")
// select by test-id
const table = page.getByTestId("csv-table")
```

## Contenu des éléments

Vous pouvez accéder à `innerHTML`, `innerText`, `value` et `textContent` d'un élément.

```js
const table = page.getByTestId("csv-table")
const html = table.innerHTML() // without the outer <table> tags!
const text = table.innerText()
const value = page.getByRole("input").value()
```

Vous pouvez utiliser les analyseurs dans [HTML](/genaiscript/reference/scripts/html) pour convertir le HTML en Markdown.

```js
const md = await HTML.convertToMarkdown(html)
const text = await HTML.convertToText(html)
const tables = await HTML.convertTablesToJSON(html)
```

## Capture d'écran

Vous pouvez prendre une capture d'écran de la page courante ou d'un localisateur et l'utiliser avec un LLM équipé de vision (comme `gpt-4o`) en utilisant `defImages`.

```js
const screenshot = await page.screenshot() // returns a node.js Buffer
defImages(screenshot)
```

## (APIs) Avancées Playwright natives

L'instance `page` retournée est un objet natif [Playwright Page](https://playwright.dev/docs/api/class-page).
Vous pouvez importer `playwright` et convertir l'instance en objet Playwright natif.

```js
import { Page } from "playwright"

const page = await host.browse(url) as Page
```

<hr />

Traduit par IA. Veuillez vérifier le contenu pour en assurer la précision.
