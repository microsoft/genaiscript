---
title: Récupérer
sidebar:
  order: 14
description: Découvrez comment utiliser fetch et fetchText dans des scripts pour
  effectuer des requêtes HTTP et gérer les réponses textuelles.
keywords: fetch API, fetchText, HTTP requests, scripts, API key
hero:
  image:
    alt: A small, flat 2D image in 8-bit style shows a computer screen displaying a
      simple browser window. In the window, there are four basic icons—a
      right-pointing arrow, a cloud symbolizing the internet, a file icon, and a
      gear for settings—each connected by straight lines to illustrate a
      simplified API process. The image uses only five solid corporate-style
      colors and no text, people, shadows, gradients, or backgrounds. The
      composition is strictly geometric and minimal at 128 by 128 pixels.
    file: ../../../reference/scripts/fetch.png

---

LʼAPI JavaScript `fetch` est disponible ; cependant, nous proposons également un assistant
`fetchText` pour effectuer des requêtes dans un format convivial.

## `host.fetch`

La fonction `host.fetch` est un encapsuleur autour de la fonction globale `fetch` qui ajoute la prise en charge des proxies intégrés et des capacités de reprise automatique.

```js
const response = await host.fetch("https://api.example.com", { retries: 3 })
```

## `host.fetchText`

Utilisez `host.fetchText` pour effectuer des requêtes et télécharger du texte depuis internet.

```ts
const { text, file } = await host.fetchText("https://....")
if (text) $`And also ${text}`

def("FILE", file)
```

`fetchText` résoudra également le contenu du fichier dans lʼespace de travail actuel si lʼURL est un chemin relatif.

```ts
const { file } = await host.fetchText("README.md")
def("README", file)
```

### HTML vers markdown ou texte

`fetchText` propose plusieurs convertisseurs pour extraire le texte de la source HTML sous une forme textuelle plus compacte.
Si vous prévoyez dʼutiliser la source HTML dans vos appels LLM, vous dépasserez certainement le contexte !

```js
// markdown
const md = await host.fetch("https://...", { convert: "markdown" })
// text
const md = await host.fetch("https://...", { convert: "text" })
```

## Secrets

Si lʼAPI que vous interrogez nécessite une clé API, vous pouvez utiliser lʼobjet [secrets](../../../reference/reference/scripts/secrets/) pour stocker la clé.

```
```
