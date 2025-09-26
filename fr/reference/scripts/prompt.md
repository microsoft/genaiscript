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