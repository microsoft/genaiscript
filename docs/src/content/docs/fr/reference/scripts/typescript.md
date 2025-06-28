---
title: TypeScript
sidebar:
  order: 15
description: Apprenez à utiliser TypeScript pour de meilleurs outils et une
  meilleure évolutivité dans vos projets GenAIScript.
keywords: TypeScript, JavaScript, ESM, dynamic imports, type checking
hero:
  image:
    alt: 'A simple 8-bit style image shows a blue file icon marked ".mts" linked
      with dotted lines to two other file icons: a dark gray one representing
      JavaScript and a light gray one for TypeScript. All icons are arranged on
      a plain white background with a geometric arrow indicating import, using
      blue, gray, black, white, and yellow. The design is flat, highly
      simplified, without people or text, and measures 128 by 128 pixels.'
    file: ../../../reference/scripts/typescript.png

---

[TypeScript](https://www.typescriptlang.org/) est un langage de programmation fortement typé qui s'appuie sur JavaScript, vous offrant de meilleurs outils à toutes les échelles. Les scripts GenAIScript peuvent être écrits en TypeScript.

## De JavaScript à TypeScript

Vous pouvez convertir n'importe quel script existant en TypeScript en changeant l'extension du fichier en **`.genai.mts`**.

```js title="summarizer.mts"
def("FILE", files)
$`Summarize each file. Be concise.`
```

:::note
Assurez-vous d'utiliser l'extension de fichier **`.mts`** - et non `.ts` -, qui oblige Node.JS à utiliser le système de modules [ESM](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html).
:::

## Importer des fichiers sources TypeScript

Il est possible d’[importer](/genaiscript/reference/scripts/imports) des fichiers sources TypeScript.

```js title="summarizer.mts"
export function summarize(files: string[]) {
    def("FILE", files)
    $`Summarize each file. Be concise.`
}
```

* import

```js
import { summarize } from "./summarizer.mts"
summarize(env.generator, env.files)
```

## GenAIScript vérifie-t-il les types des prompts ?

Oui et non.

La plupart des éditeurs modernes, comme Visual Studio Code, vérifient automatiquement les types dans les sources TypeScript.

Vous pouvez aussi lancer une compilation TypeScript avec la commande `scripts compile`.

```sh
genaiscript scripts compile
```

Cependant, à l'exécution, GenAIScript convertit le TypeScript en JavaScript **sans vérification des types** via [tsx](https://tsx.is/usage#no-type-checking).

<hr />

Traduit par IA. Veuillez vérifier le contenu pour plus de précision.
