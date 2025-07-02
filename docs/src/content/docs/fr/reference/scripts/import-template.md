---
title: Importer un Modèle
sidebar:
  order: 50
description: Découvrez comment importer des modèles d'invite dans GenAIScript en
  utilisant `importTemplate` avec la prise en charge de l'interpolation des
  variables mustache et des modèles de fichiers glob.
keywords: importTemplate, prompts, mustache, variable interpolation, file globs
hero:
  image:
    alt: A digital scene in classic 8-bit style shows stacked rectangles with tabs,
      symbolizing documents, linked by bold arrows to a computer screen with
      bracket and brace icons representing code. Small circles suggest
      variables, a simple clock icon refers to time, and minimal template shapes
      are present. The image uses five corporate colors on a flat, single-color
      background, is highly simplified and geometric, and measures 128 by 128
      pixels. There are no people, no words, and no realistic effects.
    file: ../../../reference/scripts/import-template.png

---

Divers outils LLM permettent de stocker des invites dans des fichiers texte ou markdown. Vous pouvez utiliser `importTemplate` pour importer ces fichiers dans une invite.

```markdown title="cot.md"
Explain your answer step by step.
```

```js title="tool.genai.mjs"
importTemplate("cot.md")
```

## Interpolation de variables

`importTemplate` prend en charge [mustache](https://mustache.github.io/) (par défaut), l'interpolation de variables [Jinja](https://www.npmjs.com/package/@huggingface/jinja) et le format de fichier [Prompty](https://prompty.ai/). Vous pouvez utiliser des variables dans le modèle importé et les passer en tant qu'arguments à la fonction `importTemplate`.

```markdown title="time.md"
The current time is {{time}}.
```

```js title="tool.genai.mjs"
importTemplate("time.md", { time: "12:00" })
```

Mustache prend en charge les arguments comme fonctions. Ceci vous permet de passer des valeurs dynamiques au modèle.

```js title="tool.genai.mjs"
importTemplate("time.md", { time: () => Date.now() })
```

## Davantage de façons de spécifier des fichiers

Vous pouvez utiliser les résultats de `workspace.readText`.

```js title="tool.genai.mjs"
const file = await workspace.readText("time.md")
importTemplate(time, { time: "12:00" })
```

Vous pouvez spécifier un tableau de fichiers ou des motifs glob.

```js
importTemplate("*.prompt")
```

## Prompty

[Prompty](https://prompty.ai/) fournit un format simple basé sur markdown pour les invites. Il ajoute le concept de sections de rôle au format markdown.

```markdown
---
name: Basic Prompt
description: A basic prompt that uses the chat API to answer questions
---

inputs:
question:
type: string
sample:
"question": "Who is the most famous person in the world?"

---

system:
You are an AI assistant who helps people find information.
As the assistant, you answer questions briefly, succinctly.

user:
{{question}}
```

```js title="tool.genai.mjs"
importTemplate("basic.prompty", { question: "what is the capital of France?" })
```
