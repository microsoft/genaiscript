---
title: Invite ($)
sidebar:
  order: 2
description: Apprenez à utiliser le template littéral tagué pour la génération
  dynamique de prompt dans les scripts GenAI.
keywords: tagged template, prompt expansion, dynamic prompts, JavaScript
  templates, GenAI scripting
genaiscript:
  model: openai:gpt-3.5-turbo
hero:
  image:
    alt: An 8-bit-style flat icon features a geometric speech bubble containing code
      brackets and a dollar sign, symbolizing coding or template expressions.
      Around the bubble are small, simple blocks and circles representing
      variables and template elements, all rendered in a clean, minimal,
      five-color corporate palette on a transparent background, using only basic
      geometric shapes. The image excludes people, text, shadows, gradients, or
      3D effects.
    file: ../../../reference/scripts/prompt.png

---

Le `$` est un [template littéral tagué](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) en JavaScript qui développe la chaîne de caractères en un prompt final.

```js title="example.genai.mjs" assistant=false user=true
$`You are a helpful assistant.`
```

<details open>
  <summary>👤 utilisateur</summary>

  ```markdown wrap
  You are a helpful assistant.
  ```
</details>

## Expressions en ligne

Vous pouvez intégrer des expressions dans le template en utilisant `${...}`. Les expressions peuvent être des promesses et seront attendues lors du rendu final du prompt.

```js title="example.genai.mjs" assistant=false user=true
$`Today is ${new Date().toDateString()}.`
```

<details open>
  <summary>👤 utilisateur</summary>

  ```markdown wrap
  Today is Thu Jun 13 2024.
  ```
</details>

## Templating de chaînes

La sortie du `$` peut être traitée davantage en utilisant des moteurs de template populaires comme [jinja](https://www.npmjs.com/package/@huggingface/jinja) ou [mustache](https://mustache.github.io/).

```js "jinja"
$`What is the capital of {{ country }}?`.jinja(env.vars)
```

```js "mustache"
$`What is the capital of {{ country }}?`.mustache(env.vars)
```

## Prompts en ligne

Lors de l'exécution d'un [prompt en ligne](../../../reference/reference/scripts/inline-prompts/), vous pouvez utiliser le `$` pour générer le prompt dynamiquement, mais vous devez l'appeler dans le contexte de génération.

```js title="example.genai.mjs" "ctx.$"
const res = await runPrompt(ctx => {
  ctx.$`What is the capital of France?`
})
```
